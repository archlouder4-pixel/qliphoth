import { DurableObject } from 'cloudflare:workers';
import { ExplorationRoomState, ExplorationEnemy, ExplorationIdentityState } from '../types';
import { explorationPlaces } from '../data/explorationPlaces';
import { explorationEnemies as rawEnemies } from '../data/explorationEnemies';
import { clash, rollCoin, damageTypeMult, infusionMult, skillDmgMult } from '../utils';
import { identities } from '../data/identities';

// =========================================================================
// 1. In‑memory enemy definitions (same as before)
// =========================================================================
const explorationEnemies: Record<string, any> = {
  shadow_guard: {
    id: 'shadow_guard',
    name: 'Shadow Guard',
    portrait: '👾',
    element: 'Dark',
    resist: 'Physical',
    hp: 80,
    atk: 12,
    def: 5,
    spd: 10,
    isBoss: false,
    skills: [
      { name: 'Slash', power: 5, coins: 1 },
      { name: 'Stab', power: 7, coins: 1 },
    ],
  },
  tree_warden: {
    id: 'tree_warden',
    name: 'Tree Warden',
    portrait: '🌿',
    element: 'Physical',
    resist: 'Dark',
    hp: 200,
    atk: 18,
    def: 12,
    spd: 8,
    isBoss: true,
    skills: [
      { name: 'Bash', power: 8, coins: 2 },
      { name: 'Entangle', power: 10, coins: 1 },
    ],
  },
  corrupted_construct: {
    id: 'corrupted_construct',
    name: 'Corrupted Construct',
    portrait: '🤖',
    element: 'Chaos',
    resist: 'Light',
    hp: 120,
    atk: 15,
    def: 8,
    spd: 6,
    isBoss: false,
    skills: [
      { name: 'Pulse', power: 6, coins: 1 },
      { name: 'Overload', power: 9, coins: 2 },
    ],
  },
  abyssal_shade: {
    id: 'abyssal_shade',
    name: 'Abyssal Shade',
    portrait: '🌑',
    element: 'Void',
    resist: 'Physical',
    hp: 160,
    atk: 20,
    def: 4,
    spd: 14,
    isBoss: false,
    skills: [
      { name: 'Shadow Strike', power: 7, coins: 2 },
      { name: 'Void Grasp', power: 10, coins: 1 },
    ],
  },
  qliphoth_spawn: {
    id: 'qliphoth_spawn',
    name: 'Qliphoth Spawn',
    portrait: '👹',
    element: 'Fire',
    resist: 'Water',
    hp: 100,
    atk: 14,
    def: 6,
    spd: 7,
    isBoss: false,
    skills: [
      { name: 'Flame Burst', power: 5, coins: 2 },
      { name: 'Inferno', power: 8, coins: 1 },
    ],
  },
  tree_warden_boss: {
    id: 'tree_warden_boss',
    name: 'Ancient Tree Warden',
    portrait: '🌳',
    element: 'Physical',
    resist: 'Dark',
    hp: 300,
    atk: 25,
    def: 18,
    spd: 6,
    isBoss: true,
    skills: [
      { name: 'Root Slam', power: 10, coins: 2 },
      { name: 'Entangle Wave', power: 12, coins: 1 },
      { name: 'Nature\'s Wrath', power: 15, coins: 2 },
    ],
    bossMechanic: {
      id: 'ancient_resilience',
      name: 'Ancient Resilience',
      icon: '🛡️',
      description: 'Gains +5% DEF per turn (max 25%). When HP < 50%, ATK +20%.',
      onEnemyTurnStart: (enemy: ExplorationEnemy) => {
        const state = enemy.bossMechanicState || { defStacks: 0 };
        state.defStacks = Math.min(5, (state.defStacks || 0) + 1);
        enemy.def = enemy.def * 1.05;
        enemy.bossMechanicState = state;
        if (enemy.currentHp / enemy.maxHp < 0.5) {
          enemy.atk = enemy.atk * 1.2;
        }
      },
      getDisplayStatus: (enemy: ExplorationEnemy) => {
        const state = enemy.bossMechanicState || { defStacks: 0 };
        return `🛡️ DEF stacks: ${state.defStacks}/5`;
      }
    }
  },
};

// =========================================================================
// 2. Helper: convert raw enemy to ExplorationEnemy with difficulty scaling
// =========================================================================
function convertRawEnemy(raw: any, difficulty: string): ExplorationEnemy {
  const diffMult: Record<string, { hp: number; atk: number; def: number }> = {
    Easy: { hp: 0.7, atk: 0.7, def: 0.7 },
    Normal: { hp: 1.0, atk: 1.0, def: 1.0 },
    Hard: { hp: 1.4, atk: 1.3, def: 1.3 },
    'Very Hard': { hp: 1.8, atk: 1.6, def: 1.6 },
  };
  const scale = diffMult[difficulty] || diffMult.Normal;
  const maxHp = Math.floor(raw.hp * scale.hp);
  const atk = Math.floor(raw.atk * scale.atk);
  const def = Math.floor(raw.def * scale.def);
  const spd = Math.floor(raw.spd * (difficulty === 'Easy' ? 0.8 : difficulty === 'Normal' ? 1.0 : difficulty === 'Hard' ? 1.1 : 1.2));

  const elementMap: Record<string, string> = {
    Physical: 'Red',
    Light: 'White',
    Dark: 'Black',
    Void: 'Pale',
    Fire: 'Red',
    Water: 'Pale',
    Chaos: 'Black',
  };
  const resistMap: Record<string, string> = {
    Physical: 'Blunt',
    Light: 'Pierce',
    Dark: 'Slash',
    Void: 'Pierce',
    Fire: 'Slash',
    Water: 'Pierce',
    Chaos: 'Blunt',
  };
  const damageType = elementMap[raw.element] || 'Red';
  const infusion = resistMap[raw.resist] || 'Slash';
  const oppositeDmg = ['Red', 'White', 'Black', 'Pale'].find(d => d !== damageType) || 'Pale';
  const oppositeInf = ['Slash', 'Pierce', 'Blunt'].find(i => i !== infusion) || 'Pierce';

  const skills = raw.skills.map((s: any) => ({
    name: s.name,
    power: s.power || 5,
    coins: s.coins || 1,
    damageType: s.damageType || damageType,
    infusion: s.infusion || infusion,
  }));

  return {
    id: raw.id,
    name: raw.name,
    portrait: raw.portrait,
    element: raw.element,
    resist: raw.resist,
    hp: maxHp,
    maxHp: maxHp,
    atk: atk,
    def: def,
    spd: spd,
    damageType: damageType,
    infusion: infusion,
    resistDamageType: oppositeDmg,
    resistInfusion: oppositeInf,
    skills: skills,
    isBoss: raw.isBoss || false,
    bossMechanic: raw.bossMechanic || null,
    bossMechanicState: {},
    currentHp: maxHp,
    shield: 0,
    dullStacks: 0,
    corrosionTurns: 0,
  };
}

// =========================================================================
// 3. Main Durable Object
// =========================================================================
export class ExplorationRoom extends DurableObject {
  private state: ExplorationRoomState;
  private storageKey = 'explorationState';
  private playerIdentityMap: Map<string, number> = new Map(); // playerId -> identityIndex

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.state = {
      placeId: '',
      difficulty: 'Normal',
      identityStates: [],
      enemies: [],
      turn: 'player',
      activeIdentityIndex: 0,
      clashData: null,
      log: [],
      phase: 'lobby',
      currentWaveIndex: 0,
      totalEnemiesDefeated: 0,
      bossesDefeated: 0,
      finalScore: null,
      roomId: ctx.id.toString(),
    };
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<ExplorationRoomState>(this.storageKey);
      if (stored) {
        this.state = stored;
        if (!this.state.roomId) this.state.roomId = ctx.id.toString();
        this.state.identityStates.forEach((s, idx) => {
          if ((s as any).playerId) {
            this.playerIdentityMap.set((s as any).playerId, idx);
          }
        });
      }
    });
  }

  private async saveState() {
    await this.ctx.storage.put(this.storageKey, this.state);
  }

  // ─── HTTP handling ──────────────────────────────────────────────────
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }
    if (url.pathname === '/state') {
      return Response.json(this.state);
    }
    return new Response('Not found', { status: 404 });
  }

  // ─── WebSocket handlers ────────────────────────────────────────────
  async webSocketOpen(ws: WebSocket) {
    // Nothing to do – wait for 'join'
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
    // ✅ FIX: use ws.deserializeAttachment (not ctx.getWebSocketData)
    const session = ws.deserializeAttachment() as { playerId?: string };

    switch (data.type) {
      case 'join': {
        const playerId = data.playerId;
        ws.serializeAttachment({ playerId });
        // If the player already has an identity in the room, reuse it
        if (!this.playerIdentityMap.has(playerId)) {
          const identityState: ExplorationIdentityState = {
            ...data.identityState,
            isActive: false,
            playerId: playerId,
            playerName: data.playerName || 'Guest',
          };
          this.state.identityStates.push(identityState);
          const idx = this.state.identityStates.length - 1;
          this.playerIdentityMap.set(playerId, idx);
          if (this.state.identityStates.length === 1) {
            this.state.activeIdentityIndex = 0;
            this.state.identityStates[0].isActive = true;
          }
          await this.saveState();
        }

        // Send full state directly to this new client
        ws.send(JSON.stringify({
          type: 'stateUpdate',
          state: this.state,
        }));
        ws.send(JSON.stringify({ type: 'joined', state: this.state }));
        this.broadcastState();
        break;
      }

      case 'startExploration': {
        await this.handleStartExploration(data.placeId, data.difficulty);
        break;
      }

      case 'playerAction': {
        await this.handlePlayerAction(data.selectedSkillIndex, data.selectedEnemyIndex);
        break;
      }

      case 'resolve': {
        await this.handleResolve();
        break;
      }

      case 'retreat': {
        this.state.phase = 'defeat';
        this.state.log.push('🏳️ You retreated.');
        await this.saveState();
        this.broadcastState();
        break;
      }

      default: {
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown action' }));
      }
    }
  }

  // ─── Core actions ──────────────────────────────────────────────────

  private async handleStartExploration(placeId: string, difficulty: string) {
    const place = explorationPlaces.find(p => p.id === placeId);
    if (!place) return;
    this.state.placeId = placeId;
    this.state.difficulty = difficulty;
    this.state.phase = 'exploring';
    this.state.currentWaveIndex = 0;
    this.state.totalEnemiesDefeated = 0;
    this.state.bossesDefeated = 0;
    this.state.finalScore = null;

    const wave = place.waves[0];
    const enemies = wave.enemies.map((id: string) => {
      const raw = explorationEnemies[id];
      if (!raw) return null;
      return convertRawEnemy(raw, difficulty);
    }).filter(Boolean) as ExplorationEnemy[];
    this.state.enemies = enemies;
    this.state.log = [`🗺️ Exploring: ${place.name} (${difficulty})`];
    this.state.log.push(`🌊 Wave 1: ${wave.description}`);
    this.state.turn = 'player';
    const firstAlive = this.state.identityStates.findIndex(s => s.hp > 0);
    if (firstAlive !== -1) {
      this.state.activeIdentityIndex = firstAlive;
      this.state.identityStates[firstAlive].isActive = true;
    }
    this.state.clashData = null;
    this.applySynergy();
    await this.saveState();
    this.broadcastState();
  }

  // ─── Player action with percentage‑based damage (5%–30% base) ────
  private async handlePlayerAction(skillIdx: number, enemyIdx: number) {
    if (this.state.turn !== 'player') return;
    if (this.state.phase === 'victory' || this.state.phase === 'defeat') return;

    const activeIdx = this.state.activeIdentityIndex;
    const identity = this.state.identityStates[activeIdx];
    if (!identity || identity.hp <= 0) {
      this.switchToNextAliveIdentity();
      return;
    }

    const skill = identity.skills[skillIdx];
    if (!skill) return;

    let targetEnemyIdx = enemyIdx;
    if (targetEnemyIdx >= this.state.enemies.length || this.state.enemies[targetEnemyIdx].currentHp <= 0) {
      targetEnemyIdx = this.state.enemies.findIndex(e => e.currentHp > 0);
      if (targetEnemyIdx === -1) {
        this.addLog('⚠️ No enemies left.');
        return;
      }
    }
    const enemy = this.state.enemies[targetEnemyIdx];

    const isEgo = skill.type === 'ego';
    if (isEgo && identity.ultimate < 100) {
      this.addLog('⚠️ Ultimate not full! Ego needs 100% Ultimate.');
      return;
    }

    const eSkill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
    const result = clash(skill.power, eSkill.power, skill.coins, eSkill.coins);

    const dmgMult = damageTypeMult(skill.damageType || identity.damageType, enemy.resistDamageType);
    const infMult = infusionMult(skill.infusion || identity.infusion, enemy.resistInfusion);
    const mult = dmgMult * infMult;

    let classMult = 1.0;
    if (identity.classCategory === 'Attacker') classMult += identity.classEffect;
    if (identity.classCategory === 'Amplifier' && isEgo) classMult += identity.classEffect;
    if (identity.attackerBuffTurns > 0) classMult += 0.30;

    let tankBonus = 1.0;
    if (enemy.corrosionTurns > 0) tankBonus += 0.08;

    const won = result.playerTotal >= result.enemyTotal;
    let dmg = 0;
    let enemyDmg = 0;

    if (won) {
      const diff = Math.max(1, result.playerTotal - result.enemyTotal);
      // ─── Percentage-based damage (5% base + up to 25% margin) ────
      const basePercent = 0.05 + Math.min(0.25, (diff / 50) * 0.25);
      let finalPercent = basePercent * mult * (skill.dmgMult || 1) * classMult * tankBonus;
      finalPercent *= 0.85 + Math.random() * 0.3;
      finalPercent = Math.min(0.35, Math.max(0.01, finalPercent));
      dmg = Math.max(1, Math.floor(finalPercent * enemy.maxHp));
      enemy.currentHp = Math.max(0, enemy.currentHp - dmg);
      this.state.clashData = { p: result.playerTotal, e: result.enemyTotal, won: true, dmg, actorName: identity.name };
      this.addLog(`✅ ${identity.name} won clash! ${skill.name} → ${dmg} dmg (${((dmg/enemy.maxHp)*100).toFixed(1)}% of enemy HP)`);

      // Ultimate gain
      const gain = 0.003 + Math.random() * 0.027;
      identity.ultimate = Math.min(100, identity.ultimate + gain * 100);

      this.applyClassEffects(identity, enemy, isEgo, dmg);

      if (isEgo) {
        const identityData = identities.find(i => i.id === identity.identityId);
        if (identityData && identityData.transformedSkills?.length > 0) {
          if (identity.ultimate >= 100 && identity.hp / identity.maxHp > 0.5) {
            const newSkills = identityData.transformedSkills.map((s: any) => ({
              ...s,
              power: s.basePower + s.powerGrowth * (identityData.levelCap || 1),
              coins: s.baseCoins,
              damageType: skill.damageType || identity.damageType,
              infusion: skill.infusion || identity.infusion,
            }));
            identity.transformedSkills = newSkills;
            identity.transformationActive = true;
            identity.transformationTurnsLeft = identityData.ultimateDuration || 8;
            this.addLog(`🌹 ${identity.name} transformed! Skills replaced for ${identityData.ultimateDuration || 8} turns.`);
          }
        }
      }
    } else {
      const diff = Math.max(1, result.enemyTotal - result.playerTotal);
      // ─── Enemy percentage-based damage (3% base + up to 15%) ─────
      const basePercent = 0.03 + Math.min(0.15, (diff / 50) * 0.15);
      let finalPercent = basePercent;
      finalPercent *= 0.85 + Math.random() * 0.3;
      finalPercent = Math.min(0.18, Math.max(0.01, finalPercent));
      enemyDmg = Math.max(1, Math.floor(finalPercent * identity.maxHp));
      const afterShield = Math.max(0, enemyDmg - identity.shield);
      identity.hp = Math.max(0, identity.hp - afterShield);
      identity.shield = Math.max(0, identity.shield - enemyDmg);
      this.state.clashData = { p: result.playerTotal, e: result.enemyTotal, won: false, dmg: enemyDmg, actorName: enemy.name };
      this.addLog(`❌ ${identity.name} lost clash! ${enemy.name} deals ${enemyDmg} damage.`);

      if (identity.classCategory === 'Amplifier' && afterShield > 0) {
        this.healAllies(afterShield);
        this.addLog(`💚 Amplifier resonance: allies healed for ${afterShield} HP.`);
      }
    }

    this.state.identityStates[activeIdx] = identity;
    this.state.enemies[targetEnemyIdx] = enemy;

    if (enemy.currentHp <= 0) {
      this.state.totalEnemiesDefeated += 1;
      if (enemy.isBoss) this.state.bossesDefeated += 1;
      this.addLog(`💀 ${enemy.name} defeated!`);
    }

    const aliveEnemies = this.state.enemies.filter(e => e.currentHp > 0);
    if (aliveEnemies.length === 0) {
      await this.handleWaveClear();
      return;
    }

    this.state.turn = 'resolve';
    await this.saveState();
    this.broadcastState();
  }

  private async handleResolve() {
    this.state.turn = 'enemy';
    await this.saveState();
    this.broadcastState();
    await this.executeEnemyTurn();
  }

  // ─── Enemy turn with percentage‑based damage ─────────────────────
  private async executeEnemyTurn() {
    const enemies = this.state.enemies.filter(e => e.currentHp > 0);
    const identities = this.state.identityStates.filter(s => s.hp > 0);
    if (identities.length === 0 || enemies.length === 0) {
      if (identities.length === 0) {
        this.state.phase = 'defeat';
        this.state.log.push('💀 All identities defeated.');
        await this.saveState();
        this.broadcastState();
      } else {
        await this.handleWaveClear();
      }
      return;
    }

    for (const enemy of enemies) {
      if (enemy.bossMechanic?.onEnemyTurnStart) {
        enemy.bossMechanic.onEnemyTurnStart(enemy);
      }

      const targetIdx = Math.floor(Math.random() * identities.length);
      const target = identities[targetIdx];
      const realIdx = this.state.identityStates.findIndex(s => s.identityId === target.identityId);
      if (realIdx === -1) continue;

      const eSkill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
      let enemyTotal = 0;
      for (let c = 0; c < eSkill.coins; c++) {
        enemyTotal += rollCoin(eSkill.power);
      }
      const playerTotal = 5 + Math.floor(target.def / 10);
      const diff = enemyTotal - playerTotal;
      let dmg = 0;
      if (diff > 0) {
        // ─── Enemy percentage‑based damage (3% base + up to 15%) ───
        const basePercent = 0.03 + Math.min(0.15, (diff / 50) * 0.15);
        let finalPercent = basePercent;
        finalPercent *= 0.85 + Math.random() * 0.3;
        finalPercent = Math.min(0.18, Math.max(0.01, finalPercent));
        dmg = Math.max(1, Math.floor(finalPercent * target.maxHp));
        const afterShield = Math.max(0, dmg - target.shield);
        target.hp = Math.max(0, target.hp - afterShield);
        target.shield = Math.max(0, target.shield - dmg);
        this.state.log.push(`👊 ${enemy.name} attacks ${target.name} for ${dmg} damage.`);
        if (target.classCategory === 'Amplifier' && afterShield > 0) {
          this.healAllies(afterShield);
          this.state.log.push(`💚 Amplifier resonance: allies healed for ${afterShield} HP.`);
        }
      } else {
        this.state.log.push(`🛡️ ${target.name} blocked ${enemy.name}'s attack.`);
      }
      this.state.identityStates[realIdx] = target;
      if (target.hp <= 0) {
        this.state.log.push(`💀 ${target.name} has fallen!`);
        for (const [pid, idx] of this.playerIdentityMap.entries()) {
          if (idx === realIdx) {
            this.playerIdentityMap.delete(pid);
            break;
          }
        }
      }
    }

    const alive = this.state.identityStates.filter(s => s.hp > 0);
    if (alive.length === 0) {
      this.state.phase = 'defeat';
      this.state.log.push('💀 All identities defeated.');
      this.state.turn = 'finished';
      await this.saveState();
      this.broadcastState();
      return;
    }

    this.switchToNextAliveIdentity();
    this.state.turn = 'player';
    this.state.clashData = null;
    await this.saveState();
    this.broadcastState();
  }

  // ─── Wave clear logic ─────────────────────────────────────────────
  private async handleWaveClear() {
    const place = explorationPlaces.find(p => p.id === this.state.placeId);
    if (!place) {
      this.state.phase = 'defeat';
      this.state.log.push('⚠️ Place data missing.');
      await this.saveState();
      this.broadcastState();
      return;
    }

    const waveIdx = this.state.currentWaveIndex;
    if (waveIdx < place.waves.length - 1) {
      this.state.currentWaveIndex += 1;
      const nextWave = place.waves[this.state.currentWaveIndex];
      const newEnemies = nextWave.enemies.map((id: string) => {
        const raw = explorationEnemies[id];
        if (!raw) return null;
        return convertRawEnemy(raw, this.state.difficulty);
      }).filter(Boolean) as ExplorationEnemy[];
      this.state.enemies = newEnemies;
      this.state.identityStates = this.state.identityStates.map(s => ({
        ...s,
        hp: Math.min(s.maxHp, s.hp + 15),
        sp: Math.min(s.maxSp, s.sp + 20),
        shield: Math.max(0, s.shield + 5),
      }));
      this.switchToNextAliveIdentity();
      this.state.turn = 'player';
      this.state.clashData = null;
      this.state.log.push(`🌊 Wave ${this.state.currentWaveIndex + 1}: ${nextWave.description}`);
      if (newEnemies.length > 0) {
        this.state.log.push(`⚔️ Encountered ${newEnemies.map(e => e.name).join(', ')}!`);
      }
      await this.saveState();
      this.broadcastState();
    } else {
      this.state.phase = 'victory';
      const totalLunacy = place.waves.reduce((sum, w) => sum + Math.floor((w.rewards.lunacy.min + w.rewards.lunacy.max) / 2), 0);
      const totalExp = place.waves.reduce((sum, w) => sum + Math.floor((w.rewards.exp.min + w.rewards.exp.max) / 2), 0);
      const rewardMult = 1.0;
      const finalScore = Math.floor((totalLunacy + totalExp * 10) * rewardMult);
      this.state.finalScore = finalScore;
      this.state.log.push('🏆 Exploration complete!');
      await this.saveState();
      this.broadcastState();
    }
  }

  // ─── Utility methods ──────────────────────────────────────────────

  private addLog(msg: string) {
    this.state.log = [...this.state.log.slice(-29), msg];
  }

  // ✅ FIX: correct iteration over getWebSockets()
  private broadcastState() {
    const message = JSON.stringify({ type: 'stateUpdate', state: this.state });
    for (const ws of this.ctx.getWebSockets()) {
      ws.send(message);
    }
  }

  private switchToNextAliveIdentity() {
    let nextIdx = this.state.identityStates.findIndex((s, i) => i > this.state.activeIdentityIndex && s.hp > 0);
    if (nextIdx === -1) {
      nextIdx = this.state.identityStates.findIndex(s => s.hp > 0);
    }
    if (nextIdx !== -1) {
      this.state.identityStates[this.state.activeIdentityIndex].isActive = false;
      this.state.activeIdentityIndex = nextIdx;
      this.state.identityStates[nextIdx].isActive = true;
    } else {
      this.state.phase = 'defeat';
      this.state.log.push('💀 No alive identities left.');
    }
  }

  private healAllies(amount: number) {
    this.state.identityStates = this.state.identityStates.map(s => ({
      ...s,
      hp: Math.min(s.maxHp, s.hp + amount),
    }));
  }

  private applySynergy() {
    const classes = this.state.identityStates.map(s => s.classCategory);
    const hasAttacker = classes.includes('Attacker');
    const hasTank = classes.includes('Tank');
    const hasAmplifier = classes.includes('Amplifier');
    const hasSupport = classes.includes('Support');
    let atkBuff = 0, defBuff = 0, healBonus = 0, dmgAmp = 0;
    if (hasAttacker && hasTank && hasAmplifier && !hasSupport) {
      atkBuff = 0.20;
      defBuff = 0.20;
      healBonus = 0.15;
      dmgAmp = 0.10;
      this.addLog('⚡ SYNERGY: Offensive Trinity (Attacker + Tank + Amplifier) – +20% ATK/DEF, Amplifier +15% heal, +10% damage amp!');
    } else if (hasAttacker && hasTank && hasSupport && !hasAmplifier) {
      atkBuff = 0.20;
      defBuff = 0.20;
      healBonus = 0.50;
      dmgAmp = 0;
      this.addLog('💚 SYNERGY: Defensive Trinity (Attacker + Tank + Support) – +20% ATK/DEF, Support Ego +50% heal!');
    }
    this.state.identityStates = this.state.identityStates.map(s => ({
      ...s,
      atk: Math.floor(s.atk * (1 + atkBuff)),
      def: Math.floor(s.def * (1 + defBuff)),
    }));
    (this.state as any)._synergy = { healBonus, dmgAmp };
  }

  private applyClassEffects(identity: ExplorationIdentityState, enemy: ExplorationEnemy, isEgo: boolean, dmg: number) {
    if (identity.classCategory === 'Attacker' && isEgo) {
      identity.attackerBuffTurns = 2;
      identity.atk = Math.floor(identity.atk * 1.3);
      this.addLog('⚔️ Attacker buff active! +30% ATK for 2 turns');
    }

    if (identity.classCategory === 'Tank' && isEgo) {
      const shred = identity.classEffect || 0.15;
      enemy.def = Math.max(1, Math.floor(enemy.def * (1 - shred)));
      this.addLog(`🛡️ Tank shred: enemy DEF reduced by ${(shred*100).toFixed(0)}%`);
      enemy.corrosionTurns = 2;
      this.addLog('🛡️ Corrosion applied! Enemy resistances -8% for 2 turns');
      const shieldAmt = Math.floor(dmg * 0.15);
      this.state.identityStates = this.state.identityStates.map(s => ({
        ...s,
        shield: s.shield + shieldAmt,
      }));
      this.addLog(`🛡️ All allies gained ${shieldAmt} shield!`);
    }

    if (identity.classCategory === 'Amplifier' && isEgo) {
      const synergyHeal = (this.state as any)._synergy?.healBonus || 0;
      const healPct = 0.15 + (identity.classEffect || 0) * 0.5 + synergyHeal;
      const healAmt = Math.max(3, Math.floor(dmg * healPct));
      this.healAllies(healAmt);
      this.addLog(`💚 Amplifier Ego: all allies healed for ${healAmt} HP (${(healPct*100).toFixed(0)}% of damage)`);
    }

    if (identity.classCategory === 'Support' && isEgo) {
      const synergyHeal = (this.state as any)._synergy?.healBonus || 0;
      const healPct = 0.20 + (identity.classEffect || 0) + synergyHeal;
      const healAmt = Math.floor(dmg * healPct);
      this.healAllies(healAmt);
      this.addLog(`💚 Support Ego: all allies healed for ${healAmt} HP (${(healPct*100).toFixed(0)}% of damage)`);
    }
  }

  // ─── WebSocket close – FULL implementation (fixed) ────────────────
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    // ✅ FIX: use ws.deserializeAttachment
    const session = ws.deserializeAttachment() as { playerId?: string };
    if (!session?.playerId) return;

    const playerId = session.playerId;
    const identityIdx = this.playerIdentityMap.get(playerId);
    if (identityIdx === undefined) return;

    const identity = this.state.identityStates[identityIdx];
    if (identity) {
      this.addLog(`🚪 ${identity.name} (${identity.playerName}) has disconnected.`);
      identity.hp = 0;
      this.state.identityStates[identityIdx] = identity;
    }

    this.playerIdentityMap.delete(playerId);

    if (this.playerIdentityMap.size === 0) {
      this.state.phase = 'defeat';
      this.state.log.push('💀 All players disconnected. Exploration ended.');
      this.state.turn = 'finished';
      await this.saveState();
      this.broadcastState();
      return;
    }

    if (this.state.activeIdentityIndex === identityIdx) {
      this.switchToNextAliveIdentity();
      if (this.state.identityStates.every(s => s.hp <= 0)) {
        this.state.phase = 'defeat';
        this.state.log.push('💀 All identities defeated. Exploration failed.');
        this.state.turn = 'finished';
        await this.saveState();
        this.broadcastState();
        return;
      }
    }

    if (this.state.turn === 'player') {
      const activeIdentity = this.state.identityStates[this.state.activeIdentityIndex];
      const activePlayerId = (activeIdentity as any).playerId;
      if (!activePlayerId || !this.playerIdentityMap.has(activePlayerId)) {
        this.state.turn = 'resolve';
        this.addLog('⏩ Skipping to enemy turn due to disconnected player.');
        await this.saveState();
        this.broadcastState();
        await this.handleResolve();
        return;
      }
    }

    await this.saveState();
    this.broadcastState();
  }
}

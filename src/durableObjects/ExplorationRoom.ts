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
    // ✅ FIX: use ws.deserializeAttachment() instead of ctx.getWebSocketData()
    const session = ws.deserializeAttachment() as { playerId?: string } | null;

    switch (data.type) {
      case 'join': {
        const playerId = data.playerId;
        ws.serializeAttachment({ playerId });
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

        const fullState = {
          type: 'stateUpdate',
          state: this.state,
        };
        ws.send(JSON.stringify(fullState));
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
      const enemy = convertRawEnemy(raw, difficulty);
      return enemy;
    }).filter(Boolean) as ExplorationEnemy[];
    this.state.enemies = enemies;
    this.state.log = [`🗺️ Exploring: ${place.name} (${difficulty})`];
    this.state.log.push(`🌊 Wave 1: ${

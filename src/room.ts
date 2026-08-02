import { DurableObject } from 'cloudflare:workers';
import {
  DepartmentRoomState,
  Player,
  FacilityState,
  CombatState,
  DeployedAbno,
  FacilityLogEntry,
} from './types';
import {
  getRiskEmoji,
  getRequiredEnergyForDay,
  rollCoin,
  clash,
  damageTypeMult,
  infusionMult,
  skillDmgMult,
} from './utils';

export interface Env {
  DEPARTMENT_ROOM: DurableObjectNamespace;
}

// For simplicity, we'll define a minimal identity/abnormality data structure
// In a real app, you'd import from your data files – but here we inline minimal versions.
const IDENTITIES = [
  { id: 'xarthur', name: 'XArthur', element: 'Red', baseInfusion: 'Slash' },
  // ... add all your identities
];

const ABNORMALITIES = [
  { id: 'one_sin', name: 'One Sin', risk: 'ZAYIN', hp: 100, atk: 10, def: 5, workChances: { instinct: 0.6, insight: 0.5, attachment: 0.7, repression: 0.4 } },
  // ... add all your abnormalities
];

export class DepartmentRoom extends DurableObject<Env> {
  private state: DepartmentRoomState;
  private storageKey = 'roomState';

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Initialize default state; will be overridden by storage if present
    this.state = this.createDefaultState();
    // Load persisted state
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<DepartmentRoomState>(this.storageKey);
      if (stored) {
        this.state = stored;
      }
    });
  }

  private createDefaultState(): DepartmentRoomState {
    return {
      players: [],
      facility: {
        isActive: true,
        name: 'Facility',
        managerId: null,
        departmentKey: null,
        currentDay: 1,
        energy: 0,
        maxEnergy: 100,
        totalEnergy: 0,
        members: [],
        deployedAbnos: [],
        deployedToday: [],
        unlockedResearch: [],
        completedMissions: [],
        missionProgress: { worksCompleted: 0 },
        completedCoreSuppressions: [],
        suppressionRewards: [],
        ordealsCompleted: 0,
        activeOrdeal: null,
        activeBoost: null,
        qliphothOverload: {},
        qliphothLevel: 0,
        bullets: { red: 0, white: 0, black: 0, pale: 0, hp: 0, sp: 0, adrenaline: 0, execution: 0 },
        bulletCapacityMultiplier: 1,
        memoryRepositoryAvailable: false,
        log: [],
      },
      combat: null,
      hostId: null,
      roomId: 'unknown',
    };
  }

  // ─── Persist state ──────────────────────────────────────────
  private async saveState() {
    await this.ctx.storage.put(this.storageKey, this.state);
  }

  // ─── HTTP handler ────────────────────────────────────────────
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      // We'll store playerId later when they join
      this.ctx.setWebSocketData(server, { playerId: null });
      return new Response(null, { status: 101, webSocket: client });
    }

    // REST endpoints (optional)
    if (url.pathname === '/state') {
      return Response.json(this.state);
    }

    return new Response('Not found', { status: 404 });
  }

  // ─── WebSocket event handlers ──────────────────────────────

  async webSocketOpen(ws: WebSocket) {
    // Client must send a 'join' message first
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const data = typeof message === 'string' ? JSON.parse(message) : JSON.parse(new TextDecoder().decode(message));
    const session = this.ctx.getWebSocketData(ws) as { playerId: string | null };

    // ── JOIN / IDENTIFY ──
    if (data.type === 'join') {
      const playerId = data.playerId || crypto.randomUUID();
      const playerName = data.playerName || 'Guest';

      // Check if player already in room
      let existing = this.state.players.find(p => p.id === playerId);
      if (!existing) {
        const isHost = this.state.players.length === 0;
        const newPlayer: Player = {
          id: playerId,
          name: playerName,
          isHost,
          identityId: data.identityId,
        };
        this.state.players.push(newPlayer);
        if (isHost) {
          this.state.hostId = playerId;
          this.state.facility.managerId = playerId;
        }
        // Add to facility members
        if (!this.state.facility.members.includes(playerId)) {
          this.state.facility.members.push(playerId);
        }
      } else {
        existing.name = playerName;
        if (data.identityId) existing.identityId = data.identityId;
      }

      // Store playerId on the WebSocket session
      this.ctx.setWebSocketData(ws, { playerId });
      await this.saveState();
      this.broadcastState();
      return;
    }

    // ── Actions require player identification ──
    const playerId = session?.playerId;
    if (!playerId) {
      ws.send(JSON.stringify({ error: 'Not identified. Send { type: "join" } first.' }));
      return;
    }

    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      ws.send(JSON.stringify({ error: 'Player not found in room.' }));
      return;
    }

    // ── HANDLE GAME ACTIONS ──
    const facility = this.state.facility;

    try {
      switch (data.type) {
        case 'deployAbno': {
          const { abnoId } = data.payload;
          const abnoData = ABNORMALITIES.find(a => a.id === abnoId);
          if (!abnoData) throw new Error('Abnormality not found');
          if (facility.deployedAbnos.some(a => a.abnoId === abnoId)) throw new Error('Already deployed');
          const cost = abnoData.risk === 'ALEPH' ? 50 : abnoData.risk === 'WAW' ? 30 : abnoData.risk === 'HE' ? 15 : 5;
          if (facility.energy < cost) throw new Error('Not enough energy');
          facility.energy -= cost;
          const deployed: DeployedAbno = {
            abnoId,
            abnoName: abnoData.name,
            risk: abnoData.risk,
            qliphothCounter: 5, // default
            maxCounter: 5,
          };
          facility.deployedAbnos.push(deployed);
          facility.deployedToday.push(abnoId);
          this.addLog(`${player.name} deployed ${abnoData.name}`, 'success', playerId);
          await this.saveState();
          this.broadcastState();
          ws.send(JSON.stringify({ type: 'actionResult', success: true, message: `${abnoData.name} deployed` }));
          break;
        }

        case 'work': {
          const { abnoId, workType } = data.payload;
          const abnoIndex = facility.deployedAbnos.findIndex(a => a.abnoId === abnoId);
          if (abnoIndex === -1) throw new Error('Abnormality not deployed');
          const abno = facility.deployedAbnos[abnoIndex];
          if (abno.qliphothCounter <= 0) throw new Error('Abnormality is breaching');
          const abnoData = ABNORMALITIES.find(a => a.id === abnoId);
          if (!abnoData) throw new Error('Abnormality data not found');

          // Simplified work success: use random with a base chance
          const baseChance = abnoData.workChances?.[workType] ?? 0.5;
          const success = Math.random() < baseChance;
          const energyGain = success ? 10 + Math.floor(Math.random() * 20) : 3;
          facility.energy = Math.min(facility.maxEnergy, facility.energy + energyGain);
          if (success) {
            facility.missionProgress.worksCompleted = (facility.missionProgress.worksCompleted || 0) + 1;
            // Check mission completion here...
          }
          // Random breach chance
          const breach = Math.random() < 0.05;
          if (breach) {
            abno.qliphothCounter = 0;
            this.addLog(`${abno.abnoName} has breached!`, 'danger', playerId);
          }
          // Random boost drop
          const boostDropped = Math.random() < 0.02;
          if (boostDropped) {
            facility.activeBoost = {
              expiresAt: Date.now() + 300000, // 5 minutes
            };
            this.addLog('Temperance Boost dropped!', 'success', playerId);
          }
          await this.saveState();
          this.broadcastState();
          ws.send(JSON.stringify({
            type: 'workResult',
            success,
            energyGain,
            breach,
            boostDropped,
          }));
          break;
        }

        case 'advanceDay': {
          const required = getRequiredEnergyForDay(facility.currentDay);
          if (facility.energy < required) throw new Error(`Need ${required} energy to advance`);
          facility.energy -= required;
          facility.currentDay += 1;
          facility.deployedToday = [];
          // Reset qliphoth counters?
          // Ordeal trigger
          let ordeal = null;
          if (facility.currentDay % 5 === 0) {
            ordeal = { name: 'Dawn Ordeal', id: `ordeal_${facility.currentDay}` };
            facility.activeOrdeal = ordeal;
            this.addLog(`Ordeal triggered: ${ordeal.name}`, 'warning', playerId);
          }
          await this.saveState();
          this.broadcastState();
          ws.send(JSON.stringify({
            type: 'advanceResult',
            newDay: facility.currentDay,
            ordeal,
          }));
          break;
        }

        case 'resolveOrdeal': {
          const { ordealId, victory } = data.payload;
          if (facility.activeOrdeal && facility.activeOrdeal.id === ordealId) {
            if (victory) {
              facility.ordealsCompleted += 1;
              facility.energy = Math.min(facility.maxEnergy, facility.energy + 30);
              this.addLog(`Ordeal ${facility.activeOrdeal.name} resolved (Victory)`, 'success', playerId);
            } else {
              facility.energy = Math.max(0, facility.energy - 20);
              this.addLog(`Ordeal ${facility.activeOrdeal.name} resolved (Defeat)`, 'danger', playerId);
            }
            facility.activeOrdeal = null;
            await this.saveState();
            this.broadcastState();
            ws.send(JSON.stringify({ type: 'resolveOrdealResult', victory }));
          }
          break;
        }

        case 'unlockResearch': {
          const { researchId } = data.payload;
          if (facility.unlockedResearch.includes(researchId)) throw new Error('Already unlocked');
          // Cost check etc.
          facility.unlockedResearch.push(researchId);
          this.addLog(`Researched ${researchId}`, 'info', playerId);
          await this.saveState();
          this.broadcastState();
          ws.send(JSON.stringify({ type: 'researchResult', success: true }));
          break;
        }

        case 'addBullets': {
          const { type, amount } = data.payload;
          if (!facility.bullets[type]) facility.bullets[type] = 0;
          facility.bullets[type] += amount;
          this.addLog(`Added ${amount} ${type} bullets`, 'info', playerId);
          await this.saveState();
          this.broadcastState();
          ws.send(JSON.stringify({ type: 'bulletsResult', bullets: facility.bullets }));
          break;
        }

        case 'removeAbno': {
          const { abnoId } = data.payload;
          facility.deployedAbnos = facility.deployedAbnos.filter(a => a.abnoId !== abnoId);
          this.addLog(`Removed ${abnoId}`, 'info', playerId);
          await this.saveState();
          this.broadcastState();
          ws.send(JSON.stringify({ type: 'removeResult', success: true }));
          break;
        }

        case 'startCombat': {
          const { enemy, player: playerData, abnoId } = data.payload;
          const abno = facility.deployedAbnos.find(a => a.abnoId === abnoId);
          if (!abno) throw new Error('Abnormality not found');
          if (abno.qliphothCounter > 0) throw new Error('Abnormality is not breaching');

          // Build combat state
          this.state.combat = {
            enemy,
            player: playerData,
            playerHp: playerData.hp,
            playerMaxHp: playerData.maxHp,
            enemyHp: enemy.hp,
            enemyMaxHp: enemy.maxHp,
            turn: 'player',
            clashData: null,
            log: ['⚔️ Breach combat started!'],
            isFinished: false,
            initiator: playerId,
            abnoId,
          };
          this.addLog(`${player.name} started combat with ${enemy.name}`, 'warning', playerId);
          await this.saveState();
          this.broadcastState();
          ws.send(JSON.stringify({ type: 'combatStarted' }));
          break;
        }

        case 'combatAction': {
          const combat = this.state.combat;
          if (!combat) throw new Error('No combat in progress');
          if (combat.isFinished) throw new Error('Combat already finished');
          if (combat.initiator !== playerId) throw new Error('Only the initiator can act');
          if (combat.turn !== 'player') throw new Error('Not your turn');

          const { playerHp, enemyHp, clashData, turn, log } = data.payload;
          combat.playerHp = playerHp;
          combat.enemyHp = enemyHp;
          combat.clashData = clashData;
          combat.turn = turn;
          if (log) combat.log.push(log);
          if (combat.enemyHp <= 0) {
            combat.isFinished = true;
            combat.log.push(`🏆 ${combat.enemy.name} defeated!`);
            // Remove the abnormality or suppress breach
            const abno = facility.deployedAbnos.find(a => a.abnoId === combat.abnoId);
            if (abno) abno.qliphothCounter = abno.maxCounter; // suppress
            this.addLog(`${player.name} suppressed ${combat.enemy.name}!`, 'success', playerId);
          }
          await this.saveState();
          this.broadcastState();
          ws.send(JSON.stringify({ type: 'combatActionResult', success: true }));
          break;
        }

        case 'combatFinish': {
          const { abnoId, won, initiator, enemyName } = data.payload;
          const combat = this.state.combat;
          if (!combat) throw new Error('No combat');
          if (combat.initiator !== playerId) throw new Error('Only initiator can finish');
          combat.isFinished = true;
          if (won) {
            const abno = facility.deployedAbnos.find(a => a.abnoId === abnoId);
            if (abno) abno.qliphothCounter = abno.maxCounter;
            this.addLog(`${player.name} suppressed ${enemyName}!`, 'success', playerId);
          } else {
            this.addLog(`${player.name} failed to suppress ${enemyName}.`, 'danger', playerId);
          }
          this.state.combat = null;
          await this.saveState();
          this.broadcastState();
          ws.send(JSON.stringify({ type: 'combatFinished', won }));
          break;
        }

        case 'combatRetreat': {
          if (this.state.combat && this.state.combat.initiator === playerId) {
            this.state.combat.isFinished = true;
            this.state.combat = null;
            this.addLog(`${player.name} retreated from combat`, 'info', playerId);
            await this.saveState();
            this.broadcastState();
            ws.send(JSON.stringify({ type: 'combatRetreated' }));
          }
          break;
        }

        case 'addLog': {
          const { message, type } = data.payload;
          this.addLog(message, type || 'info', playerId);
          await this.saveState();
          this.broadcastState();
          break;
        }

        case 'memoryRepository': {
          const { targetDay } = data.payload;
          // Reset to day logic – simplified
          facility.currentDay = targetDay;
          facility.energy = 0;
          facility.deployedAbnos = [];
          facility.deployedToday = [];
          this.addLog(`Memory Repository used to return to Day ${targetDay}`, 'warning', playerId);
          await this.saveState();
          this.broadcastState();
          ws.send(JSON.stringify({ type: 'memoryResult', success: true }));
          break;
        }

        default:
          ws.send(JSON.stringify({ error: `Unknown action: ${data.type}` }));
      }
    } catch (err: any) {
      ws.send(JSON.stringify({ type: 'error', message: err.message || 'Action failed' }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    const session = this.ctx.getWebSocketData(ws) as { playerId: string | null };
    if (session?.playerId) {
      const playerId = session.playerId;
      // Remove player from state
      this.state.players = this.state.players.filter(p => p.id !== playerId);
      this.state.facility.members = this.state.facility.members.filter(id => id !== playerId);
      if (this.state.hostId === playerId) {
        this.state.hostId = this.state.players[0]?.id || null;
        if (this.state.players.length > 0) {
          this.state.players[0].isHost = true;
          this.state.facility.managerId = this.state.players[0].id;
        } else {
          this.state.facility.managerId = null;
        }
      }
      // If host leaves while others are present, you might want to disband? We'll keep state alive.
      await this.saveState();
      this.broadcastState();
    }
    this.ctx.setWebSocketData(ws, null);
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private addLog(message: string, type: FacilityLogEntry['type'], playerId: string) {
    const player = this.state.players.find(p => p.id === playerId);
    const entry: FacilityLogEntry = {
      timestamp: Date.now(),
      message,
      type,
      player: player?.name || 'System',
    };
    this.state.facility.log = [entry, ...this.state.facility.log].slice(0, 50);
  }

  private broadcastState() {
    const message = JSON.stringify({
      type: 'stateUpdate',
      players: this.state.players,
      facility: this.state.facility,
      combat: this.state.combat,
    });
    for (const [ws, _] of this.ctx.getWebSockets()) {
      ws.send(message);
    }
  }
}
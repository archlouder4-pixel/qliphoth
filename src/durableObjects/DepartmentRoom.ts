import { DurableObject } from 'cloudflare:workers';
import {
  DepartmentRoomState,
  Player,
  DeployedAbno,
  FacilityLogEntry,
} from '../types';
import {
  getRequiredEnergyForDay,
  rollCoin,
  clash,
  damageTypeMult,
  infusionMult,
  skillDmgMult,
} from '../utils';
import { abnormalities } from '../data/abnormalities';
import { DEPARTMENTS, DepartmentId } from '../data/departments';

// ─── DepartmentRoom Durable Object ──────────────────────────────────
export class DepartmentRoom extends DurableObject {
  private state: DepartmentRoomState;
  private storageKey = 'departmentState';

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.state = this.createDefaultState();
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<DepartmentRoomState>(this.storageKey);
      if (stored) this.state = stored;
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
        lunacy: 0,
        log: [],
      },
      combat: null,
      hostId: null,
      roomId: 'unknown',
    };
  }

  private async saveState() {
    await this.ctx.storage.put(this.storageKey, this.state);
  }

  // ─── HTTP handler ──────────────────────────────────────────────────
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
    // Client must send 'join' first
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));

    if (data.type === 'join') {
      await this.handleJoin(ws, data);
      return;
    }

    // ✅ FIX: attachments live on the WebSocket itself (survives hibernation),
    // not on ctx. ctx.getWebSocketData() is not a real Durable Object API.
    const session = ws.deserializeAttachment() as { playerId?: string } | null;

    if (!session?.playerId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Not joined. Send join first.' }));
      return;
    }

    const playerId = session.playerId;

    switch (data.type) {
      case 'deployAbno':
        await this.handleDeploy(ws, data.payload.abnoId, playerId);
        break;
      case 'work':
        await this.handleWork(ws, data.payload.abnoId, data.payload.workType, playerId);
        break;
      case 'advanceDay':
        await this.handleAdvanceDay(ws, playerId);
        break;
      case 'resolveOrdeal':
        await this.handleResolveOrdeal(ws, data.payload.id, data.payload.victory, playerId);
        break;
      case 'unlockResearch':
        await this.handleUnlockResearch(ws, data.payload.researchId, playerId);
        break;
      case 'addBullets':
        await this.handleAddBullets(ws, data.payload.type, data.payload.amount, playerId);
        break;
      case 'removeAbno':
        await this.handleRemoveAbno(ws, data.payload.abnoId, playerId);
        break;
      case 'startCombat':
        await this.handleStartCombat(ws, data.payload.enemy, data.payload.player, data.payload.abnoId, playerId);
        break;
      case 'combatAction':
        await this.handleCombatAction(ws, data.payload.playerHp, data.payload.enemyHp, data.payload.clashData, data.payload.turn, data.payload.log, playerId);
        break;
      case 'combatFinish':
        await this.handleCombatFinish(ws, data.payload.abnoId, data.payload.won, data.payload.initiator, data.payload.enemyName, playerId);
        break;
      case 'combatRetreat':
        await this.handleCombatRetreat(ws, playerId);
        break;
      case 'addLog':
        await this.handleAddLog(ws, data.payload.message, data.payload.type, playerId);
        break;
      case 'memoryRepository':
        await this.handleMemoryRepository(ws, data.payload.targetDay, playerId);
        break;
      case 'disbandDepartmentRoom':
        await this.handleDisband(ws, playerId);
        break;
      case 'leaveDepartmentRoom':
        // Client-side leave already handled via webSocketClose when the socket closes;
        // nothing additional needed here, but acknowledge so the client isn't left hanging.
        ws.send(JSON.stringify({ type: 'leaveAck' }));
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown action: ${data.type}` }));
    }
  }

  // ─── Join handler ──────────────────────────────────────────────────
  private async handleJoin(ws: WebSocket, data: any) {
    const playerId = data.playerId || data.userId || crypto.randomUUID();
    const playerName = data.playerName || 'Guest';
    const isHost = this.state.players.length === 0;
    const player: Player = {
      id: playerId,
      name: playerName,
      isHost,
      identityId: data.identityId,
    };
    this.state.players.push(player);
    if (isHost) {
      this.state.hostId = playerId;
      this.state.facility.managerId = playerId;
    }
    if (!this.state.facility.members.includes(playerId)) {
      this.state.facility.members.push(playerId);
    }

    this.state.facility.isActive = true;

    // ✅ FIX: use ws.serializeAttachment, not ctx.setWebSocketData (doesn't exist).
    // This is what was silently throwing and killing the join before any response
    // was ever sent back to the client.
    ws.serializeAttachment({ playerId });

    await this.saveState();

    // Send the full state directly to this new client
    ws.send(JSON.stringify({
      type: 'stateUpdate',
      players: this.state.players,
      facility: this.state.facility,
      combat: this.state.combat,
    }));

    // Broadcast to everyone else (the new client will get it twice – that's fine)
    this.broadcastState();

    ws.send(JSON.stringify({ type: 'joined', playerIndex: this.state.players.length - 1 }));
  }

  // ─── Action handlers ──────────────────────────────────────────────

  private async handleDeploy(ws: WebSocket, abnoId: string, playerId: string) {
    const facility = this.state.facility;
    const abnoData = abnormalities.find(a => a.id === abnoId);
    if (!abnoData) {
      ws.send(JSON.stringify({ type: 'error', message: 'Abnormality not found' }));
      return;
    }
    if (facility.deployedAbnos.some(a => a.abnoId === abnoId)) {
      ws.send(JSON.stringify({ type: 'error', message: 'Already deployed' }));
      return;
    }
    const cost = abnoData.risk === 'ALEPH' ? 50 : abnoData.risk === 'WAW' ? 30 : abnoData.risk === 'HE' ? 15 : 5;
    if (facility.energy < cost) {
      ws.send(JSON.stringify({ type: 'error', message: 'Not enough energy' }));
      return;
    }
    facility.energy -= cost;
    const deployed: DeployedAbno = {
      abnoId,
      abnoName: abnoData.name,
      risk: abnoData.risk,
      qliphothCounter: 5,
      maxCounter: 5,
    };
    facility.deployedAbnos.push(deployed);
    facility.deployedToday.push(abnoId);
    this.addLog(`Deployed ${abnoData.name}`, 'success', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'actionResult', success: true, message: `${abnoData.name} deployed` }));
  }

  private async handleWork(ws: WebSocket, abnoId: string, workType: string, playerId: string) {
    const facility = this.state.facility;
    const abnoIndex = facility.deployedAbnos.findIndex(a => a.abnoId === abnoId);
    if (abnoIndex === -1) {
      ws.send(JSON.stringify({ type: 'error', message: 'Abnormality not deployed' }));
      return;
    }
    const abno = facility.deployedAbnos[abnoIndex];
    if (abno.qliphothCounter <= 0) {
      ws.send(JSON.stringify({ type: 'error', message: 'Abnormality is breaching' }));
      return;
    }
    const abnoData = abnormalities.find(a => a.id === abnoId);
    if (!abnoData) {
      ws.send(JSON.stringify({ type: 'error', message: 'Abnormality data not found' }));
      return;
    }

    const baseChance = abnoData.workChances?.[workType] ?? 0.5;
    const success = Math.random() < baseChance;
    const energyGain = success ? 10 + Math.floor(Math.random() * 20) : 3;
    facility.energy = Math.min(facility.maxEnergy, facility.energy + energyGain);
    if (success) {
      facility.missionProgress.worksCompleted = (facility.missionProgress.worksCompleted || 0) + 1;
      if (facility.missionProgress.worksCompleted >= 1 && !facility.completedMissions.includes('m1')) {
        facility.completedMissions.push('m1');
        this.addLog('Mission "First Work" completed!', 'success', playerId);
      }
    }
    const breach = Math.random() < 0.05;
    if (breach) {
      abno.qliphothCounter = 0;
      this.addLog(`${abno.abnoName} has breached!`, 'danger', playerId);
    }
    const boostDropped = Math.random() < 0.02;
    if (boostDropped) {
      facility.activeBoost = {
        expiresAt: Date.now() + 300000,
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
  }

  private async handleAdvanceDay(ws: WebSocket, playerId: string) {
    const facility = this.state.facility;
    const required = getRequiredEnergyForDay(facility.currentDay);
    if (facility.energy < required) {
      ws.send(JSON.stringify({ type: 'error', message: `Need ${required} energy to advance` }));
      return;
    }
    facility.energy -= required;
    facility.currentDay += 1;
    facility.deployedToday = [];
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
  }

  private async handleResolveOrdeal(ws: WebSocket, ordealId: string, victory: boolean, playerId: string) {
    const facility = this.state.facility;
    if (!facility.activeOrdeal || facility.activeOrdeal.id !== ordealId) {
      ws.send(JSON.stringify({ type: 'error', message: 'No active ordeal with that ID' }));
      return;
    }
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

  private async handleUnlockResearch(ws: WebSocket, researchId: string, playerId: string) {
    const facility = this.state.facility;
    const deptKey = facility.departmentKey as DepartmentId;
    const dept = DEPARTMENTS[deptKey];
    if (!dept) {
      ws.send(JSON.stringify({ type: 'error', message: 'Department not found' }));
      return;
    }
    const research = dept.research.find(r => r.id === researchId);
    if (!research) {
      ws.send(JSON.stringify({ type: 'error', message: 'Research not found' }));
      return;
    }
    if (facility.unlockedResearch.includes(researchId)) {
      ws.send(JSON.stringify({ type: 'error', message: 'Already unlocked' }));
      return;
    }
    if (research.cost.lunacy && facility.lunacy < research.cost.lunacy) {
      ws.send(JSON.stringify({ type: 'error', message: 'Not enough Lunacy' }));
      return;
    }
    if (research.cost.energy && facility.energy < research.cost.energy) {
      ws.send(JSON.stringify({ type: 'error', message: 'Not enough energy' }));
      return;
    }
    if (research.cost.lunacy) facility.lunacy -= research.cost.lunacy;
    if (research.cost.energy) facility.energy -= research.cost.energy;
    facility.unlockedResearch.push(researchId);
    this.addLog(`Researched ${research.name}`, 'info', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'researchResult', success: true }));
  }

  private async handleAddBullets(ws: WebSocket, type: string, amount: number, playerId: string) {
    const facility = this.state.facility;
    if (!facility.bullets[type]) facility.bullets[type] = 0;
    facility.bullets[type] += amount;
    this.addLog(`Added ${amount} ${type} bullets`, 'info', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'bulletsResult', bullets: facility.bullets }));
  }

  private async handleRemoveAbno(ws: WebSocket, abnoId: string, playerId: string) {
    const facility = this.state.facility;
    facility.deployedAbnos = facility.deployedAbnos.filter(a => a.abnoId !== abnoId);
    this.addLog(`Removed ${abnoId}`, 'info', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'removeResult', success: true }));
  }

  private async handleStartCombat(ws: WebSocket, enemy: any, player: any, abnoId: string, playerId: string) {
    const facility = this.state.facility;
    const abno = facility.deployedAbnos.find(a => a.abnoId === abnoId);
    if (!abno) {
      ws.send(JSON.stringify({ type: 'error', message: 'Abnormality not found' }));
      return;
    }
    if (abno.qliphothCounter > 0) {
      ws.send(JSON.stringify({ type: 'error', message: 'Abnormality is not breaching' }));
      return;
    }

    this.state.combat = {
      enemy,
      player,
      playerHp: player.hp,
      playerMaxHp: player.maxHp,
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
  }

  private async handleCombatAction(ws: WebSocket, playerHp: number, enemyHp: number, clashData: any, turn: string, log: string, playerId: string) {
    const combat = this.state.combat;
    if (!combat) {
      ws.send(JSON.stringify({ type: 'error', message: 'No combat in progress' }));
      return;
    }
    if (combat.isFinished) {
      ws.send(JSON.stringify({ type: 'error', message: 'Combat already finished' }));
      return;
    }
    if (combat.initiator !== playerId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Only the initiator can perform combat actions' }));
      return;
    }
    combat.playerHp = playerHp;
    combat.enemyHp = enemyHp;
    combat.clashData = clashData;
    combat.turn = turn as any;
    if (log) combat.log.push(log);

    if (combat.enemyHp <= 0) {
      combat.isFinished = true;
      const abno = this.state.facility.deployedAbnos.find(a => a.abnoId === combat.abnoId);
      if (abno) abno.qliphothCounter = abno.maxCounter;
      this.addLog(`${combat.player.name} suppressed ${combat.enemy.name}!`, 'success', playerId);
    }
    if (combat.playerHp <= 0) {
      combat.isFinished = true;
      this.addLog(`${combat.player.name} was defeated by ${combat.enemy.name}.`, 'danger', playerId);
    }

    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'combatActionResult', success: true }));
  }

  private async handleCombatFinish(ws: WebSocket, abnoId: string, won: boolean, initiator: string, enemyName: string, playerId: string) {
    const combat = this.state.combat;
    if (!combat) {
      ws.send(JSON.stringify({ type: 'error', message: 'No combat' }));
      return;
    }
    if (combat.initiator !== playerId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Only the initiator can finish combat' }));
      return;
    }
    combat.isFinished = true;
    if (won) {
      const abno = this.state.facility.deployedAbnos.find(a => a.abnoId === abnoId);
      if (abno) abno.qliphothCounter = abno.maxCounter;
      this.addLog(`${initiator} suppressed ${enemyName}!`, 'success', playerId);
    } else {
      this.addLog(`${initiator} failed to suppress ${enemyName}.`, 'danger', playerId);
    }
    this.state.combat = null;
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'combatFinished', won }));
  }

  private async handleCombatRetreat(ws: WebSocket, playerId: string) {
    const combat = this.state.combat;
    if (!combat) {
      ws.send(JSON.stringify({ type: 'error', message: 'No combat' }));
      return;
    }
    if (combat.initiator !== playerId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Only the initiator can retreat' }));
      return;
    }
    combat.isFinished = true;
    this.state.combat = null;
    this.addLog(`${combat.player.name} retreated from combat`, 'info', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'combatRetreated' }));
  }

  private async handleAddLog(ws: WebSocket, message: string, type: string, playerId: string) {
    this.addLog(message, type as any, playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'logAdded' }));
  }

  private async handleMemoryRepository(ws: WebSocket, targetDay: number, playerId: string) {
    const facility = this.state.facility;
    if (targetDay < 1 || targetDay > facility.currentDay) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid day' }));
      return;
    }
    facility.currentDay = targetDay;
    facility.energy = 0;
    facility.deployedAbnos = [];
    facility.deployedToday = [];
    this.addLog(`Memory Repository used to return to Day ${targetDay}`, 'warning', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'memoryResult', success: true }));
  }

  // ✅ New: server-side disband handler, since the client now only sends this
  // action when isCoop is actually true (see DepartmentView.tsx fix).
  private async handleDisband(ws: WebSocket, playerId: string) {
    if (this.state.facility.managerId !== playerId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Only the manager can disband the facility' }));
      return;
    }
    this.state = this.createDefaultState();
    await this.saveState();
    const payload = JSON.stringify({ type: 'departmentRoomDisbanded' });

    // ✅ FIX: ctx.getWebSockets() returns a plain WebSocket[], not [key, value]
    // pairs. Destructuring each entry as [socket] silently threw and aborted
    // the broadcast, so only the manager's own disband request ever completed
    // locally — everyone else's client never heard about it.
    for (const socket of this.ctx.getWebSockets()) {
      socket.send(payload);
    }
  }

  // ─── WebSocket close ──────────────────────────────────────────────
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    // ✅ FIX: same attachment fix as above
    const session = ws.deserializeAttachment() as { playerId?: string } | null;
    if (!session?.playerId) return;
    const playerId = session.playerId;

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

    if (this.state.players.length === 0) {
      this.state.facility.isActive = false;
    }

    if (this.state.combat && this.state.combat.initiator === playerId) {
      this.state.combat.isFinished = true;
      this.state.combat = null;
      this.addLog(`Combat ended because ${playerId} disconnected`, 'warning', playerId);
    }

    await this.saveState();
    this.broadcastState();
  }

  // ─── Utility methods ──────────────────────────────────────────────

  private addLog(message: string, type: FacilityLogEntry['type'] = 'info', playerId?: string) {
    const player = this.state.players.find(p => p.id === playerId)?.name || 'System';
    const entry: FacilityLogEntry = {
      timestamp: Date.now(),
      message,
      type,
      player,
    };
    this.state.facility.log = [entry, ...this.state.facility.log].slice(0, 50);
  }

  // ✅ FIX: ctx.getWebSockets() returns a plain WebSocket[], not [key, value]
  // pairs. Destructuring each entry as [ws, _] threw a TypeError on the first
  // iteration, which silently aborted every broadcast — this is why the manager's
  // screen never saw the member count update when someone else joined, and why
  // no facility state changes ever propagated to other connected players.
  private broadcastState() {
    const payload = {
      type: 'stateUpdate',
      players: this.state.players,
      facility: this.state.facility,
      combat: this.state.combat,
    };
    for (const ws of this.ctx.getWebSockets()) {
      ws.send(JSON.stringify(payload));
    }
  }
}

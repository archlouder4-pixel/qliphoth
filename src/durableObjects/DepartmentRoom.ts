// src/workers/DepartmentRoom.ts
// Complete Durable Object for department management
// Handles: Work, Deploy, Meltdown, Ordeals, Combat, Panic, Safe Room, Retry Day, Memory Repository

import { DurableObject } from 'cloudflare:workers';
import {
  DepartmentRoomState,
  Player,
  DeployedAbno,
  FacilityLogEntry,
  OrdealInstance,
  OrdealEnemy,
  CombatState,
  DepartmentId,
  WebSocketMessage,
  JoinPayload,
  WorkPayload,
  CombatActionPayload,
  CombatFinishPayload,
  ResolveOrdealPayload,
} from '../types';
import {
  getRequiredEnergyForDay,
  calculateQliphothMax,
  shouldTriggerOrdeal,
  pickOrdealTier,
  getPanicType,
  getPanicEffect,
  getDeployCost,
  applyResearchEffects,
  rollCoin,
  clash,
  damageTypeMult,
  infusionMult,
  skillDmgMult,
} from '../utils';
import { abnormalities, getAbnormalityById } from '../data/abnormalities';
import { DEPARTMENTS, DepartmentId as DeptId } from '../data/departments';
import { ORDEALS, getRandomOrdealByTier, getOrdealById, calculateOrdealReward, spawnsPerDepartment } from '../data/ordeals';

// Timer type for Cloudflare Workers (simplified)
type Timer = ReturnType<typeof setTimeout>;

export class DepartmentRoom extends DurableObject {
  private state: DepartmentRoomState;
  private storageKey = 'departmentState';
  private meltdownTimer: Timer | null = null;
  private panicTimers: Map<string, Timer> = new Map();
  private ordealCheckTimer: Timer | null = null;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.state = this.createDefaultState();
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<DepartmentRoomState>(this.storageKey);
      if (stored) {
        this.state = stored;
        // Restore any timers if needed (optional)
        if (this.state.meltdownActive && this.state.meltdownExpiresAt) {
          const remaining = this.state.meltdownExpiresAt - Date.now();
          if (remaining > 0) {
            this.scheduleMeltdownCheck(remaining);
          } else {
            // Immediate expiry check
            this.checkMeltdownExpiry();
          }
        }
      }
    });
  }

  private createDefaultState(): DepartmentRoomState {
    return {
      players: [],
      facility: {
        isActive: false,
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
        maxDeployPerDay: 1,
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
        qliphothMeter: 0,
        qliphothMax: calculateQliphothMax(1),
        meltdownActive: false,
        meltdownTarget: null,
        meltdownExpiresAt: null,
        ordeals: [],
        safeRoomUnlocked: false,
        panicCount: 0,
      },
      combat: null,
      hostId: null,
      roomId: 'unknown',
    };
  }

  private async saveState() {
    await this.ctx.storage.put(this.storageKey, this.state);
  }

  // ─── HTTP & WebSocket handlers ──────────────────────────────────────────

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

  async webSocketOpen(ws: WebSocket) {
    // No-op; client must send join first
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
    if (data.type === 'join') {
      await this.handleJoin(ws, data);
      return;
    }
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
        await this.handleWork(ws, data.payload.abnoId, data.payload.workType, playerId, data.payload.workSuccess || 1);
        break;
      case 'advanceDay':
        await this.handleAdvanceDay(ws, playerId);
        break;
      case 'retryDay':
        await this.handleRetryDay(ws, playerId);
        break;
      case 'resolveOrdeal':
        await this.handleResolveOrdeal(ws, data.payload.id, data.payload.victory, playerId);
        break;
      case 'startOrdealCombat':
        await this.handleStartOrdealCombat(ws, data.payload.ordealId, data.payload.enemyIndex, playerId);
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
      case 'goToSafeRoom':
        await this.handleGoToSafeRoom(ws, playerId);
        break;
      case 'leaveSafeRoom':
        await this.handleLeaveSafeRoom(ws, playerId);
        break;
      case 'disbandDepartmentRoom':
        await this.handleDisband(ws, playerId);
        break;
      case 'leaveDepartmentRoom':
        ws.send(JSON.stringify({ type: 'leaveAck' }));
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown action: ${data.type}` }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    const session = ws.deserializeAttachment() as { playerId?: string } | null;
    if (!session?.playerId) return;
    const playerId = session.playerId;
    // Remove player and handle host transfer
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
    // Clear panic timer if any
    if (this.panicTimers.has(playerId)) {
      clearTimeout(this.panicTimers.get(playerId)!);
      this.panicTimers.delete(playerId);
    }
    // If combat initiator left, end combat
    if (this.state.combat && this.state.combat.initiator === playerId) {
      this.state.combat.isFinished = true;
      this.state.combat = null;
      this.addLog(`Combat ended because ${playerId} disconnected`, 'warning', playerId);
    }
    if (this.state.players.length === 0) {
      this.state.facility.isActive = false;
    }
    await this.saveState();
    this.broadcastState();
  }

  // ─── JOIN HANDLER ────────────────────────────────────────────────────────

  private async handleJoin(ws: WebSocket, data: JoinPayload) {
    const playerId = data.playerId || crypto.randomUUID();
    const playerName = data.playerName || 'Guest';
    const isHost = this.state.players.length === 0;

    // Department validation
    let deptKey = data.departmentKey as DepartmentId | undefined;
    if (deptKey) {
      const dept = DEPARTMENTS.find(d => d.id === deptKey);
      if (!dept) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid department' }));
        return;
      }
      if (this.state.facility.isActive && this.state.facility.departmentKey) {
        if (this.state.facility.departmentKey !== deptKey) {
          ws.send(JSON.stringify({ type: 'error', message: 'This room already has a different department' }));
          return;
        }
      } else {
        const currentDay = this.state.facility.currentDay;
        if (currentDay < dept.dayUnlock) {
          ws.send(JSON.stringify({ type: 'error', message: `Department "${dept.name}" requires Day ${dept.dayUnlock}.` }));
          return;
        }
        // Create facility
        this.state.facility.isActive = true;
        this.state.facility.departmentKey = deptKey;
        this.state.facility.maxDeployPerDay = dept.maxAbnosPerDay || 1;
        this.state.facility.maxEnergy = 100 + (dept.dayUnlock || 0) * 2;
        this.state.facility.name = `${dept.name} Facility`;
        this.state.facility.managerId = playerId;
        this.state.facility.members = [playerId];
        this.state.facility.bulletCapacityMultiplier = 1.0;
        this.state.facility.safeRoomUnlocked = true; // manager gets safe room
      }
    } else {
      if (!this.state.facility.isActive) {
        ws.send(JSON.stringify({ type: 'error', message: 'No department selected' }));
        return;
      }
    }

    // Add player
    const player: Player = {
      id: playerId,
      name: playerName,
      isHost,
      identityId: data.identityId,
      highestStat: 'fortitude',
      isPanic: false,
      panicTimer: null,
      inSafeRoom: false,
    };
    this.state.players.push(player);
    if (isHost) {
      this.state.hostId = playerId;
      this.state.facility.managerId = playerId;
    }
    if (!this.state.facility.members.includes(playerId)) {
      this.state.facility.members.push(playerId);
    }

    ws.serializeAttachment({ playerId });
    await this.saveState();

    ws.send(JSON.stringify({
      type: 'stateUpdate',
      players: this.state.players,
      facility: this.state.facility,
      combat: this.state.combat,
    }));
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'joined', playerIndex: this.state.players.length - 1 }));
  }

  // ─── DEPLOY HANDLER ──────────────────────────────────────────────────────

  private async handleDeploy(ws: WebSocket, abnoId: string, playerId: string) {
    const facility = this.state.facility;
    const abnoData = abnormalities.find(a => a.id === abnoId);
    if (!abnoData) {
      ws.send(JSON.stringify({ type: 'actionResult', success: false, message: 'Abnormality not found' }));
      return;
    }
    if (facility.deployedAbnos.some(a => a.abnoId === abnoId)) {
      ws.send(JSON.stringify({ type: 'actionResult', success: false, message: 'Already deployed' }));
      return;
    }
    if (facility.deployedToday.length >= facility.maxDeployPerDay) {
      ws.send(JSON.stringify({ type: 'actionResult', success: false, message: 'Max deployments for today reached' }));
      return;
    }
    const cost = getDeployCost(facility.currentDay, abnoData.risk);
    if (facility.energy < cost) {
      ws.send(JSON.stringify({ type: 'actionResult', success: false, message: `Not enough energy (need ${cost})` }));
      return;
    }
    facility.energy -= cost;
    const deployed: DeployedAbno = {
      abnoId,
      abnoName: abnoData.name,
      risk: abnoData.risk,
      qliphothCounter: 5,
      maxCounter: 5,
      workCount: 0,
    };
    facility.deployedAbnos.push(deployed);
    facility.deployedToday.push(abnoId);
    this.addLog(`Deployed ${abnoData.name}`, 'success', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'actionResult', success: true, message: `${abnoData.name} deployed` }));
  }

  // ─── WORK HANDLER (Full Integration) ──────────────────────────────────

  private async handleWork(ws: WebSocket, abnoId: string, workType: string, playerId: string, workSuccess: number) {
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

    const player = this.state.players.find(p => p.id === playerId);
    if (player?.isPanic) {
      ws.send(JSON.stringify({ type: 'error', message: 'Agent is panicking and cannot work.' }));
      return;
    }

    // Log work start
    this.addLog(`${player?.name || 'Agent'} started working on ${abno.abnoName} (${workType})`, 'work_start', playerId);

    // Overload penalty
    let overloadPenalty = 0;
    if (facility.qliphothOverload && facility.qliphothOverload[abnoId]) {
      const overload = facility.qliphothOverload[abnoId];
      if (overload.workCount > 2) {
        overloadPenalty = Math.min(0.5, (overload.workCount - 2) * 0.05);
      }
    }

    let baseChance = abnoData.workChances?.[workType] ?? 0.5;
    let finalChance = Math.max(0.05, Math.min(1, baseChance * workSuccess - overloadPenalty));
    const success = Math.random() < finalChance;

    // Energy gain
    const energyGain = success ? 10 + Math.floor(Math.random() * 20) : 3;
    facility.energy = Math.min(facility.maxEnergy, facility.energy + energyGain);

    // Mission progress
    if (success) {
      facility.missionProgress.worksCompleted = (facility.missionProgress.worksCompleted || 0) + 1;
    }

    // Qliphoth Meltdown logic
    if (success) {
      this.state.qliphothMeter += 1;
      if (this.state.qliphothMeter >= this.state.qliphothMax) {
        if (!this.state.meltdownActive) {
          await this.triggerMeltdown();
        } else {
          this.state.qliphothMeter = 0;
          this.addLog('Qliphoth meter maxed, but meltdown already active.', 'warning');
        }
      }
      // Resolve meltdown if working on target
      if (this.state.meltdownActive && this.state.meltdownTarget === abnoId) {
        this.state.meltdownActive = false;
        this.state.meltdownTarget = null;
        this.state.meltdownExpiresAt = null;
        if (this.meltdownTimer) { clearTimeout(this.meltdownTimer); this.meltdownTimer = null; }
        this.state.qliphothMeter = 0;
        facility.energy = Math.min(facility.maxEnergy, facility.energy + 20);
        this.addLog(`✅ Meltdown on ${abno.abnoName} resolved!`, 'success');
      }
    }

    // Breach chance
    const breach = !success && Math.random() < 0.15;
    if (breach) {
      abno.qliphothCounter = 0;
      this.addLog(`${abno.abnoName} has breached!`, 'abno_breach', playerId);
      await this.startBreachCombat(abnoId);
    }

    // Ordeal trigger (after work, check if we should spawn an ordeal)
    if (success && shouldTriggerOrdeal(facility.currentDay, this.state.qliphothMeter)) {
      await this.triggerOrdeal();
    }

    // Overload tracking
    if (!success && (abnoData.risk === 'HE' || abnoData.risk === 'WAW' || abnoData.risk === 'ALEPH')) {
      if (!facility.qliphothOverload) facility.qliphothOverload = {};
      if (!facility.qliphothOverload[abnoId]) {
        facility.qliphothOverload[abnoId] = { workCount: 0 };
      }
      facility.qliphothOverload[abnoId].workCount += 1;
    }

    // Panic check: on failure, chance to panic
    if (!success && player) {
      const panicChance = 0.2; // 20% chance to panic on failure
      if (Math.random() < panicChance) {
        const stats = { fortitude: 50, prudence: 50, temperance: 50, justice: 50 }; // placeholder; would use actual stats
        const panicType = getPanicType(stats);
        player.highestStat = panicType;
        player.isPanic = true;
        this.state.facility.panicCount += 1;
        this.addLog(`${player.name} panicked! (${panicType})`, 'panic', playerId);
        // Set panic timer (30 seconds)
        if (this.panicTimers.has(playerId)) {
          clearTimeout(this.panicTimers.get(playerId)!);
        }
        const timer = setTimeout(() => {
          player.isPanic = false;
          this.addLog(`${player.name} recovered from panic.`, 'info', playerId);
          this.broadcastState();
          this.panicTimers.delete(playerId);
        }, 30000);
        this.panicTimers.set(playerId, timer);
      }
    }

    // Log work end
    this.addLog(`${player?.name || 'Agent'} finished work on ${abno.abnoName} (${success ? 'Success' : 'Fail'})`, 'work_end', playerId);

    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'workResult', success, energyGain, breach, boostDropped: false }));
  }

  // ─── MELTDOWN METHODS ──────────────────────────────────────────────────

  private async triggerMeltdown() {
    const facility = this.state.facility;
    const eligible = facility.deployedAbnos.filter(a => a.qliphothCounter > 0);
    if (eligible.length === 0) {
      this.state.qliphothMeter = 0;
      this.addLog('No abnormalities available for meltdown.', 'warning');
      await this.saveState();
      this.broadcastState();
      return;
    }
    const target = eligible[Math.floor(Math.random() * eligible.length)];
    this.state.meltdownTarget = target.abnoId;
    this.state.meltdownActive = true;
    const baseTime = 60_000 + Math.min(30_000, facility.currentDay * 1000);
    this.state.meltdownExpiresAt = Date.now() + baseTime;
    this.state.qliphothMeter = 0;
    this.state.qliphothLevel += 1;

    this.addLog(`⚠️ Qliphoth Meltdown on ${target.abnoName}!`, 'danger');
    await this.saveState();
    this.broadcastState();
    this.scheduleMeltdownCheck(baseTime);
  }

  private scheduleMeltdownCheck(delay?: number) {
    if (this.meltdownTimer) clearTimeout(this.meltdownTimer);
    const interval = delay || 5000;
    this.meltdownTimer = setTimeout(() => this.checkMeltdownExpiry(), interval);
  }

  private async checkMeltdownExpiry() {
    if (!this.state.meltdownActive || !this.state.meltdownExpiresAt) return;
    if (Date.now() >= this.state.meltdownExpiresAt) {
      const targetId = this.state.meltdownTarget;
      const abno = this.state.facility.deployedAbnos.find(a => a.abnoId === targetId);
      if (abno) {
        abno.qliphothCounter = 0;
        this.addLog(`💀 Meltdown expired! ${abno.abnoName} breached!`, 'danger');
        await this.startBreachCombat(abno.abnoId);
      } else {
        this.state.facility.energy = Math.max(0, this.state.facility.energy - 20);
        this.addLog('Meltdown expired! Energy lost.', 'danger');
      }
      this.state.meltdownActive = false;
      this.state.meltdownTarget = null;
      this.state.meltdownExpiresAt = null;
      this.state.qliphothMeter = 0;
      await this.saveState();
      this.broadcastState();
    } else {
      this.scheduleMeltdownCheck();
    }
  }

  // ─── ORDEAL METHODS ────────────────────────────────────────────────────

  private async triggerOrdeal() {
    const day = this.state.facility.currentDay;
    const tier = pickOrdealTier(day);
    const definition = getRandomOrdealByTier(tier, day);
    if (!definition) return;

    // Check if we should spawn per department
    let totalSpawned = 0;
    const enemiesPerSpawn = definition.totalEnemies;
    const perDept = spawnsPerDepartment(definition);
    const deptCount = this.state.facility.deployedAbnos.length > 0 ? 1 : 1; // simplified: just one group
    const spawnCount = perDept ? deptCount : 1;
    const enemiesToSpawn = definition.phases[0].enemies.slice(0, definition.totalEnemies);

    // Create an ordeal instance
    const instance: OrdealInstance = {
      id: `ordeal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      definitionId: definition.id,
      tier: definition.tier,
      enemyType: definition.enemyType,
      enemies: enemiesToSpawn.map(e => ({ ...e, id: `${e.id}_${Math.random().toString(36).substring(2, 6)}` })),
      startTime: Date.now(),
      resolved: false,
      victory: null,
      rewardEnergy: typeof definition.rewardEnergy === 'number' ? definition.rewardEnergy : 0, // will calculate later
    };
    // Calculate reward if it's quota percent
    if (definition.rewardEnergy === 'quota_percent') {
      const quota = getRequiredEnergyForDay(this.state.facility.currentDay);
      instance.rewardEnergy = Math.floor(quota * 0.1);
    }

    this.state.facility.ordeals.push(instance);
    this.addLog(`🌪️ Ordeal triggered: ${definition.tier} ${definition.enemyType}`, 'warning');
    await this.saveState();
    this.broadcastState();

    // Optionally start combat automatically if not already in combat
    if (!this.state.combat) {
      // Start combat with the first enemy
      const firstEnemy = instance.enemies[0];
      // Find a player to engage? For simplicity, we'll let the UI handle it.
      // We'll broadcast the ordeal, UI will show "Fight" button.
    }
  }

  private async handleStartOrdealCombat(ws: WebSocket, ordealId: string, enemyIndex: number, playerId: string) {
    const ordeal = this.state.facility.ordeals.find(o => o.id === ordealId);
    if (!ordeal || ordeal.resolved) {
      ws.send(JSON.stringify({ type: 'error', message: 'Ordeal not found or already resolved' }));
      return;
    }
    if (enemyIndex >= ordeal.enemies.length) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid enemy index' }));
      return;
    }
    const enemy = ordeal.enemies[enemyIndex];
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      ws.send(JSON.stringify({ type: 'error', message: 'Player not found' }));
      return;
    }
    // Build player combat stats from identity (simplified)
    // In real implementation, you'd get stats from the identity.
    // For now, use placeholder.
    const playerStats = {
      name: player.name,
      hp: 100,
      maxHp: 100,
      atk: 15,
      def: 5,
      damageType: 'Red',
      infusion: 'Slash',
      skills: [{ name: 'Strike', power: 8, coins: 2, damageType: 'Red', infusion: 'Slash' }],
    };
    this.state.combat = {
      enemy,
      player: playerStats,
      playerHp: playerStats.hp,
      playerMaxHp: playerStats.maxHp,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.maxHp,
      turn: 'player',
      clashData: null,
      log: [`⚔️ Fighting ${enemy.name} (Ordeal)`],
      isFinished: false,
      initiator: playerId,
      abnoId: null,
      ordealId,
    };
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'combatStarted' }));
  }

  private async handleResolveOrdeal(ws: WebSocket, ordealId: string, victory: boolean, playerId: string) {
    const ordeal = this.state.facility.ordeals.find(o => o.id === ordealId);
    if (!ordeal || ordeal.resolved) {
      ws.send(JSON.stringify({ type: 'error', message: 'Ordeal not found or already resolved' }));
      return;
    }
    ordeal.resolved = true;
    ordeal.victory = victory;
    if (victory) {
      const energyGain = ordeal.rewardEnergy || 20;
      this.state.facility.energy = Math.min(this.state.facility.maxEnergy, this.state.facility.energy + energyGain);
      this.state.facility.ordealsCompleted += 1;
      this.addLog(`Ordeal ${ordeal.tier} ${ordeal.enemyType} resolved (Victory)`, 'success', playerId);
    } else {
      this.state.facility.energy = Math.max(0, this.state.facility.energy - 20);
      this.addLog(`Ordeal ${ordeal.tier} ${ordeal.enemyType} resolved (Defeat)`, 'danger', playerId);
    }
    // Remove the ordeal from active list (or keep for history)
    this.state.facility.ordeals = this.state.facility.ordeals.filter(o => o.id !== ordealId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'resolveOrdealResult', victory }));
  }

  // ─── BREACH COMBAT ──────────────────────────────────────────────────────

  private async startBreachCombat(abnoId: string) {
    const facility = this.state.facility;
    const abno = facility.deployedAbnos.find(a => a.abnoId === abnoId);
    if (!abno) return;
    const abnoData = abnormalities.find(a => a.id === abnoId);
    if (!abnoData) return;
    const enemy = {
      name: abnoData.name,
      hp: abnoData.hp || 200,
      maxHp: abnoData.hp || 200,
      atk: abnoData.atk || 15,
      def: abnoData.def || 5,
      resistDamageType: 'Pale',
      resistInfusion: 'Pierce',
      skills: abnoData.combatPages?.map(p => ({
        name: p.name,
        power: p.basePower || 8,
        coins: p.coins || 2,
        damageType: p.damageType || 'Red',
        infusion: p.infusion || 'Slash',
      })) || [{ name: 'Strike', power: 5, coins: 1, damageType: 'Red', infusion: 'Slash' }],
      abnoId: abno.abnoId,
    };
    this.state.combat = {
      enemy,
      player: null, // Will be set when a player engages
      playerHp: 0,
      playerMaxHp: 0,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.maxHp,
      turn: 'player',
      clashData: null,
      log: [`⚔️ ${enemy.name} has breached!`],
      isFinished: false,
      initiator: null,
      abnoId,
    };
    await this.saveState();
    this.broadcastState();
  }

  // ─── COMBAT HANDLERS (Reused for breaches and ordeals) ──────────────

  private async handleStartCombat(ws: WebSocket, enemy: any, player: any, abnoId: string, playerId: string) {
    if (this.state.combat && !this.state.combat.isFinished) {
      ws.send(JSON.stringify({ type: 'error', message: 'Combat already in progress' }));
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
    if (!combat || combat.isFinished) {
      ws.send(JSON.stringify({ type: 'error', message: 'No active combat or already finished' }));
      return;
    }
    if (combat.initiator && combat.initiator !== playerId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Only the initiator can act' }));
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
      this.addLog(`${combat.player.name} suppressed ${combat.enemy.name}!`, 'abno_suppressed', playerId);
      // If this was an ordeal enemy, mark it as defeated
      if (combat.ordealId) {
        const ordeal = this.state.facility.ordeals.find(o => o.id === combat.ordealId);
        if (ordeal) {
          // Remove the defeated enemy
          const enemyIndex = ordeal.enemies.findIndex(e => e.id === combat.enemy.id);
          if (enemyIndex !== -1) {
            ordeal.enemies.splice(enemyIndex, 1);
          }
          if (ordeal.enemies.length === 0) {
            // All enemies defeated; resolve ordeal as victory
            await this.handleResolveOrdeal(ws, combat.ordealId, true, playerId);
          }
        }
      }
    }
    if (combat.playerHp <= 0) {
      combat.isFinished = true;
      this.addLog(`${combat.player.name} was defeated by ${combat.enemy.name}.`, 'death', playerId);
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
      this.addLog(`${initiator} suppressed ${enemyName}!`, 'abno_suppressed', playerId);
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

  // ─── RESEARCH ──────────────────────────────────────────────────────────

  private async handleUnlockResearch(ws: WebSocket, researchId: string, playerId: string) {
    const facility = this.state.facility;
    const deptKey = facility.departmentKey as DepartmentId;
    const dept = DEPARTMENTS.find(d => d.id === deptKey);
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
    // Apply research effects
    applyResearchEffects(facility.unlockedResearch, facility);
    this.addLog(`Researched ${research.name}`, 'info', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'researchResult', success: true }));
  }

  // ─── BULLETS ───────────────────────────────────────────────────────────

  private async handleAddBullets(ws: WebSocket, type: string, amount: number, playerId: string) {
    const facility = this.state.facility;
    const capacity = Math.floor(10 * (facility.bulletCapacityMultiplier || 1));
    const current = facility.bullets[type as keyof typeof facility.bullets] || 0;
    if (current + amount > capacity) {
      ws.send(JSON.stringify({ type: 'error', message: `Capacity exceeded (${capacity})` }));
      return;
    }
    facility.bullets[type as keyof typeof facility.bullets] += amount;
    this.addLog(`Added ${amount} ${type} bullets`, 'info', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'bulletsResult', bullets: facility.bullets }));
  }

  // ─── REMOVE ABNO ──────────────────────────────────────────────────────

  private async handleRemoveAbno(ws: WebSocket, abnoId: string, playerId: string) {
    this.state.facility.deployedAbnos = this.state.facility.deployedAbnos.filter(a => a.abnoId !== abnoId);
    this.addLog(`Removed ${abnoId}`, 'info', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'removeResult', success: true }));
  }

  // ─── ADVANCE DAY ───────────────────────────────────────────────────────

  private async handleAdvanceDay(ws: WebSocket, playerId: string) {
    const facility = this.state.facility;
    const required = getRequiredEnergyForDay(facility.currentDay);
    if (facility.energy < required) {
      ws.send(JSON.stringify({ type: 'error', message: `Need ${required} energy to advance` }));
      return;
    }
    facility.energy -= required;
    facility.currentDay += 1;
    facility.maxEnergy = Math.min(300, facility.maxEnergy + 5);
    facility.deployedToday = [];
    facility.qliphothOverload = {};
    // Reset meltdown state
    this.state.meltdownActive = false;
    this.state.meltdownTarget = null;
    this.state.meltdownExpiresAt = null;
    this.state.qliphothMeter = 0;
    this.state.qliphothMax = calculateQliphothMax(facility.currentDay);
    if (this.meltdownTimer) { clearTimeout(this.meltdownTimer); this.meltdownTimer = null; }
    // Reset panic for all players
    for (const player of this.state.players) {
      player.isPanic = false;
      if (player.panicTimer) {
        clearTimeout(player.panicTimer);
        player.panicTimer = null;
      }
    }
    this.state.facility.panicCount = 0;
    // Clear resolved ordeals
    this.state.facility.ordeals = this.state.facility.ordeals.filter(o => !o.resolved);
    // Check for day-based research unlocks (optional)
    // Advance safe room, memory repo, etc.
    this.addLog(`Advanced to Day ${facility.currentDay}`, 'success', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'advanceResult', newDay: facility.currentDay, ordeal: null }));
  }

  // ─── RETRY DAY ────────────────────────────────────────────────────────

  private async handleRetryDay(ws: WebSocket, playerId: string) {
    const facility = this.state.facility;
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;
    if (!player.isHost && facility.managerId !== playerId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Only the manager can retry the day.' }));
      return;
    }
    // Reset to beginning of current day: keep day number, reset energy, deployedToday, etc.
    facility.energy = 0;
    facility.deployedToday = [];
    facility.missionProgress = { worksCompleted: 0 };
    facility.qliphothOverload = {};
    this.state.qliphothMeter = 0;
    this.state.qliphothMax = calculateQliphothMax(facility.currentDay);
    this.state.meltdownActive = false;
    this.state.meltdownTarget = null;
    this.state.meltdownExpiresAt = null;
    if (this.meltdownTimer) { clearTimeout(this.meltdownTimer); this.meltdownTimer = null; }
    facility.ordeals = [];
    // Reset panic for all players
    for (const p of this.state.players) {
      p.isPanic = false;
      if (p.panicTimer) {
        clearTimeout(p.panicTimer);
        p.panicTimer = null;
      }
    }
    this.state.facility.panicCount = 0;
    this.addLog(`Day ${facility.currentDay} retried.`, 'warning', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'retryResult', success: true }));
  }

  // ─── MEMORY REPOSITORY ───────────────────────────────────────────────

  private async handleMemoryRepository(ws: WebSocket, targetDay: number, playerId: string) {
    const facility = this.state.facility;
    if (targetDay < 1 || targetDay > facility.currentDay) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid target day' }));
      return;
    }
    if (facility.lunacy < 1500) {
      ws.send(JSON.stringify({ type: 'error', message: 'Need 1500 Lunacy' }));
      return;
    }
    facility.lunacy -= 1500;
    facility.currentDay = targetDay;
    facility.energy = 0;
    facility.deployedAbnos = [];
    facility.deployedToday = [];
    facility.qliphothOverload = {};
    this.state.meltdownActive = false;
    this.state.meltdownTarget = null;
    this.state.meltdownExpiresAt = null;
    this.state.qliphothMeter = 0;
    this.state.qliphothMax = calculateQliphothMax(facility.currentDay);
    if (this.meltdownTimer) { clearTimeout(this.meltdownTimer); this.meltdownTimer = null; }
    facility.ordeals = [];
    for (const p of this.state.players) {
      p.isPanic = false;
      if (p.panicTimer) {
        clearTimeout(p.panicTimer);
        p.panicTimer = null;
      }
    }
    this.addLog(`Memory Repository used to return to Day ${targetDay}`, 'warning', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'memoryResult', success: true }));
  }

  // ─── SAFE ROOM ────────────────────────────────────────────────────────

  private async handleGoToSafeRoom(ws: WebSocket, playerId: string) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;
    if (!this.state.facility.safeRoomUnlocked) {
      ws.send(JSON.stringify({ type: 'error', message: 'Safe room not unlocked yet.' }));
      return;
    }
    if (player.inSafeRoom) return;
    player.inSafeRoom = true;
    // Heal over time: we can add a timer for healing
    this.addLog(`${player.name} entered the safe room.`, 'info', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'safeRoomEntered' }));
  }

  private async handleLeaveSafeRoom(ws: WebSocket, playerId: string) {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || !player.inSafeRoom) return;
    player.inSafeRoom = false;
    this.addLog(`${player.name} left the safe room.`, 'info', playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'safeRoomLeft' }));
  }

  // ─── DISBAND ──────────────────────────────────────────────────────────

  private async handleDisband(ws: WebSocket, playerId: string) {
    if (this.state.facility.managerId !== playerId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Only the manager can disband the facility' }));
      return;
    }
    this.state = this.createDefaultState();
    await this.saveState();
    const payload = JSON.stringify({ type: 'departmentRoomDisbanded' });
    for (const socket of this.ctx.getWebSockets()) {
      socket.send(payload);
    }
  }

  // ─── ADD LOG ──────────────────────────────────────────────────────────

  private async handleAddLog(ws: WebSocket, message: string, type: string, playerId: string) {
    this.addLog(message, type as any, playerId);
    await this.saveState();
    this.broadcastState();
    ws.send(JSON.stringify({ type: 'logAdded' }));
  }

  // ─── UTILITY METHODS ──────────────────────────────────────────────────

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

  private broadcastState() {
    const payload = {
      type: 'stateUpdate',
      players: this.state.players,
      facility: this.state.facility,
      combat: this.state.combat,
    };
    const message = JSON.stringify(payload);
    for (const ws of this.ctx.getWebSockets()) {
      ws.send(message);
    }
  }
}

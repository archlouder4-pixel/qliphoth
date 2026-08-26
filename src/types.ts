// src/types.ts
// Complete type definitions for the department system

// ============================================================================
// DEPARTMENT IDS
// ============================================================================

export type DepartmentId =
  | 'MALKUTH'
  | 'YESOD'
  | 'NETZACH'
  | 'HOD'
  | 'TIPHERETH'
  | 'GEBURA'
  | 'CHESED'
  | 'BINAH'
  | 'HOKMA'
  | 'DAAT'
  | 'KETER';

export type PanicType = 'fortitude' | 'prudence' | 'temperance' | 'justice';

// ============================================================================
// PLAYER
// ============================================================================

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  identityId?: string;
  // Panic tracking
  highestStat?: PanicType;
  isPanic: boolean;
  panicTimer?: NodeJS.Timeout | null;
  inSafeRoom: boolean;
  // Agent stats (for combat & work)
  stats?: {
    fortitude: number;
    prudence: number;
    temperance: number;
    justice: number;
    hp: number;
    maxHp: number;
    sp: number;
    maxSp: number;
    atk: number;
    def: number;
    spd: number;
    workSuccess: number;
  };
}

// ============================================================================
// DEPLOYED ABNORMALITY
// ============================================================================

export interface DeployedAbno {
  abnoId: string;
  abnoName: string;
  risk: string;
  qliphothCounter: number;
  maxCounter: number;
  workCount: number;
  lastWorkResult?: 'success' | 'fail';
}

// ============================================================================
// FACILITY LOG ENTRY
// ============================================================================

export type LogType =
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'panic'
  | 'death'
  | 'abno_breach'
  | 'abno_suppressed'
  | 'event'
  | 'event_suppressed'
  | 'ego_gift'
  | 'work_start'
  | 'work_end';

export interface FacilityLogEntry {
  timestamp: number;
  message: string;
  type: LogType;
  player: string;
}

// ============================================================================
// ORDEALS
// ============================================================================

export interface OrdealEnemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  resistDamageType: string;
  resistInfusion: string;
  skills: Array<{
    name: string;
    power: number;
    coins: number;
    damageType: string;
    infusion: string;
  }>;
}

export interface OrdealInstance {
  id: string;
  definitionId: string;
  tier: 'Dawn' | 'Noon' | 'Dusk' | 'Midnight';
  enemyType: string;
  enemies: OrdealEnemy[];
  startTime: number;
  resolved: boolean;
  victory: boolean | null;
  rewardEnergy: number;
}

export interface OrdealDefinition {
  id: string;
  tier: 'Dawn' | 'Noon' | 'Dusk' | 'Midnight';
  enemyType: 'Crimson' | 'Amber' | 'Green' | 'Indigo' | 'Violet' | 'White';
  name: string;
  description: string;
  wikiReference: string;
  totalEnemies: number;
  phases: {
    id: string;
    name: string;
    description: string;
    duration: number;
    enemies: OrdealEnemy[];
    mechanics?: {
      type: 'spawn' | 'buff' | 'debuff' | 'heal' | 'shield' | 'enrage' | 'explode' | 'burrow' | 'deactivate' | 'upset_abno' | 'corpse_heal';
      description: string;
      value?: number;
      spawnTarget?: string;
    }[];
  }[];
  rewardEnergy: number | 'quota_percent';
  rewardLunacy?: number;
  riskLevel: 'TETH' | 'HE' | 'WAW' | 'ALEPH';
  spawnCountPerDepartment?: boolean;
  minDay?: number;
  globalMechanics?: {
    type: 'time_limit' | 'timer' | 'phase_transition';
    description: string;
    value?: number;
  }[];
}

// ============================================================================
// COMBAT STATE
// ============================================================================

export interface CombatState {
  enemy: any;
  player: any;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  turn: 'player' | 'resolve' | 'enemy';
  clashData: {
    p: number;
    e: number;
    won: boolean;
    dmg: number;
    actorName: string;
  } | null;
  log: string[];
  isFinished: boolean;
  initiator: string | null;
  abnoId: string | null;
  ordealId?: string;
}

// ============================================================================
// DEPARTMENT ROOM STATE (full state)
// ============================================================================

export interface DepartmentRoomState {
  // ── Core ──
  players: Player[];
  facility: {
    // ── Basic ──
    isActive: boolean;
    name: string;
    managerId: string | null;
    departmentKey: DepartmentId | null;
    currentDay: number;
    energy: number;
    maxEnergy: number;
    totalEnergy: number;
    members: string[];
    deployedAbnos: DeployedAbno[];
    deployedToday: string[];
    maxDeployPerDay: number;

    // ── Research & Missions ──
    unlockedResearch: string[];
    completedMissions: string[];
    missionProgress: {
      worksCompleted: number;
      totalDeployments?: number;
    };
    completedCoreSuppressions: string[];
    suppressionRewards: string[];

    // ── Ordeals ──
    ordealsCompleted: number;
    activeOrdeal: { name: string; id: string } | null;
    greatestOrdealTime: 'Dawn' | 'Noon' | 'Dusk' | 'Midnight' | null;
    ordealsTriggeredToday: string[]; // e.g., ['Dawn', 'Noon']
    pendingOrdeal: OrdealDefinition | null; // the next ordeal to trigger

    // ── Boost ──
    activeBoost: { expiresAt: number } | null;

    // ── Qliphoth & Meltdown ──
    qliphothOverload: Record<string, { workCount: number }>;
    qliphothLevel: number;
    qliphothMeter: number;
    qliphothMax: number;
    meltdownActive: boolean;
    meltdownTarget: string | null; // abnoId
    meltdownExpiresAt: number | null;

    // ── Bullets ──
    bullets: {
      red: number;
      white: number;
      black: number;
      pale: number;
      hp: number;
      sp: number;
      adrenaline: number;
      execution: number;
    };
    bulletCapacityMultiplier: number;

    // ── Memory Repository ──
    memoryRepositoryAvailable: boolean;

    // ── Lunacy ──
    lunacy: number;

    // ── Log ──
    log: FacilityLogEntry[];

    // ── Safe Room ──
    safeRoomUnlocked: boolean;
    panicCount: number;

    // ── Ordeals list ──
    ordeals: OrdealInstance[];
  };

  // ── Combat ──
  combat: CombatState | null;

  // ── Host & Room ──
  hostId: string | null;
  roomId: string;
}

// ============================================================================
// WEB SOCKET MESSAGES
// ============================================================================

export interface WebSocketMessage {
  type: string;
  payload?: any;
}

export interface JoinPayload {
  playerId: string;
  playerName: string;
  identityId?: string;
  departmentKey?: DepartmentId;
}

export interface WorkPayload {
  abnoId: string;
  workType: string;
  workSuccess: number;
}

export interface CombatActionPayload {
  playerHp: number;
  enemyHp: number;
  clashData: any;
  turn: string;
  log: string;
}

export interface CombatFinishPayload {
  abnoId: string;
  won: boolean;
  initiator: string;
  enemyName: string;
}

export interface ResolveOrdealPayload {
  id: string;
  victory: boolean;
}

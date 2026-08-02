export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  identityId?: string;
  score?: number;
  lives?: number;
  wins?: number;
  losses?: number;
}

export interface FacilityState {
  isActive: boolean;
  name: string;
  managerId: string | null;
  departmentKey: string | null;
  currentDay: number;
  energy: number;
  maxEnergy: number;
  totalEnergy: number;
  members: string[];
  deployedAbnos: DeployedAbno[];
  deployedToday: string[];
  unlockedResearch: string[];
  completedMissions: string[];
  missionProgress: Record<string, any>;
  completedCoreSuppressions: string[];
  suppressionRewards: any[];
  ordealsCompleted: number;
  activeOrdeal: any | null;
  activeBoost: any | null;
  qliphothOverload: Record<string, any>;
  qliphothLevel: number;
  bullets: Record<string, number>;
  bulletCapacityMultiplier: number;
  memoryRepositoryAvailable: boolean;
  log: FacilityLogEntry[];
}

export interface DeployedAbno {
  abnoId: string;
  abnoName: string;
  risk: string;
  qliphothCounter: number;
  maxCounter: number;
}

export interface FacilityLogEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  player: string;
}

export interface CombatState {
  enemy: any;
  player: any;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  turn: 'player' | 'resolve' | 'enemy';
  clashData: { p: number; e: number; won: boolean; dmg: number; actorName: string } | null;
  log: string[];
  isFinished: boolean;
  initiator: string | null;
  abnoId: string;
}

export interface DepartmentRoomState {
  players: Player[];
  facility: FacilityState;
  combat: CombatState | null;
  hostId: string | null;
  roomId: string;
}

export interface ReceptionPlayerData {
  identityId: string;
  weaponId: string | null;
  giftIds: string[];
  playerName: string;
  stats: {
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    spd: number;
    sp: number;
    shield: number;
    score: number;
    lives: number;
    ultimateBar: number;
    transformationActive: boolean;
    transformationTurnsLeft: number;
  };
  skills: any[];
  classCategory: string;
  classEffect: number;
  hasUltimate: boolean;
  transformationTrigger: string;
  ultimateDuration: number;
  transformationPassive: any;
  baseSkills: any[];
  transformedSkills: any[];
}

export interface ReceptionRoomState {
  p1: ReceptionPlayerData & { userId: string };
  p2: ReceptionPlayerData & { userId: string };
  turn: 'p1' | 'p2';
  phase: 'p1Select' | 'p2Select' | 'clash' | 'result';
  p1SkillIdx: number | null;
  p2SkillIdx: number | null;
  clashResult: any;
  winner: 'p1' | 'p2' | null;
  scoreChanges: { p1: number; p2: number };
  lifeChanges: { p1: number; p2: number };
  newRanks: { p1: string; p2: string };
}

export interface CompetitiveRoomState {
  players: Player[];
  hostId: string | null;
  currentWeek: number;
  zoneScores: Record<string, number>;
  completedZones: string[];
  merit: number;
  reputation: number;
  squad: string;
  region: string;
}

export interface ExplorationEnemy {
  id: string;
  name: string;
  portrait: string;
  element: string;
  resist: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  damageType: string;
  infusion: string;
  resistDamageType: string;
  resistInfusion: string;
  skills: { name: string; power: number; coins: number; damageType?: string; infusion?: string }[];
  isBoss: boolean;
  bossMechanic?: any;
}

export interface ExplorationIdentityState {
  identityId: string;
  name: string;
  playerName: string;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  ultimate: number;
  shield: number;
  transformationActive: boolean;
  transformationTurnsLeft: number;
  transformedSkills: any[];
  resolveStacks: number;
  witherStacks: number;
  bleedStacks: number;
  atk: number;
  def: number;
  spd: number;
  damageType: string;
  infusion: string;
  classCategory: string;
  classEffect: number;
  skills: any[];
  isActive: boolean;
  attackerBuffTurns: number;
}

export interface ExplorationRoomState {
  placeId: string;
  difficulty: string;
  identityStates: ExplorationIdentityState[];
  enemies: ExplorationEnemy[];
  turn: 'player' | 'enemy' | 'resolve' | 'finished';
  activeIdentityIndex: number;
  clashData: any;
  log: string[];
  phase: 'lobby' | 'exploring' | 'waveClear' | 'victory' | 'defeat';
  currentWaveIndex: number;
  totalEnemiesDefeated: number;
  bossesDefeated: number;
  finalScore: number | null;
}
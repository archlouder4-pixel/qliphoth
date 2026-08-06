// src/store/gameStore.ts – Full file with moveset integration + blood lunacy milestone
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { identities, storyOnlyIdentities, getClassCategories, type Identity, expForLevel } from '../data/identities';
import { weapons, canEquipWeapon, type Weapon } from '../data/weapons';
import {
  egoGifts,
  setBonuses,
  RESONANCE_STATS,
  HYPERTUNE_LEVELS,
  EGO_GIFT_SLOTS,
  convertLegacyStats,
  getSetCounts,
  type EgoGiftSlot,
  type EgoGift,
} from '../data/egoGifts';
import { storyChapters } from '../data/story';
import { CR_REGIONS, SQUAD_INFO, getCurrentWeek, getWeeklyZones, type CRRegion, type Squad, type ZoneElement } from '../data/competitive';
import { getFirstTutorialStep, getTabTutorialSteps } from '../data/tutorial';
import { abnormalities } from '../data/abnormalities';

// ── Moveset data ──────────────────────────────────────────────────────
// Import from movesets.js (adjust path as needed)
const movesetsData = require('../data/movesets');

// Define a type for a moveset (enriched with grade/obtainable)
export interface Moveset {
  name: string;
  rank: string; // 'ZAYIN' | 'TETH' | 'HE' | 'WAW' | 'ALEPH' | 'WALKIRKSNACHT'
  grade?: 'standard' | 'plus' | 'commissioned' | 'esoteric' | 'library' | 'removed';
  obtainable?: boolean;
  code: string;
  video?: string;
}

// Normalize movesets: add default grade and obtainable if missing
const movesets: Moveset[] = (movesetsData.data || []).map((m: any) => ({
  ...m,
  grade: m.grade || 'standard',
  obtainable: m.obtainable !== undefined ? m.obtainable : true,
}));

// Build a map for quick lookup
const movesetMap = new Map<string, Moveset>();
for (const m of movesets) {
  movesetMap.set(m.name, m);
}

// ── STORE VERSION ──────────────────────────────────────────────────────
const STORE_VERSION = 28; // Incremented for blood lunacy

// ── TAB UNLOCK CONSTANTS ──────────────────────────────────────────────
export const TAB_UNLOCK_LEVELS = {
  gacha: 99,
  identities: 0,
  weapons: 0,
  egoGifts: 99,
  missions: 99,
  competitive: 99,
  shardShop: 0,
  department: 1,
  exploration: 1,
  duel: 1,
  movesets: 0,
};

export const TAB_UNLOCK_LABELS = {
  gacha: { title: 'Extraction Unlocked!', description: 'Pull for new Manifests and Arsenals.' },
  identities: { title: 'Manifest Unlocked!', description: 'View and upgrade your Manifest – the souls bound to the Eclipse.' },
  weapons: { title: 'Arsenal Unlocked!', description: 'Equip and level your Arsenal of Eclipse‑forged weapons.' },
  egoGifts: { title: 'Sigil Relics Unlocked!', description: 'Purchase and equip Sigil Relics – ancient echoes of Eclipse power.' },
  missions: { title: 'Missions Unlocked!', description: 'Complete daily and weekly tasks.' },
  competitive: { title: 'Sefiroth Ascent Unlocked!', description: 'Ascend through the Sefiroth in weekly turn-based combat.' },
  shardShop: { title: 'Shard Shop Unlocked!', description: 'Purchase shards with Inversed Manifest Materials.' },
  department: { title: 'Department Unlocked!', description: 'Manage your facility.' },
  exploration: { title: 'Exploration Unlocked!', description: 'Discover nodes and claim rewards.' },
  duel: { title: 'Duel Unlocked!', description: 'Challenge opponents in 1v1 combat.' },
  movesets: { title: 'Moveset Collection Unlocked!', description: 'View and obtain powerful movesets.' },
};

export type BannerType = 'standard' | 'featured' | 'fate' | 'weapon' | 'rerun' | 'rerun_weapon' | 'rerun_fate';

export interface GachaResult {
  type: 'identity' | 'weapon' | 'material';
  rarity: 'SSR' | 'SR' | 'material';
  id: string;
  name: string;
  shards?: number;
}

export interface PullHistoryEntry {
  id: string;
  bannerType: BannerType;
  timestamp: number;
  result: GachaResult;
}

export interface OwnedIdentity {
  identityId: string;
  rank: number;
  level: number;
  exp: number;
  shards: number;
  skillLevels: [number, number, number, number];
  classSkillLevel?: number;
  corePassiveLevel?: number;
  defenseLevel?: number;
  equippedWeaponId?: string;
}

export interface OwnedWeapon {
  weaponId: string;
  level: number;
  exp: number;
}

export interface EquippedGift {
  slot: EgoGiftSlot;
  giftId: string;
  level: number;
  exp: number;
  syncLevel: number;
}

export interface DailyTask {
  id: string;
  description: string;
  progress: number;
  max: number;
  claimed: boolean;
}

export interface WeeklyTask {
  id: string;
  description: string;
  progress: number;
  max: number;
  claimed: boolean;
}

export interface BannerState {
  type: BannerType;
  pity: number;
  totalPulls: number;
  selectedTargetId?: string;
  selectedWeaponId?: string;
  featuredId?: string;
  floatingGuarantee?: number;
  calibrationActive?: boolean;
  calibrationTarget?: string | null;
}

export const IDENTITY_MATERIAL_RATES = [
  { key: 'expSerum', label: 'EXP Essence', weight: 15.42 },
  { key: 'weapon_parts', label: 'Forge Alloy', weight: 14.39 },
  { key: 'threads', label: 'Sigil Strands', weight: 14.39 },
  { key: 'lowTierMats', label: 'Qliphoth Dust', weight: 10.42 },
  { key: 'sync_mats', label: 'Sync Materials', weight: 10.27 },
  { key: 'manifest_shard', label: 'Manifest Shard', weight: 10.27 },
];

export const WEAPON_MATERIAL_RATES = [
  { key: 'expSerum', label: 'EXP Essence', weight: 15.42 },
  { key: 'weapon_parts', label: 'Forge Alloy', weight: 14.39 },
  { key: 'threads', label: 'Sigil Strands', weight: 14.39 },
  { key: 'lowTierMats', label: 'Qliphoth Dust', weight: 10.42 },
  { key: 'sync_mats', label: 'Sync Materials', weight: 10.27 },
];

// ─── RESONANCE SYSTEM TYPES ──────────────────────────────────────────────
export type ResonanceType =
  | 'precision_attack'
  | 'tactical_modification'
  | 'strengthened_power'
  | 'positioned_action'
  | 'ego_skill_level'
  | 'core_passive_level'
  | 'class_skill_level';

export const UPPER_RESONANCE_SLOTS = 6;
export const LOWER_RESONANCE_SLOTS = 6;
export const TOTAL_RESONANCE_SLOTS = 12;

export const RESONANCE_TYPES: Record<ResonanceType, { label: string; stats: { hp: number; atk: number; def: number; spd: number; crit: number; clashPower: number } }> = {
  precision_attack: {
    label: 'Precision Attack',
    stats: { hp: 50, atk: 0, def: 0, spd: 0, crit: 15, clashPower: 0 },
  },
  tactical_modification: {
    label: 'Tactical Modification',
    stats: { hp: 50, atk: 15, def: 0, spd: 0, crit: 0, clashPower: 0 },
  },
  strengthened_power: {
    label: 'Strengthened Power',
    stats: { hp: 0, atk: 15, def: 20, spd: 0, crit: 0, clashPower: 0 },
  },
  positioned_action: {
    label: 'Positioned Action',
    stats: { hp: 0, atk: 0, def: 0, spd: 45, crit: 0, clashPower: 15 },
  },
  ego_skill_level: {
    label: 'E.G.O Skill +1',
    stats: { hp: 0, atk: 0, def: 0, spd: 0, crit: 0, clashPower: 0 },
  },
  core_passive_level: {
    label: 'Core Passive +1',
    stats: { hp: 0, atk: 0, def: 0, spd: 0, crit: 0, clashPower: 0 },
  },
  class_skill_level: {
    label: 'Class Skill +1',
    stats: { hp: 0, atk: 0, def: 0, spd: 0, crit: 0, clashPower: 0 },
  },
};

export const RESONANCE_HYPERTUNE_MULTIPLIERS: Record<number, number> = {
  0: 1.0,
  1: 1.1,
  2: 1.25,
  3: 1.4,
  4: 1.6,
  5: 1.85,
  6: 2.15,
  7: 2.5,
  8: 2.9,
  9: 3.4,
  10: 4.0,
};

export function getResonanceSlotStats(
  type: ResonanceType | null,
  hypertuneLevel: number = 0
): { hp: number; atk: number; def: number; spd: number; crit: number; clashPower: number } {
  if (!type) return { hp: 0, atk: 0, def: 0, spd: 0, crit: 0, clashPower: 0 };
  const base = RESONANCE_TYPES[type].stats;
  const multiplier = RESONANCE_HYPERTUNE_MULTIPLIERS[hypertuneLevel] || 1.0;
  return {
    hp: Math.floor(base.hp * multiplier),
    atk: Math.floor(base.atk * multiplier),
    def: Math.floor(base.def * multiplier),
    spd: Math.floor(base.spd * multiplier),
    crit: Math.floor(base.crit * multiplier),
    clashPower: Math.floor(base.clashPower * multiplier),
  };
}

export function getTotalResonanceStats(resonance: { slots: { type: ResonanceType | null; hypertuneLevel: number }[] }): {
  hp: number; atk: number; def: number; spd: number; crit: number; clashPower: number;
} {
  const result = { hp: 0, atk: 0, def: 0, spd: 0, crit: 0, clashPower: 0 };
  for (const slot of resonance.slots) {
    const stats = getResonanceSlotStats(slot.type, slot.hypertuneLevel);
    result.hp += stats.hp;
    result.atk += stats.atk;
    result.def += stats.def;
    result.spd += stats.spd;
    result.crit += stats.crit;
    result.clashPower += stats.clashPower;
  }
  return result;
}

// ─── Full GameState ─────────────────────────────────────────────────────
export interface GameState {
  enkephalin: number;
  weaponFragments: number;
  threads: number;
  eclipseResonanceMaterials: number;
  eventManifestTickets: number;
  targetArsenalTickets: number;
  basicManifestTickets: number;
  managerLevel: number;
  managerExp: number;
  lunacy: number;

  ownedIdentities: OwnedIdentity[];
  ownedWeapons: OwnedWeapon[];
  ownedGifts: string[];
  equippedGifts: EquippedGift[];

  expSerum: number;
  expSerumM: number;
  expSerumL: number;
  expSerumXL: number;
  weaponParts: number;
  syncEnhancementMats: number;
  syncSerumMats: number;
  lowTierMats: number;

  currentChapter: number;
  storyAllies: string[];
  storyRoster: string[];
  completedChapters: string[];
  nodeCompletion: Record<string, string[]>;

  dailyTasks: DailyTask[];
  weeklyTasks: WeeklyTask[];

  competitiveScore: number;
  competitivePlayed: boolean;
  crRegion: CRRegion | null;
  crRegionLocked: boolean;
  crWeek: number;
  crZoneScores: Partial<Record<ZoneElement, number>>;
  crCompletedZones: ZoneElement[];
  crMerit: number;
  crReputation: number;
  crSquad: Squad;
  totalEnemyDefeats: number;

  banners: Record<BannerType, BannerState>;

  team: string[];
  leaderIndex: number;

  shardInventory: Record<string, number>;
  ssrInverseMaterial: number;
  srInverseMaterial: number;
  purchasedShards: Record<string, number>;

  seenTutorials: string[];
  pendingTutorialKey: string | null;
  currentTutorialStep: string | null;
  pendingTutorialSequence: string | null;

  giftResonance: Record<EgoGiftSlot, { slot1: string | null; slot2: string | null }>;
  giftHypertune: Record<EgoGiftSlot, number>;
  weaponHarmonization: Record<string, string>;

  lastDailyReset: number;
  lastWeeklyReset: number;
  allDailyBonusClaimed: boolean;
  allWeeklyBonusClaimed: boolean;
  specialDebuffActive: boolean;

  pullHistory: PullHistoryEntry[];

  roverAwakened: boolean;
  trialIdentities: string[];
  temporaryTrialIds: string[];
  awakeningRewardsGranted: boolean;

  currentForcedIdentity: string | null;
  currentUseDawnbreaker: boolean;
  currentJoinAllies: string[];
  currentChapterId: string | null;
  pendingChapterRewards: { bossUnlockId?: string; joinAllies?: string[] } | null;

  egoManifestEssence: number;
  resonance: {
    slots: {
      type: ResonanceType | null;
      hypertuneLevel: number;
    }[];
  };

  facility: {
    isActive: boolean;
    name: string;
    managerId: string | null;
    departmentKey: string | null;
    currentDay: number;
    maxDay: number;
    energy: number;
    maxEnergy: number;
    totalEnergy: number;
    meltdownLevel: number;
    meltdownProgress: number;
    qliphothLevel: number;
    members: string[];
    captainIds: string[];
    threadId: string | null;

    deployedAbnos: {
      abnoId: string;
      abnoName: string;
      risk: string;
      qliphothCounter: number;
      maxCounter: number;
      workCount: number;
      todayWorkCount: number;
    }[];
    deployedToday: string[];
    maxDeployPerDay: number;

    unlockedResearch: string[];
    completedMissions: string[];
    missionProgress: Record<string, number>;
    completedCoreSuppressions: string[];
    suppressionRewards: string[];

    ordealsCompleted: number;
    activeOrdeal: {
      id: string;
      name: string;
      color: string;
      time: 'DAWN' | 'NOON' | 'DUSK' | 'MIDNIGHT';
      enemies: { name: string; hp: number; maxHp: number; atk: number; def: number; spd: number; portrait: string; skills: any[] }[];
    } | null;

    activeBoost: {
      type: string;
      expiresAt: number;
      multiplier: number;
    } | null;

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

    memoryRepositoryAvailable: boolean;
    memoryRepositoryUnlockedDays: number[];

    qliphothOverload: Record<string, { workCount: number; penaltyPercent: number }>;
  };

  duel: {
    active: boolean;
    score: number;
    lives: number;
    streak: number;
    history: { result: 'win' | 'loss'; timestamp: number }[];
  };

  // ── Moveset fields ────────────────────────────────────────────────────
  ownedMovesets: string[];
  movesetTickets: number;
  wawMovesetTickets: number;
  alephMovesetTickets: number;
  walkirksnachtMovesetTickets: number;
  movesetShards: Record<string, number>;

  // ── Blood Lunacy fields ──────────────────────────────────────────────
  bloodLunacy: number;
  bloodLunacyThreshold: number;
}

function generateFloatingGuarantee(): number {
  const specialValues = [85, 90, 100];
  const weights = [0.50, 0.30, 0.15];
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < specialValues.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) {
      const jitter = Math.floor(Math.random() * 5) - 2;
      return Math.min(100, Math.max(80, specialValues[i] + jitter));
    }
  }
  return Math.floor(80 + Math.random() * 21);
}

const AWAKENING_CHAPTER_INDEX = 4;
const AWAKENING_TRIAL_IDS: string[] = [];

const DEPARTMENTS = [
  { key: 'MALKUTH', name: 'Control Team', emoji: '🔥', dayUnlock: 1, maxAbnosPerDay: 1, maxMembers: 10, color: '#FF6B6B', desc: 'Control Team' },
  { key: 'YESOD', name: 'Information Team', emoji: '📊', dayUnlock: 5, maxAbnosPerDay: 1, maxMembers: 10, color: '#4ECDC4', desc: 'Information Team' },
  { key: 'NETZACH', name: 'Safety Team', emoji: '🛡️', dayUnlock: 10, maxAbnosPerDay: 1, maxMembers: 10, color: '#45B7D1', desc: 'Safety Team' },
  { key: 'HOD', name: 'Training Team', emoji: '📚', dayUnlock: 15, maxAbnosPerDay: 1, maxMembers: 10, color: '#96CEB4', desc: 'Training Team' },
  { key: 'TIPHERETH', name: 'Central Command', emoji: '⚖️', dayUnlock: 20, maxAbnosPerDay: 2, maxMembers: 12, color: '#FFEAA7', desc: 'Central Command' },
  { key: 'GEBURA', name: 'Disciplinary Team', emoji: '⚔️', dayUnlock: 25, maxAbnosPerDay: 1, maxMembers: 10, color: '#FF8C42', desc: 'Disciplinary Team' },
  { key: 'CHESED', name: 'Welfare Team', emoji: '🩹', dayUnlock: 30, maxAbnosPerDay: 1, maxMembers: 10, color: '#A8E6CF', desc: 'Welfare Team' },
  { key: 'BINAH', name: 'Extraction Team', emoji: '🔮', dayUnlock: 35, maxAbnosPerDay: 1, maxMembers: 10, color: '#D4A5A5', desc: 'Extraction Team' },
  { key: 'HOKMA', name: 'Records Team', emoji: '⏰', dayUnlock: 40, maxAbnosPerDay: 1, maxMembers: 10, color: '#B5EAD7', desc: 'Records Team' },
  { key: 'DAAT', name: 'Managerial Team', emoji: '🌌', dayUnlock: 45, maxAbnosPerDay: 1, maxMembers: 10, color: '#C7CEE6', desc: 'Managerial Team' },
  { key: 'KETER', name: 'Architecture Team', emoji: '👑', dayUnlock: 50, maxAbnosPerDay: 2, maxMembers: 12, color: '#E2B4BD', desc: 'Architecture Team' },
];

const RESEARCH_DATA: Record<string, { id: string; name: string; description: string; cost: number; effect: any }[]> = {
  MALKUTH: [
    { id: 'malkuth_tt2', name: 'TT2 Protocol', description: 'Allows agents to work more efficiently', cost: 100, effect: { workEfficiency: 1.1 } },
    { id: 'malkuth_join', name: 'Join Command', description: 'Allows agents to join ongoing work', cost: 150, effect: { joinCommand: true } },
    { id: 'malkuth_retreat', name: 'Meeting Call', description: 'Allows one agent to retreat per 5 turns', cost: 200, effect: { retreatEnabled: true } },
  ],
  YESOD: [
    { id: 'yesod_visualization', name: 'G.O Visualization', description: 'Shows abnormality work type visualization', cost: 100, effect: { showWorkVisuals: true } },
    { id: 'yesod_normalization', name: 'Damage Normalization', description: 'Standardizes damage calculations', cost: 150, effect: { damageNormalized: true } },
    { id: 'yesod_corrective', name: 'Corrective Measures Manual', description: 'Reduces penalty from bad work results', cost: 200, effect: { penaltyReduction: 0.3 } },
  ],
  NETZACH: [
    { id: 'netzach_regenerator', name: 'Regenerator MK2', description: 'Heals employees over time', cost: 100, effect: { regenHp: 5 } },
    { id: 'netzach_neutralizer', name: 'Mental Corruption Neutralizer', description: 'Reduces SP damage from abnormalities', cost: 150, effect: { spDamageReduction: 0.25 } },
    { id: 'netzach_distinguisher', name: 'Regeneration Distinguisher', description: 'Improves healing effectiveness', cost: 200, effect: { healingBonus: 0.3 } },
  ],
  HOD: [
    { id: 'hod_manuals', name: 'Education Manuals', description: 'Increases stat gain from work', cost: 100, effect: { statGainBonus: 1.2 } },
    { id: 'hod_professional', name: 'Professional Education', description: 'Further increases work success rates', cost: 150, effect: { workBonus: 0.1 } },
    { id: 'hod_hiring', name: 'Hiring Procedure', description: 'Allows faster recruitment', cost: 200, effect: { hireSpeed: 0.5 } },
  ],
  TIPHERETH: [
    { id: 'tiphereth_red_shield', name: 'Red Shield Bullets', description: 'Unlocks Red Shield bullets', cost: 100, effect: { unlocksBullet: 'RED_SHIELD' } },
    { id: 'tiphereth_white_shield', name: 'White Shield Bullets', description: 'Unlocks White Shield bullets', cost: 100, effect: { unlocksBullet: 'WHITE_SHIELD' } },
    { id: 'tiphereth_black_shield', name: 'Black Shield Bullets', description: 'Unlocks Black Shield bullets', cost: 100, effect: { unlocksBullet: 'BLACK_SHIELD' } },
    { id: 'tiphereth_bullet_capacity', name: 'Bullet Capacity Upgrade', description: 'Increases bullet capacity by 25%', cost: 200, effect: { bulletCapacityBonus: 1.25 } },
  ],
  GEBURA: [
    { id: 'gebura_execution', name: 'Execution Bullets', description: 'Unlocks Execution bullets (Manager only)', cost: 150, effect: { unlocksBullet: 'EXECUTION_BULLET', managerOnly: true } },
    { id: 'gebura_qliphoth', name: 'Qliphoth Intervention Field', description: 'Reduces Qliphoth counter decrease chance', cost: 200, effect: { qliphothProtection: 0.2 } },
    { id: 'gebura_rabbit', name: 'Rabbit Team', description: 'Deploys Rabbit Team to suppress breaches (Manager only)', cost: 300, effect: { rabbitTeamEnabled: true, managerOnly: true } },
  ],
  CHESED: [
    { id: 'chesed_hp_bullet', name: 'HP Bullet', description: 'Unlocks HP healing bullets', cost: 80, effect: { unlocksBullet: 'HP_BULLET' } },
    { id: 'chesed_sp_bullet', name: 'SP Bullet', description: 'Unlocks SP healing bullets', cost: 80, effect: { unlocksBullet: 'SP_BULLET' } },
    { id: 'chesed_refinement', name: 'HP & SP Bullet Refinement', description: 'Improves bullet healing effectiveness', cost: 150, effect: { healingBonus: 1.5 } },
  ],
  BINAH: [
    { id: 'binah_re_extraction', name: 'Re-Extraction', description: 'Allows players to vote for re-roll', cost: 150, effect: { reExtractionEnabled: true } },
    { id: 'binah_extraction_endurance', name: 'Extraction Protocol Endurance', description: 'Increases extraction pulls (3 instead of 1)', cost: 200, effect: { extraExtractionPulls: 3 } },
    { id: 'binah_gift_division', name: 'Gift Division', description: 'Allows splitting EGO gifts', cost: 250, effect: { giftDivisionEnabled: true } },
  ],
  HOKMA: [
    { id: 'hokma_limit_breaker_fortitude', name: 'Limit Breaker: Fortitude', description: 'Fortitude can go past 120', cost: 200, effect: { statCapIncrease: { fortitude: 130 } } },
    { id: 'hokma_limit_breaker_prudence', name: 'Limit Breaker: Prudence', description: 'Prudence can go past 120', cost: 200, effect: { statCapIncrease: { prudence: 130 } } },
    { id: 'hokma_limit_breaker_temperance', name: 'Limit Breaker: Temperance', description: 'Temperance can go past 120', cost: 200, effect: { statCapIncrease: { temperance: 130 } } },
  ],
  DAAT: [
    { id: 'daat_adrenaline', name: 'Adrenaline Bullet', description: 'Speeds up agent movement', cost: 200, effect: { unlocksBullet: 'ADRENALINE_BULLET' } },
    { id: 'daat_instability', name: 'Instability Fix', description: 'Decreases Qliphoth overload for WAW/ALEPH', cost: 250, effect: { overloadReduction: 0.5 } },
  ],
  KETER: [
    { id: 'keter_memory', name: 'Memory Repository Overclock', description: 'Return to specific day for 1500 Lunacy', cost: 500, effect: { memoryOverclock: true, cost: 1500 } },
    { id: 'keter_synergy', name: 'Department Synergy', description: 'All department buffs apply globally at 20% efficiency', cost: 400, effect: { globalSynergy: 0.2 } },
    { id: 'keter_awakening', name: 'Awakening', description: 'Agents with half HP enter Awakening mode', cost: 450, effect: { awakeningEnabled: true } },
  ],
};

const SUPPRESSION_MISSIONS: Record<string, { missions: { id: string; name: string; description: string; requiredProgress: number; stat: string; reward: string }[] }> = {
  MALKUTH: {
    missions: [
      { id: 'malkuth_1', name: 'First Records', description: 'Complete 1 successful work', requiredProgress: 1, stat: 'worksCompleted', reward: 'Unlocks Basic Research & Core Suppression' },
      { id: 'malkuth_2', name: 'Data Entry', description: 'Complete 5 successful works', requiredProgress: 5, stat: 'worksCompleted', reward: 'Unlocks Intermediate Research' },
      { id: 'malkuth_3', name: 'Record Keeper', description: 'Complete 15 successful works', requiredProgress: 15, stat: 'worksCompleted', reward: 'Unlocks Advanced Research' },
      { id: 'malkuth_4', name: 'Archivist', description: 'Complete 30 successful works', requiredProgress: 30, stat: 'worksCompleted', reward: 'Unlocks Expert Research' },
      { id: 'malkuth_5', name: 'Master Archivist', description: 'Complete 50 successful works', requiredProgress: 50, stat: 'worksCompleted', reward: 'Unlocks MALKUTH Core Suppression' },
    ],
  },
  YESOD: {
    missions: [
      { id: 'yesod_1', name: 'Information Gatherer', description: 'Complete 2 successful works', requiredProgress: 2, stat: 'worksCompleted', reward: 'Unlocks Basic Research' },
      { id: 'yesod_2', name: 'Data Analyst', description: 'Complete 8 successful works', requiredProgress: 8, stat: 'worksCompleted', reward: 'Unlocks Intermediate Research' },
      { id: 'yesod_3', name: 'Information Specialist', description: 'Complete 20 successful works', requiredProgress: 20, stat: 'worksCompleted', reward: 'Unlocks Advanced Research' },
      { id: 'yesod_4', name: 'Information Master', description: 'Complete 40 successful works', requiredProgress: 40, stat: 'worksCompleted', reward: 'Unlocks Expert Research' },
      { id: 'yesod_5', name: 'Omniscient', description: 'Complete 75 successful works', requiredProgress: 75, stat: 'worksCompleted', reward: 'Unlocks YESOD Core Suppression' },
    ],
  },
  NETZACH: {
    missions: [
      { id: 'netzach_1', name: 'Art Apprentice', description: 'Heal 50 total HP', requiredProgress: 50, stat: 'totalHealing', reward: 'Unlocks Basic Research' },
      { id: 'netzach_2', name: 'Art Enthusiast', description: 'Heal 150 total HP', requiredProgress: 150, stat: 'totalHealing', reward: 'Unlocks Intermediate Research' },
      { id: 'netzach_3', name: 'Art Connoisseur', description: 'Heal 300 total HP', requiredProgress: 300, stat: 'totalHealing', reward: 'Unlocks Advanced Research' },
      { id: 'netzach_4', name: 'Art Master', description: 'Heal 500 total HP', requiredProgress: 500, stat: 'totalHealing', reward: 'Unlocks Expert Research' },
      { id: 'netzach_5', name: 'Art God', description: 'Heal 1000 total HP', requiredProgress: 1000, stat: 'totalHealing', reward: 'Unlocks NETZACH Core Suppression' },
    ],
  },
  HOD: {
    missions: [
      { id: 'hod_1', name: 'Student', description: 'Gain 10 total stat points', requiredProgress: 10, stat: 'statGains', reward: 'Unlocks Basic Research' },
      { id: 'hod_2', name: 'Scholar', description: 'Gain 25 total stat points', requiredProgress: 25, stat: 'statGains', reward: 'Unlocks Intermediate Research' },
      { id: 'hod_3', name: 'Teacher', description: 'Gain 50 total stat points', requiredProgress: 50, stat: 'statGains', reward: 'Unlocks Advanced Research' },
      { id: 'hod_4', name: 'Professor', description: 'Gain 100 total stat points', requiredProgress: 100, stat: 'statGains', reward: 'Unlocks Expert Research' },
      { id: 'hod_5', name: 'Headmaster', description: 'Gain 200 total stat points', requiredProgress: 200, stat: 'statGains', reward: 'Unlocks HOD Core Suppression' },
    ],
  },
  TIPHERETH: {
    missions: [
      { id: 'tiphereth_1', name: 'Energy Novice', description: 'Collect 50 total Energy', requiredProgress: 50, stat: 'totalEnergy', reward: 'Unlocks Basic Research' },
      { id: 'tiphereth_2', name: 'Energy Apprentice', description: 'Collect 150 total Energy', requiredProgress: 150, stat: 'totalEnergy', reward: 'Unlocks Intermediate Research' },
      { id: 'tiphereth_3', name: 'Energy Expert', description: 'Collect 350 total Energy', requiredProgress: 350, stat: 'totalEnergy', reward: 'Unlocks Advanced Research' },
      { id: 'tiphereth_4', name: 'Energy Master', description: 'Collect 600 total Energy', requiredProgress: 600, stat: 'totalEnergy', reward: 'Unlocks Expert Research' },
      { id: 'tiphereth_5', name: 'Energy God', description: 'Collect 1000 total Energy', requiredProgress: 1000, stat: 'totalEnergy', reward: 'Unlocks TIPHERETH Core Suppression' },
    ],
  },
  GEBURA: {
    missions: [
      { id: 'gebura_1', name: 'Novice Fighter', description: 'Deal 100 total damage in combat', requiredProgress: 100, stat: 'totalDamage', reward: 'Unlocks Basic Research' },
      { id: 'gebura_2', name: 'Skilled Warrior', description: 'Deal 300 total damage in combat', requiredProgress: 300, stat: 'totalDamage', reward: 'Unlocks Intermediate Research' },
      { id: 'gebura_3', name: 'Elite Soldier', description: 'Deal 600 total damage in combat', requiredProgress: 600, stat: 'totalDamage', reward: 'Unlocks Advanced Research' },
      { id: 'gebura_4', name: 'Master Fighter', description: 'Deal 1000 total damage in combat', requiredProgress: 1000, stat: 'totalDamage', reward: 'Unlocks Expert Research' },
      { id: 'gebura_5', name: 'One-Woman Army', description: 'Deal 2000 total damage in combat', requiredProgress: 2000, stat: 'totalDamage', reward: 'Unlocks GEBURA Core Suppression' },
    ],
  },
  CHESED: {
    missions: [
      { id: 'chesed_1', name: 'Helper', description: 'Suppress 1 abnormality', requiredProgress: 1, stat: 'suppressions', reward: 'Unlocks Basic Research' },
      { id: 'chesed_2', name: 'Protector', description: 'Suppress 3 abnormalities', requiredProgress: 3, stat: 'suppressions', reward: 'Unlocks Intermediate Research' },
      { id: 'chesed_3', name: 'Guardian', description: 'Suppress 6 abnormalities', requiredProgress: 6, stat: 'suppressions', reward: 'Unlocks Advanced Research' },
      { id: 'chesed_4', name: 'Savior', description: 'Suppress 10 abnormalities', requiredProgress: 10, stat: 'suppressions', reward: 'Unlocks Expert Research' },
      { id: 'chesed_5', name: 'Messiah', description: 'Suppress 20 abnormalities', requiredProgress: 20, stat: 'suppressions', reward: 'Unlocks CHESED Core Suppression' },
    ],
  },
  BINAH: {
    missions: [
      { id: 'binah_1', name: 'Extractor', description: 'Extract 1 E.G.O. equipment', requiredProgress: 1, stat: 'extractions', reward: 'Unlocks Basic Research' },
      { id: 'binah_2', name: 'Collector', description: 'Extract 3 E.G.O. equipment', requiredProgress: 3, stat: 'extractions', reward: 'Unlocks Intermediate Research' },
      { id: 'binah_3', name: 'Hoarder', description: 'Extract 6 E.G.O. equipment', requiredProgress: 6, stat: 'extractions', reward: 'Unlocks Advanced Research' },
      { id: 'binah_4', name: 'Curator', description: 'Extract 10 E.G.O. equipment', requiredProgress: 10, stat: 'extractions', reward: 'Unlocks Expert Research' },
      { id: 'binah_5', name: 'Singularity Master', description: 'Extract 20 E.G.O. equipment', requiredProgress: 20, stat: 'extractions', reward: 'Unlocks BINAH Core Suppression' },
    ],
  },
  HOKMA: {
    missions: [
      { id: 'hokma_1', name: 'Day 10', description: 'Reach Day 10', requiredProgress: 10, stat: 'currentDay', reward: 'Unlocks Basic Research' },
      { id: 'hokma_2', name: 'Day 20', description: 'Reach Day 20', requiredProgress: 20, stat: 'currentDay', reward: 'Unlocks Intermediate Research' },
      { id: 'hokma_3', name: 'Day 30', description: 'Reach Day 30', requiredProgress: 30, stat: 'currentDay', reward: 'Unlocks Advanced Research' },
      { id: 'hokma_4', name: 'Day 40', description: 'Reach Day 40', requiredProgress: 40, stat: 'currentDay', reward: 'Unlocks Expert Research' },
      { id: 'hokma_5', name: 'Day 50', description: 'Reach Day 50', requiredProgress: 50, stat: 'currentDay', reward: 'Unlocks HOKMA Core Suppression' },
    ],
  },
  DAAT: {
    missions: [
      { id: 'daat_1', name: 'Ordeal Survivor', description: 'Complete 2 ordeals', requiredProgress: 2, stat: 'ordealsCompleted', reward: 'Unlocks Basic Research' },
      { id: 'daat_2', name: 'Ordeal Veteran', description: 'Complete 5 ordeals', requiredProgress: 5, stat: 'ordealsCompleted', reward: 'Unlocks Intermediate Research' },
      { id: 'daat_3', name: 'Ordeal Master', description: 'Complete 10 ordeals', requiredProgress: 10, stat: 'ordealsCompleted', reward: 'Unlocks Advanced Research' },
      { id: 'daat_4', name: 'Ordeal Conqueror', description: 'Complete 15 ordeals', requiredProgress: 15, stat: 'ordealsCompleted', reward: 'Unlocks Expert Research' },
      { id: 'daat_5', name: 'Ordeal God', description: 'Complete 25 ordeals', requiredProgress: 25, stat: 'ordealsCompleted', reward: 'Unlocks DAAT Core Suppression' },
    ],
  },
  KETER: {
    missions: [
      { id: 'keter_1', name: 'First Suppression', description: 'Complete 1 core suppression', requiredProgress: 1, stat: 'completedSuppressions', reward: 'Unlocks Basic Research' },
      { id: 'keter_2', name: 'Growing Power', description: 'Complete 3 core suppressions', requiredProgress: 3, stat: 'completedSuppressions', reward: 'Unlocks Intermediate Research' },
      { id: 'keter_3', name: 'Established Authority', description: 'Complete 6 core suppressions', requiredProgress: 6, stat: 'completedSuppressions', reward: 'Unlocks Advanced Research' },
      { id: 'keter_4', name: 'Supreme Ruler', description: 'Complete 9 core suppressions', requiredProgress: 9, stat: 'completedSuppressions', reward: 'Unlocks Expert Research' },
      { id: 'keter_5', name: 'The One Who Rules', description: 'Complete all other core suppressions', requiredProgress: 10, stat: 'completedSuppressions', reward: 'Unlocks KETER Core Suppression' },
    ],
  },
};

const ORDEAL_TIMES = {
  DAWN: { name: 'Dawn', minDay: 6, energyReward: 20, emoji: '🌅' },
  NOON: { name: 'Noon', minDay: 10, energyReward: 40, emoji: '☀️' },
  DUSK: { name: 'Dusk', minDay: 15, energyReward: 60, emoji: '🌆' },
  MIDNIGHT: { name: 'Midnight', minDay: 20, energyReward: 100, emoji: '🌙' },
};

function getRequiredEnergyForDay(day: number): number {
  if (day <= 1) return 50;
  const required = 50 + (day - 1) * 20;
  return Math.min(required, 2000);
}

function getDeployCost(day: number, risk: string): number {
  if (risk === 'ZAYIN' || risk === 'TETH') return 0;
  if (risk === 'HE') return 10 + Math.floor(day * 0.5);
  if (risk === 'WAW') return 25 + Math.floor(day * 0.8);
  if (risk === 'ALEPH') return 50 + day;
  return 0;
}

// ─── INITIAL STATE ──────────────────────────────────────────────────────
const INITIAL_STATE: GameState = {
  enkephalin: 175,
  weaponFragments: 175,
  threads: 75,
  eclipseResonanceMaterials: 0,
  eventManifestTickets: 0,
  targetArsenalTickets: 0,
  basicManifestTickets: 0,
  managerLevel: 1,
  managerExp: 0,
  lunacy: 0,
  ownedIdentities: [
    {
      identityId: 'arthur_excalibur',
      rank: 0,
      level: 1,
      exp: 0,
      shards: 0,
      skillLevels: [1, 1, 1, 1],
      corePassiveLevel: 1,
      defenseLevel: 1,
      equippedWeaponId: 'excalibur_greatsword',
    },
  ],
  ownedWeapons: [{ weaponId: 'excalibur_greatsword', level: 1, exp: 0 }],
  ownedGifts: [],
  equippedGifts: EGO_GIFT_SLOTS.map(slot => ({
    slot: slot.id,
    giftId: '',
    level: 1,
    exp: 0,
    syncLevel: 0,
  })),
  expSerum: 10,
  expSerumM: 5,
  expSerumL: 0,
  expSerumXL: 0,
  weaponParts: 0,
  syncEnhancementMats: 0,
  syncSerumMats: 0,
  lowTierMats: 0,
  currentChapter: 0,
  storyAllies: ['arthur_excalibur'],
  storyRoster: ['arthur_excalibur'],
  completedChapters: [],
  nodeCompletion: {},
  dailyTasks: [
    { id: 'daily_pull', description: 'Perform 1 Extraction Pull', progress: 0, max: 1, claimed: false },
    { id: 'daily_story', description: 'Complete a Story Quest', progress: 0, max: 1, claimed: false },
    { id: 'daily_level', description: 'Level up an Identity once', progress: 0, max: 1, claimed: false },
    { id: 'daily_gift', description: 'Equip or change an Ego Gift', progress: 0, max: 1, claimed: false },
    { id: 'daily_moveset', description: 'Obtain a Moveset', progress: 0, max: 1, claimed: false },
  ],
  weeklyTasks: [
    { id: 'weekly_reception_first', description: 'Clear Competitive Reception', progress: 0, max: 1, claimed: false },
    { id: 'weekly_reception_score', description: 'Get 200k Score on Competitive Reception', progress: 0, max: 200000, claimed: false },
    { id: 'weekly_pull_10', description: 'Perform 10 Extractions', progress: 0, max: 10, claimed: false },
    { id: 'weekly_level_5', description: 'Level up Identities 5 times', progress: 0, max: 5, claimed: false },
    { id: 'weekly_moveset_3', description: 'Obtain 3 Movesets', progress: 0, max: 3, claimed: false },
  ],
  competitiveScore: 0,
  competitivePlayed: false,
  crRegion: null,
  crRegionLocked: false,
  crWeek: 0,
  crZoneScores: {},
  crCompletedZones: [],
  crMerit: 0,
  crReputation: 0,
  crSquad: 'Beginner',
  totalEnemyDefeats: 0,
  banners: {
    standard: { type: 'standard', pity: 0, totalPulls: 0, selectedTargetId: 'arthur_excalibur' },
    featured: { type: 'featured', pity: 0, totalPulls: 0, featuredId: 'arthur_excalibur' },
    fate: {
      type: 'fate',
      pity: 0,
      totalPulls: 0,
      featuredId: 'arthur_excalibur',
      floatingGuarantee: generateFloatingGuarantee(),
    },
    weapon: {
      type: 'weapon',
      pity: 0,
      totalPulls: 0,
      selectedWeaponId: 'excalibur_greatsword',
      calibrationActive: false,
      calibrationTarget: null,
    },
    rerun: {
      type: 'rerun',
      pity: 0,
      totalPulls: 0,
      featuredId: 'arthur_excalibur',
    },
    rerun_weapon: {
      type: 'rerun_weapon',
      pity: 0,
      totalPulls: 0,
      selectedWeaponId: 'excalibur_greatsword',
      calibrationActive: false,
      calibrationTarget: null,
    },
    rerun_fate: {
      type: 'rerun_fate',
      pity: 0,
      totalPulls: 0,
      featuredId: 'arthur_excalibur',
      floatingGuarantee: generateFloatingGuarantee(),
    },
  },
  team: ['arthur_excalibur'],
  leaderIndex: 0,
  shardInventory: {},
  ssrInverseMaterial: 0,
  srInverseMaterial: 0,
  purchasedShards: {},
  seenTutorials: [],
  pendingTutorialKey: null,
  currentTutorialStep: null,
  pendingTutorialSequence: null,
  giftResonance: {} as Record<EgoGiftSlot, { slot1: string | null; slot2: string | null }>,
  giftHypertune: {} as Record<EgoGiftSlot, number>,
  weaponHarmonization: {},
  lastDailyReset: Date.now(),
  lastWeeklyReset: Date.now(),
  allDailyBonusClaimed: false,
  allWeeklyBonusClaimed: false,
  specialDebuffActive: false,
  pullHistory: [],
  roverAwakened: false,
  trialIdentities: [],
  temporaryTrialIds: [],
  awakeningRewardsGranted: false,
  currentForcedIdentity: null,
  currentUseDawnbreaker: false,
  currentJoinAllies: [],
  currentChapterId: null,
  pendingChapterRewards: null,
  egoManifestEssence: 0,
  resonance: {
    slots: Array.from({ length: TOTAL_RESONANCE_SLOTS }, () => ({
      type: null,
      hypertuneLevel: 0,
    })),
  },
  facility: {
    isActive: false,
    name: '',
    managerId: null,
    departmentKey: null,
    currentDay: 1,
    maxDay: 50,
    energy: 0,
    maxEnergy: 100,
    totalEnergy: 0,
    meltdownLevel: 0,
    meltdownProgress: 0,
    qliphothLevel: 0,
    members: [],
    captainIds: [],
    threadId: null,
    deployedAbnos: [],
    deployedToday: [],
    maxDeployPerDay: 1,
    unlockedResearch: [],
    completedMissions: [],
    missionProgress: {},
    completedCoreSuppressions: [],
    suppressionRewards: [],
    ordealsCompleted: 0,
    activeOrdeal: null,
    activeBoost: null,
    bullets: { red: 0, white: 0, black: 0, pale: 0, hp: 0, sp: 0, adrenaline: 0, execution: 0 },
    bulletCapacityMultiplier: 1.0,
    memoryRepositoryAvailable: false,
    memoryRepositoryUnlockedDays: [],
    qliphothOverload: {},
  },
  duel: {
    active: false,
    score: 0,
    lives: 5,
    streak: 0,
    history: [],
  },

  // ── Moveset initial state ────────────────────────────────────────────
  ownedMovesets: [],
  movesetTickets: 0,
  wawMovesetTickets: 0,
  alephMovesetTickets: 0,
  walkirksnachtMovesetTickets: 0,
  movesetShards: {},

  // ── Blood Lunacy initial state ──────────────────────────────────────
  bloodLunacy: 0,
  bloodLunacyThreshold: 1000,
};

const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── Currency actions ──────────────────────────────────────────────
      addEnkephalin: (amount: number) => set((state) => ({ enkephalin: state.enkephalin + amount })),
      addWeaponFragments: (amount: number) => set((state) => ({ weaponFragments: state.weaponFragments + amount })),
      addThreads: (amount: number) => set((state) => ({ threads: state.threads + amount })),
      addEclipseResonanceMaterials: (amount: number) => set((state) => ({ eclipseResonanceMaterials: state.eclipseResonanceMaterials + amount })),
      addEventManifestTickets: (amount: number) => set((state) => ({ eventManifestTickets: state.eventManifestTickets + amount })),
      addTargetArsenalTickets: (amount: number) => set((state) => ({ targetArsenalTickets: state.targetArsenalTickets + amount })),
      addBasicManifestTickets: (amount: number) => set((state) => ({ basicManifestTickets: state.basicManifestTickets + amount })),
      addLunacy: (amount: number) => set((state) => ({ lunacy: state.lunacy + amount })),
      removeLunacy: (amount: number) => set((state) => ({ lunacy: Math.max(0, state.lunacy - amount) })),

      addManagerExp: (amount: number) => {
        const state = get();
        let exp = state.managerExp + amount;
        let level = state.managerLevel;
        const maxLevel = 80;
        while (level < maxLevel && exp >= level * 100) {
          exp -= level * 100;
          level += 1;
        }
        if (level >= maxLevel) {
          level = maxLevel;
          exp = 0;
        }
        set({ managerLevel: level, managerExp: exp });
      },

      addExpSerum: (amount: number) => set((state) => ({ expSerum: state.expSerum + amount })),
      addExpSerumM: (amount: number) => set((state) => ({ expSerumM: state.expSerumM + amount })),
      addExpSerumL: (amount: number) => set((state) => ({ expSerumL: state.expSerumL + amount })),
      addExpSerumXL: (amount: number) => set((state) => ({ expSerumXL: state.expSerumXL + amount })),
      addWeaponParts: (amount: number) => set((state) => ({ weaponParts: state.weaponParts + amount })),
      addSyncEnhancement: (amount: number) => set((state) => ({ syncEnhancementMats: state.syncEnhancementMats + amount })),
      addSyncSerum: (amount: number) => set((state) => ({ syncSerumMats: state.syncSerumMats + amount })),
      addLowTierMats: (amount: number) => set((state) => ({ lowTierMats: state.lowTierMats + amount })),

      // ── Story Allies ──────────────────────────────────────────────────
      addStoryAlly: (identityId: string) => {
        set((s) => ({
          storyAllies: s.storyAllies.includes(identityId) ? s.storyAllies : [...s.storyAllies, identityId],
        }));
      },

      // ── Trial identities ──────────────────────────────────────────────
      addTrialIdentity: (identityId: string, permanent: boolean = true) => {
        set((s) => {
          const newTrials = s.trialIdentities.includes(identityId) ? s.trialIdentities : [...s.trialIdentities, identityId];
          let newTemp = s.temporaryTrialIds;
          if (permanent) {
            newTemp = newTemp.filter(id => id !== identityId);
          } else {
            if (!newTemp.includes(identityId)) {
              newTemp = [...newTemp, identityId];
            }
          }
          const forcedIds = newTrials.filter(id => id !== 'arthur_excalibur');
          let finalTeam = [...s.team];
          for (const id of forcedIds) {
            if (!finalTeam.includes(id)) {
              finalTeam.unshift(id);
            }
          }
          if (finalTeam.length > 3) finalTeam = finalTeam.slice(0, 3);
          return { ...s, trialIdentities: newTrials, temporaryTrialIds: newTemp, team: finalTeam };
        });
      },

      removeTrialIdentity: (identityId: string) => {
        set((s) => ({
          trialIdentities: s.trialIdentities.filter(id => id !== identityId),
          temporaryTrialIds: s.temporaryTrialIds.filter(id => id !== identityId),
        }));
      },

      getMaxedIdentity: (identityId: string): OwnedIdentity | null => {
        const state = get();
        const owned = state.ownedIdentities.find(o => o.identityId === identityId);
        if (!owned) return null;
        const isTrial = state.trialIdentities.includes(identityId);
        if (!isTrial) return owned;
        const identity = identities.find(i => i.id === identityId);
        if (!identity) return owned;
        return {
          ...owned,
          level: identity.levelCap,
          rank: 8,
          skillLevels: [15, 15, 15, 15] as [number, number, number, number],
          classSkillLevel: 20,
          corePassiveLevel: 10,
          defenseLevel: 10,
          shards: 0,
          exp: 0,
        };
      },

      // ── Chapter management ────────────────────────────────────────────
      prepareChapter: (chapterIndex: number) => {
        const state = get();
        const chapter = storyChapters[chapterIndex];
        if (!chapter) return;
        const forcedIdentity = 'forcedIdentity' in chapter ? chapter.forcedIdentity : null;
        const useDawnbreaker = 'useDawnbreaker' in chapter ? chapter.useDawnbreaker : false;
        const joinAllies = 'joinAllies' in chapter ? chapter.joinAllies : [];
        const bossUnlockId = 'bossUnlockId' in chapter ? chapter.bossUnlockId : null;
        const chapterId = chapter.id || `ch${chapterIndex}`;
        const tempTrialIds: string[] = [];
        if (forcedIdentity) tempTrialIds.push(forcedIdentity);
        for (const id of joinAllies) {
          if (!tempTrialIds.includes(id)) tempTrialIds.push(id);
        }
        const isAwakeningChapter = chapterIndex === AWAKENING_CHAPTER_INDEX;
        const shouldUseDawnbreaker = useDawnbreaker && (state.roverAwakened || isAwakeningChapter);
        let newTeam = [...get().team];
        if (shouldUseDawnbreaker) {
          const eclipseIdx = newTeam.indexOf('arthur_excalibur');
          if (eclipseIdx !== -1) {
            newTeam[eclipseIdx] = 'rover_dawnbreaker_story';
          } else if (!newTeam.includes('rover_dawnbreaker_story')) {
            newTeam.unshift('rover_dawnbreaker_story');
          }
          if (!isAwakeningChapter && !tempTrialIds.includes('rover_dawnbreaker_story')) {
            tempTrialIds.push('rover_dawnbreaker_story');
          }
        }
        let newTrials = [...get().trialIdentities];
        for (const id of tempTrialIds) {
          if (!newTrials.includes(id)) {
            newTrials.push(id);
          }
          if (!newTeam.includes(id)) {
            newTeam.unshift(id);
          }
        }
        if (newTeam.length > 3) newTeam = newTeam.slice(0, 3);
        set((s) => ({
          currentForcedIdentity: forcedIdentity,
          currentUseDawnbreaker: useDawnbreaker,
          currentJoinAllies: joinAllies,
          currentChapterId: chapterId,
          team: newTeam,
          trialIdentities: newTrials,
          temporaryTrialIds: [...s.temporaryTrialIds, ...tempTrialIds],
          pendingChapterRewards: {
            bossUnlockId: bossUnlockId || undefined,
            joinAllies: joinAllies.length > 0 ? joinAllies : undefined,
          },
        }));
      },

      completeChapter: () => {
        const state = get();
        if (!state.pendingChapterRewards && !state.currentForcedIdentity) {
          const nextChapter = state.currentChapter + 1;
          set((s) => ({ currentChapter: nextChapter }));
          return;
        }
        const chapter = storyChapters[state.currentChapter];
        if (!chapter) return;
        const chapterId = state.currentChapterId || chapter.id || `ch${state.currentChapter}`;
        if (state.currentChapter === AWAKENING_CHAPTER_INDEX && !state.roverAwakened) {
          let newTrials = [...state.trialIdentities];
          if (!newTrials.includes('rover_dawnbreaker_story')) {
            newTrials.push('rover_dawnbreaker_story');
          }
          const newTemp = state.temporaryTrialIds.filter(id => id !== 'rover_dawnbreaker_story');
          let newTeam = [...state.team];
          const eclipseIdx = newTeam.indexOf('arthur_excalibur');
          if (eclipseIdx !== -1) {
            newTeam[eclipseIdx] = 'rover_dawnbreaker_story';
          } else if (!newTeam.includes('rover_dawnbreaker_story')) {
            newTeam.unshift('rover_dawnbreaker_story');
          }
          if (newTeam.length > 3) newTeam = newTeam.slice(0, 3);
          for (const id of AWAKENING_TRIAL_IDS) {
            if (!newTrials.includes(id)) {
              newTrials.push(id);
            }
            if (!newTeam.includes(id) && newTeam.length < 3) {
              newTeam.push(id);
            }
          }
          set((s) => ({
            trialIdentities: newTrials,
            temporaryTrialIds: newTemp,
            team: newTeam,
            roverAwakened: true,
          }));
        }
        const rewards = state.pendingChapterRewards;
        if (rewards) {
          let newRoster = [...state.storyRoster];
          let newTrials = [...state.trialIdentities];
          if (rewards.bossUnlockId && rewards.bossUnlockId !== 'lotus_qlippoth' && rewards.bossUnlockId !== 'mother') {
            if (!newRoster.includes(rewards.bossUnlockId)) {
              newRoster.push(rewards.bossUnlockId);
            }
            if (!newTrials.includes(rewards.bossUnlockId)) {
              newTrials.push(rewards.bossUnlockId);
            }
          }
          if (rewards.joinAllies) {
            for (const id of rewards.joinAllies) {
              if (!newRoster.includes(id)) {
                newRoster.push(id);
              }
              if (!newTrials.includes(id)) {
                newTrials.push(id);
              }
            }
          }
          set((s) => ({ storyRoster: newRoster, trialIdentities: newTrials }));
        }
        let tempIds = state.temporaryTrialIds;
        let newTrialsAfter = state.trialIdentities.filter(id => !tempIds.includes(id));
        let newTeam = state.team.filter(id => !tempIds.includes(id));
        const permanentTrials = state.trialIdentities.filter(id => !tempIds.includes(id));
        for (const id of permanentTrials) {
          if (!newTeam.includes(id) && id !== 'arthur_excalibur') {
            newTeam.unshift(id);
          }
        }
        if (newTeam.length > 3) newTeam = newTeam.slice(0, 3);
        set((s) => ({
          completedChapters: s.completedChapters.includes(chapterId) ? s.completedChapters : [...s.completedChapters, chapterId],
          currentForcedIdentity: null,
          currentUseDawnbreaker: false,
          currentJoinAllies: [],
          currentChapterId: null,
          pendingChapterRewards: null,
          trialIdentities: newTrialsAfter,
          temporaryTrialIds: tempIds,
          team: newTeam,
          currentChapter: state.currentChapter + 1,
        }));
        const roverIndex = state.ownedIdentities.findIndex(o => o.identityId === 'arthur_excalibur');
        let newOwned = [...state.ownedIdentities];
        if (roverIndex !== -1) {
          const rover = newOwned[roverIndex];
          const maxShardsNeeded = 189;
          const shardGain = 30;
          let newShards = rover.shards + shardGain;
          if (newShards > maxShardsNeeded) newShards = maxShardsNeeded;
          let newExp = rover.exp + 1000;
          let newLevel = rover.level;
          while (newLevel < 65) {
            const needed = expForLevel(newLevel);
            if (newExp < needed) break;
            newExp -= needed;
            newLevel += 1;
          }
          newOwned[roverIndex] = {
            ...rover,
            shards: newShards,
            level: newLevel,
            exp: newExp,
          };
        }
        set((s) => ({
          ownedIdentities: newOwned,
          threads: s.threads + 50,
          expSerum: s.expSerum + 5,
          expSerumM: s.expSerumM + 2,
          expSerumL: s.expSerumL + 1,
          lowTierMats: s.lowTierMats + 10,
          weaponParts: s.weaponParts + 5,
          dailyTasks: s.dailyTasks.map(t =>
            t.id === 'daily_story' ? { ...t, progress: Math.min(t.max, t.progress + 1) } : t
          ),
        }));
        // ── Blood Lunacy from story ──────────────────────────────────
        get().addBloodLunacy(100);
        get().addManagerExp(750);
      },

      // ── Story Nodes ────────────────────────────────────────────────────
      completeNode: (chapterId: string, nodeId: string) => {
        set((state) => ({
          nodeCompletion: {
            ...state.nodeCompletion,
            [chapterId]: [...(state.nodeCompletion[chapterId] || []), nodeId],
          },
        }));
      },
      isNodeComplete: (chapterId: string, nodeId: string): boolean => {
        const state = get();
        return state.nodeCompletion[chapterId]?.includes(nodeId) ?? false;
      },
      getAvailableNodes: (chapterId: string) => {
        const state = get();
        const chapter = storyChapters.find(c => c.id === chapterId);
        if (!chapter) return [];
        return chapter.nodes.filter(n => !state.isNodeComplete(chapterId, n.id));
      },

      // ── Exchange ────────────────────────────────────────────────────────
      exchangeEnkephalinToEventTickets: (amount: number) => {
        const state = get();
        if (state.enkephalin < amount) return;
        set((s) => ({
          enkephalin: s.enkephalin - amount,
          eventManifestTickets: s.eventManifestTickets + amount,
        }));
      },
      exchangeEnkephalinToArsenalTickets: (amount: number) => {
        const state = get();
        if (state.enkephalin < amount) return;
        set((s) => ({
          enkephalin: s.enkephalin - amount,
          targetArsenalTickets: s.targetArsenalTickets + amount,
        }));
      },
      exchangeEnkephalinToBasicTickets: (amount: number) => {
        const state = get();
        if (state.enkephalin < amount) return;
        set((s) => ({
          enkephalin: s.enkephalin - amount,
          basicManifestTickets: s.basicManifestTickets + amount,
        }));
      },

      // ── Pull History ────────────────────────────────────────────────────
      addPullHistoryEntry: (entry: PullHistoryEntry) =>
        set((state) => ({
          pullHistory: [entry, ...state.pullHistory].slice(0, 500),
        })),

      // ── Gacha ──────────────────────────────────────────────────────────
      pullGacha: (bannerType: BannerType, count: 1 | 10): GachaResult[] => {
        const state = get();
        const cost = count === 10 ? 1750 : 175;
        let currency: 'enkephalin' | 'weaponFragments' | 'eventManifestTickets' | 'targetArsenalTickets' | 'basicManifestTickets';
        let balance: number;
        if (bannerType === 'weapon' || bannerType === 'rerun_weapon') {
          currency = 'targetArsenalTickets';
          balance = state.targetArsenalTickets;
          if (balance < cost) return [];
        } else if (bannerType === 'featured' || bannerType === 'fate' || bannerType === 'rerun' || bannerType === 'rerun_fate') {
          currency = 'eventManifestTickets';
          balance = state.eventManifestTickets;
          if (balance < cost) return [];
        } else {
          currency = 'basicManifestTickets';
          balance = state.basicManifestTickets;
          if (balance < cost) return [];
        }
        const results: GachaResult[] = [];
        const banner = { ...state.banners[bannerType] };
        const pulledIds = new Set<string>();
        for (let i = 0; i < count; i++) {
          const result = pullOne(banner, bannerType);
          if (result.rarity === 'SSR') {
            banner.pity = 0;
            if (bannerType === 'fate' || bannerType === 'rerun_fate') {
              banner.floatingGuarantee = generateFloatingGuarantee();
            }
          } else {
            banner.pity += 1;
          }
          banner.totalPulls += 1;
          results.push(result);
          const entry: PullHistoryEntry = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            bannerType: bannerType,
            timestamp: Date.now(),
            result: result,
          };
          get().addPullHistoryEntry(entry);
          if (result.type === 'identity' && result.id) {
            const existing = state.ownedIdentities.find(o => o.identityId === result.id);
            const shardAmount = result.shards || 20;
            if (existing || pulledIds.has(result.id)) {
              set((s) => ({
                ownedIdentities: s.ownedIdentities.map(o =>
                  o.identityId === result.id ? { ...o, shards: o.shards + shardAmount } : o
                ),
                trialIdentities: s.trialIdentities.filter(id => id !== result.id),
                temporaryTrialIds: s.temporaryTrialIds.filter(id => id !== result.id),
              }));
            } else {
              pulledIds.add(result.id);
              set((s) => ({
                ownedIdentities: [
                  ...s.ownedIdentities,
                  {
                    identityId: result.id,
                    rank: 0,
                    level: 1,
                    exp: 0,
                    shards: 0,
                    skillLevels: [1, 1, 1, 1],
                    corePassiveLevel: 1,
                    defenseLevel: 1,
                    equippedWeaponId: weapons.find(w => w.signatureFor === result.id)?.id || undefined,
                  },
                ],
                trialIdentities: s.trialIdentities.filter(id => id !== result.id),
                temporaryTrialIds: s.temporaryTrialIds.filter(id => id !== result.id),
              }));
            }
          } else if (result.type === 'weapon' && result.id) {
            set((s) => ({ weaponParts: s.weaponParts + 5 }));
          } else if (result.type === 'material') {
            if (result.id === 'lowTierMats') {
              set((s) => ({ lowTierMats: s.lowTierMats + 3 }));
            } else if (result.id === 'expSerum') {
              set((s) => ({ expSerum: s.expSerum + 2 }));
            } else if (result.id === 'weapon_parts') {
              set((s) => ({ weaponParts: s.weaponParts + 5 }));
            } else if (result.id.startsWith('sr_shard:') || result.id.startsWith('ssr_shard:')) {
              const id = result.id.split(':')[1];
              set((s) => ({
                shardInventory: { ...s.shardInventory, [id]: (s.shardInventory[id] || 0) + 1 },
              }));
            }
          }
        }
        set((s) => ({
          [currency]: s[currency] - cost,
          banners: { ...s.banners, [bannerType]: banner },
          dailyTasks: s.dailyTasks.map(t =>
            t.id === 'daily_pull' ? { ...t, progress: Math.min(t.max, t.progress + count) } : t
          ),
          weeklyTasks: s.weeklyTasks.map(t =>
            t.id === 'weekly_pull_10' ? { ...t, progress: Math.min(t.max, t.progress + count) } : t
          ),
        }));
        get().addManagerExp(count * 5);
        return results;
      },

      setBannerTarget: (bannerType: BannerType, targetId: string) => {
        const state = get();
        const banner = state.banners[bannerType];
        if (!banner) return;
        const isWeapon = bannerType === 'weapon' || bannerType === 'rerun_weapon';
        let updates: Partial<BannerState> = {};
        if (isWeapon) {
          updates = { selectedWeaponId: targetId, calibrationActive: false, calibrationTarget: null };
        } else {
          updates = bannerType === 'standard' ? { selectedTargetId: targetId } : { featuredId: targetId };
        }
        set((s) => ({
          banners: {
            ...s.banners,
            [bannerType]: { ...s.banners[bannerType], ...updates },
          },
        }));
      },

      // ── Identities ──────────────────────────────────────────────────────
      claimIdentity: (identityId: string) => {
        const state = get();
        if (state.ownedIdentities.some(o => o.identityId === identityId)) return;
        const idn = identities.find(i => i.id === identityId);
        if (!idn) return;
        const signatureWeapon = weapons.find(w => w.signatureFor === identityId);
        set((s) => ({
          ownedIdentities: [
            ...s.ownedIdentities,
            {
              identityId,
              rank: 0,
              level: 1,
              exp: 0,
              shards: 20,
              skillLevels: [1, 1, 1, 1],
              corePassiveLevel: 1,
              defenseLevel: 1,
              equippedWeaponId: signatureWeapon ? signatureWeapon.id : undefined,
            },
          ],
          trialIdentities: s.trialIdentities.filter(id => id !== identityId),
          temporaryTrialIds: s.temporaryTrialIds.filter(id => id !== identityId),
        }));
      },

      upgradeIdentity: (identityId: string) => {
        const state = get();
        const identity = identities.find(i => i.id === identityId);
        const owned = state.ownedIdentities.find(o => o.identityId === identityId);
        if (!identity || !owned) return;
        const maxRank = 8;
        if (owned.rank >= maxRank) return;
        const costs = identity.rarity === 'SSR' ? identity.rankUpgrades?.ssr : identity.rankUpgrades?.sr;
        if (!costs) return;
        const cost = costs[owned.rank];
        if (cost === undefined) return;
        const totalShards = owned.shards + (state.shardInventory[identityId] || 0);
        if (totalShards < cost) return;
        let remaining = cost;
        let newShardInv = { ...state.shardInventory };
        let newOwnedShards = owned.shards;
        const inv = newShardInv[identityId] || 0;
        if (inv >= remaining) {
          newShardInv[identityId] = inv - remaining;
          remaining = 0;
        } else {
          newShardInv[identityId] = 0;
          remaining -= inv;
          newOwnedShards -= remaining;
        }
        set((s) => ({
          ownedIdentities: s.ownedIdentities.map(o =>
            o.identityId === identityId ? { ...o, rank: o.rank + 1, shards: Math.max(0, newOwnedShards) } : o
          ),
          shardInventory: newShardInv,
        }));
      },

      levelUpIdentityWithSerums: (identityId: string, amounts: { s: number; m: number; l: number; xl: number }) => {
        const state = get();
        const identity = identities.find(i => i.id === identityId);
        const owned = state.ownedIdentities.find(o => o.identityId === identityId);
        if (!identity || !owned || owned.level >= identity.levelCap) return;
        const { s, m, l, xl } = amounts;
        const totalExp = s * 100 + m * 500 + l * 2000 + xl * 10000;
        if (totalExp <= 0) return;
        const newSerums = {
          expSerum: state.expSerum - s,
          expSerumM: state.expSerumM - m,
          expSerumL: state.expSerumL - l,
          expSerumXL: state.expSerumXL - xl,
        };
        if (newSerums.expSerum < 0 || newSerums.expSerumM < 0 || newSerums.expSerumL < 0 || newSerums.expSerumXL < 0) return;
        let exp = owned.exp + totalExp;
        let level = owned.level;
        let levelsGained = 0;
        while (level < identity.levelCap) {
          const needed = expForLevel(level);
          if (exp < needed) break;
          exp -= needed;
          level += 1;
          levelsGained += 1;
        }
        if (level >= identity.levelCap) {
          level = identity.levelCap;
          exp = 0;
        }
        set((s) => ({
          ...newSerums,
          ownedIdentities: s.ownedIdentities.map(o =>
            o.identityId === identityId ? { ...o, level, exp } : o
          ),
          dailyTasks: s.dailyTasks.map(t =>
            t.id === 'daily_level' && levelsGained > 0 ? { ...t, progress: Math.min(t.max, t.progress + 1) } : t
          ),
          weeklyTasks: s.weeklyTasks.map(t =>
            t.id === 'weekly_level_5' && levelsGained > 0 ? { ...t, progress: Math.min(t.max, t.progress + levelsGained) } : t
          ),
        }));
        if (levelsGained > 0) get().addManagerExp(levelsGained * 10);
      },

      levelUpSkill: (identityId: string, skillIndex: 0 | 1 | 2 | 3) => {
        const state = get();
        const owned = state.ownedIdentities.find(o => o.identityId === identityId);
        if (!owned) return;
        const skillLevel = owned.skillLevels[skillIndex];
        if (skillLevel >= 15) return;
        if (state.lowTierMats < 5 || state.expSerum < 2) return;
        set((s) => ({
          lowTierMats: s.lowTierMats - 5,
          expSerum: s.expSerum - 2,
          ownedIdentities: s.ownedIdentities.map(o =>
            o.identityId === identityId
              ? {
                  ...o,
                  skillLevels: o.skillLevels.map((lv, i) =>
                    i === skillIndex ? Math.min(15, lv + 1) : lv
                  ) as [number, number, number, number],
                }
              : o
          ),
        }));
      },

      levelUpClassSkill: (identityId: string) => {
        const state = get();
        const owned = state.ownedIdentities.find(o => o.identityId === identityId);
        if (!owned) return;
        const current = owned.classSkillLevel ?? 1;
        if (current >= 20) return;
        if (state.lowTierMats < 8 || state.expSerum < 3) return;
        set((s) => ({
          lowTierMats: s.lowTierMats - 8,
          expSerum: s.expSerum - 3,
          ownedIdentities: s.ownedIdentities.map(o =>
            o.identityId === identityId ? { ...o, classSkillLevel: Math.min(20, (o.classSkillLevel ?? 1) + 1) } : o
          ),
        }));
      },

      levelUpCorePassive: (identityId: string) => {
        const state = get();
        const owned = state.ownedIdentities.find(o => o.identityId === identityId);
        if (!owned) return;
        const current = owned.corePassiveLevel ?? 1;
        if (current >= 10) return;
        if (state.lowTierMats < 5 || state.expSerum < 2) return;
        set((s) => ({
          lowTierMats: s.lowTierMats - 5,
          expSerum: s.expSerum - 2,
          ownedIdentities: s.ownedIdentities.map(o =>
            o.identityId === identityId
              ? { ...o, corePassiveLevel: (o.corePassiveLevel ?? 1) + 1 }
              : o
          ),
        }));
      },

      levelUpDefense: (identityId: string) => {
        const state = get();
        const owned = state.ownedIdentities.find(o => o.identityId === identityId);
        if (!owned) return;
        const current = owned.defenseLevel ?? 1;
        if (current >= 10) return;
        if (state.lowTierMats < 5 || state.expSerum < 2) return;
        set((s) => ({
          lowTierMats: s.lowTierMats - 5,
          expSerum: s.expSerum - 2,
          ownedIdentities: s.ownedIdentities.map(o =>
            o.identityId === identityId
              ? { ...o, defenseLevel: (o.defenseLevel ?? 1) + 1 }
              : o
          ),
        }));
      },

      // ── Weapons ────────────────────────────────────────────────────────
      levelUpWeapon: (weaponId: string) => {
        const state = get();
        const weapon = weapons.find(w => w.id === weaponId);
        const owned = state.ownedWeapons.find(w => w.weaponId === weaponId);
        if (!weapon || !owned || owned.level >= weapon.levelCap || state.weaponParts < 1) return;
        const needed = expForLevel(owned.level);
        const exp = owned.exp + 100;
        if (exp >= needed) {
          set((s) => ({
            weaponParts: s.weaponParts - 1,
            ownedWeapons: s.ownedWeapons.map(w =>
              w.weaponId === weaponId ? { ...w, level: w.level + 1, exp: exp - needed } : w
            ),
          }));
        } else {
          set((s) => ({
            weaponParts: s.weaponParts - 1,
            ownedWeapons: s.ownedWeapons.map(w =>
              w.weaponId === weaponId ? { ...w, exp } : w
            ),
          }));
        }
      },

      // ─── EGO Gifts (15-slot) ──────────────────────────────────────────
      levelUpGift: (slotId: EgoGiftSlot) => {
        const state = get();
        const gift = state.equippedGifts.find(g => g.slot === slotId);
        if (!gift || !gift.giftId || gift.level >= 25 || state.threads < 100) return;
        const needed = expForLevel(gift.level);
        const exp = gift.exp + 100;
        if (exp >= needed) {
          set((s) => ({
            threads: s.threads - 100,
            equippedGifts: s.equippedGifts.map(g =>
              g.slot === slotId ? { ...g, level: g.level + 1, exp: exp - needed } : g
            ),
          }));
        } else {
          set((s) => ({
            threads: s.threads - 100,
            equippedGifts: s.equippedGifts.map(g =>
              g.slot === slotId ? { ...g, exp } : g
            ),
          }));
        }
      },

      syncGift: (slotId: EgoGiftSlot) => {
        const state = get();
        const gift = state.equippedGifts.find(g => g.slot === slotId);
        if (!gift || !gift.giftId) return;
        if (state.syncEnhancementMats < 750 || state.syncSerumMats < 150) return;
        set((s) => ({
          syncEnhancementMats: s.syncEnhancementMats - 750,
          syncSerumMats: s.syncSerumMats - 150,
          equippedGifts: s.equippedGifts.map(g =>
            g.slot === slotId ? { ...g, syncLevel: g.syncLevel + 1 } : g
          ),
        }));
      },

      buyEgoGift: (giftId: string) => {
        const state = get();
        const gift = egoGifts.find(g => g.id === giftId);
        if (!gift || state.threads < gift.cost || state.managerLevel < 5) return;
        const newThreads = state.threads - gift.cost;
        const owned = state.ownedGifts.includes(giftId) ? state.ownedGifts : [...state.ownedGifts, giftId];
        const slot = gift.slot;
        const newGifts = state.equippedGifts.map(g =>
          g.slot === slot ? { ...g, giftId, level: 1, exp: 0, syncLevel: 0 } : g
        );
        set({
          threads: newThreads,
          ownedGifts: owned,
          equippedGifts: newGifts,
          dailyTasks: state.dailyTasks.map(t =>
            t.id === 'daily_gift' ? { ...t, progress: Math.min(t.max, t.progress + 1) } : t
          ),
        });
      },

      equipOwnedGift: (giftId: string, targetSlot?: EgoGiftSlot) => {
        const state = get();
        const gift = egoGifts.find(g => g.id === giftId);
        if (!gift) return;
        if (!state.ownedGifts.includes(giftId)) return;
        const slot = targetSlot || gift.slot;
        const newGifts = state.equippedGifts.map(g =>
          g.slot === slot ? { ...g, giftId, level: 1, exp: 0, syncLevel: 0 } : g
        );
        set({ equippedGifts: newGifts });
      },

      resonateGift: (slotId: EgoGiftSlot, slotIndex: 1 | 2, stat: 'ATK' | 'HP' | 'DEF' | 'SPD') => {
        const state = get();
        const current = state.giftResonance[slotId] || { slot1: null, slot2: null };
        const key = slotIndex === 1 ? 'slot1' : 'slot2';
        if (current[key]) return;
        if (state.eclipseResonanceMaterials < 1) return;
        set((s) => ({
          eclipseResonanceMaterials: s.eclipseResonanceMaterials - 1,
          giftResonance: {
            ...s.giftResonance,
            [slotId]: { ...current, [key]: stat },
          },
        }));
      },

      hypertuneGift: (slotId: EgoGiftSlot) => {
        const state = get();
        const currentLevel = state.giftHypertune[slotId] || 0;
        if (currentLevel >= 5) return;
        const nextLevel = currentLevel + 1;
        const cost = HYPERTUNE_LEVELS[nextLevel].cost;
        if (state.threads < cost) return;
        set((s) => ({
          threads: s.threads - cost,
          giftHypertune: {
            ...s.giftHypertune,
            [slotId]: nextLevel,
          },
        }));
      },

      harmonizeWeapon: (identityId: string, weaponId: string) => {
        const state = get();
        const identity = identities.find(i => i.id === identityId);
        const weapon = weapons.find(w => w.id === weaponId);
        if (!identity || !weapon) return;
        if (weapon.signatureFor !== identityId) return;
        const ownedWeapon = state.ownedWeapons.find(w => w.weaponId === weaponId);
        if (!ownedWeapon) return;
        if (state.weaponHarmonization[identityId] === weaponId) {
          const newHarmonization = { ...state.weaponHarmonization };
          delete newHarmonization[identityId];
          set({ weaponHarmonization: newHarmonization });
          return;
        }
        set((s) => ({
          weaponHarmonization: {
            ...s.weaponHarmonization,
            [identityId]: weaponId,
          },
        }));
      },

      // ─── Gift stats & resistances ─────────────────────────────────────
      getTotalGiftStats: () => {
        const state = get();
        const total = {
          hp: 0,
          atk: 0,
          def: 0,
          spd: 0,
          sanity: 0,
          resistRed: 0,
          resistPale: 0,
          resistBlack: 0,
          resistWhite: 0,
          clashPower: 0,
          healBonus: 0,
        };

        state.equippedGifts.forEach(g => {
          const gift = egoGifts.find(eg => eg.id === g.giftId);
          if (!gift) return;
          const converted = convertLegacyStats(gift.stats);
          total.hp += converted.hp || 0;
          total.atk += converted.atk || 0;
          total.def += converted.def || 0;
          total.spd += converted.spd || 0;
          total.sanity += converted.sanity || 0;
          total.clashPower += converted.clashPower || 0;
          total.healBonus += converted.healBonus || 0;
          total.resistRed += converted.resistRed || 0;
          total.resistPale += converted.resistPale || 0;
          total.resistBlack += converted.resistBlack || 0;
          total.resistWhite += converted.resistWhite || 0;

          const res = state.giftResonance[g.slot];
          if (res) {
            const s1 = res.slot1 ? RESONANCE_STATS[res.slot1] : null;
            const s2 = res.slot2 ? RESONANCE_STATS[res.slot2] : null;
            if (s1) {
              total.atk += s1.atk || 0;
              total.hp += s1.hp || 0;
              total.def += s1.def || 0;
              total.spd += s1.spd || 0;
            }
            if (s2) {
              total.atk += s2.atk || 0;
              total.hp += s2.hp || 0;
              total.def += s2.def || 0;
              total.spd += s2.spd || 0;
            }
          }

          const htLevel = state.giftHypertune[g.slot] || 0;
          const htStats = HYPERTUNE_LEVELS[htLevel]?.stats;
          if (htStats) {
            total.atk += htStats.atk || 0;
            total.hp += htStats.hp || 0;
            total.def += htStats.def || 0;
            total.spd += htStats.spd || 0;
          }
        });
        return total;
      },

      getTotalResistances: () => {
        const stats = get().getTotalGiftStats();
        return {
          red: stats.resistRed,
          pale: stats.resistPale,
          black: stats.resistBlack,
          white: stats.resistWhite,
        };
      },

      getTotalSetBonuses: () => {
        const state = get();
        const equippedGiftObjects = state.equippedGifts
          .map(g => egoGifts.find(eg => eg.id === g.giftId))
          .filter((g): g is EgoGift => g !== undefined);
        const setCounts = getSetCounts(equippedGiftObjects);
        const activeBonuses: { setName: string; pieces: number; description: string; effect: string; active: boolean }[] = [];
        for (const [setName, count] of Object.entries(setCounts)) {
          const bonuses = setBonuses[setName] || [];
          for (const bonus of bonuses) {
            const isHarmonized = false;
            const active = (bonus.pieces === 2 && count >= 2) ||
                           (bonus.pieces === 4 && count >= 4 && isHarmonized) ||
                           (bonus.pieces === 6 && count >= 6 && isHarmonized);
            activeBonuses.push({
              setName,
              pieces: bonus.pieces,
              description: bonus.description,
              effect: bonus.effect,
              active,
            });
          }
        }
        return activeBonuses;
      },

      // ── Story Progression ──────────────────────────────────────────────
      progressStory: () => {
        const state = get();
        if (state.pendingChapterRewards || state.currentForcedIdentity) {
          get().completeChapter();
        } else {
          const nextChapter = state.currentChapter + 1;
          set((s) => ({
            currentChapter: nextChapter,
            dailyTasks: s.dailyTasks.map(t =>
              t.id === 'daily_story' ? { ...t, progress: Math.min(t.max, t.progress + 1) } : t
            ),
          }));
          get().addManagerExp(750);
          get().addBloodLunacy(100);
        }
      },

      setStoryRoster: (roster: string[]) => set({ storyRoster: roster }),

      // ── Daily / Weekly ──────────────────────────────────────────────────
      ensureDailyWeeklyReset: (week: number) => {
        // Reset logic is handled by timestamps; we just ensure bonus flags are reset on day/week change.
        // This is a simplified version – you may want to implement full reset logic.
        // For now, we rely on the migration to set initial values.
      },

      claimDailyTask: (taskId: string) => {
        const state = get();
        const task = state.dailyTasks.find(t => t.id === taskId);
        if (!task || task.progress < task.max || task.claimed) return;
        set((s) => ({
          enkephalin: s.enkephalin + 15,
          dailyTasks: s.dailyTasks.map(t => t.id === taskId ? { ...t, claimed: true } : t),
        }));
        get().addManagerExp(30);
      },

      claimWeeklyTask: (taskId: string) => {
        const state = get();
        const task = state.weeklyTasks.find(t => t.id === taskId);
        if (!task || task.progress < task.max || task.claimed) return;
        set((s) => ({
          enkephalin: s.enkephalin + 250,
          weeklyTasks: s.weeklyTasks.map(t => t.id === taskId ? { ...t, claimed: true } : t),
        }));
        get().addManagerExp(200);
      },

      claimDailyBonus: () => {
        const state = get();
        if (state.allDailyBonusClaimed) return;
        const allClaimed = state.dailyTasks.every(t => t.claimed);
        if (!allClaimed) return;
        set((s) => ({
          movesetTickets: s.movesetTickets + 1,
          allDailyBonusClaimed: true,
        }));
        get().addManagerExp(50);
      },

      claimWeeklyBonus: () => {
        const state = get();
        if (state.allWeeklyBonusClaimed) return;
        const allClaimed = state.weeklyTasks.every(t => t.claimed);
        if (!allClaimed) return;
        set((s) => ({
          movesetTickets: s.movesetTickets + 2,
          allWeeklyBonusClaimed: true,
        }));
        get().addManagerExp(200);
      },

      // ── Competitive ─────────────────────────────────────────────────────
      setCRRegion: (region: CRRegion) => {
        const state = get();
        if (state.crRegionLocked) return;
        set({ crRegion: region, crRegionLocked: true });
      },
      ensureWeeklyReset: (week: number) => {
        const state = get();
        if (state.crWeek !== week && state.crWeek !== 0) {
          const completedAll = state.crCompletedZones.length >= 3;
          const repBonus = completedAll ? 1 : 0;
          set({
            crWeek: week,
            crZoneScores: {},
            crCompletedZones: [],
            crReputation: Math.min(2, state.crReputation + repBonus),
          });
        } else if (state.crWeek === 0) {
          set({ crWeek: week });
        }
      },
      submitZoneScore: (zone: ZoneElement, score: number, week: number) => {
        const state = get();
        if (state.crWeek !== week) {
          set({ crWeek: week, crZoneScores: { [zone]: score }, crCompletedZones: [zone] });
        } else {
          const existing = state.crZoneScores[zone] || 0;
          if (score > existing) {
            set((s) => ({
              crZoneScores: { ...s.crZoneScores, [zone]: Math.max(s.crZoneScores[zone] || 0, score) },
              crCompletedZones: s.crCompletedZones.includes(zone) ? s.crCompletedZones : [...s.crCompletedZones, zone],
            }));
          }
        }
        const team = get().team;
        let multiplier = 1.0;
        let ampCount = 0;
        let ssrCount = 0;
        for (const id of team) {
          const identity = identities.find(i => i.id === id);
          if (identity) {
            if (identity.rarity === 'SSR') ssrCount++;
            const classCats = getClassCategories(id);
            if (classCats.includes('Amplifier') || classCats.includes('Support')) {
              ampCount++;
              multiplier += 0.05;
            }
          }
        }
        multiplier += ssrCount * 0.10;
        if (ampCount > 0) multiplier += 0.10;
        const boostedScore = Math.floor(score * multiplier);
        const total = Object.values(get().crZoneScores).reduce((a, b) => a + b, 0) + boostedScore - (get().crZoneScores[zone] || 0);
        const meritGain = Math.min(5, Math.floor(boostedScore / 100000));
        set((s) => ({
          competitiveScore: Math.max(s.competitiveScore, total),
          competitivePlayed: true,
          crMerit: Math.min(100, s.crMerit + meritGain),
          weeklyTasks: s.weeklyTasks.map(t =>
            t.id === 'weekly_reception_first' ? { ...t, progress: 1 } :
            t.id === 'weekly_reception_score' ? { ...t, progress: Math.max(t.progress, total) } : t
          ),
        }));
        get().addManagerExp(Math.min(300, Math.floor(boostedScore / 1500)));
        // ── Blood Lunacy from competitive ──────────────────────────────
        get().addBloodLunacy(50);
      },
      promoteSquad: () => {
        const state = get();
        const order: Squad[] = ['Beginner', 'Amateur', 'Expert', 'Professional'];
        const idx = order.indexOf(state.crSquad);
        if (idx >= order.length - 1) return;
        const next = order[idx + 1];
        const requiredMerit = state.crSquad === 'Expert' ? 100 : 0;
        if (state.crMerit < requiredMerit) return;
        set((s) => ({ crSquad: next, crMerit: s.crMerit - requiredMerit }));
      },
      consumeReputation: () => {
        const state = get();
        if (state.crReputation <= 0) return;
        set((s) => ({ crReputation: s.crReputation - 1 }));
      },
      recordEnemyDefeats: (count: number) => set((s) => ({ totalEnemyDefeats: s.totalEnemyDefeats + count })),

      // ── Team ────────────────────────────────────────────────────────────
      setTeam: (newTeam: string[]) => {
        const state = get();
        const permanentTrials = state.trialIdentities.filter(id =>
          !state.temporaryTrialIds.includes(id) && id !== 'arthur_excalibur'
        );
        let finalTeam = [...newTeam];
        for (const id of permanentTrials) {
          if (!finalTeam.includes(id)) {
            finalTeam.unshift(id);
          }
        }
        if (finalTeam.length > 3) finalTeam = finalTeam.slice(0, 3);
        set({ team: finalTeam });
      },

      setLeaderIndex: (index: number) => set({ leaderIndex: index }),

      // ── Shard Shop ──────────────────────────────────────────────────────
      recycleShards: (identityId: string, amount: number) => {
        const state = get();
        const identity = identities.find(i => i.id === identityId);
        const owned = state.ownedIdentities.find(o => o.identityId === identityId);
        if (!identity || !owned) return;
        const maxRank = 8;
        if (owned.rank < maxRank) return;
        const totalShards = owned.shards + (state.shardInventory[identityId] || 0);
        if (totalShards < amount) return;
        const isSSR = identity.rarity === 'SSR';
        const rate = isSSR ? 3 : 1;
        const inverseGain = amount * rate;
        let remaining = amount;
        let newShardInv = { ...state.shardInventory };
        let newOwnedShards = owned.shards;
        const inv = newShardInv[identityId] || 0;
        if (inv >= remaining) {
          newShardInv[identityId] = inv - remaining;
          remaining = 0;
        } else {
          newShardInv[identityId] = 0;
          remaining -= inv;
          newOwnedShards -= remaining;
        }
        set((s) => ({
          shardInventory: newShardInv,
          ownedIdentities: s.ownedIdentities.map(o =>
            o.identityId === identityId ? { ...o, shards: Math.max(0, newOwnedShards) } : o
          ),
          [isSSR ? 'ssrInverseMaterial' : 'srInverseMaterial']: s[isSSR ? 'ssrInverseMaterial' : 'srInverseMaterial'] + inverseGain,
        }));
      },
      buyShardsWithInverse: (identityId: string, amount: number) => {
        const state = get();
        const identity = identities.find(i => i.id === identityId);
        if (!identity) return;
        const isSSR = identity.rarity === 'SSR';
        const costPerShard = isSSR ? 30 : 10;
        const totalCost = amount * costPerShard;
        const materialKey = isSSR ? 'ssrInverseMaterial' : 'srInverseMaterial';
        if (state[materialKey] < totalCost) return;
        const purchased = state.purchasedShards[identityId] || 0;
        if (purchased + amount > 20) return;
        const owned = state.ownedIdentities.find(o => o.identityId === identityId);
        if (owned && owned.rank >= 8) return;
        set((s) => ({
          [materialKey]: s[materialKey] - totalCost,
          purchasedShards: { ...s.purchasedShards, [identityId]: purchased + amount },
          shardInventory: { ...s.shardInventory, [identityId]: (s.shardInventory[identityId] || 0) + amount },
        }));
      },

      // ── Admin ────────────────────────────────────────────────────────────
      initializeAdmin: () => {
        set((s) => ({
          managerLevel: 80,
          managerExp: 0,
          enkephalin: 99999,
          weaponFragments: 99999,
          threads: 99999,
          eclipseResonanceMaterials: 999,
          eventManifestTickets: 999,
          targetArsenalTickets: 999,
          basicManifestTickets: 999,
          expSerum: 999,
          expSerumM: 999,
          expSerumL: 999,
          expSerumXL: 999,
          weaponParts: 999,
          syncEnhancementMats: 999,
          syncSerumMats: 999,
          lowTierMats: 999,
          lunacy: 9999,
          movesetTickets: 999,
          wawMovesetTickets: 99,
          alephMovesetTickets: 99,
          walkirksnachtMovesetTickets: 99,
          bloodLunacy: 9999,
        }));
      },
      adminGiveSSRShards: (amount: number = 20): string | null => {
        const pool = identities.filter(i => i.rarity === 'SSR' && i.id !== 'arthur_excalibur' && !storyOnlyIdentities.has(i.id));
        if (pool.length === 0) return null;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        set((s) => ({ shardInventory: { ...s.shardInventory, [picked.id]: (s.shardInventory[picked.id] || 0) + amount } }));
        return picked.id;
      },
      adminGiveSRShards: (amount: number = 8): string | null => {
        const pool = identities.filter(i => i.rarity === 'SR' && !storyOnlyIdentities.has(i.id));
        if (pool.length === 0) return null;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        set((s) => ({ shardInventory: { ...s.shardInventory, [picked.id]: (s.shardInventory[picked.id] || 0) + amount } }));
        return picked.id;
      },
      adminGiveRandomSSR: (): string | null => {
        const pool = identities.filter(i => i.rarity === 'SSR' && i.id !== 'arthur_excalibur' && !storyOnlyIdentities.has(i.id));
        if (pool.length === 0) return null;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        const signatureWeapon = weapons.find(w => w.signatureFor === picked.id);
        set((s) => ({
          ownedIdentities: [
            ...s.ownedIdentities,
            {
              identityId: picked.id,
              rank: 0,
              level: 1,
              exp: 0,
              shards: 20,
              skillLevels: [1, 1, 1, 1],
              corePassiveLevel: 1,
              defenseLevel: 1,
              equippedWeaponId: signatureWeapon ? signatureWeapon.id : undefined,
            },
          ],
        }));
        return picked.id;
      },
      adminGiveRandomSigWeapon: (): string | null => {
        return null;
      },
      adminMaxAllCharacters: () => {
        const state = get();
        const newOwned = state.ownedIdentities.map(owned => {
          const identity = identities.find(i => i.id === owned.identityId);
          if (!identity) return owned;
          return {
            ...owned,
            rank: 8,
            level: identity.levelCap || 65,
            exp: 0,
            skillLevels: [15, 15, 15, 15] as [number, number, number, number],
            classSkillLevel: 20,
            corePassiveLevel: 10,
            defenseLevel: 10,
            shards: 0,
          };
        });
        set({ ownedIdentities: newOwned });
      },
      resetState: () => {
        set(INITIAL_STATE);
      },

      // ── Shard Unlock ────────────────────────────────────────────────────
      unlockIdentityWithShards: (identityId: string) => {
        const state = get();
        const identity = identities.find(i => i.id === identityId);
        if (!identity) return;
        if (state.ownedIdentities.some(o => o.identityId === identityId)) return;
        const required = identity.rarity === 'SSR' ? 70 : 50;
        const shards = state.shardInventory[identityId] || 0;
        if (shards < required) return;
        set((s) => ({
          shardInventory: { ...s.shardInventory, [identityId]: shards - required },
          ownedIdentities: [
            ...s.ownedIdentities,
            {
              identityId,
              rank: 0,
              level: 1,
              exp: 0,
              shards: 0,
              skillLevels: [1, 1, 1, 1],
              corePassiveLevel: 1,
              defenseLevel: 1,
              equippedWeaponId: weapons.find(w => w.signatureFor === identityId)?.id || undefined,
            },
          ],
          trialIdentities: s.trialIdentities.filter(id => id !== identityId),
          temporaryTrialIds: s.temporaryTrialIds.filter(id => id !== identityId),
        }));
      },

      convertEnkephalinToFragments: (amount: number) => {
        const state = get();
        if (state.enkephalin < amount) return;
        set((s) => ({
          enkephalin: s.enkephalin - amount,
          weaponFragments: s.weaponFragments + amount,
        }));
      },

      // ── Tutorial ────────────────────────────────────────────────────────
      dismissTutorial: () => set({ pendingTutorialKey: null, currentTutorialStep: null, pendingTutorialSequence: null }),
      startTutorialSequence: (key: string) => {
        const firstStep = getFirstTutorialStep(key);
        if (firstStep) set({ pendingTutorialSequence: key, currentTutorialStep: firstStep });
      },
      completeTutorialSequence: () => {
        const state = get();
        if (state.pendingTutorialSequence) {
          const steps = getTabTutorialSteps(state.pendingTutorialSequence);
          const newSeen = [...state.seenTutorials];
          steps.forEach(id => { if (!newSeen.includes(id)) newSeen.push(id); });
          set({ seenTutorials: newSeen, pendingTutorialSequence: null, currentTutorialStep: null });
        } else {
          set({ currentTutorialStep: null });
        }
      },
      setTutorialStepSeen: (stepId: string) => {
        const state = get();
        if (!state.seenTutorials.includes(stepId)) {
          set({ seenTutorials: [...state.seenTutorials, stepId] });
        }
      },

      setEquippedWeapon: (identityId: string, weaponId: string) => {
        const state = get();
        const identity = identities.find(i => i.id === identityId);
        if (!identity) return;
        const weapon = weapons.find(w => w.id === weaponId);
        if (!weapon) return;
        if (!canEquipWeapon(identityId, weaponId)) return;
        const ownedWeapon = state.ownedWeapons.find(w => w.weaponId === weaponId);
        if (!ownedWeapon) return;
        set((s) => ({
          ownedIdentities: s.ownedIdentities.map(o =>
            o.identityId === identityId ? { ...o, equippedWeaponId: weaponId } : o
          ),
        }));
      },

      grantWeapon: (weaponId: string) => {
        const state = get();
        if (state.ownedWeapons.some(w => w.weaponId === weaponId)) return;
        const weapon = weapons.find(w => w.id === weaponId);
        if (!weapon) return;
        set((s) => ({
          ownedWeapons: [...s.ownedWeapons, { weaponId, level: 1, exp: 0 }],
        }));
      },

      toggleSpecialDebuff: () => set((state) => ({ specialDebuffActive: !state.specialDebuffActive })),
      setSpecialDebuff: (active: boolean) => set({ specialDebuffActive: active }),

      loadState: (newState: Partial<GameState>) => set((s) => ({ ...s, ...newState })),

      // ── RESONANCE ACTIONS ────────────────────────────────────────────────
      setResonanceSlot: (slotIndex: number, type: ResonanceType | null) => {
        const state = get();
        if (slotIndex < 0 || slotIndex >= TOTAL_RESONANCE_SLOTS) return;
        const newSlots = [...state.resonance.slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], type };
        set((s) => ({
          resonance: { ...s.resonance, slots: newSlots },
        }));
      },

      hypertuneResonanceSlot: (slotIndex: number) => {
        const state = get();
        if (slotIndex < 0 || slotIndex >= TOTAL_RESONANCE_SLOTS) return;
        const slot = state.resonance.slots[slotIndex];
        if (!slot.type) return;
        const currentLevel = slot.hypertuneLevel;
        if (currentLevel >= 10) return;
        const nextLevel = currentLevel + 1;
        const cost = 100 + nextLevel * 150;
        if (state.threads < cost) return;
        if (state.lowTierMats < nextLevel) return;
        const newSlots = [...state.resonance.slots];
        newSlots[slotIndex] = { ...slot, hypertuneLevel: nextLevel };
        set((s) => ({
          resonance: { ...s.resonance, slots: newSlots },
          threads: s.threads - cost,
          lowTierMats: s.lowTierMats - nextLevel,
        }));
      },

      getTotalResonanceStats: () => {
        const state = get();
        return getTotalResonanceStats(state.resonance);
      },

      getResonanceSlotStats: (slotIndex: number) => {
        const state = get();
        if (slotIndex < 0 || slotIndex >= TOTAL_RESONANCE_SLOTS)
          return { hp: 0, atk: 0, def: 0, spd: 0, crit: 0, clashPower: 0 };
        const slot = state.resonance.slots[slotIndex];
        return getResonanceSlotStats(slot.type, slot.hypertuneLevel);
      },

      addEgoManifestEssence: (amount: number) =>
        set((state) => ({ egoManifestEssence: state.egoManifestEssence + amount })),

      removeEgoManifestEssence: (amount: number) =>
        set((state) => ({ egoManifestEssence: Math.max(0, state.egoManifestEssence - amount) })),

      // ────────────────────────────────────────────────────────────────────
      // ─── DEPARTMENT / FACILITY ACTIONS ────────────────────────────────
      // ────────────────────────────────────────────────────────────────────

      createFacility: (departmentKey: string, userId: string, name?: string) => {
        const normalizedKey = departmentKey.toUpperCase();
        const deptConfig = DEPARTMENTS.find(d => d.key === normalizedKey);
        if (!deptConfig) {
          console.warn(`Department "${departmentKey}" not found. Available: ${DEPARTMENTS.map(d => d.key).join(', ')}`);
          return { success: false, reason: 'Invalid department' };
        }
        const state = get();
        if (state.facility.isActive) return { success: false, reason: 'Already have a facility' };
        set({
          facility: {
            ...INITIAL_STATE.facility,
            isActive: true,
            name: name || `${deptConfig.name} Facility`,
            managerId: userId,
            departmentKey: normalizedKey,
            maxDeployPerDay: deptConfig.maxAbnosPerDay,
            maxEnergy: 100 + (deptConfig.dayUnlock || 0) * 2,
            members: [userId],
          },
        });
        return { success: true, department: get().facility };
      },

      joinFacility: (userId: string) => {
        const state = get();
        if (!state.facility.isActive) return { success: false, reason: 'No active facility' };
        if (state.facility.members.includes(userId)) return { success: false, reason: 'Already a member' };
        set((s) => ({
          facility: {
            ...s.facility,
            members: [...s.facility.members, userId],
          },
        }));
        return { success: true };
      },

      leaveFacility: (userId: string) => {
        const state = get();
        if (!state.facility.isActive) return { success: false, reason: 'No active facility' };
        if (state.facility.managerId === userId) {
          return { success: false, reason: 'Manager cannot leave. Transfer ownership or disband.' };
        }
        set((s) => ({
          facility: {
            ...s.facility,
            members: s.facility.members.filter(id => id !== userId),
          },
        }));
        return { success: true };
      },

      deployAbnormality: (abnoId: string, userId: string) => {
        const state = get();
        if (!state.facility.isActive) return { success: false, reason: 'No active facility' };
        if (state.facility.managerId !== userId) return { success: false, reason: 'Only manager can deploy abnormalities' };
        const deptConfig = DEPARTMENTS.find(d => d.key === state.facility.departmentKey);
        if (!deptConfig) return { success: false, reason: 'Department config not found' };
        const maxPerDay = deptConfig.maxAbnosPerDay || 1;
        if (state.facility.deployedToday.length >= maxPerDay) {
          return { success: false, reason: `Already deployed ${maxPerDay} abnormality today` };
        }
        const abnoData = abnormalities.find(a => a.id === abnoId);
        if (!abnoData) return { success: false, reason: 'Abnormality not found' };
        const deployCost = getDeployCost(state.facility.currentDay, abnoData.risk);
        if (state.facility.energy < deployCost) {
          return { success: false, reason: `Not enough energy (need ${deployCost})` };
        }
        const newAbno = {
          abnoId: abnoData.id,
          abnoName: abnoData.name,
          risk: abnoData.risk,
          qliphothCounter: 3,
          maxCounter: 3,
          workCount: 0,
          todayWorkCount: 0,
        };
        set((s) => ({
          facility: {
            ...s.facility,
            energy: s.facility.energy - deployCost,
            deployedAbnos: [...s.facility.deployedAbnos, newAbno],
            deployedToday: [...s.facility.deployedToday, abnoId],
          },
        }));
        return { success: true, abnormality: abnoData.name, deployCost };
      },

      workOnAbnormality: (abnoId: string, workType: 'instinct' | 'insight' | 'attachment' | 'repression', userId: string) => {
        const state = get();
        if (!state.facility.isActive) return { success: false, reason: 'No active facility' };
        const abnoIndex = state.facility.deployedAbnos.findIndex(a => a.abnoId === abnoId);
        if (abnoIndex === -1) return { success: false, reason: 'Abnormality not found' };
        const abno = state.facility.deployedAbnos[abnoIndex];
        if (abno.qliphothCounter <= 0) return { success: false, reason: 'Abnormality is breaching!' };

        const successRate = 0.6 + Math.random() * 0.3;
        const isSuccess = Math.random() < successRate;

        const baseEnergy = 10 + (abno.risk === 'ALEPH' ? 40 : abno.risk === 'WAW' ? 25 : abno.risk === 'HE' ? 15 : 5);
        const energyGain = isSuccess ? baseEnergy : Math.floor(baseEnergy * 0.2);

        let counterChange = 0;
        if (isSuccess) {
          counterChange = 1;
        } else {
          counterChange = -1;
        }
        let newCounter = Math.max(0, Math.min(abno.maxCounter, abno.qliphothCounter + counterChange));

        let breached = false;
        if (newCounter === 0) {
          breached = true;
        }

        const updatedAbnos = [...state.facility.deployedAbnos];
        updatedAbnos[abnoIndex] = {
          ...abno,
          qliphothCounter: newCounter,
          workCount: abno.workCount + 1,
          todayWorkCount: abno.todayWorkCount + 1,
        };

        const newEnergy = Math.min(state.facility.maxEnergy, state.facility.energy + energyGain);
        const newTotalEnergy = state.facility.totalEnergy + energyGain;

        const newMissionProgress = { ...state.facility.missionProgress };
        if (isSuccess) {
          newMissionProgress.worksCompleted = (newMissionProgress.worksCompleted || 0) + 1;
        }
        newMissionProgress.totalEnergy = (newMissionProgress.totalEnergy || 0) + energyGain;

        let boostDropped = false;
        let boostData = null;
        if (isSuccess && Math.random() < 0.05 && !state.facility.activeBoost) {
          const expiresAt = Date.now() + 15 * 60 * 1000;
          boostDropped = true;
          boostData = {
            type: 'TEMPERANCE',
            expiresAt,
            multiplier: 1.5,
          };
        }

        const newOverload = { ...state.facility.qliphothOverload };
        if (!isSuccess && (abno.risk === 'HE' || abno.risk === 'WAW' || abno.risk === 'ALEPH')) {
          const key = abno.abnoId;
          if (!newOverload[key]) {
            newOverload[key] = { workCount: 0, penaltyPercent: 0 };
          }
          newOverload[key].workCount += 1;
          const penalty = Math.min(0.5, (newOverload[key].workCount - 2) * 0.05);
          newOverload[key].penaltyPercent = Math.round(penalty * 100);
        }

        if (breached) {
          // breach handling
        }

        set((s) => ({
          facility: {
            ...s.facility,
            energy: newEnergy,
            totalEnergy: newTotalEnergy,
            deployedAbnos: updatedAbnos,
            missionProgress: newMissionProgress,
            activeBoost: boostData || s.facility.activeBoost,
            qliphothOverload: newOverload,
          },
        }));

        // ── Blood Lunacy from facility work ──────────────────────────────
        if (isSuccess) get().addBloodLunacy(10);

        return {
          success: true,
          isSuccess,
          energyGain,
          peBoxes: isSuccess ? Math.floor(energyGain / 2) : 0,
          breached,
          boostDropped,
          boostData,
          result: isSuccess ? 'GOOD' : 'BAD',
        };
      },

      advanceDay: () => {
        const state = get();
        if (!state.facility.isActive) return { success: false, reason: 'No active facility' };
        const requiredEnergy = getRequiredEnergyForDay(state.facility.currentDay);
        if (state.facility.energy < requiredEnergy) {
          return { success: false, reason: `Need ${requiredEnergy} energy to advance` };
        }
        const newDay = state.facility.currentDay + 1;
        const qliphothLevel = state.facility.qliphothLevel + 1;
        let activeOrdeal = null;
        if (qliphothLevel >= 2 && qliphothLevel % 2 === 0) {
          const timeKey = qliphothLevel <= 2 ? 'DAWN' : qliphothLevel <= 4 ? 'NOON' : qliphothLevel <= 6 ? 'DUSK' : 'MIDNIGHT';
          const ordealTime = ORDEAL_TIMES[timeKey];
          if (ordealTime && newDay >= ordealTime.minDay) {
            const colors = ['AMBER', 'CRIMSON', 'GREEN', 'VIOLET', 'WHITE'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            activeOrdeal = {
              id: `ordeal_${Date.now()}`,
              name: `${color} ${timeKey}`,
              color,
              time: timeKey as any,
              enemies: [
                { name: `${color} Enemy`, hp: 100 + newDay * 5, maxHp: 100 + newDay * 5, atk: 10 + newDay * 2, def: 5 + newDay, spd: 50, portrait: '👾', skills: [{ name: 'Strike', power: 5, coins: 1 }] },
              ],
            };
          }
        }

        set((s) => ({
          facility: {
            ...s.facility,
            currentDay: newDay,
            energy: s.facility.energy - requiredEnergy,
            qliphothLevel,
            meltdownProgress: (s.facility.meltdownProgress || 0) + 10,
            meltdownLevel: Math.floor((s.facility.meltdownProgress || 0) / 100),
            deployedToday: [],
            qliphothOverload: {},
            activeOrdeal,
          },
        }));

        return { success: true, newDay, ordeal: activeOrdeal };
      },

      resolveOrdeal: (ordealId: string, victory: boolean) => {
        const state = get();
        if (!state.facility.activeOrdeal || state.facility.activeOrdeal.id !== ordealId) return;
        if (victory) {
          const energyReward = ORDEAL_TIMES[state.facility.activeOrdeal.time]?.energyReward || 20;
          const lunacyReward = 10;
          set((s) => ({
            facility: {
              ...s.facility,
              energy: Math.min(s.facility.maxEnergy, s.facility.energy + energyReward),
              ordealsCompleted: (s.facility.ordealsCompleted || 0) + 1,
              activeOrdeal: null,
            },
            lunacy: s.lunacy + lunacyReward,
          }));
          // ── Blood Lunacy from ordeal victory ──────────────────────────
          get().addBloodLunacy(25);
        } else {
          set((s) => ({
            facility: {
              ...s.facility,
              energy: Math.max(0, s.facility.energy - 10),
              activeOrdeal: null,
            },
          }));
        }
      },

      suppressBreach: (abnoId: string, victory: boolean) => {
        const state = get();
        const abnoIndex = state.facility.deployedAbnos.findIndex(a => a.abnoId === abnoId);
        if (abnoIndex === -1) return;
        if (victory) {
          const updatedAbnos = [...state.facility.deployedAbnos];
          updatedAbnos[abnoIndex].qliphothCounter = updatedAbnos[abnoIndex].maxCounter;
          set((s) => ({
            facility: {
              ...s.facility,
              deployedAbnos: updatedAbnos,
            },
          }));
          // ── Blood Lunacy from breach suppression ──────────────────────
          get().addBloodLunacy(30);
        }
      },

      unlockResearch: (researchId: string) => {
        const state = get();
        if (!state.facility.isActive) return { success: false, reason: 'No active facility' };
        const deptKey = state.facility.departmentKey;
        if (!deptKey) return { success: false, reason: 'No department' };
        const researches = RESEARCH_DATA[deptKey] || [];
        const research = researches.find(r => r.id === researchId);
        if (!research) return { success: false, reason: 'Research not found' };
        if (state.facility.unlockedResearch.includes(researchId)) {
          return { success: false, reason: 'Already unlocked' };
        }
        const cost = research.cost;
        if (state.facility.energy < cost) {
          return { success: false, reason: `Not enough energy (need ${cost})` };
        }
        set((s) => ({
          facility: {
            ...s.facility,
            energy: s.facility.energy - cost,
            unlockedResearch: [...s.facility.unlockedResearch, researchId],
          },
        }));
        return { success: true, research };
      },

      checkMissions: () => {
        const state = get();
        if (!state.facility.isActive) return [];
        const deptKey = state.facility.departmentKey;
        if (!deptKey) return [];
        const missions = SUPPRESSION_MISSIONS[deptKey]?.missions || [];
        const completed = [];
        for (const mission of missions) {
          if (state.facility.completedMissions.includes(mission.id)) continue;
          const progress = state.facility.missionProgress[mission.stat] || 0;
          if (progress >= mission.requiredProgress) {
            completed.push(mission);
          }
        }
        return completed;
      },

      completeCoreSuppression: (departmentKey: string) => {
        const state = get();
        if (!state.facility.isActive) return { success: false, reason: 'No active facility' };
        const missions = SUPPRESSION_MISSIONS[departmentKey]?.missions || [];
        const allDone = missions.every(m => state.facility.completedMissions.includes(m.id));
        if (!allDone) return { success: false, reason: 'Not all missions completed' };
        if (state.facility.completedCoreSuppressions.includes(departmentKey)) {
          return { success: false, reason: 'Already completed' };
        }
        set((s) => ({
          facility: {
            ...s.facility,
            completedCoreSuppressions: [...s.facility.completedCoreSuppressions, departmentKey],
          },
        }));
        // ── Blood Lunacy from core suppression ──────────────────────────
        get().addBloodLunacy(100);
        return { success: true };
      },

      useMemoryRepository: (targetDay: number) => {
        const state = get();
        if (!state.facility.isActive) return { success: false, reason: 'No active facility' };
        if (!state.facility.memoryRepositoryAvailable) return { success: false, reason: 'Memory Repository not unlocked' };
        if (state.lunacy < 1500) return { success: false, reason: 'Need 1500 Lunacy' };
        if (targetDay < 1 || targetDay > state.facility.currentDay) {
          return { success: false, reason: 'Invalid target day' };
        }
        set((s) => ({
          facility: {
            ...s.facility,
            currentDay: targetDay,
            energy: 0,
            deployedAbnos: [],
            deployedToday: [],
            qliphothOverload: {},
            activeOrdeal: null,
            meltdownProgress: 0,
            meltdownLevel: 0,
            qliphothLevel: 0,
          },
          lunacy: s.lunacy - 1500,
        }));
        return { success: true };
      },

      fireBullet: (type: string, targetAbnoId: string) => {
        const state = get();
        const bulletKey = type.toLowerCase();
        if (state.facility.bullets[bulletKey] <= 0) {
          return { success: false, reason: `No ${type} bullets left` };
        }
        set((s) => ({
          facility: {
            ...s.facility,
            bullets: {
              ...s.facility.bullets,
              [bulletKey]: s.facility.bullets[bulletKey] - 1,
            },
          },
        }));
        return { success: true };
      },

      addBullets: (type: string, amount: number) => {
        const state = get();
        const bulletKey = type.toLowerCase();
        const current = state.facility.bullets[bulletKey] || 0;
        set((s) => ({
          facility: {
            ...s.facility,
            bullets: {
              ...s.facility.bullets,
              [bulletKey]: current + amount,
            },
          },
        }));
      },

      // ─── DUEL ACTIONS ────────────────────────────────────────────────────
      startDuel: () => set((state) => ({ duel: { ...state.duel, active: true } })),
      endDuel: () => set((state) => ({ duel: { ...state.duel, active: false } })),
      updateDuelScore: (score: number) => set((state) => ({ duel: { ...state.duel, score: Math.max(0, score) } })),
      updateDuelLives: (lives: number) => set((state) => ({ duel: { ...state.duel, lives: Math.max(0, lives) } })),
      recordDuelResult: (result: 'win' | 'loss') => {
        set((state) => ({
          duel: {
            ...state.duel,
            streak: result === 'win' ? state.duel.streak + 1 : 0,
            history: [...state.duel.history, { result, timestamp: Date.now() }].slice(-50),
          }
        }));
        // ── Blood Lunacy from duel ──────────────────────────────────────
        if (result === 'win') get().addBloodLunacy(25);
        else get().addBloodLunacy(10);
      },

      // ─── MOVESET ACTIONS ──────────────────────────────────────────────────

      addMoveset: (name: string) => {
        const state = get();
        const moveset = movesetMap.get(name);
        if (!moveset) return;

        if (state.ownedMovesets.includes(name)) {
          set((s) => ({
            movesetShards: {
              ...s.movesetShards,
              [name]: (s.movesetShards[name] || 0) + 1,
            },
          }));
          return;
        }

        set((s) => ({
          ownedMovesets: [...s.ownedMovesets, name],
          dailyTasks: s.dailyTasks.map(t =>
            t.id === 'daily_moveset' ? { ...t, progress: Math.min(t.max, t.progress + 1) } : t
          ),
          weeklyTasks: s.weeklyTasks.map(t =>
            t.id === 'weekly_moveset_3' ? { ...t, progress: Math.min(t.max, t.progress + 1) } : t
          ),
        }));
        get().addManagerExp(25);
      },

      removeMoveset: (name: string) => {
        set((s) => ({
          ownedMovesets: s.ownedMovesets.filter(n => n !== name),
          movesetShards: (() => {
            const { [name]: _, ...rest } = s.movesetShards;
            return rest;
          })(),
        }));
      },

      hasMoveset: (name: string) => get().ownedMovesets.includes(name),

      pullMoveset: (ticketType: 'random' | 'waw' | 'aleph' | 'walkirksnacht') => {
        const state = get();
        const ticketKeyMap = {
          random: 'movesetTickets',
          waw: 'wawMovesetTickets',
          aleph: 'alephMovesetTickets',
          walkirksnacht: 'walkirksnachtMovesetTickets',
        } as const;
        const ticketKey = ticketKeyMap[ticketType];
        if (!ticketKey) return null;
        if (state[ticketKey] < 1) return null;

        let pool = movesets.filter(m =>
          m.obtainable !== false &&
          m.grade !== 'removed'
        );

        if (ticketType === 'waw') {
          pool = pool.filter(m => m.rank === 'WAW' || m.rank === 'WALKIRKSNACHT');
        } else if (ticketType === 'aleph') {
          pool = pool.filter(m => m.rank === 'ALEPH');
        } else if (ticketType === 'walkirksnacht') {
          pool = pool.filter(m => m.rank === 'WALKIRKSNACHT');
        }

        if (pool.length === 0) return null;

        const rankOrder = ['ZAYIN', 'TETH', 'HE', 'WAW', 'ALEPH', 'WALKIRKSNACHT'];
        const weights = pool.map(m => {
          const idx = rankOrder.indexOf(m.rank);
          const weight = Math.max(1, 10 - idx);
          return weight;
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * totalWeight;
        let picked = pool[0];
        for (let i = 0; i < pool.length; i++) {
          rand -= weights[i];
          if (rand <= 0) {
            picked = pool[i];
            break;
          }
        }

        set((s) => ({
          [ticketKey]: s[ticketKey] - 1,
        }));

        get().addMoveset(picked.name);

        return picked;
      },

      recycleMovesetShards: (name: string, amount: number): boolean => {
        const state = get();
        const shards = state.movesetShards[name] || 0;
        if (shards < amount) return false;
        const newShards = shards - amount;
        const threadReward = amount * 3;
        const lunacyReward = amount * 5;
        set((s) => {
          const newShardMap = { ...s.movesetShards };
          if (newShards === 0) {
            delete newShardMap[name];
          } else {
            newShardMap[name] = newShards;
          }
          return {
            movesetShards: newShardMap,
            threads: s.threads + threadReward,
            lunacy: s.lunacy + lunacyReward,
          };
        });
        return true;
      },

      buyMovesetTicket: (cost: number, type: 'random' | 'waw' | 'aleph' | 'walkirksnacht' = 'random') => {
        const state = get();
        if (state.lunacy < cost) return false;
        const ticketKeyMap = {
          random: 'movesetTickets',
          waw: 'wawMovesetTickets',
          aleph: 'alephMovesetTickets',
          walkirksnacht: 'walkirksnachtMovesetTickets',
        } as const;
        const key = ticketKeyMap[type];
        set((s) => ({
          lunacy: s.lunacy - cost,
          [key]: s[key] + 1,
        }));
        return true;
      },

      // ─── BLOOD LUNACY ACTIONS ──────────────────────────────────────────

      addBloodLunacy: (amount: number) => {
        set((state) => ({ bloodLunacy: state.bloodLunacy + amount }));
      },

      claimBloodLunacyTicket: () => {
        const state = get();
        if (state.bloodLunacy < state.bloodLunacyThreshold) return false;
        set((s) => ({
          bloodLunacy: s.bloodLunacy - s.bloodLunacyThreshold,
          movesetTickets: s.movesetTickets + 1,
        }));
        get().addManagerExp(100);
        return true;
      },
    }),
    {
      name: 'qliphoth_state',
      version: STORE_VERSION,
      migrate: (persistedState: any, version: number) => {
        let newState = { ...persistedState };

        // ─── Ensure facility exists ────────────────────────────────────
        if (!newState.facility) {
          newState.facility = { ...INITIAL_STATE.facility };
        } else {
          const defaultFac = INITIAL_STATE.facility;
          for (const key of Object.keys(defaultFac)) {
            if (newState.facility[key] === undefined) {
              newState.facility[key] = defaultFac[key];
            }
          }
        }

        // ─── Resonance migration ──────────────────────────────────────
        if (!newState.resonance) {
          newState.resonance = {
            slots: Array.from({ length: TOTAL_RESONANCE_SLOTS }, () => ({
              type: null,
              hypertuneLevel: 0,
            })),
          };
        } else if (!newState.resonance.slots || newState.resonance.slots.length !== TOTAL_RESONANCE_SLOTS) {
          const existing = newState.resonance.slots || [];
          while (existing.length < TOTAL_RESONANCE_SLOTS) {
            existing.push({ type: null, hypertuneLevel: 0 });
          }
          newState.resonance.slots = existing.slice(0, TOTAL_RESONANCE_SLOTS);
        }
        if (newState.egoManifestEssence === undefined) newState.egoManifestEssence = 0;

        // ─── Ensure Arthur exists and all identities have corePassiveLevel & defenseLevel ──
        if (!Array.isArray(newState.ownedIdentities)) {
          newState.ownedIdentities = [];
        }
        const validIds = new Set(identities.map(i => i.id));
        newState.ownedIdentities = newState.ownedIdentities.filter((o: any) =>
          o && o.identityId && validIds.has(o.identityId)
        );
        newState.ownedIdentities = newState.ownedIdentities.map((o: any) => ({
          ...o,
          corePassiveLevel: o.corePassiveLevel ?? 1,
          defenseLevel: o.defenseLevel ?? 1,
        }));
        if (!newState.ownedIdentities.some((o: any) => o.identityId === 'arthur_excalibur')) {
          newState.ownedIdentities = [
            ...newState.ownedIdentities,
            ...INITIAL_STATE.ownedIdentities,
          ];
        }

        // ─── Migrate old gift slots (version < 26) ────────────────────
        if (version < 26) {
          const oldGifts = newState.equippedGifts || [];
          const slotMap: Record<number, EgoGiftSlot> = {
            1: 'left_back',
            2: 'right_back',
            3: 'mouth',
            4: 'mouth2',
            5: 'face',
            6: 'eye',
          };
          const newGifts = EGO_GIFT_SLOTS.map(slot => {
            const old = oldGifts.find((g: any) => g.slot === parseInt(Object.keys(slotMap).find(k => slotMap[parseInt(k)] === slot.id) || '0'));
            return {
              slot: slot.id,
              giftId: old?.giftId || '',
              level: old?.level || 1,
              exp: old?.exp || 0,
              syncLevel: old?.syncLevel || 0,
            };
          });
          newState.equippedGifts = newGifts;

          const oldRes = newState.giftResonance || {};
          const oldHypertune = newState.giftHypertune || {};
          const newRes: Record<EgoGiftSlot, { slot1: string | null; slot2: string | null }> = {};
          const newHypertune: Record<EgoGiftSlot, number> = {};
          for (const [key, value] of Object.entries(oldRes)) {
            const num = parseInt(key);
            if (!isNaN(num) && slotMap[num]) {
              newRes[slotMap[num]] = value;
            }
          }
          for (const [key, value] of Object.entries(oldHypertune)) {
            const num = parseInt(key);
            if (!isNaN(num) && slotMap[num]) {
              newHypertune[slotMap[num]] = value;
            }
          }
          newState.giftResonance = newRes;
          newState.giftHypertune = newHypertune;
        }

        // ─── Clean arrays ──────────────────────────────────────────────
        const arrays = ['storyAllies', 'storyRoster', 'team', 'trialIdentities', 'temporaryTrialIds'];
        for (const key of arrays) {
          if (Array.isArray(newState[key])) {
            newState[key] = newState[key].filter((id: string) => validIds.has(id));
            if (newState[key].length === 0 && key !== 'temporaryTrialIds') {
              newState[key] = ['arthur_excalibur'];
            }
          } else {
            newState[key] = key === 'temporaryTrialIds' ? [] : ['arthur_excalibur'];
          }
        }

        // ─── Clean shardInventory ──────────────────────────────────────
        if (newState.shardInventory) {
          const cleaned: Record<string, number> = {};
          for (const [id, count] of Object.entries(newState.shardInventory)) {
            if (validIds.has(id)) cleaned[id] = count;
          }
          newState.shardInventory = cleaned;
        }

        // ─── Ensure all banners exist ──────────────────────────────────
        const allTypes: BannerType[] = ['standard', 'featured', 'fate', 'weapon', 'rerun', 'rerun_weapon', 'rerun_fate'];
        if (!newState.banners) newState.banners = {};
        for (const type of allTypes) {
          if (!newState.banners[type]) {
            if (type === 'weapon' || type === 'rerun_weapon') {
              newState.banners[type] = { type, pity: 0, totalPulls: 0, selectedWeaponId: 'excalibur_greatsword', calibrationActive: false, calibrationTarget: null };
            } else if (type === 'standard') {
              newState.banners[type] = { type, pity: 0, totalPulls: 0, selectedTargetId: 'arthur_excalibur' };
            } else if (type === 'fate' || type === 'rerun_fate') {
              newState.banners[type] = { type, pity: 0, totalPulls: 0, featuredId: 'arthur_excalibur', floatingGuarantee: generateFloatingGuarantee() };
            } else {
              newState.banners[type] = { type, pity: 0, totalPulls: 0, featuredId: 'arthur_excalibur' };
            }
          }
        }

        // ─── Ensure duel state exists ──────────────────────────────────
        if (!newState.duel) {
          newState.duel = {
            active: false,
            score: 0,
            lives: 5,
            streak: 0,
            history: [],
          };
        }

        // ─── Moveset migration ──────────────────────────────────────────
        if (!newState.ownedMovesets) newState.ownedMovesets = [];
        if (newState.movesetTickets === undefined) newState.movesetTickets = 0;
        if (newState.wawMovesetTickets === undefined) newState.wawMovesetTickets = 0;
        if (newState.alephMovesetTickets === undefined) newState.alephMovesetTickets = 0;
        if (newState.walkirksnachtMovesetTickets === undefined) newState.walkirksnachtMovesetTickets = 0;
        if (!newState.movesetShards) newState.movesetShards = {};

        // Ensure daily/weekly tasks include moveset tasks
        const dailyTasks = newState.dailyTasks || [];
        if (!dailyTasks.find((t: any) => t.id === 'daily_moveset')) {
          dailyTasks.push({ id: 'daily_moveset', description: 'Obtain a Moveset', progress: 0, max: 1, claimed: false });
        }
        const weeklyTasks = newState.weeklyTasks || [];
        if (!weeklyTasks.find((t: any) => t.id === 'weekly_moveset_3')) {
          weeklyTasks.push({ id: 'weekly_moveset_3', description: 'Obtain 3 Movesets', progress: 0, max: 3, claimed: false });
        }
        newState.dailyTasks = dailyTasks;
        newState.weeklyTasks = weeklyTasks;

        // ─── Bonus flags ──────────────────────────────────────────────
        if (newState.allDailyBonusClaimed === undefined) newState.allDailyBonusClaimed = false;
        if (newState.allWeeklyBonusClaimed === undefined) newState.allWeeklyBonusClaimed = false;

        // ─── Blood Lunacy migration ────────────────────────────────────
        if (newState.bloodLunacy === undefined) newState.bloodLunacy = 0;
        if (newState.bloodLunacyThreshold === undefined) newState.bloodLunacyThreshold = 1000;

        return newState;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // ─── Ensure Arthur exists ──────────────────────────────────────
        if (!Array.isArray(state.ownedIdentities)) state.ownedIdentities = [];
        const arthur = state.ownedIdentities.find((o: any) => o.identityId === 'arthur_excalibur');
        if (!arthur) {
          state.ownedIdentities.push({
            identityId: 'arthur_excalibur',
            rank: 0,
            level: 1,
            exp: 0,
            shards: 0,
            skillLevels: [1, 1, 1, 1],
            corePassiveLevel: 1,
            defenseLevel: 1,
            equippedWeaponId: 'excalibur_greatsword',
          });
        }

        // ─── Ensure Arthur owns Excalibur ──────────────────────────────
        if (!Array.isArray(state.ownedWeapons)) state.ownedWeapons = [];
        const hasExcalibur = state.ownedWeapons.some((w: any) => w.weaponId === 'excalibur_greatsword');
        if (!hasExcalibur) {
          state.ownedWeapons.push({ weaponId: 'excalibur_greatsword', level: 1, exp: 0 });
        }

        // ─── Force equip Excalibur for Arthur ──────────────────────────
        state.ownedIdentities = state.ownedIdentities.map((o: any) => {
          if (o.identityId === 'arthur_excalibur') {
            return { ...o, equippedWeaponId: 'excalibur_greatsword' };
          }
          if (o.equippedWeaponId === 'excalibur_greatsword') {
            return { ...o, equippedWeaponId: 'excalibur_greatsword' };
          }
          return o;
        });

        // ─── Fix any old weapon ID in ownedWeapons ─────────────────────
        state.ownedWeapons = state.ownedWeapons.map((w: any) => ({
          ...w,
          weaponId: w.weaponId === 'excalibur_greatsword' ? 'excalibur_greatsword' : w.weaponId,
        }));

        // ─── Fix valid identities ──────────────────────────────────────
        const validIds = new Set(identities.map(i => i.id));
        state.ownedIdentities = state.ownedIdentities.filter((o: any) =>
          o && o.identityId && validIds.has(o.identityId)
        );
        state.ownedIdentities = state.ownedIdentities.map((o: any) => ({
          ...o,
          corePassiveLevel: o.corePassiveLevel ?? 1,
          defenseLevel: o.defenseLevel ?? 1,
        }));
        if (!state.ownedIdentities.some((o: any) => o.identityId === 'arthur_excalibur')) {
          state.ownedIdentities.push({
            identityId: 'arthur_excalibur',
            rank: 0,
            level: 1,
            exp: 0,
            shards: 0,
            skillLevels: [1, 1, 1, 1],
            corePassiveLevel: 1,
            defenseLevel: 1,
            equippedWeaponId: 'excalibur_greatsword',
          });
        }

        // ─── Ensure duel state exists ──────────────────────────────────
        if (!state.duel) {
          state.duel = {
            active: false,
            score: 0,
            lives: 5,
            streak: 0,
            history: [],
          };
        }

        // ─── Moveset fields ──────────────────────────────────────────────
        if (!state.ownedMovesets) state.ownedMovesets = [];
        if (state.movesetTickets === undefined) state.movesetTickets = 0;
        if (state.wawMovesetTickets === undefined) state.wawMovesetTickets = 0;
        if (state.alephMovesetTickets === undefined) state.alephMovesetTickets = 0;
        if (state.walkirksnachtMovesetTickets === undefined) state.walkirksnachtMovesetTickets = 0;
        if (!state.movesetShards) state.movesetShards = {};

        // ─── Bonus flags ──────────────────────────────────────────────
        if (state.allDailyBonusClaimed === undefined) state.allDailyBonusClaimed = false;
        if (state.allWeeklyBonusClaimed === undefined) state.allWeeklyBonusClaimed = false;

        // ─── Blood Lunacy fields ──────────────────────────────────────
        if (state.bloodLunacy === undefined) state.bloodLunacy = 0;
        if (state.bloodLunacyThreshold === undefined) state.bloodLunacyThreshold = 1000;

        // ─── Ensure daily/weekly tasks include moveset tasks ──────────
        const dailyTasks = state.dailyTasks || [];
        if (!dailyTasks.find((t: any) => t.id === 'daily_moveset')) {
          dailyTasks.push({ id: 'daily_moveset', description: 'Obtain a Moveset', progress: 0, max: 1, claimed: false });
        }
        state.dailyTasks = dailyTasks;

        const weeklyTasks = state.weeklyTasks || [];
        if (!weeklyTasks.find((t: any) => t.id === 'weekly_moveset_3')) {
          weeklyTasks.push({ id: 'weekly_moveset_3', description: 'Obtain 3 Movesets', progress: 0, max: 3, claimed: false });
        }
        state.weeklyTasks = weeklyTasks;
      },
      partialize: (state) => ({
        enkephalin: state.enkephalin,
        weaponFragments: state.weaponFragments,
        threads: state.threads,
        eclipseResonanceMaterials: state.eclipseResonanceMaterials,
        eventManifestTickets: state.eventManifestTickets,
        targetArsenalTickets: state.targetArsenalTickets,
        basicManifestTickets: state.basicManifestTickets,
        managerLevel: state.managerLevel,
        managerExp: state.managerExp,
        lunacy: state.lunacy,
        ownedIdentities: state.ownedIdentities,
        ownedWeapons: state.ownedWeapons,
        ownedGifts: state.ownedGifts,
        equippedGifts: state.equippedGifts,
        expSerum: state.expSerum,
        expSerumM: state.expSerumM,
        expSerumL: state.expSerumL,
        expSerumXL: state.expSerumXL,
        weaponParts: state.weaponParts,
        syncEnhancementMats: state.syncEnhancementMats,
        syncSerumMats: state.syncSerumMats,
        lowTierMats: state.lowTierMats,
        currentChapter: state.currentChapter,
        storyAllies: state.storyAllies,
        storyRoster: state.storyRoster,
        completedChapters: state.completedChapters,
        nodeCompletion: state.nodeCompletion,
        dailyTasks: state.dailyTasks,
        weeklyTasks: state.weeklyTasks,
        competitiveScore: state.competitiveScore,
        competitivePlayed: state.competitivePlayed,
        crRegion: state.crRegion,
        crRegionLocked: state.crRegionLocked,
        crWeek: state.crWeek,
        crZoneScores: state.crZoneScores,
        crCompletedZones: state.crCompletedZones,
        crMerit: state.crMerit,
        crReputation: state.crReputation,
        crSquad: state.crSquad,
        totalEnemyDefeats: state.totalEnemyDefeats,
        banners: state.banners,
        team: state.team,
        leaderIndex: state.leaderIndex,
        shardInventory: state.shardInventory,
        ssrInverseMaterial: state.ssrInverseMaterial,
        srInverseMaterial: state.srInverseMaterial,
        purchasedShards: state.purchasedShards,
        seenTutorials: state.seenTutorials,
        pendingTutorialKey: state.pendingTutorialKey,
        pendingTutorialSequence: state.pendingTutorialSequence,
        currentTutorialStep: state.currentTutorialStep,
        giftResonance: state.giftResonance,
        giftHypertune: state.giftHypertune,
        weaponHarmonization: state.weaponHarmonization,
        lastDailyReset: state.lastDailyReset,
        lastWeeklyReset: state.lastWeeklyReset,
        allDailyBonusClaimed: state.allDailyBonusClaimed,
        allWeeklyBonusClaimed: state.allWeeklyBonusClaimed,
        specialDebuffActive: state.specialDebuffActive,
        pullHistory: state.pullHistory,
        roverAwakened: state.roverAwakened,
        trialIdentities: state.trialIdentities,
        temporaryTrialIds: state.temporaryTrialIds,
        awakeningRewardsGranted: state.awakeningRewardsGranted,
        currentForcedIdentity: state.currentForcedIdentity,
        currentUseDawnbreaker: state.currentUseDawnbreaker,
        currentJoinAllies: state.currentJoinAllies,
        currentChapterId: state.currentChapterId,
        pendingChapterRewards: state.pendingChapterRewards,
        egoManifestEssence: state.egoManifestEssence,
        resonance: state.resonance,
        facility: state.facility,
        duel: state.duel,
        // Moveset fields
        ownedMovesets: state.ownedMovesets,
        movesetTickets: state.movesetTickets,
        wawMovesetTickets: state.wawMovesetTickets,
        alephMovesetTickets: state.alephMovesetTickets,
        walkirksnachtMovesetTickets: state.walkirksnachtMovesetTickets,
        movesetShards: state.movesetShards,
        // Blood Lunacy
        bloodLunacy: state.bloodLunacy,
        bloodLunacyThreshold: state.bloodLunacyThreshold,
      }),
    }
  )
);

// ─── Helper: pullOne ──────────────────────────────────────────────────
function pullOne(banner: BannerState, bannerType: BannerType): GachaResult {
  const isFate = bannerType === 'fate' || bannerType === 'rerun_fate';
  const isRerun = bannerType === 'rerun' || bannerType === 'rerun_fate';
  const isWeapon = bannerType === 'weapon' || bannerType === 'rerun_weapon';
  const isFeatured = bannerType === 'featured';
  const isStandard = bannerType === 'standard';

  const ssrRate = isWeapon ? 0.05 : isFate ? 0.015 : 0.005;
  const srRate = isWeapon ? 0.135 : 0.025;

  const pity = banner.pity + 1;
  let pityCap: number;
  if (isFate) {
    pityCap = banner.floatingGuarantee || 80;
  } else if (isWeapon) {
    pityCap = 40;
  } else {
    pityCap = 60;
  }
  const isGuaranteed = pity >= pityCap;

  let rarity: 'SSR' | 'SR' | 'material';
  if (isGuaranteed) {
    rarity = 'SSR';
  } else if (isWeapon) {
    const roll = Math.random();
    if (roll < ssrRate) rarity = 'SSR';
    else if (roll < ssrRate + srRate) rarity = 'SR';
    else rarity = 'material';
  } else {
    if (Math.random() < ssrRate) rarity = 'SSR';
    else if ((pity % 10 === 0) || Math.random() < srRate) rarity = 'SR';
    else rarity = 'material';
  }

  if (rarity === 'SSR') {
    if (isWeapon) {
      const target = banner.selectedWeaponId;
      if (banner.calibrationActive && banner.calibrationTarget === target) {
        const found = weapons.find(w => w.id === target && w.rarity === 'SSR' && w.inGacha);
        if (found) {
          banner.calibrationActive = false;
          banner.calibrationTarget = null;
          return { type: 'weapon', rarity: 'SSR', id: found.id, name: found.name };
        }
      }
      const pool = weapons.filter(w => w.rarity === 'SSR' && w.inGacha);
      let picked: Weapon;
      if (target && Math.random() < 0.8) {
        const found = pool.find(w => w.id === target);
        if (found) {
          banner.calibrationActive = false;
          banner.calibrationTarget = null;
          return { type: 'weapon', rarity: 'SSR', id: found.id, name: found.name };
        }
      }
      const offTargetPool = pool.filter(w => w.id !== target);
      if (offTargetPool.length === 0) {
        picked = pool[Math.floor(Math.random() * pool.length)];
      } else {
        picked = offTargetPool[Math.floor(Math.random() * offTargetPool.length)];
      }
      banner.calibrationActive = true;
      banner.calibrationTarget = target;
      return { type: 'weapon', rarity: 'SSR', id: picked.id, name: picked.name };
    }

    let pickedId: string;
    if (isFeatured || isFate) {
      const featuredPool = ['arthur_excalibur'];
      const validFeatured = featuredPool.filter(id => identities.some(i => i.id === id && i.rarity === 'SSR'));
      if (validFeatured.length === 0) {
        const fallbackPool = identities.filter(i => i.rarity === 'SSR' && i.id !== 'arthur_excalibur' && !storyOnlyIdentities.has(i.id));
        pickedId = fallbackPool[Math.floor(Math.random() * fallbackPool.length)].id;
      } else {
        pickedId = validFeatured[Math.floor(Math.random() * validFeatured.length)];
      }
    } else if (isRerun) {
      const isRateUp = Math.random() < 0.7;
      if (isRateUp) {
        const rerunPool = ['arthur_excalibur'];
        const validRerun = rerunPool.filter(id => identities.some(i => i.id === id && i.rarity === 'SSR'));
        if (validRerun.length === 0) {
          const fallbackPool = identities.filter(i => i.rarity === 'SSR' && i.id !== 'arthur_excalibur' && !storyOnlyIdentities.has(i.id));
          pickedId = fallbackPool[Math.floor(Math.random() * fallbackPool.length)].id;
        } else {
          pickedId = validRerun[Math.floor(Math.random() * validRerun.length)];
        }
      } else {
        const offPool = identities.filter(i =>
          i.rarity === 'SSR' &&
          i.id !== 'arthur_excalibur' &&
          !storyOnlyIdentities.has(i.id)
        );
        if (offPool.length === 0) {
          const fallback = identities.filter(i => i.rarity === 'SSR' && i.id !== 'arthur_excalibur' && !storyOnlyIdentities.has(i.id));
          pickedId = fallback[Math.floor(Math.random() * fallback.length)].id;
        } else {
          pickedId = offPool[Math.floor(Math.random() * offPool.length)].id;
        }
      }
    } else if (isStandard) {
      const pool = identities.filter(i => i.rarity === 'SSR' && i.id !== 'arthur_excalibur' && !storyOnlyIdentities.has(i.id));
      if (pool.length === 0) throw new Error('No SSR identities in standard pool');
      pickedId = pool[Math.floor(Math.random() * pool.length)].id;
    } else {
      const pool = identities.filter(i => i.rarity === 'SSR' && i.id !== 'arthur_excalibur' && !storyOnlyIdentities.has(i.id));
      pickedId = pool[Math.floor(Math.random() * pool.length)].id;
    }
    const identity = identities.find(i => i.id === pickedId)!;
    return { type: 'identity', rarity: 'SSR', id: pickedId, name: identity.name, shards: 20 };
  }

  if (rarity === 'SR') {
    if (isWeapon) {
      const target = banner.selectedWeaponId;
      let srUpId: string | undefined;
      const targetWeapon = weapons.find(w => w.id === target);
      if (targetWeapon && targetWeapon.signatureFor) {
        const fallback = weapons.find(w => w.fallbackFor === targetWeapon.signatureFor && w.inGacha);
        srUpId = fallback?.id;
      }
      const pool = weapons.filter(w => w.rarity === 'SR' && w.inGacha);
      let picked: Weapon;
      if (srUpId && Math.random() < 0.8889) {
        const found = pool.find(w => w.id === srUpId);
        if (found) picked = found;
        else picked = pool[Math.floor(Math.random() * pool.length)];
      } else {
        const otherPool = srUpId ? pool.filter(w => w.id !== srUpId) : pool;
        picked = otherPool[Math.floor(Math.random() * otherPool.length)];
      }
      return { type: 'weapon', rarity: 'SR', id: picked.id, name: picked.name };
    } else {
      if (isStandard) {
        const target = banner.selectedTargetId;
        let srPool = identities.filter(i => i.rarity === 'SR' && !storyOnlyIdentities.has(i.id));
        if (banner.featuredId) {
          srPool = srPool.filter(i => i.id !== banner.featuredId);
        }
        let pickedId: string;
        if (pity % 10 === 0 && target && srPool.some(i => i.id === target)) {
          pickedId = target;
        } else {
          if (target && Math.random() < 0.5 && srPool.some(i => i.id === target)) {
            pickedId = target;
          } else {
            if (srPool.length === 0) throw new Error('No SR identities in standard pool');
            pickedId = srPool[Math.floor(Math.random() * srPool.length)].id;
          }
        }
        const identity = identities.find(i => i.id === pickedId)!;
        return { type: 'identity', rarity: 'SR', id: pickedId, name: identity.name, shards: 8 };
      } else {
        let pool = identities.filter(i => i.rarity === 'SR' && !storyOnlyIdentities.has(i.id));
        if (pool.length === 0) throw new Error('No SR identities in featured pool');
        const picked = pool[Math.floor(Math.random() * pool.length)];
        return { type: 'identity', rarity: 'SR', id: picked.id, name: picked.name, shards: 8 };
      }
    }
  }

  // Materials
  const materialRoll = Math.random();
  if (materialRoll < 0.1542) {
    return { type: 'material', rarity: 'material', id: 'expSerum', name: 'EXP Essence x2' };
  } else if (materialRoll < 0.1542 + 0.1439) {
    return { type: 'material', rarity: 'material', id: 'weapon_parts', name: 'Forge Alloy x2' };
  } else if (materialRoll < 0.1542 + 0.1439 + 0.1439) {
    return { type: 'material', rarity: 'material', id: 'threads', name: 'Sigil Strands x1' };
  } else if (materialRoll < 0.1542 + 0.1439 + 0.1439 + 0.1042) {
    return { type: 'material', rarity: 'material', id: 'lowTierMats', name: 'Qliphoth Dust x3' };
  } else if (materialRoll < 0.1542 + 0.1439 + 0.1439 + 0.1042 + 0.1027) {
    return { type: 'material', rarity: 'material', id: 'syncEnhancementMats', name: 'Sync Materials x1' };
  } else {
    const otherPool = [
      { id: 'expSerum', name: 'EXP Essence x1' },
      { id: 'weapon_parts', name: 'Forge Alloy x1' },
      { id: 'lowTierMats', name: 'Qliphoth Dust x2' },
    ];
    const picked = otherPool[Math.floor(Math.random() * otherPool.length)];
    return { type: 'material', rarity: 'material', id: picked.id, name: picked.name };
  }
}

export default useGameStore;

// src/data/departments.ts
// Complete department definitions for the Qliphoth system
// All 11 departments: Malkuth, Yesod, Netzach, Hod, Tiphereth, Gebura, Chesed, Binah, Hokma, Da'at, Keter

import { BossData } from './bossData';
import { OrdealEnemy } from './ordealsData';

// ============================================================================
// TYPES
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

export interface DepartmentResearch {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active' | 'bullet';
  cost: { lunacy: number; energy: number };
  effect: string;
  unlocked: boolean;
}

export interface DepartmentSuppressionReward {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: string;
}

export interface CoreSuppression {
  id: string;
  name: string;
  description: string;
  bossName: string;
  bossId: string;
  reward: string;
}

export interface Department {
  id: DepartmentId;
  key: string;          // uppercase key for store matching
  name: string;
  title: string;
  description: string;
  icon: string;
  emoji: string;         // duplicate of icon for compatibility
  color: string;
  levelRequired: number; // manager level required (not used for day unlock)
  maxAbnosPerDay: number;
  dayUnlock: number;     // the actual day requirement
  research: DepartmentResearch[];
  suppressionReward: DepartmentSuppressionReward;
  coreSuppression?: CoreSuppression;
}

// ─── Shared department data (single source of truth) ──────────────
export const DEPARTMENTS: Department[] = [
  {
    id: 'MALKUTH',
    key: 'MALKUTH',
    name: 'Control Team',
    title: 'The Kingdom',
    description: 'The foundation floor. Control and training.',
    icon: '👑',
    emoji: '🔥',
    color: '#FF6B6B',
    levelRequired: 1,
    maxAbnosPerDay: 1,
    dayUnlock: 1,
    research: [
      {
        id: 'tt2_protocol',
        name: 'TT2 Protocol',
        description: 'Improves work speed by 10%',
        type: 'passive',
        cost: { lunacy: 500, energy: 50 },
        effect: '+10% work speed',
        unlocked: false,
      },
      {
        id: 'join_command',
        name: 'Join Command',
        description: 'Allows agents to quickly join departments',
        type: 'active',
        cost: { lunacy: 300, energy: 30 },
        effect: 'Instant department transfer',
        unlocked: false,
      },
      {
        id: 'meeting_call',
        name: 'Meeting Call',
        description: 'Allows one agent to retreat per 5 turns',
        type: 'active',
        cost: { lunacy: 400, energy: 40 },
        effect: '1 retreat per 5 turns',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'malkuth_reward',
      name: "Malkuth's Crown",
      description: '20% increase in Lob Points and Lunacy earned at day end',
      icon: '👑',
      effect: '+20% Lunacy & Lob Points',
    },
  },
  {
    id: 'YESOD',
    key: 'YESOD',
    name: 'Information Team',
    title: 'The Foundation',
    description: 'Records and information management.',
    icon: '📊',
    emoji: '📊',
    color: '#4ECDC4',
    levelRequired: 5,
    maxAbnosPerDay: 1,
    dayUnlock: 5, // ✅ corrected
    research: [
      {
        id: 'go_visualization',
        name: 'G.O. Visualization',
        description: 'Visualize G.O. data for better management',
        type: 'passive',
        cost: { lunacy: 600, energy: 60 },
        effect: 'Improved management data',
        unlocked: false,
      },
      {
        id: 'damage_normalization',
        name: 'Damage Normalization',
        description: 'Normalizes damage output',
        type: 'passive',
        cost: { lunacy: 500, energy: 50 },
        effect: '+5% damage consistency',
        unlocked: false,
      },
      {
        id: 'corrective_measures',
        name: 'Corrective Measures Manual',
        description: 'Better work results',
        type: 'passive',
        cost: { lunacy: 700, energy: 70 },
        effect: '+10% PE Boxes',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'yesod_reward',
      name: "Yesod's Records",
      description: '25% increase in PE Boxes obtained from working',
      icon: '📊',
      effect: '+25% PE Boxes',
    },
  },
  {
    id: 'HOD',
    key: 'HOD',
    name: 'Training Team',
    title: 'The Glory',
    description: 'Education and training. Develop your agents.',
    icon: '📚',
    emoji: '📚',
    color: '#FFE66D',
    levelRequired: 10,
    maxAbnosPerDay: 1,
    dayUnlock: 15, // ✅ corrected
    research: [
      {
        id: 'education_manuals',
        name: 'Education Manuals',
        description: 'Improved stat gain from working',
        type: 'passive',
        cost: { lunacy: 600, energy: 60 },
        effect: '+15% stat gain',
        unlocked: false,
      },
      {
        id: 'professional_education',
        name: 'Professional Education',
        description: 'Further improved stat gain',
        type: 'passive',
        cost: { lunacy: 800, energy: 80 },
        effect: '+25% stat gain',
        unlocked: false,
      },
      {
        id: 'hiring_procedure',
        name: 'Hiring Procedure',
        description: 'Better agent recruitment',
        type: 'passive',
        cost: { lunacy: 500, energy: 50 },
        effect: '+20% agent stats on hire',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'hod_reward',
      name: "Hod's Knowledge",
      description: 'Increased stats gained through working',
      icon: '📚',
      effect: '+50% stat gain from work',
    },
  },
  {
    id: 'NETZACH',
    key: 'NETZACH',
    name: 'Safety Team',
    title: 'The Victory',
    description: 'Recreation and healing. Restore your agents.',
    icon: '💚',
    emoji: '🛡️',
    color: '#51CF66',
    levelRequired: 15,
    maxAbnosPerDay: 1,
    dayUnlock: 10, // ✅ corrected
    research: [
      {
        id: 'regenerator_mk2',
        name: 'Regenerator MK2',
        description: 'Improved healing',
        type: 'passive',
        cost: { lunacy: 700, energy: 70 },
        effect: '+20% healing',
        unlocked: false,
      },
      {
        id: 'mental_neutralizer',
        name: 'Mental Corruption Neutralizer',
        description: 'Reduces SP damage',
        type: 'passive',
        cost: { lunacy: 800, energy: 80 },
        effect: '-15% SP damage',
        unlocked: false,
      },
      {
        id: 'regeneration_distinguisher',
        name: 'Regeneration Distinguisher',
        description: 'Better healing efficiency',
        type: 'passive',
        cost: { lunacy: 600, energy: 60 },
        effect: 'Main room heals at 50% efficiency',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'netzach_reward',
      name: "Netzach's Mercy",
      description: 'Heals while working with abnormalities. Main room heals at 50% efficiency.',
      icon: '💚',
      effect: 'Work healing +50%',
    },
  },
  {
    id: 'TIPHERETH',
    key: 'TIPHERETH',
    name: 'Central Command',
    title: 'The Beauty',
    description: 'Weapons and bullets. Arm your agents.',
    icon: '⚖️',
    emoji: '⚔️',
    color: '#CC8899',
    levelRequired: 20,
    maxAbnosPerDay: 2,
    dayUnlock: 20, // ✅ corrected
    research: [
      {
        id: 'shield_bullets',
        name: 'Shield Bullets',
        description: 'White, Black, and Red shield bullets',
        type: 'bullet',
        cost: { lunacy: 1000, energy: 100 },
        effect: 'Shield bullets unlocked',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'tiphereth_reward',
      name: "Tiphereth's Armory",
      description: 'Pale bullets unlocked. Bullet capacity +25%',
      icon: '⚔️',
      effect: 'Pale bullets + Bullet capacity +25%',
    },
  },
  {
    id: 'GEBURA',
    key: 'GEBURA',
    name: 'Disciplinary Team',
    title: 'The Might',
    description: 'Combat and suppression. Become the strongest.',
    icon: '⚔️',
    emoji: '🗡️',
    color: '#FF6B6B',
    levelRequired: 25,
    maxAbnosPerDay: 1,
    dayUnlock: 25, // ✅ corrected
    research: [
      {
        id: 'execution_bullets',
        name: 'Execution Bullets',
        description: 'Manager-only execution bullets',
        type: 'bullet',
        cost: { lunacy: 1500, energy: 150 },
        effect: 'Execution bullets unlocked',
        unlocked: false,
      },
      {
        id: 'qliphoth_intervention',
        name: 'Qliphoth Intervention Field',
        description: 'Reduces Qliphoth meltdown effects',
        type: 'passive',
        cost: { lunacy: 1200, energy: 120 },
        effect: 'Qliphoth damage -20%',
        unlocked: false,
      },
      {
        id: 'rabbit_team',
        name: 'Rabbit Team',
        description: 'Call in the Rabbit Team',
        type: 'active',
        cost: { lunacy: 2000, energy: 200 },
        effect: 'Rabbit Team deployed',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'gebura_reward',
      name: 'Proto Mimi',
      description: 'Allows dual wielding. Decreases Ego cost by 20-30%',
      icon: '🗡️',
      effect: 'Dual wielding + Ego cost -25%',
    },
  },
  {
    id: 'CHESED',
    key: 'CHESED',
    name: 'Welfare Team',
    title: 'The Mercy',
    description: 'Healing and support. Protect your agents.',
    icon: '💙',
    emoji: '🩹',
    color: '#4A9BE8',
    levelRequired: 30,
    maxAbnosPerDay: 1,
    dayUnlock: 30, // ✅ corrected
    research: [
      {
        id: 'hp_sp_bullets',
        name: 'HP & SP Bullets',
        description: 'Healing and sanity bullets',
        type: 'bullet',
        cost: { lunacy: 800, energy: 80 },
        effect: 'HP & SP bullets unlocked',
        unlocked: false,
      },
      {
        id: 'hp_sp_refinement',
        name: 'HP & SP Bullets Refinement',
        description: 'Improved healing bullets',
        type: 'bullet',
        cost: { lunacy: 1000, energy: 100 },
        effect: 'Improved HP & SP bullets',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'chesed_reward',
      name: "Chesed's Mercy",
      description: '25% chance to revive/restore sanity upon panic (once per day)',
      icon: '💙',
      effect: '25% panic revival chance',
    },
  },
  {
    id: 'BINAH',
    key: 'BINAH',
    name: 'Extraction Team',
    title: 'The Understanding',
    description: 'Extraction and singularity research.',
    icon: '🔮',
    emoji: '🔮',
    color: '#9B59B6',
    levelRequired: 35,
    maxAbnosPerDay: 1,
    dayUnlock: 35, // ✅ corrected
    research: [
      {
        id: 're_extraction',
        name: 'Re-Extraction',
        description: 'Allows voting for re-roll',
        type: 'active',
        cost: { lunacy: 1200, energy: 120 },
        effect: 'Re-extraction available',
        unlocked: false,
      },
      {
        id: 'extraction_endurance',
        name: 'Extraction Protocol Endurance',
        description: 'Extract 3 times instead of 1',
        type: 'passive',
        cost: { lunacy: 1500, energy: 150 },
        effect: '3 extractions per day',
        unlocked: false,
      },
      {
        id: 'gift_division',
        name: 'Gift Division',
        description: 'Better gift distribution',
        type: 'passive',
        cost: { lunacy: 1000, energy: 100 },
        effect: '+2 gift slots',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'binah_reward',
      name: 'Singularities',
      description: 'Allows using many different singularities, once per day',
      icon: '🔮',
      effect: 'Singularities unlocked',
    },
  },
  {
    id: 'HOKMA',
    key: 'HOKMA',
    name: 'Records Team',
    title: 'The Wisdom',
    description: 'Limit break and ultimate potential.',
    icon: '🧠',
    emoji: '⏰',
    color: '#2C3E50',
    levelRequired: 40,
    maxAbnosPerDay: 1,
    dayUnlock: 40, // ✅ corrected
    research: [
      {
        id: 'limit_breakers',
        name: 'Limit Breakers',
        description: 'Fortitude, Prudence, Temperance can go past 120',
        type: 'passive',
        cost: { lunacy: 2000, energy: 200 },
        effect: 'Stat caps extended to 130',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'hokma_reward',
      name: "Hokma's Wisdom",
      description: 'Increases stat caps to 130 and allows leveling self to 130',
      icon: '🧠',
      effect: 'Stat cap 130',
    },
    coreSuppression: {
      id: 'hokma_core',
      name: 'Hokma Core Suppression',
      description: 'Stats set to 110. Pass to unlock 130 cap.',
      bossName: "Hokma's Twilight",
      bossId: 'hokma_twilight',
      reward: 'Unlock 130 stat cap',
    },
  },
  {
    id: 'DAAT',
    key: 'DAAT',
    name: 'Managerial Team',
    title: 'The Knowledge',
    description: 'Knowledge and ultimate power.',
    icon: '🌟',
    emoji: '🌌',
    color: '#FFD700',
    levelRequired: 45,
    maxAbnosPerDay: 1,
    dayUnlock: 45, // ✅ corrected
    research: [
      {
        id: 'today_ordeals',
        name: "Today's Ordeals",
        description: 'See upcoming ordeals in management logs',
        type: 'passive',
        cost: { lunacy: 800, energy: 80 },
        effect: 'Ordeal preview',
        unlocked: false,
      },
      {
        id: 'adrenaline_bullet',
        name: 'Adrenaline Bullet',
        description: 'Speeds up movement speed',
        type: 'bullet',
        cost: { lunacy: 1000, energy: 100 },
        effect: 'Movement speed +50%',
        unlocked: false,
      },
      {
        id: 'instability_fix',
        name: 'Instability Fix',
        description: 'Decreases Qliphoth overload for WAW and ALEPH',
        type: 'passive',
        cost: { lunacy: 1500, energy: 150 },
        effect: 'Qliphoth overload -30%',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'daat_reward',
      name: 'Strength Amplification',
      description: 'Multiply one agent\'s stat by 2x. Effect lasts once per meltdown.',
      icon: '🌟',
      effect: '2x stat multiplier',
    },
  },
  {
    id: 'KETER',
    key: 'KETER',
    name: 'Architecture Team',
    title: 'The Crown',
    description: 'The final floor. Ultimate power.',
    icon: '👑',
    emoji: '👑',
    color: '#E2B4BD',
    levelRequired: 50,
    maxAbnosPerDay: 2,
    dayUnlock: 50, // ✅ corrected
    research: [
      {
        id: 'memory_repository_overclock',
        name: 'Memory Repository Overclock',
        description: 'Choose any past day to return to (1500 Lunacy)',
        type: 'active',
        cost: { lunacy: 1500, energy: 150 },
        effect: 'Memory Repository unlocked',
        unlocked: false,
      },
      {
        id: 'department_synergy',
        name: 'Department Synergy',
        description: 'All department buffs apply globally at 20% effectiveness',
        type: 'passive',
        cost: { lunacy: 3000, energy: 300 },
        effect: 'Global department synergy',
        unlocked: false,
      },
      {
        id: 'awakening',
        name: 'Awakening',
        description: 'Agents with half HP enter Awakening mode',
        type: 'passive',
        cost: { lunacy: 2500, energy: 250 },
        effect: 'Awakening mode',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'keter_reward',
      name: 'Qliphoth Skip Protocol',
      description: 'Skip one Qliphoth meltdown twice per day. Deployment sync.',
      icon: '👑',
      effect: '2x Qliphoth skip per day + Deployment sync',
    },
  },
];

// ============================================================================
// RESEARCH INDEX (for quick lookup)
// ============================================================================

export const DEPARTMENT_RESEARCHES: Record<string, DepartmentResearch> = {};
DEPARTMENTS.forEach((dept) => {
  dept.research.forEach((r) => {
    DEPARTMENT_RESEARCHES[r.id] = r;
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getDepartment(id: DepartmentId): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}

export function getUnlockedDepartments(day: number): DepartmentId[] {
  return DEPARTMENTS
    .filter((d) => d.dayUnlock <= day)
    .map((d) => d.id);
}

export function getDepartmentByLevel(level: number): DepartmentId[] {
  return getUnlockedDepartments(level);
}

export function getMaxAbnormalitiesForDepartment(deptId: DepartmentId): number {
  const dept = getDepartment(deptId);
  return dept ? dept.maxAbnosPerDay : 1;
}

// src/data/departments.ts
// Reworked according to "How departments will work in Angela" blueprint

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
  // optional: requiredMissionId if you want to gate research behind missions
  requiredMissionId?: string;
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
  rewardDescription: string;
  // boss stats can be added later
}

export interface Department {
  id: DepartmentId;
  key: string;               // uppercase for store matching
  name: string;
  title: string;
  description: string;
  icon: string;
  emoji: string;
  color: string;
  layer: 'Asiyah' | 'Briah' | 'Atziluth'; // in-game layer
  dayUnlock: number;          // day required to unlock
  maxAbnosPerDay: number;     // 1 for most, 2 for Tiphereth & Keter
  research: DepartmentResearch[];
  suppressionReward: DepartmentSuppressionReward;
  coreSuppression?: CoreSuppression;
}

// ============================================================================
// DEPARTMENT DATA (single source of truth)
// ============================================================================

export const DEPARTMENTS: Department[] = [
  // 1. MALKUTH – Control Team
  {
    id: 'MALKUTH',
    key: 'MALKUTH',
    name: 'Control Team',
    title: 'The Kingdom',
    description: 'The foundation floor. Control and training.',
    icon: '👑',
    emoji: '🔥',
    color: '#FF6B6B',
    layer: 'Asiyah',
    dayUnlock: 1,
    maxAbnosPerDay: 1,
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
        description: 'Lets an agent retreat, only one agent will be able to retreat per 5 turns',
        type: 'active',
        cost: { lunacy: 400, energy: 40 },
        effect: '1 retreat per 5 turns',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'malkuth_reward',
      name: "Malkuth's Crown",
      description: '20% increase in Lob Points and Lunacy earned at the end of the day',
      icon: '👑',
      effect: '+20% Lunacy & Lob Points',
    },
    coreSuppression: {
      id: 'malkuth_core',
      name: 'Malkuth Core Suppression',
      description: 'Face Malkuth\'s trial to unlock her full potential.',
      bossName: 'Malkuth\'s Trial',
      bossId: 'malkuth_trial',
      reward: 'Malkuth Suppression Reward',
      rewardDescription: 'Unlocks the suppression reward permanently.',
    },
  },

  // 2. YESOD – Information Team
  {
    id: 'YESOD',
    key: 'YESOD',
    name: 'Information Team',
    title: 'The Foundation',
    description: 'Records and information management.',
    icon: '📊',
    emoji: '📊',
    color: '#4ECDC4',
    layer: 'Asiyah',
    dayUnlock: 6,
    maxAbnosPerDay: 1,
    research: [
      {
        id: 'go_visualization',
        name: 'G.O Visualization',
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
    coreSuppression: {
      id: 'yesod_core',
      name: 'Yesod Core Suppression',
      description: 'Confront Yesod\'s truth to unlock his records.',
      bossName: 'Yesod\'s Truth',
      bossId: 'yesod_truth',
      reward: 'Yesod Suppression Reward',
      rewardDescription: 'Permanently increase PE Box gains.',
    },
  },

  // 3. NETZACH – Safety Team
  {
    id: 'NETZACH',
    key: 'NETZACH',
    name: 'Safety Team',
    title: 'The Victory',
    description: 'Recreation and healing. Restore your agents.',
    icon: '💚',
    emoji: '🛡️',
    color: '#51CF66',
    layer: 'Asiyah',
    dayUnlock: 11,
    maxAbnosPerDay: 1,
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
      description: 'Heals whilst working with abnormalities, main room heals at 50% efficiency',
      icon: '💚',
      effect: 'Work healing +50%',
    },
    coreSuppression: {
      id: 'netzach_core',
      name: 'Netzach Core Suppression',
      description: 'Overcome Netzach\'s indifference to unlock his mercy.',
      bossName: 'Netzach\'s Resolve',
      bossId: 'netzach_resolve',
      reward: 'Netzach Suppression Reward',
      rewardDescription: 'Permanent healing bonus while working.',
    },
  },

  // 4. HOD – Training Team
  {
    id: 'HOD',
    key: 'HOD',
    name: 'Training Team',
    title: 'The Glory',
    description: 'Education and training. Develop your agents.',
    icon: '📚',
    emoji: '📚',
    color: '#FFE66D',
    layer: 'Asiyah',
    dayUnlock: 16,
    maxAbnosPerDay: 1,
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
    coreSuppression: {
      id: 'hod_core',
      name: 'Hod Core Suppression',
      description: 'Illuminate Hod\'s insecurities to gain true knowledge.',
      bossName: 'Hod\'s Enlightenment',
      bossId: 'hod_enlightenment',
      reward: 'Hod Suppression Reward',
      rewardDescription: 'Permanent stat gain boost.',
    },
  },

  // 5. TIPHERETH – Central Command
  {
    id: 'TIPHERETH',
    key: 'TIPHERETH',
    name: 'Central Command',
    title: 'The Beauty',
    description: 'Weapons and bullets. Arm your agents.',
    icon: '⚖️',
    emoji: '⚔️',
    color: '#CC8899',
    layer: 'Briah',
    dayUnlock: 21,
    maxAbnosPerDay: 2, // 2 per day as specified
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
      description: 'Pale bullets, bullet capacity increased by 25% (bullets can be used both during combat and departments, won\'t be able to use them whilst working on abnos, they\'ll break when working on abnos)',
      icon: '⚔️',
      effect: 'Pale bullets + Bullet capacity +25%',
    },
    coreSuppression: {
      id: 'tiphereth_core',
      name: 'Tiphereth Core Suppression',
      description: 'Balance Tiphereth\'s dual nature to unlock the armory.',
      bossName: 'Tiphereth\'s Balance',
      bossId: 'tiphereth_balance',
      reward: 'Tiphereth Suppression Reward',
      rewardDescription: 'Permanent bullet upgrades.',
    },
  },

  // 6. GEBURA – Disciplinary Team
  {
    id: 'GEBURA',
    key: 'GEBURA',
    name: 'Disciplinary Team',
    title: 'The Might',
    description: 'Combat and suppression. Become the strongest.',
    icon: '⚔️',
    emoji: '🗡️',
    color: '#FF6B6B',
    layer: 'Briah',
    dayUnlock: 26,
    maxAbnosPerDay: 1,
    research: [
      {
        id: 'execution_bullets',
        name: 'Execution Bullets',
        description: 'Can only be used by the manager, each reset there\'ll be a new manager unless it is a user facility, the manager will always be the user',
        type: 'bullet',
        cost: { lunacy: 1500, energy: 150 },
        effect: 'Execution bullets unlocked (manager only)',
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
        description: 'Call in the Rabbit Team (manager only)',
        type: 'active',
        cost: { lunacy: 2000, energy: 200 },
        effect: 'Rabbit Team deployed',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'gebura_reward',
      name: 'Proto Mimi',
      description: 'Allows dual wielding (it will show in stats), also will decrease ego cost by 20~30%',
      icon: '🗡️',
      effect: 'Dual wielding + Ego cost -25%',
    },
    coreSuppression: {
      id: 'gebura_core',
      name: 'Gebura Core Suppression',
      description: 'Confront Gebura\'s rage to earn the Proto Mimi.',
      bossName: 'Gebura\'s Rage',
      bossId: 'gebura_rage',
      reward: 'Gebura Suppression Reward',
      rewardDescription: 'Unlock dual wielding and EGO cost reduction.',
    },
  },

  // 7. CHESED – Welfare Team
  {
    id: 'CHESED',
    key: 'CHESED',
    name: 'Welfare Team',
    title: 'The Mercy',
    description: 'Healing and support. Protect your agents.',
    icon: '💙',
    emoji: '🩹',
    color: '#4A9BE8',
    layer: 'Briah',
    dayUnlock: 31,
    maxAbnosPerDay: 1,
    research: [
      {
        id: 'hp_sp_bullets',
        name: 'HP-n and SP- bullets',
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
      description: 'Employees have a 25% chance to revive/restore sanity upon panic (once per day)',
      icon: '💙',
      effect: '25% panic revival chance',
    },
    coreSuppression: {
      id: 'chesed_core',
      name: 'Chesed Core Suppression',
      description: 'Embrace Chesed\'s compassion to unlock revival chance.',
      bossName: 'Chesed\'s Compassion',
      bossId: 'chesed_compassion',
      reward: 'Chesed Suppression Reward',
      rewardDescription: 'Unlock panic revival chance.',
    },
  },

  // 8. BINAH – Extraction Team
  {
    id: 'BINAH',
    key: 'BINAH',
    name: 'Extraction Team',
    title: 'The Understanding',
    description: 'Extraction and singularity research.',
    icon: '🔮',
    emoji: '🔮',
    color: '#9B59B6',
    layer: 'Briah',
    dayUnlock: 36,
    maxAbnosPerDay: 1,
    research: [
      {
        id: 're_extraction',
        name: 'Re-Extraction',
        description: 'Allows players to vote for re-roll',
        type: 'active',
        cost: { lunacy: 1200, energy: 120 },
        effect: 'Re-extraction available',
        unlocked: false,
      },
      {
        id: 'extraction_endurance',
        name: 'Extraction Protocol Endurance',
        description: 'Replacement for ego restoration, increases extractions pulls, so you can extract 3 times instead of just once',
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
      description: 'Allows you to use many different singularities, but once per day',
      icon: '🔮',
      effect: 'Singularities unlocked',
    },
    coreSuppression: {
      id: 'binah_core',
      name: 'Binah Core Suppression',
      description: 'Unlock Binah\'s singularities by suppressing her core.',
      bossName: 'Binah\'s Singularity',
      bossId: 'binah_singularity',
      reward: 'Binah Suppression Reward',
      rewardDescription: 'Unlock Singularities.',
    },
  },

  // 9. HOKMA – Records Team
  {
    id: 'HOKMA',
    key: 'HOKMA',
    name: 'Records Team',
    title: 'The Wisdom',
    description: 'Limit break and ultimate potential.',
    icon: '🧠',
    emoji: '⏰',
    color: '#2C3E50',
    layer: 'Atziluth',
    dayUnlock: 41,
    maxAbnosPerDay: 1,
    research: [
      {
        id: 'limit_breakers',
        name: 'Limit Breakers',
        description: 'Fortitude, Prudence, Temperance can all go past 120, ego gifts still will ignore any cap',
        type: 'passive',
        cost: { lunacy: 2000, energy: 200 },
        effect: 'Stat caps extended to 130',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'hokma_reward',
      name: "Hokma's Wisdom",
      description: 'Increases stat caps to 130 and allows leveling self to 130 directly also adds the cap limit for justice too.',
      icon: '🧠',
      effect: 'Stat cap 130 + Justice cap',
    },
    coreSuppression: {
      id: 'hokma_core',
      name: 'Hokma Core Suppression',
      description: 'Stats set to 110. Pass to unlock normal 130 cap.',
      bossName: 'Hokma\'s Twilight',
      bossId: 'hokma_twilight',
      reward: 'Unlock 130 stat cap',
      rewardDescription: 'Removes the stat cap and allows leveling to 130.',
    },
  },

  // 10. DA'AT – Managerial Team (non-canon, added for content)
  {
    id: 'DAAT',
    key: 'DAAT',
    name: 'Managerial Team',
    title: 'The Knowledge',
    description: 'Knowledge and ultimate power. (Non-canon department)',
    icon: '🌟',
    emoji: '🌌',
    color: '#FFD700',
    layer: 'Atziluth',
    dayUnlock: 46,
    maxAbnosPerDay: 1,
    research: [
      {
        id: 'today_ordeals',
        name: "Today's Ordeals",
        description: 'Show the ordeals that are going to happen in the management logs.',
        type: 'passive',
        cost: { lunacy: 800, energy: 80 },
        effect: 'Ordeal preview',
        unlocked: false,
      },
      {
        id: 'adrenaline_bullet',
        name: 'Adrenaline Bullet',
        description: 'Speeds up the movement speed of any agent (making it faster for them to go from a department to another)',
        type: 'bullet',
        cost: { lunacy: 1000, energy: 100 },
        effect: 'Movement speed +50%',
        unlocked: false,
      },
      {
        id: 'instability_fix',
        name: 'Instability Fix',
        description: 'Decreases the qliphoth overload for WAW and ALEPH',
        type: 'passive',
        cost: { lunacy: 1500, energy: 150 },
        effect: 'Qliphoth overload -30%',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'daat_reward',
      name: 'Strength Amplification',
      description: 'Allows multiplying a specific agent\'s stat for 2 times, the effect lasts once per meltdown, the agent will also be immune to the corresponding damage type (e.g., fortitude = red)',
      icon: '🌟',
      effect: '2x stat multiplier + damage immunity',
    },
    coreSuppression: {
      id: 'daat_core',
      name: 'Da\'at Core Suppression',
      description: 'Unlock the true power of knowledge.',
      bossName: 'Da\'at\'s Trial',
      bossId: 'daat_trial',
      reward: 'Da\'at Suppression Reward',
      rewardDescription: 'Unlocks Strength Amplification permanently.',
    },
  },

  // 11. KETER – Architecture Team (non-canon but included)
  {
    id: 'KETER',
    key: 'KETER',
    name: 'Architecture Team',
    title: 'The Crown',
    description: 'The final floor. Ultimate power. (Non-canon department)',
    icon: '👑',
    emoji: '👑',
    color: '#E2B4BD',
    layer: 'Atziluth',
    dayUnlock: 51,
    maxAbnosPerDay: 2, // 2 per day as specified
    research: [
      {
        id: 'memory_repository_overclock',
        name: 'Memory Repository Overclock',
        description: 'Allows the player to choose which specific day they want to come back, however with the cost of 1500 lunacy (can change in the future)',
        type: 'active',
        cost: { lunacy: 1500, energy: 150 },
        effect: 'Memory Repository unlocked',
        unlocked: false,
      },
      {
        id: 'department_synergy',
        name: 'Department Synergy',
        description: 'Allows all department buffs apply at the whole facility globally (however with 20% of its original effectiveness, yes it will ignore if you already have buff from X department)',
        type: 'passive',
        cost: { lunacy: 3000, energy: 300 },
        effect: 'Global department synergy (20% effectiveness)',
        unlocked: false,
      },
      {
        id: 'awakening',
        name: 'Awakening',
        description: 'Agents with half of their hp will go into an "awakening mode" (beware: based on the agent\'s main hand weapon, if they go into a too low sp, they\'ll corrode.)',
        type: 'passive',
        cost: { lunacy: 2500, energy: 250 },
        effect: 'Awakening mode below 50% HP',
        unlocked: false,
      },
    ],
    suppressionReward: {
      id: 'keter_reward',
      name: 'Qliphoth Skip Protocol',
      description: 'Allows you to skip one qliphoth meltdown, twice per day. Deployment sync: players can be moved freely between any department slots at the start of each day without losing their assignment day bonuses, however, they\'ll synchronize to the department buffs they were moved to (instead of keeping the previous ones) to avoid overlapping',
      icon: '👑',
      effect: '2x Qliphoth skip per day + Deployment sync',
    },
    coreSuppression: {
      id: 'keter_core',
      name: 'Keter Core Suppression',
      description: 'Face the final crown to unlock the Qliphoth Skip Protocol.',
      bossName: 'Keter\'s Crown',
      bossId: 'keter_crown',
      reward: 'Keter Suppression Reward',
      rewardDescription: 'Unlocks Qliphoth Skip and Deployment Sync.',
    },
  },
];

// ============================================================================
// HELPERS & INDEXES
// ============================================================================

export const DEPARTMENT_RESEARCHES: Record<string, DepartmentResearch> = {};
DEPARTMENTS.forEach((dept) => {
  dept.research.forEach((r) => {
    DEPARTMENT_RESEARCHES[r.id] = r;
  });
});

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

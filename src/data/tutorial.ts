export interface TutorialStep {
  id: string;
  title: string;
  description: string[];
  targetTab?: string;
  nextStep: string | null;
}

// ── Pre-defined sequences for each tab ──
export const TAB_TUTORIALS: Record<string, string[]> = {
  daily: ['daily_unlock_1', 'daily_unlock_2', 'daily_unlock_3'],
  gacha: ['gacha_unlock_1', 'gacha_unlock_2', 'gacha_unlock_3', 'gacha_unlock_4', 'gacha_unlock_5'],
  identities: ['identities_unlock_1', 'identities_unlock_2', 'identities_unlock_3', 'identities_unlock_4', 'identities_unlock_5'],
  weapons: ['weapons_unlock_1', 'weapons_unlock_2', 'weapons_unlock_3'],
  'ego-gifts': ['egogifts_unlock_1', 'egogifts_unlock_2', 'egogifts_unlock_3', 'egogifts_unlock_4'],
  competitive: ['competitive_unlock_1', 'competitive_unlock_2', 'competitive_unlock_3', 'competitive_unlock_4', 'competitive_unlock_5'],
  shardShop: ['shardShop_unlock_1', 'shardShop_unlock_2', 'shardShop_unlock_3', 'shardShop_unlock_4'],
};

export const TUTORIAL_STEPS: Record<string, TutorialStep> = {
  // ═══════════════════════════════════════════════════════════════════════
  // WELCOME & MANAGER LEVEL
  // ═══════════════════════════════════════════════════════════════════════
  welcome: {
    id: 'welcome',
    title: 'WELCOME TO QLIPHOTH',
    description: [
      'You are the Eclipse Bearer, the last hope against the Qliphoth.',
      'Progress through the story, collect powerful identities, and compete in the Competitive Reception.',
      'Your journey begins now. Good luck, Manager.',
    ],
    nextStep: 'manager_level',
  },
  manager_level: {
    id: 'manager_level',
    title: 'MANAGER LEVEL & PROGRESSION',
    description: [
      'Your Manager Level increases as you gain EXP from story chapters, missions, and battles.',
      'Higher levels unlock new features and content. Check the top bar to see your progress.',
      'Some features require a specific Manager Level. Keep leveling up to unlock everything!',
    ],
    nextStep: null, // Set dynamically based on which tabs are unlocked
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DAILY (MISSIONS) – Tab ID: 'daily'
  // ═══════════════════════════════════════════════════════════════════════
  daily_unlock_1: {
    id: 'daily_unlock_1',
    title: 'MISSIONS UNLOCKED!',
    description: [
      'Daily and Weekly tasks are now available in the MISSIONS tab.',
      'Complete tasks to earn Enkephalin, Manager EXP, and valuable materials.',
      'Tasks reset daily and weekly, so check back often!',
    ],
    targetTab: 'daily',
    nextStep: 'daily_unlock_2',
  },
  daily_unlock_2: {
    id: 'daily_unlock_2',
    title: 'DAILY MISSIONS',
    description: [
      'Daily Missions reset every day at midnight.',
      'Each completed mission gives 15 Enkephalin + 30 Manager EXP.',
      'Complete ALL daily missions to earn a bonus 60 Enkephalin!',
    ],
    targetTab: 'daily',
    nextStep: 'daily_unlock_3',
  },
  daily_unlock_3: {
    id: 'daily_unlock_3',
    title: 'WEEKLY MISSIONS',
    description: [
      'Weekly Missions reset every Monday.',
      'Each completed weekly mission gives 250 Enkephalin + 200 Manager EXP.',
      'Complete ALL weekly missions to earn a bonus 1000 Enkephalin!',
      'Weekly missions include: Competitive Reception, Extractions, Level-ups, and more.',
    ],
    targetTab: 'daily',
    nextStep: null,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GACHA (EXTRACTION) – Tab ID: 'gacha'
  // ═══════════════════════════════════════════════════════════════════════
  gacha_unlock_1: {
    id: 'gacha_unlock_1',
    title: 'EXTRACTION UNLOCKED!',
    description: [
      'The EXTRACTION tab is where you pull for new Identities and Weapons.',
      'Use Enkephalin (⚡) for Identity pulls and Weapon Fragments (💠) for Weapon pulls.',
      'You can pull 1 or 10 times at once. 10 pulls are more efficient!',
    ],
    targetTab: 'gacha',
    nextStep: 'gacha_unlock_2',
  },
  gacha_unlock_2: {
    id: 'gacha_unlock_2',
    title: 'BANNER TYPES',
    description: [
      'There are 4 banner types: Standard, Featured, Fate, and Weapon.',
      'STANDARD: Guaranteed SR every 10 pulls. Random SSR pool. Hard pity at 60.',
      'FEATURED: Focused on a single featured identity. 100% SSR rate when you hit SSR. Hard pity at 60.',
      'FATE: Higher base SSR rate (1.5%). Floating guarantee 80-100 pulls. Hard pity at 100.',
      'WEAPON: Target a specific signature weapon. 80/20 rate on SSR. Hard pity at 40.',
    ],
    targetTab: 'gacha',
    nextStep: 'gacha_unlock_3',
  },
  gacha_unlock_3: {
    id: 'gacha_unlock_3',
    title: 'PITY SYSTEM',
    description: [
      'Each banner has a Pity Counter that increases with every pull.',
      'When the pity counter reaches the cap, you are guaranteed an SSR or featured item.',
      'Pity resets when you pull an SSR.',
      'The Fate banner has a floating guarantee that rerolls between 80-100 pulls.',
    ],
    targetTab: 'gacha',
    nextStep: 'gacha_unlock_4',
  },
  gacha_unlock_4: {
    id: 'gacha_unlock_4',
    title: 'SHARDS FROM DUPLICATES',
    description: [
      'When you pull an identity you already own, you earn shards instead.',
      'SSR duplicates: +20 shards. SR duplicates: +8 shards.',
      'Shards are stored in your inventory and can be used to rank up your identities.',
      'You can also use shards to unlock new identities in the Shard Shop!',
    ],
    targetTab: 'gacha',
    nextStep: 'gacha_unlock_5',
  },
  gacha_unlock_5: {
    id: 'gacha_unlock_5',
    title: 'PULLING TIPS',
    description: [
      'Save your resources for the Featured banner when a character you want is available.',
      'The Fate banner has higher rates but also higher pity, so it\'s a gamble.',
      'Weapon banner pulls use Weapon Fragments (💠), which are separate from Enkephalin.',
      'Always check your pity counter before pulling to know when you\'re guaranteed!',
    ],
    targetTab: 'gacha',
    nextStep: null,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // IDENTITIES (MANIFEST) – Tab ID: 'identities'
  // ═══════════════════════════════════════════════════════════════════════
  identities_unlock_1: {
    id: 'identities_unlock_1',
    title: 'IDENTITIES UNLOCKED!',
    description: [
      'The MANIFEST tab allows you to view and upgrade all your owned identities.',
      'Each identity has unique stats, skills, passives, and a class category.',
      'Your identities are the core of your team — level them up to increase their power!',
    ],
    targetTab: 'identities',
    nextStep: 'identities_unlock_2',
  },
  identities_unlock_2: {
    id: 'identities_unlock_2',
    title: 'LEVELING & EXP',
    description: [
      'Level up your identities using EXP Serums (S/M/L/XL).',
      'Each level increases HP, ATK, DEF, and SPD.',
      'You can apply serums individually or use the "Use All" button.',
      'Higher levels require more EXP per level. The cap is Level 65.',
    ],
    targetTab: 'identities',
    nextStep: 'identities_unlock_3',
  },
  identities_unlock_3: {
    id: 'identities_unlock_3',
    title: 'RANK UP SYSTEM',
    description: [
      'Ranking up an identity unlocks powerful passive effects and damage bonuses.',
      'SSR identities can rank up to R8 (8 levels).',
      'Each rank costs shards (SSR: 9→40 shards, SR: 2→12 shards).',
      'Higher ranks unlock better passives and skill damage bonuses.',
      'At R8 (MAX), you can recycle excess shards into Inverse Materials!',
    ],
    targetTab: 'identities',
    nextStep: 'identities_unlock_4',
  },
  identities_unlock_4: {
    id: 'identities_unlock_4',
    title: 'SKILLS & CLASS EFFECTS',
    description: [
      'Each identity has 3 Basic Skills, 1 Ego Skill, and 1 Class Skill.',
      'Basic Skills can be leveled up to 15 using materials and EXP serums.',
      'Ego Skills cost 40 SP and deal massive damage.',
      'Class Skills (Attacker/Tank/Amplifier/Support) provide unique role-based effects.',
      'Example: Attackers deal bonus damage, Tanks shred enemy defense, Supporters heal allies.',
    ],
    targetTab: 'identities',
    nextStep: 'identities_unlock_5',
  },
  identities_unlock_5: {
    id: 'identities_unlock_5',
    title: 'EQUIPPING WEAPONS',
    description: [
      'Each identity can equip one weapon.',
      'Signature weapons provide the best bonuses (ATK + element damage).',
      'SR fallback weapons are also available for each identity.',
      'You can select weapons in the MANIFEST tab under "Weapon Selection".',
      'Equipped weapons are shared across all game modes (Story, Competitive, etc.).',
    ],
    targetTab: 'identities',
    nextStep: null,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // WEAPONS (ARSENAL) – Tab ID: 'weapons'
  // ═══════════════════════════════════════════════════════════════════════
  weapons_unlock_1: {
    id: 'weapons_unlock_1',
    title: 'ARSENAL UNLOCKED!',
    description: [
      'The ARSENAL tab displays all weapons you own.',
      'Weapons provide bonus ATK and stat bonuses to your identities.',
      'Weapons are obtained from the Weapon banner or as rewards.',
    ],
    targetTab: 'weapons',
    nextStep: 'weapons_unlock_2',
  },
  weapons_unlock_2: {
    id: 'weapons_unlock_2',
    title: 'UPGRADING WEAPONS',
    description: [
      'Weapons can be leveled up using Weapon Parts (🔩).',
      'Each level increases ATK and bonus stats.',
      'Weapon cap is Level 35 for SSR and Level 25 for SR.',
      'Higher weapon levels significantly increase your identity\'s Battle Power (BP).',
    ],
    targetTab: 'weapons',
    nextStep: 'weapons_unlock_3',
  },
  weapons_unlock_3: {
    id: 'weapons_unlock_3',
    title: 'SIGNATURE WEAPONS',
    description: [
      'Signature weapons are designed for specific identities.',
      'When equipped to their signature identity, they grant additional bonuses.',
      'The Weapon banner has an 80/20 rate — 80% chance to get the selected signature weapon.',
      'SR fallback weapons are also available for all SSR identities.',
    ],
    targetTab: 'weapons',
    nextStep: null,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // EGO GIFTS (SIGIL RELICS) – Tab ID: 'ego-gifts'
  // ═══════════════════════════════════════════════════════════════════════
  egogifts_unlock_1: {
    id: 'egogifts_unlock_1',
    title: 'SIGIL RELICS UNLOCKED!',
    description: [
      'The SIGIL RELICS tab allows you to purchase and equip Ego Gifts.',
      'Ego Gifts provide bonus stats (HP, ATK, DEF, SPD).',
      'You can equip up to 6 gifts at a time.',
      'Purchasing gifts costs Threads (🧵), which you earn from various activities.',
    ],
    targetTab: 'ego-gifts',
    nextStep: 'egogifts_unlock_2',
  },
  egogifts_unlock_2: {
    id: 'egogifts_unlock_2',
    title: 'SET BONUSES',
    description: [
      'Ego Gifts belong to Sets. Equipping multiple pieces from the same set unlocks bonuses.',
      'Slots 1-4 are for 4-piece sets (e.g., Eclipse Sovereign).',
      'Slots 5-6 are for 2-piece sets (e.g., Vitality, Aggression, Entropy).',
      'Set bonuses include: +15% DMG, increased Crit Rate, healing effects, and more.',
      'Check your active set bonuses in the SIGIL RELICS tab!',
    ],
    targetTab: 'ego-gifts',
    nextStep: 'egogifts_unlock_3',
  },
  egogifts_unlock_3: {
    id: 'egogifts_unlock_3',
    title: 'GIFT LEVELING',
    description: [
      'Ego Gifts can be leveled up using Threads (🧵).',
      'Each level increases the stats provided by the gift.',
      'Max level for gifts is 25.',
      'You can also "Sync" gifts using Sync Enhancement and Sync Serum materials.',
      'Sync level increases the gift\'s effectiveness even further.',
    ],
    targetTab: 'ego-gifts',
    nextStep: 'egogifts_unlock_4',
  },
  egogifts_unlock_4: {
    id: 'egogifts_unlock_4',
    title: 'BUYING GIFTS',
    description: [
      'The Sigil Relics shop has both SR and SSR gifts.',
      'SR gifts cost 800 Threads. SSR gifts cost 2000-3000 Threads.',
      'Signature gifts are designed for specific identities (e.g., Xenon\'s Chaos Sovereign set).',
      'Plan your gift purchases carefully — sets provide the strongest bonuses when completed!',
    ],
    targetTab: 'ego-gifts',
    nextStep: null,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // COMPETITIVE RECEPTION (SEFIROTH ASCENT) – Tab ID: 'competitive'
  // ═══════════════════════════════════════════════════════════════════════
  competitive_unlock_1: {
    id: 'competitive_unlock_1',
    title: 'SEFIROTH ASCENT UNLOCKED!',
    description: [
      'The SEFIROTH ASCENT is a weekly turn-based combat mode.',
      'Each week, 3 elemental zones are available. Each zone has enemies that resist their own element.',
      'Your goal is to achieve the highest score possible by clearing waves.',
      'Scores are saved and contribute to your bracket ranking and points leaderboard.',
    ],
    targetTab: 'competitive',
    nextStep: 'competitive_unlock_2',
  },
  competitive_unlock_2: {
    id: 'competitive_unlock_2',
    title: 'BRACKET SYSTEM',
    description: [
      'Your score determines your Squad tier: Beginner, Amateur, Expert, or Professional.',
      'Each squad has 20 members. Your rank within the squad determines promotion or demotion.',
      'Promotion (Top 3): Move up to the next squad tier.',
      'Defending (Top 4-10): Stay in your current squad.',
      'Demotion (Bottom 10-20): Move down one tier.',
      'Expert → Professional promotion requires 100 Merit.',
    ],
    targetTab: 'competitive',
    nextStep: 'competitive_unlock_3',
  },
  competitive_unlock_3: {
    id: 'competitive_unlock_3',
    title: 'WEEKLY ZONES',
    description: [
      '3 zones are randomly selected each week from 8 elements (Void, Light, Dark, Chaos, Fire, Water, Physical, Spectro).',
      'Enemies in each zone resist their own element, so bring counter-element identities!',
      'Each zone tracks your best score. Clearing all 3 zones grants +1 Reputation.',
      'Reputation can be spent to avoid demotion (Professional excluded).',
    ],
    targetTab: 'competitive',
    nextStep: 'competitive_unlock_4',
  },
  competitive_unlock_4: {
    id: 'competitive_unlock_4',
    title: 'POINTS RANKING',
    description: [
      'Points Ranking shows the top 50 players in your region.',
      'Your personal rank and percentile are displayed based on your total weekly score.',
      'Higher points = better rank. Compete to reach the top!',
      'Points are calculated from all 3 zones combined.',
    ],
    targetTab: 'competitive',
    nextStep: 'competitive_unlock_5',
  },
  competitive_unlock_5: {
    id: 'competitive_unlock_5',
    title: 'REGION LOCK',
    description: [
      'You must choose a region before playing Competitive Reception.',
      'Options: NA (North America), SEA (Southeast Asia), Asia, or AP (Asia-Pacific).',
      '⚠️ REGION CHOICE IS PERMANENT. Choose carefully!',
      'Your region determines your bracket, points ranking, and player pool.',
      'You cannot change your region after selection.',
    ],
    targetTab: 'competitive',
    nextStep: null,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SHARD SHOP – Tab ID: 'shardShop'
  // ═══════════════════════════════════════════════════════════════════════
  shardShop_unlock_1: {
    id: 'shardShop_unlock_1',
    title: 'SHARD SHOP UNLOCKED!',
    description: [
      'The SHARD SHOP allows you to purchase shards for characters using Inverse Materials.',
      'SSR Inverse Materials come from recycling SSR shards (3 per shard).',
      'SR Inverse Materials come from recycling SR shards (1 per shard).',
      'You can also recycle shards from max-rank identities in the MANIFEST tab.',
    ],
    targetTab: 'shardShop',
    nextStep: 'shardShop_unlock_2',
  },
  shardShop_unlock_2: {
    id: 'shardShop_unlock_2',
    title: 'PURCHASING SHARDS',
    description: [
      'SSR Shards cost 30 SSR Inverse Materials each.',
      'SR Shards cost 10 SR Inverse Materials each.',
      'You can purchase a maximum of 20 shards per character.',
      'Characters that are already at max rank (R8) cannot purchase shards — they are marked as "Cannot Purchase".',
    ],
    targetTab: 'shardShop',
    nextStep: 'shardShop_unlock_3',
  },
  shardShop_unlock_3: {
    id: 'shardShop_unlock_3',
    title: 'SHARD RECYCLE',
    description: [
      'In the MANIFEST tab, select a max-rank character (R8).',
      'Click "Shard Recycle" to convert excess shards into Inverse Materials.',
      'SSR Rate: 1 shard → 3 SSR Inverse Materials.',
      'SR Rate: 1 shard → 1 SR Inverse Material.',
      'This is the only way to obtain Inverse Materials for the Shard Shop.',
    ],
    targetTab: 'shardShop',
    nextStep: 'shardShop_unlock_4',
  },
  shardShop_unlock_4: {
    id: 'shardShop_unlock_4',
    title: 'UNLOCKING CHARACTERS WITH SHARDS',
    description: [
      'You can unlock new characters using shards from the Shard Shop.',
      'SSR characters require 70 shards to unlock.',
      'SR characters require 50 shards to unlock.',
      'This is a great way to get characters without relying entirely on gacha luck!',
      'Check the Shard Shop regularly to see which characters you can unlock.',
    ],
    targetTab: 'shardShop',
    nextStep: null,
  },
};

// ── Helpers ──
export function getFirstTutorialStep(tabKey: string): string | null {
  const steps = TAB_TUTORIALS[tabKey];
  return steps ? steps[0] : null;
}

export function getTutorialStep(id: string): TutorialStep | null {
  return TUTORIAL_STEPS[id] || null;
}

export function getNextStepId(currentStepId: string): string | null {
  const step = TUTORIAL_STEPS[currentStepId];
  return step ? step.nextStep : null;
}

export function tabHasTutorial(tabKey: string): boolean {
  return !!TAB_TUTORIALS[tabKey];
}

export function getTabTutorialSteps(tabKey: string): string[] {
  return TAB_TUTORIALS[tabKey] || [];
}
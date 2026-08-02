// src/data/ordealsData.ts
// Complete ordeals data from dawn_ordeal.js, noon_ordeal.js, dusk_ordeal.js,
// midnight_ordeal.js, and special_ordeals.js
// No omissions – all ordeals included.

export interface OrdealSkill {
  name: string;
  damageType: string;
  basePower: number;
  coinPower: number;
  coins: number;
  description?: string;
  isAoe?: boolean;
  isSpecial?: boolean;
  isHealing?: boolean;
  isDefenseSkill?: boolean;
  isRanged?: boolean;
  range?: string;
  slow?: boolean;
  minDamage?: number;
  maxDamage?: number;
  finalDamage?: number;
  special?: string;
  condition?: string;
  requiredLowHp?: boolean;
  isOnSpawn?: boolean;
  damageComponents?: { red?: number; white?: number; black?: number; pale?: number };
}

export interface OrdealResistances {
  red: number;
  white: number;
  black: number;
  pale: number;
}

export interface OrdealEnemy {
  id?: string;
  name: string;
  risk?: string;
  hp: number;
  maxHp: number;
  damageType: string;
  resistances: OrdealResistances;
  skills: OrdealSkill[];
  isBoss?: boolean;
  currentHp?: number;
  specialMechanics?: any;
  onDeathMessage?: string;
  description?: string;
  movementSpeed?: number;
  emoji?: string;
  ordealLevel?: string;
  color?: string;
  minDay?: number;
  maxDay?: number;
  isMultiEnemy?: boolean;
  enemyCount?: number;
  enemies?: OrdealEnemy[];
  spawnOnDeath?: boolean;
  spawnId?: string;
  fragmentCount?: number;
  fragmentHp?: number;
  explodesOnDeath?: boolean;
  explosionDamage?: number;
  explosionDamageType?: string;
  explosionRange?: string;
  packBehavior?: boolean;
  packBonusDamage?: number;
  packSize?: number;
  howlOnDeath?: boolean;
  adaptsToDamage?: boolean;
  adaptationResistanceBonus?: number;
  lowersQliphoth?: boolean;
  qliphothDecreaseRange?: string;
  qliphothDecreaseAmount?: number;
  teleportsBetweenDepartments?: boolean;
  teleportCooldown?: number;
  canConsumeCorpses?: boolean;
  healOnConsume?: number | 'full';
  respawnsAfterDeath?: boolean;
  respawnDelay?: number;
  respawnLimit?: number;
  groupSize?: number;
  isFactory?: boolean;
  spawnInterval?: number;
  spawnsPerCycle?: number;
  maxSpawned?: number;
  spawnMessage?: string;
  enragesBelowHpPercent?: number;
  enrageDamageBonus?: number;
  enrageSpeedBonus?: number;
  globalDamage?: boolean;
  globalDamageAmount?: number;
  globalDamageType?: string;
  globalDamageInterval?: number;
  isTower?: boolean;
  laserRotationTime?: number;
  laserDamage?: any;
  laserDamageType?: string;
  targetsRandomDepartments?: boolean;
  damageReductionWhileSpinning?: number;
  secondaryLasers?: number;
  isProphet?: boolean;
  qliphothReductionInterval?: number;
  qliphothReductionAmount?: number;
  allMustDie?: boolean;
  fixerTeam?: boolean;
  isMultiWave?: boolean;
  isDynamic?: boolean;
  waves?: any[];
  onDeathEffect?: string;
  onDeathEnergyReward?: number;
  onDeathSpawnId?: string;
  onDeathSpawnCount?: number;
}

// ─── Helper functions ──────────────────────────────────────────────────

function skill(s: any): OrdealSkill {
  return {
    name: s.name,
    damageType: s.damageType,
    basePower: s.basePower,
    coinPower: s.coinPower,
    coins: s.coins,
    description: s.description,
    isAoe: s.isAoe,
    isSpecial: s.isSpecial,
    isHealing: s.isHealing,
    isDefenseSkill: s.isDefenseSkill,
    isRanged: s.isRanged,
    range: s.range,
    slow: s.slow,
    minDamage: s.minDamage,
    maxDamage: s.maxDamage,
    finalDamage: s.finalDamage,
    special: s.special,
    condition: s.condition,
    requiredLowHp: s.requiredLowHp,
    isOnSpawn: s.isOnSpawn,
    damageComponents: s.damageComponents,
  };
}

function res(r: any): OrdealResistances {
  return {
    red: r.red ?? 1.0,
    white: r.white ?? 1.0,
    black: r.black ?? 1.0,
    pale: r.pale ?? 1.0,
  };
}

// ============================================================================
// DAWN ORDEALS
// ============================================================================

// Amber Dawn
export const AMBER_DAWN: OrdealEnemy = {
  id: 'amber_dawn',
  name: 'The Perfect Food',
  risk: 'TETH',
  ordealLevel: 'dawn',
  color: 'AMBER',
  emoji: '🪱',
  hp: 50,
  maxHp: 50,
  movementSpeed: 30,
  damageType: 'red',
  resistances: res({ red: 2.0, white: 1.0, black: 1.0, pale: 2.0 }),
  skills: [
    skill({ name: 'Leaping Bite', damageType: 'red', basePower: 8, coinPower: 2, coins: 2, description: 'Leaps and bites for 8-12 Red damage' }),
    skill({ name: 'Burrow Emergence', damageType: 'red', basePower: 6, coinPower: 1, coins: 2, description: 'Emerges from underground, dealing 6-8 Red damage' }),
  ],
  specialMechanics: { spawnOnDeath: true, spawnId: 'amber_fragment', fragmentCount: 2, fragmentHp: 25, onDeathEffect: 'spawn_fragments' },
  onDeathMessage: '🪱 The Amber Worm dissolves into two smaller fragments!',
  description: 'Amber-colored worms that multiply when killed. They swarm and overwhelm employees with continuous Red Damage.',
};

export const AMBER_FRAGMENT: OrdealEnemy = {
  id: 'amber_fragment',
  name: 'Amber Fragment',
  risk: 'ZAYIN',
  ordealLevel: 'dawn',
  color: 'AMBER',
  hp: 25,
  maxHp: 25,
  movementSpeed: 20,
  damageType: 'red',
  resistances: res({ red: 2.0, white: 1.0, black: 1.0, pale: 2.0 }),
  skills: [skill({ name: 'Nibble', damageType: 'red', basePower: 4, coinPower: 1, coins: 2, description: 'A weak nibble dealing 4-6 Red damage' })],
  specialMechanics: { isFragment: true, parentId: 'amber_dawn' },
  onDeathMessage: '🪱 The Amber Fragment crumbles away.',
  description: 'A small fragment of the Amber Worm.',
};

// Crimson Dawn
export const CRIMSON_DAWN: OrdealEnemy = {
  id: 'crimson_dawn',
  name: 'Cheers for the Beginning',
  risk: 'TETH',
  ordealLevel: 'dawn',
  color: 'CRIMSON',
  emoji: '🤡',
  hp: 40,
  maxHp: 40,
  movementSpeed: 35,
  damageType: 'white',
  resistances: res({ red: 0.8, white: 1.3, black: 1.3, pale: 2.0 }),
  skills: [
    skill({ name: 'Prank', damageType: 'white', basePower: 6, coinPower: 2, coins: 1, description: 'A playful attack dealing 6-8 White damage' }),
    skill({ name: 'Confetti Explosion', damageType: 'white', basePower: 4, coinPower: 2, coins: 1, description: 'Throws explosive confetti dealing 4-6 White damage' }),
  ],
  specialMechanics: { explodesOnDeath: true, explosionDamage: 15, explosionDamageType: 'white', explosionRange: 'nearby' },
  onDeathMessage: '💥 The Crimson Clown explodes in a shower of confetti! Everyone nearby takes 15 White damage!',
  description: 'A festive clown that brings chaos. EXPLODES upon death dealing White damage to nearby employees.',
};

// Green Dawn
export const GREEN_DAWN: OrdealEnemy = {
  id: 'green_dawn',
  name: 'Doubt',
  risk: 'TETH',
  ordealLevel: 'dawn',
  color: 'GREEN',
  emoji: '🤖',
  hp: 60,
  maxHp: 60,
  movementSpeed: 25,
  damageType: 'black',
  resistances: res({ red: 0.8, white: 1.3, black: 2.0, pale: 1.0 }),
  skills: [
    skill({ name: 'Lance Thrust', damageType: 'black', basePower: 10, coinPower: 2, coins: 2, description: 'A piercing thrust dealing 10-14 Black damage' }),
    skill({ name: 'Overkill Execution', damageType: 'black', basePower: 15, coinPower: 0, coins: 1, description: 'Deals 15 Black damage to low HP targets' }),
  ],
  specialMechanics: { executesBelowHpPercent: 0.2, executionDamage: 15, executionDamageType: 'black' },
  onDeathMessage: '🤖 Doubt shuts down permanently.',
  description: 'A mechanical robot with a lance. Focuses on precise Black damage attacks.',
};

// Violet Dawn
export const VIOLET_DAWN: OrdealEnemy = {
  id: 'violet_dawn',
  name: 'The Fruit of Understanding',
  risk: 'TETH',
  ordealLevel: 'dawn',
  color: 'VIOLET',
  emoji: '🕯️',
  hp: 45,
  maxHp: 45,
  movementSpeed: 20,
  damageType: 'pale',
  resistances: res({ red: 1.0, white: 1.5, black: 1.0, pale: 1.0 }),
  skills: [
    skill({ name: 'Tendril Whip', damageType: 'pale', basePower: 7, coinPower: 2, coins: 1, description: 'Whips with a tendril dealing 7-9 Pale damage' }),
    skill({ name: 'Pollen Cloud', damageType: 'pale', basePower: 5, coinPower: 1, coins: 1, description: 'Releases a cloud of pollen dealing 5-6 Pale damage' }),
  ],
  specialMechanics: { lowersQliphoth: true, qliphothDecreaseRange: 'nearby', qliphothDecreaseAmount: 1 },
  onDeathMessage: '🕯️ The Fruit of Understanding withers away.',
  description: 'A fruit that seeks understanding. LOWERS Qliphoth counters of nearby abnormalities.',
};

// Dawn Ordeal Collection
export const DAWN_ORDEAL_ENEMIES: OrdealEnemy[] = [AMBER_DAWN, CRIMSON_DAWN, GREEN_DAWN, VIOLET_DAWN];

export const DAWN_ORDEAL = {
  id: 'dawn_ordeal',
  name: 'Dawn Ordeal',
  risk: 'TETH',
  ordealLevel: 'dawn',
  isMultiWave: true,
  isDynamic: true,
  waves: DAWN_ORDEAL_ENEMIES.map(e => ({ ...e, currentHp: e.hp })),
  description: 'The first light brings forth lesser threats. Occurs at Qliphoth Meltdown Level 2.',
  getRandomEnemy: function() {
    const randomIndex = Math.floor(Math.random() * DAWN_ORDEAL_ENEMIES.length);
    return { ...DAWN_ORDEAL_ENEMIES[randomIndex], currentHp: DAWN_ORDEAL_ENEMIES[randomIndex].hp };
  },
  getAllEnemies: function() {
    return DAWN_ORDEAL_ENEMIES.map(e => ({ ...e, currentHp: e.hp }));
  },
};

// ============================================================================
// NOON ORDEALS
// ============================================================================

// Amber Noon – Queen Bee
export const AMBER_NOON: OrdealEnemy = {
  id: 'amber_noon',
  name: 'The Food Chain',
  risk: 'HE',
  ordealLevel: 'noon',
  color: 'AMBER',
  emoji: '🪱👑',
  hp: 150,
  maxHp: 150,
  movementSpeed: 35,
  damageType: 'black',
  resistances: res({ red: 1.2, white: 0.8, black: 0.5, pale: 2.0 }),
  skills: [
    skill({ name: 'Gorge', damageType: 'black', basePower: 15, coinPower: 5, coins: 2, description: 'Devours a target for 15-20 Black damage' }),
    skill({ name: 'Tunnel Rush', damageType: 'red', basePower: 12, coinPower: 4, coins: 3, description: 'Charges through the facility for 12-16 Red damage per hit' }),
    skill({ name: 'Consume Corpse', damageType: 'none', basePower: 0, coinPower: 0, coins: 0, isHealing: true, condition: 'nearby_corpse', description: 'Consumes a nearby corpse to heal 50 HP' }),
  ],
  specialMechanics: {
    spawnsOnDeath: { id: 'amber_dawn', count: 2 },
    consumesCorpses: true,
    healOnConsume: 50,
    enragesBelowHpPercent: 0.3,
    enrageDamageBonus: 1.5,
  },
  onDeathMessage: '🪱 The Queen Bee falls. Smaller worms scatter from her corpse!',
  onDeathEffect: 'spawn_fragments',
  onDeathSpawnId: 'amber_dawn',
  onDeathSpawnCount: 2,
  description: 'The Queen Bee commands her swarm of Amber worms.',
};

// Crimson Noon – Crimson Beast
export const CRIMSON_NOON: OrdealEnemy = {
  id: 'crimson_noon',
  name: 'Crimson Beast',
  risk: 'HE',
  ordealLevel: 'noon',
  color: 'CRIMSON',
  emoji: '🐺',
  hp: 120,
  maxHp: 120,
  movementSpeed: 45,
  damageType: 'red',
  resistances: res({ red: 0.5, white: 1.2, black: 1.2, pale: 1.5 }),
  skills: [
    skill({ name: 'Gnashing Bite', damageType: 'red', basePower: 4, coinPower: 4, coins: 1, description: 'Vicious bite attack dealing 4-8 Red damage' }),
    skill({ name: 'Stinging Tail', damageType: 'red', basePower: 7, coinPower: 2, coins: 1, description: 'Tail strike dealing 7-9 Red damage' }),
    skill({ name: 'Pack Howl', damageType: 'white', basePower: 10, coinPower: 3, coins: 1, isSpecial: true, description: 'Howls, boosting nearby allies\' damage by 20%' }),
    skill({ name: 'Blood Frenzy', damageType: 'red', basePower: 6, coinPower: 2, coins: 3, description: 'A flurry of attacks dealing 6-8 Red damage per hit' }),
  ],
  specialMechanics: {
    spawnsOnDeath: { id: 'crimson_dawn', count: 3 },
    packBehavior: true,
    packBonusDamage: 1.2,
    packSize: 3,
    howlOnDeath: true,
  },
  onDeathMessage: '🐺 The Crimson Beast falls, but its pack grows enraged!',
  onDeathEffect: 'enrage_nearby',
  description: 'A beast that hunts with its pack. Grows stronger together.',
};

// Green Noon – Processing Unit
export const GREEN_NOON: OrdealEnemy = {
  id: 'green_noon',
  name: 'Processing Unit',
  risk: 'HE',
  ordealLevel: 'noon',
  color: 'GREEN',
  emoji: '⚙️',
  hp: 180,
  maxHp: 180,
  movementSpeed: 25,
  damageType: 'red',
  resistances: res({ red: 0.8, white: 1.3, black: 2.0, pale: 1.0 }),
  skills: [
    skill({ name: 'Saw Barrage', damageType: 'red', basePower: 1, coinPower: 1, coins: 9, description: 'Multiple saw attacks dealing 1-2 Red damage per hit' }),
    skill({ name: 'Gun Line', damageType: 'red', basePower: 1, coinPower: 0, coins: 1, isRanged: true, description: 'Ranged gun attack dealing 1-15 Red damage' }),
    skill({ name: 'Adaptive Analysis', damageType: 'white', basePower: 0, coinPower: 0, coins: 0, isDefenseSkill: true, description: 'Analyzes the last damage type, gaining resistance to it' }),
  ],
  specialMechanics: { adaptsToDamage: true, adaptationResistanceBonus: 0.3 },
  onDeathMessage: '⚙️ The Processing Unit shuts down permanently.',
  onDeathEffect: 'none',
  description: 'A mechanical unit that analyzes and adapts to damage types.',
};

// Violet Noon – The Idol
export const VIOLET_NOON: OrdealEnemy = {
  id: 'violet_noon',
  name: 'The Idol',
  risk: 'HE',
  ordealLevel: 'noon',
  color: 'VIOLET',
  emoji: '🕯️',
  hp: 130,
  maxHp: 130,
  movementSpeed: 20,
  damageType: 'red',
  resistances: res({ red: 0.8, white: 2.0, black: 0.8, pale: 1.0 }),
  skills: [
    skill({ name: 'Falling Impact', damageType: 'red', basePower: 100, coinPower: 0, coins: 1, isOnSpawn: true, description: 'Massive slam on spawn dealing 100 Red damage' }),
    skill({ name: 'Devotion Pulse', damageType: 'white', basePower: 12, coinPower: 3, coins: 2, description: 'A pulse of devotion deals 12-15 White damage' }),
  ],
  specialMechanics: {
    lowersRandomQliphoth: 1,
    teleportsBetweenDepartments: true,
    teleportCooldown: 20,
  },
  onDeathMessage: '🕯️ The Idol crumbles, its influence fading.',
  onDeathEffect: 'none',
  description: 'A strange idol that demands worship and lowers Qliphoth counters.',
};

// Indigo Noon – Sweepers
export const INDIGO_NOON_SWEEPER: OrdealEnemy = {
  id: 'indigo_noon_sweeper',
  name: 'Sweeper',
  risk: 'HE',
  ordealLevel: 'noon',
  color: 'INDIGO',
  emoji: '🧹',
  hp: 100,
  maxHp: 100,
  movementSpeed: 30,
  damageType: 'black',
  resistances: res({ red: 1.0, white: 1.2, black: 0.5, pale: 0.8 }),
  skills: [
    skill({ name: 'Hook Slash', damageType: 'black', basePower: 4, coinPower: 1, coins: 1, description: 'Hook attack dealing 4-5 Black damage' }),
    skill({ name: 'Corpse Cleanup', damageType: 'none', basePower: 0, coinPower: 0, coins: 0, isHealing: true, condition: 'nearby_corpse', description: 'Consumes a corpse to fully heal' }),
  ],
  specialMechanics: {
    canConsumeCorpses: true,
    healOnConsume: 'full',
    respawnsAfterDeath: true,
    respawnDelay: 30,
    respawnLimit: 3,
  },
  onDeathMessage: '🧹 The Sweeper dissolves into black liquid... but will it return?',
  onDeathEffect: 'respawn_after_delay',
  description: 'A cyborg cleaner that consumes corpses to heal and respawns unless fully dealt with.',
};

export const INDIGO_NOON: OrdealEnemy = {
  id: 'indigo_noon',
  name: 'The Sweepers',
  risk: 'HE',
  ordealLevel: 'noon',
  color: 'INDIGO',
  emoji: '🧹🧹🧹',
  isMultiEnemy: true,
  enemyCount: 3,
  hp: 100,
  maxHp: 100,
  movementSpeed: 30,
  damageType: 'black',
  resistances: res({ red: 1.0, white: 1.2, black: 0.5, pale: 0.8 }),
  skills: [
    skill({ name: 'Hook Slash', damageType: 'black', basePower: 4, coinPower: 1, coins: 1, description: 'Hook attack dealing 4-5 Black damage' }),
    skill({ name: 'Corpse Cleanup', damageType: 'none', basePower: 0, coinPower: 0, coins: 0, isHealing: true, condition: 'nearby_corpse', description: 'Consumes a corpse to fully heal' }),
  ],
  specialMechanics: {
    groupSize: 3,
    canConsumeCorpses: true,
    respawnsAfterDeath: true,
    respawnDelay: 30,
    respawnLimit: 3,
  },
  onDeathMessage: '🧹 All Sweepers have been cleaned up. The facility is safe... for now.',
  description: 'A group of Sweepers that work together to "clean" the facility.',
};

// Noon Ordeal Collection
export const NOON_ORDEAL_ENEMIES: OrdealEnemy[] = [AMBER_NOON, CRIMSON_NOON, GREEN_NOON, VIOLET_NOON, INDIGO_NOON];

export const NOON_ORDEAL = {
  id: 'noon_ordeal',
  name: 'Noon Ordeal',
  risk: 'HE',
  ordealLevel: 'noon',
  isMultiWave: true,
  isDynamic: true,
  waves: NOON_ORDEAL_ENEMIES,
  description: 'The facility shakes as greater threats emerge.',
  getRandomEnemy: function() {
    const randomIndex = Math.floor(Math.random() * NOON_ORDEAL_ENEMIES.length);
    return NOON_ORDEAL_ENEMIES[randomIndex];
  },
  getAllEnemies: function() {
    return [...NOON_ORDEAL_ENEMIES];
  },
};

// ============================================================================
// DUSK ORDEALS
// ============================================================================

// Amber Dusk – The Eternal Meal
export const AMBER_DUSK: OrdealEnemy = {
  id: 'amber_dusk',
  name: 'The Eternal Meal',
  risk: 'WAW',
  ordealLevel: 'dusk',
  color: 'AMBER',
  emoji: '🪱👑',
  hp: 500,
  maxHp: 500,
  movementSpeed: 30,
  damageType: 'red',
  minDay: 15,
  resistances: res({ red: 1.2, white: 0.8, black: 0.5, pale: 2.0 }),
  skills: [
    skill({ name: 'Devouring Maw', damageType: 'red', basePower: 50, coinPower: 20, coins: 1, description: 'Consumes a target for 50-70 Red damage' }),
    skill({ name: 'Eternal Feast', damageType: 'red', basePower: 30, coinPower: 10, coins: 2, description: 'Deals 30-40 Red damage to all nearby targets' }),
    skill({ name: 'Spawn Brood', damageType: 'none', basePower: 0, coinPower: 0, coins: 0, isSpecial: true, description: 'Spawns additional worms' }),
  ],
  specialMechanics: {
    spawnInterval: 15,
    spawnsPerCycle: 2,
    maxSpawned: 6,
    spawnId: 'amber_noon',
    spawnMessage: '🪱 The Eternal Meal spawns more worms!',
    enragesBelowHpPercent: 0.3,
    enrageDamageBonus: 1.5,
    phases: [
      { hpPercent: 0.7, trigger: 'rage', message: '💢 The Eternal Meal becomes enraged!', damageBonus: 1.5 },
      { hpPercent: 0.3, trigger: 'desperate', message: '⚠️ The Eternal Meal desperately spawns more minions!', spawnRate: 'double' },
    ],
  },
  onDeathMessage: '🪱💀 The Eternal Meal collapses, its endless hunger finally satiated.',
  description: 'A massive worm that never stops eating and constantly spawns minions. Deals heavy Red damage. Appears Days 15-45.',
};

// Crimson Dusk – The Struggle at the Climax
export const CRIMSON_DUSK: OrdealEnemy = {
  id: 'crimson_dusk',
  name: 'The Struggle at the Climax',
  risk: 'WAW',
  ordealLevel: 'dusk',
  color: 'CRIMSON',
  emoji: '🐉',
  hp: 450,
  maxHp: 450,
  movementSpeed: 40,
  damageType: 'white',
  minDay: 15,
  resistances: res({ red: 0.6, white: 0.8, black: 0.8, pale: 1.5 }),
  skills: [
    skill({ name: 'Rolling Crush', damageType: 'white', basePower: 20, coinPower: 5, coins: 1, description: 'Rolls over targets, dealing 20-25 White damage' }),
    skill({ name: 'Claw Swipe', damageType: 'white', basePower: 12, coinPower: 3, coins: 2, description: 'Swipes with claws twice, dealing 12-15 White damage each' }),
    skill({ name: 'Charged Slam', damageType: 'white', basePower: 30, coinPower: 10, coins: 1, isSpecial: true, description: 'Charges up and slams for 30-40 White damage' }),
    skill({ name: 'Crimson Roar', damageType: 'white', basePower: 20, coinPower: 5, coins: 2, description: 'A terrifying roar dealing 20-25 White damage to all nearby' }),
  ],
  specialMechanics: {
    explodesOnDeath: true,
    explosionDamage: 50,
    explosionDamageType: 'white',
    explosionRange: 'large',
    enragesBelowHpPercent: 0.3,
    enrageDamageBonus: 2.0,
    phases: [
      { hpPercent: 0.66, trigger: 'phase2', message: '🐉 The Crimson Titan roars with fury!', damageBonus: 1.5 },
      { hpPercent: 0.33, trigger: 'phase3', message: '💀 The Crimson Titan enters a blood frenzy!', damageBonus: 2.0 },
    ],
  },
  onDeathMessage: '💥 The Crimson Titan explodes in a massive blast! Everyone nearby takes 50 White damage!',
  description: 'The ultimate beast that tests your combat prowess. EXPLODES upon death dealing massive White damage. Appears Days 15-45.',
};

// Green Dusk – Where We Must Reach
export const GREEN_DUSK: OrdealEnemy = {
  id: 'green_dusk',
  name: 'Where We Must Reach',
  risk: 'WAW',
  ordealLevel: 'dusk',
  color: 'GREEN',
  emoji: '🏭',
  hp: 400,
  maxHp: 400,
  movementSpeed: 0,
  damageType: 'black',
  minDay: 15,
  resistances: res({ red: 0.8, white: 1.0, black: 2.0, pale: 1.0 }),
  skills: [
    skill({ name: 'Assembly Line', damageType: 'black', basePower: 22, coinPower: 6, coins: 4, description: 'Multiple assembly arms attack, dealing 22-28 Black damage per hit' }),
    skill({ name: 'Mass Discharge', damageType: 'black', basePower: 25, coinPower: 7, coins: 3, description: 'Electrical discharge deals 25-32 Black damage in a wide area' }),
    skill({ name: 'Core Meltdown', damageType: 'black', basePower: 32, coinPower: 9, coins: 2, description: 'Core overload deals 32-41 Black damage to all nearby' }),
  ],
  specialMechanics: {
    isFactory: true,
    spawnInterval: 45,
    spawnsPerCycle: 3,
    maxSpawned: 15,
    spawnMessage: '🏭 The Green Factory produces more robots!',
    spawnId: 'green_noon',
    phases: [
      { hpPercent: 0.66, trigger: 'accelerate', message: '⚙️ The Green Factory accelerates production!', spawnRate: 1.5, spawnInterval: 30 },
      { hpPercent: 0.33, trigger: 'overdrive', message: '⚠️ The Green Factory enters OVERDRIVE!', spawnRate: 2.0, damageBonus: 1.5, spawnInterval: 20 },
    ],
  },
  onDeathMessage: '🏭💀 The Green Factory grinds to a halt. Its production ceases forever.',
  description: 'A factory that produces endless mechanical enemies. Deals Black damage. Appears Days 15-45.',
};

// Violet Dusk – The Prophet of the End
export const VIOLET_DUSK: OrdealEnemy = {
  id: 'violet_dusk',
  name: 'The Prophet of the End',
  risk: 'WAW',
  ordealLevel: 'dusk',
  color: 'VIOLET',
  emoji: '🕯️🔮',
  hp: 350,
  maxHp: 350,
  movementSpeed: 25,
  damageType: 'pale',
  minDay: 15,
  resistances: res({ red: 1.0, white: 0.5, black: 0.5, pale: 1.2 }),
  skills: [
    skill({ name: 'Prophetic Vision', damageType: 'pale', basePower: 15, coinPower: 4, coins: 2, description: 'Reveals visions of despair dealing 15-19 Pale damage' }),
    skill({ name: 'End Prophecy', damageType: 'pale', basePower: 18, coinPower: 5, coins: 2, description: 'Prophecy of the end dealing 18-23 Pale damage' }),
    skill({ name: 'Qliphoth Curse', damageType: 'pale', basePower: 10, coinPower: 2, coins: 1, isSpecial: true, description: 'Lowers Qliphoth counter of a random abnormality by 1' }),
  ],
  specialMechanics: {
    isProphet: true,
    lowersQliphoth: true,
    qliphothReductionInterval: 25,
    qliphothReductionAmount: 1,
    qliphothDecreaseRange: 'global',
    phases: [
      { hpPercent: 0.66, trigger: 'revelation', message: '🔮 The Prophet receives a revelation! Qliphoth counters lower more frequently!', qliphothInterval: 15 },
      { hpPercent: 0.33, trigger: 'apocalypse', message: '⚠️ THE APOCALYPSE PROPHECY BEGINS!', qliphothInterval: 10, damageBonus: 1.5 },
    ],
  },
  onDeathMessage: '🔮💀 The Prophet crumbles to dust, its final prophecy unfulfilled.',
  description: 'A prophet that LOWERS Qliphoth counters across the entire facility. Deals Pale damage. Appears Days 15-45.',
};

// White Dusk – The Fixers (Days 46-49)
export const WHITE_DUSK_FIXERS = {
  red: {
    id: 'white_dusk_fixer_red',
    name: 'Red Fixer',
    risk: 'ALEPH',
    ordealLevel: 'dusk',
    color: 'WHITE',
    emoji: '🔴👤',
    hp: 400,
    maxHp: 400,
    damageType: 'red',
    resistances: res({ red: 0.5, white: 1.0, black: 1.0, pale: 1.0 }),
    skills: [
      skill({ name: 'Blade Slash', damageType: 'red', basePower: 25, coinPower: 5, coins: 2, description: 'Slash with a blade for 25-30 Red damage' }),
      skill({ name: 'Execution', damageType: 'red', basePower: 40, coinPower: 10, coins: 1, description: 'A lethal strike for 40-50 Red damage' }),
    ],
  },
  white: {
    id: 'white_dusk_fixer_white',
    name: 'White Fixer',
    risk: 'ALEPH',
    ordealLevel: 'dusk',
    color: 'WHITE',
    emoji: '⚪👤',
    hp: 400,
    maxHp: 400,
    damageType: 'white',
    resistances: res({ red: 1.0, white: 0.5, black: 1.0, pale: 1.0 }),
    skills: [
      skill({ name: 'Mind Break', damageType: 'white', basePower: 22, coinPower: 5, coins: 2, description: 'Deals 22-27 White damage' }),
      skill({ name: 'Sanity Drain', damageType: 'white', basePower: 35, coinPower: 8, coins: 1, description: 'Drains sanity for 35-43 White damage' }),
    ],
  },
  black: {
    id: 'white_dusk_fixer_black',
    name: 'Black Fixer',
    risk: 'ALEPH',
    ordealLevel: 'dusk',
    color: 'WHITE',
    emoji: '⚫👤',
    hp: 400,
    maxHp: 400,
    damageType: 'black',
    resistances: res({ red: 1.0, white: 1.0, black: 0.5, pale: 1.0 }),
    skills: [
      skill({ name: 'Shadow Strike', damageType: 'black', basePower: 20, coinPower: 4, coins: 3, description: 'Shadowy strikes for 20-24 Black damage' }),
      skill({ name: 'Dark Eruption', damageType: 'black', basePower: 38, coinPower: 9, coins: 1, description: 'Erupts with dark energy for 38-47 Black damage' }),
    ],
  },
  pale: {
    id: 'white_dusk_fixer_pale',
    name: 'Pale Fixer',
    risk: 'ALEPH',
    ordealLevel: 'dusk',
    color: 'WHITE',
    emoji: '⚪👤',
    hp: 400,
    maxHp: 400,
    damageType: 'pale',
    resistances: res({ red: 1.0, white: 1.0, black: 1.0, pale: 0.5 }),
    skills: [
      skill({ name: 'Pale Touch', damageType: 'pale', basePower: 18, coinPower: 4, coins: 2, description: 'A pale touch for 18-22 Pale damage' }),
      skill({ name: 'Oblivion', damageType: 'pale', basePower: 42, coinPower: 10, coins: 1, description: 'A glimpse of oblivion for 42-52 Pale damage' }),
    ],
  },
};

export const WHITE_DUSK: OrdealEnemy = {
  id: 'white_dusk',
  name: 'The Fixers',
  risk: 'ALEPH',
  ordealLevel: 'dusk',
  color: 'WHITE',
  emoji: '👤👤👤👤',
  hp: 400,
  maxHp: 400,
  minDay: 46,
  maxDay: 49,
  isMultiEnemy: true,
  enemyCount: 4,
  damageType: 'mixed',
  resistances: res({ red: 1.0, white: 1.0, black: 1.0, pale: 1.0 }),
  enemies: [
    { ...WHITE_DUSK_FIXERS.red, currentHp: WHITE_DUSK_FIXERS.red.hp },
    { ...WHITE_DUSK_FIXERS.white, currentHp: WHITE_DUSK_FIXERS.white.hp },
    { ...WHITE_DUSK_FIXERS.black, currentHp: WHITE_DUSK_FIXERS.black.hp },
    { ...WHITE_DUSK_FIXERS.pale, currentHp: WHITE_DUSK_FIXERS.pale.hp },
  ],
  specialMechanics: { allMustDie: true, fixerTeam: true },
  onDeathMessage: '👤💀 All Fixers have been eliminated. The Head\'s agents are no more.',
  description: 'Four Fixers appear to eliminate the facility. Only appears on Days 46-49.',
};

// Dusk Ordeal Collection
export const DUSK_ORDEAL_ENEMIES: OrdealEnemy[] = [AMBER_DUSK, CRIMSON_DUSK, GREEN_DUSK, VIOLET_DUSK, WHITE_DUSK];

export const DUSK_ORDEAL = {
  id: 'dusk_ordeal',
  name: 'Dusk Ordeal',
  risk: 'WAW',
  ordealLevel: 'dusk',
  isMultiWave: true,
  isDynamic: true,
  waves: DUSK_ORDEAL_ENEMIES.map(e => ({ ...e, currentHp: e.hp })),
  description: 'Twilight falls, and the facility shakes with power. Occurs at Qliphoth Meltdown Level 6.',
  getRandomEnemy: function(day: number = 1) {
    let availableEnemies = [...DUSK_ORDEAL_ENEMIES];
    if (day < 46) {
      availableEnemies = availableEnemies.filter(e => e.color !== 'WHITE');
    } else {
      availableEnemies = availableEnemies.filter(e => e.color === 'WHITE');
    }
    const randomIndex = Math.floor(Math.random() * availableEnemies.length);
    const enemy = availableEnemies[randomIndex];
    if (enemy.isMultiEnemy && enemy.enemies) {
      return {
        ...enemy,
        enemies: enemy.enemies.map(e => ({ ...e, currentHp: e.hp })),
        currentHp: enemy.hp,
      };
    }
    return { ...enemy, currentHp: enemy.hp };
  },
  getAllEnemies: function(day: number = 1) {
    if (day < 46) {
      return DUSK_ORDEAL_ENEMIES.filter(e => e.color !== 'WHITE').map(e => ({ ...e, currentHp: e.hp }));
    }
    return DUSK_ORDEAL_ENEMIES.filter(e => e.color === 'WHITE').map(e => {
      if (e.isMultiEnemy && e.enemies) {
        return {
          ...e,
          enemies: e.enemies.map(en => ({ ...en, currentHp: en.hp })),
          currentHp: e.hp,
        };
      }
      return { ...e, currentHp: e.hp };
    });
  },
};

// ============================================================================
// MIDNIGHT ORDEALS
// ============================================================================

// Amber Midnight – The Perfect Meal
export const AMBER_MIDNIGHT: OrdealEnemy = {
  id: 'amber_midnight',
  name: 'The Perfect Meal',
  risk: 'ALEPH',
  ordealLevel: 'midnight',
  color: 'AMBER',
  emoji: '🪱👑💀',
  hp: 1000,
  maxHp: 1000,
  movementSpeed: 35,
  resistances: res({ red: 1.0, white: 0.6, black: 0.4, pale: 0.8 }),
  skills: [
    skill({ name: 'Cataclysmic Emergence', damageType: 'red', basePower: 50, coinPower: 0, coins: 1, description: 'Devastating emergence attack dealing 50-100 Red damage' }),
    skill({ name: 'World Devour', damageType: 'black', basePower: 45, coinPower: 12, coins: 4, description: 'Attempts to consume the facility, dealing 45-57 Black damage per hit' }),
    skill({ name: 'Tremor Lunge', damageType: 'red', basePower: 22, coinPower: 6, coins: 3, description: 'A powerful lunge that shakes the ground for 22-28 Red damage' }),
    skill({ name: 'Endless Hunger', damageType: 'pale', basePower: 35, coinPower: 10, coins: 2, description: 'The worm\'s endless hunger manifests as pale energy' }),
  ],
  specialMechanics: {
    spawnInterval: 15,
    spawnsPerCycle: 2,
    maxSpawned: 8,
    spawnId: 'amber_dusk',
    spawnMessage: '🪱 The Perfect Meal spawns more worms!',
    globalDamage: true,
    globalDamageAmount: 5,
    globalDamageType: 'red',
    globalDamageInterval: 10,
    phases: [
      { hpPercent: 0.66, trigger: 'phase2', message: '🌋 The Perfect Meal grows larger!', damageBonus: 1.5, spawnRate: 1.5 },
      { hpPercent: 0.33, trigger: 'phase3', message: '💀 THE PERFECT MEAL HAS AWAKENED!', damageBonus: 2.0, spawnRate: 2.0, globalDamageAmount: 10, globalDamageInterval: 8 },
    ],
  },
  onDeathMessage: '🪱💀 The Perfect Meal collapses, its endless hunger finally satisfied... for now.',
  onDeathEffect: 'massive_energy_reward',
  onDeathEnergyReward: 50,
  description: 'The ultimate worm that consumes everything. It grows stronger as it weakens.',
};

// Crimson Midnight – The Grand Finale (Ringmaster)
export const CRIMSON_MIDNIGHT: OrdealEnemy = {
  id: 'crimson_midnight',
  name: 'The Grand Finale',
  risk: 'ALEPH',
  ordealLevel: 'midnight',
  color: 'CRIMSON',
  emoji: '🤡👑',
  hp: 1800,
  maxHp: 1800,
  movementSpeed: 50,
  resistances: res({ red: 0.3, white: 1.0, black: 1.0, pale: 1.5 }),
  skills: [
    skill({ name: 'Grand Finale', damageType: 'red', basePower: 30, coinPower: 5, coins: 2, description: 'The ultimate performance dealing 30-35 Red damage per hit' }),
    skill({ name: 'Crimson Carnival', damageType: 'white', basePower: 25, coinPower: 6, coins: 3, description: 'A carnival of madness dealing 25-31 White damage per hit' }),
    skill({ name: 'Ringmaster\'s Whip', damageType: 'red', basePower: 18, coinPower: 4, coins: 2, description: 'A sharp whip crack dealing 18-22 Red damage' }),
    skill({ name: 'Final Bow', damageType: 'pale', basePower: 50, coinPower: 15, coins: 1, isSpecial: true, description: 'The ringmaster takes a final bow, dealing 50-65 Pale damage' }),
  ],
  specialMechanics: {
    spawnsOnDeath: { id: 'crimson_dusk', count: 2 },
    enragesBelowHpPercent: 0.3,
    enrageDamageBonus: 2.0,
    enrageSpeedBonus: 1.5,
    phases: [
      { hpPercent: 0.66, trigger: 'phase2', message: '🤡 The Ringmaster\'s performance intensifies!', damageBonus: 1.5, speedBonus: 1.3 },
      { hpPercent: 0.33, trigger: 'phase3', message: '💀 THE GRAND FINALE BEGINS!', damageBonus: 2.0, speedBonus: 1.5 },
    ],
  },
  onDeathMessage: '🤡💀 The Ringmaster takes his final bow. The carnival ends forever.',
  onDeathEffect: 'spawn_fragments',
  onDeathSpawnId: 'crimson_dusk',
  onDeathSpawnCount: 2,
  description: 'The Ringmaster appears, bringing the carnival\'s grand finale.',
};

// Green Midnight – Helix of the End
export const GREEN_MIDNIGHT: OrdealEnemy = {
  id: 'green_midnight',
  name: 'Helix of the End',
  risk: 'ALEPH',
  ordealLevel: 'midnight',
  color: 'GREEN',
  emoji: '🗼',
  hp: 1200,
  maxHp: 1200,
  movementSpeed: 0,
  resistances: res({ red: 0.5, white: 0.8, black: 1.2, pale: 1.0 }),
  skills: [
    skill({ name: 'Rotating Laser', damageType: 'black', basePower: 12, coinPower: 8, coins: 1, description: 'Continuous rotating laser deals 12-20 Black damage per hit' }),
    skill({ name: 'Helix Cannon', damageType: 'pale', basePower: 55, coinPower: 15, coins: 2, description: 'Powerful cannon blast dealing 55-70 Pale damage' }),
    skill({ name: 'Energy Wave', damageType: 'white', basePower: 30, coinPower: 10, coins: 2, description: 'A wave of energy sweeps across the facility for 30-40 White damage' }),
    skill({ name: 'Helix Overload', damageType: 'pale', basePower: 80, coinPower: 20, coins: 1, isSpecial: true, description: 'The helix overloads, dealing massive Pale damage' }),
  ],
  specialMechanics: {
    isTower: true,
    laserRotationTime: 30,
    laserDamage: { min: 12, max: 20 },
    laserDamageType: 'black',
    targetsRandomDepartments: true,
    damageReductionWhileSpinning: 0.5,
    phases: [
      { hpPercent: 0.66, trigger: 'phase2', message: '⚡ The Helix accelerates!', laserSpeed: 'double', laserRotationTime: 15, laserDamage: 1.5 },
      { hpPercent: 0.33, trigger: 'phase3', message: '💀 The Helix reaches critical!', laserSpeed: 'triple', laserRotationTime: 10, laserDamage: 2.0, secondaryLasers: 2 },
    ],
    specialAttacks: {
      atHpPercent: [0.5, 0.25],
      attackName: 'Helix Overload',
      damage: 80,
      damageType: 'pale',
      warningMessage: '⚠️ The Helix is overloading! Get to cover!',
    },
  },
  onDeathMessage: '🗼💀 The Helix of the End crumbles into dust. The facility falls silent.',
  onDeathEffect: 'remove_all_lasers',
  description: 'A towering structure that brings the end. Its laser sweeps across the facility.',
};

// Violet Midnight – The God Delusion (4 Shrines)
export const VIOLET_MIDNIGHT_SHRINES = {
  red: {
    id: 'violet_shrine_red',
    name: 'Crimson Shrine of Wrath',
    risk: 'WAW',
    ordealLevel: 'midnight',
    color: 'VIOLET',
    emoji: '🔴',
    hp: 6000,
    maxHp: 6000,
    damageType: 'red',
    resistances: res({ red: -1.0, white: 0.7, black: 1.2, pale: 1.0 }),
    skills: [
      skill({ name: 'Crimson Grasp', damageType: 'red', basePower: 75, coinPower: 15, coins: 1, description: 'A massive red hand lunges forward, dealing 60-90 Red damage' }),
      skill({ name: 'Blood Rain', damageType: 'red', basePower: 15, coinPower: 3, coins: 4, description: 'Drops of blood rain down, dealing 12-18 Red damage per hit' }),
      skill({ name: 'Redemption\'s Flame', damageType: 'red', basePower: 50, coinPower: 10, coins: 1, isSpecial: true, description: 'A massive burst of red flame dealing 50-60 Red damage' }),
    ],
    defenseTriggers: [0.70, 0.40, 0.10],
    defensePortals: 2,
    defenseSkill: { name: 'Twin Grasp', damageType: 'red', basePower: 75, description: 'Two hands stretch from both sides, dealing 60-90 Red damage', range: 'both_sides', windup: 3000 },
    onDeathMessage: '🔴 The Crimson Shrine of Wrath crumbles to dust! One seal broken...',
  },
  white: {
    id: 'violet_shrine_white',
    name: 'Ivory Shrine of Despair',
    risk: 'WAW',
    ordealLevel: 'midnight',
    color: 'VIOLET',
    emoji: '⚪',
    hp: 6000,
    maxHp: 6000,
    damageType: 'white',
    resistances: res({ red: 1.0, white: -1.0, black: 1.0, pale: 1.2 }),
    skills: [
      skill({ name: 'Despairing Tendrils', damageType: 'white', basePower: 52, coinPower: 8, coins: 1, description: 'White tentacles sweep in a wide arc, dealing 45-60 White damage' }),
      skill({ name: 'Holy Light', damageType: 'white', basePower: 10, coinPower: 2, coins: 5, description: 'Rays of holy light bombard the area, dealing 8-12 White damage per hit' }),
      skill({ name: 'Divine Judgment', damageType: 'white', basePower: 55, coinPower: 12, coins: 2, isSpecial: true, description: 'Judgment falls upon the sinners, dealing 55-67 White damage' }),
    ],
    defenseTriggers: [0.70, 0.40, 0.10],
    defensePortals: 2,
    defenseSkill: { name: 'Twin Tendrils', damageType: 'white', basePower: 52, description: 'Tentacles sweep from both sides, dealing 45-60 White damage', range: 'both_sides_wide', windup: 4000 },
    onDeathMessage: '⚪ The Ivory Shrine of Despair crumbles to dust! Two seals broken...',
  },
  black: {
    id: 'violet_shrine_black',
    name: 'Amethyst Shrine of Torment',
    risk: 'WAW',
    ordealLevel: 'midnight',
    color: 'VIOLET',
    emoji: '🟣',
    hp: 6000,
    maxHp: 6000,
    damageType: 'black',
    resistances: res({ red: 1.2, white: 0.7, black: -1.0, pale: 1.0 }),
    skills: [
      skill({ name: 'Tormenting Spikes', damageType: 'black', basePower: 50, coinPower: 5, coins: 1, description: 'Purple spikes extend forward, dealing 45-55 Black damage' }),
      skill({ name: 'Abyss Gaze', damageType: 'black', basePower: 20, coinPower: 4, coins: 3, description: 'Gazing into the abyss damages sanity for 16-24 Black damage' }),
      skill({ name: 'Dark Eruption', damageType: 'black', basePower: 45, coinPower: 15, coins: 2, isSpecial: true, description: 'Dark energy erupts from the shrine dealing 45-60 Black damage' }),
    ],
    defenseTriggers: [0.70, 0.40, 0.10],
    defensePortals: 2,
    defenseSkill: { name: 'Twin Spikes', damageType: 'black', basePower: 50, description: 'Spikes extend from both sides, dealing 45-55 Black damage', range: 'both_sides', windup: 2500 },
    onDeathMessage: '🟣 The Amethyst Shrine of Torment crumbles to dust! Three seals broken...',
  },
  pale: {
    id: 'violet_shrine_pale',
    name: 'Azure Shrine of Annihilation',
    risk: 'ALEPH',
    ordealLevel: 'midnight',
    color: 'VIOLET',
    emoji: '🔵',
    hp: 6000,
    maxHp: 6000,
    damageType: 'pale',
    resistances: res({ red: 0.7, white: 1.0, black: 0.7, pale: -1.0 }),
    skills: [
      skill({ name: 'Oblivion Ray', damageType: 'pale', basePower: 35, coinPower: 10, coins: 1, description: 'A ray of pale light threatens existence with 35-45 Pale damage' }),
      skill({ name: 'Existential Erosion', damageType: 'pale', basePower: 15, coinPower: 5, coins: 3, description: 'Slowly erodes existence for 10-20 Pale damage per hit' }),
      skill({ name: 'The End of All Things', damageType: 'pale', basePower: 65, coinPower: 20, coins: 1, isSpecial: true, description: 'A glimpse of the end deals 65-85 Pale damage' }),
    ],
    hasWanderingEye: true,
    eyeDamage: { min: 5, max: 7 },
    eyeDamageInterval: 500,
    defenseTriggers: [0.70, 0.40, 0.10],
    onDeathMessage: '🔵 The Azure Shrine of Annihilation crumbles to dust! The final seal is broken!',
  },
};

export const VIOLET_MIDNIGHT: OrdealEnemy = {
  id: 'violet_midnight',
  name: 'The God Delusion',
  risk: 'ALEPH',
  ordealLevel: 'midnight',
  color: 'VIOLET',
  emoji: '🙏',
  hp: 900,
  maxHp: 900,
  isImmune: true,
  immuneUntilAllMinionsDead: true,
  resistances: res({ red: 1.0, white: 1.0, black: 1.0, pale: 1.0 }),
  skills: [
    skill({ name: 'God\'s Wrath', damageType: 'pale', basePower: 100, coinPower: 25, coins: 3, description: 'The full power of the false god is unleashed for 100-125 Pale damage' }),
    skill({ name: 'Divine Judgment', damageType: 'white', basePower: 60, coinPower: 15, coins: 2, description: 'Judgment falls upon all, dealing 60-75 White damage' }),
    skill({ name: 'Oblivion', damageType: 'pale', basePower: 45, coinPower: 12, coins: 3, description: 'A glimpse of oblivion deals 45-57 Pale damage' }),
  ],
  minions: Object.values(VIOLET_MIDNIGHT_SHRINES).map(shrine => ({ ...shrine, currentHp: shrine.hp })),
  onAllMinionsDefeated: {
    message: '✨ All four shrines have crumbled! The God Delusion\'s immunity is broken! ✨\nThe false god reveals its true form!',
    effect: 'remove_immunity',
    newSkills: true,
  },
  onDeathMessage: '🙏💀 The false god fades into nothingness... The God Delusion is no more.',
  onDeathEffect: 'grant_violet_midnight_reward',
  description: 'Four shrines guard the false god. Destroy them all to claim victory.',
};

// White Midnight – The Claw (Days 46-49)
export const WHITE_MIDNIGHT: OrdealEnemy = {
  id: 'white_midnight',
  name: 'The Claw',
  risk: 'ALEPH',
  ordealLevel: 'midnight',
  color: 'WHITE',
  emoji: '🤚',
  hp: 3000,
  maxHp: 3000,
  movementSpeed: 40,
  minDay: 46,
  maxDay: 49,
  resistances: res({ red: 0.4, white: 0.4, black: 0.4, pale: 0.4 }),
  skills: [
    skill({ name: 'Claw Swipe', damageType: 'red', basePower: 20, coinPower: 5, coins: 1, description: 'A swift claw attack dealing 15-25 Red damage' }),
    skill({ name: 'Thrusting Claw', damageType: 'red', basePower: 32, coinPower: 8, coins: 2, description: 'Double thrust attack dealing 25-40 Red damage per hit' }),
    skill({ name: 'Pale Judgment', damageType: 'pale', basePower: 45, coinPower: 10, coins: 2, description: 'A devastating Pale damage attack for 35-55 damage' }),
  ],
  specialMechanics: {
    serums: {
      orange: {
        name: 'Serum R',
        emoji: '🧡',
        effect: 'dash_attack',
        damage: 100,
        damageType: 'red',
        cooldown: 45,
        windup: 3000,
        interruptible: true,
        interruptDamage: 200,
        stunDuration: 12,
        triggerHpPercent: 0.75,
        description: 'Charges through all enemies in a line',
        message: '🧡 The Claw crouches down, flicking its claw, then charges at extreme speed!',
        attackSkill: { name: 'Serum R: Dash Attack', damageType: 'red', basePower: 100, description: 'The Claw charges forward, dealing 100 Red damage to all in its path' },
      },
      blue: {
        name: 'Serum W',
        emoji: '💙',
        effect: 'teleport_attack',
        damage: { min: 25, max: 35 },
        damageType: 'black',
        cooldown: 45,
        preparationTime: 15000,
        windup: 3000,
        interruptible: true,
        interruptDamage: 200,
        stunDuration: 12,
        targetCount: 8,
        triggerHpPercent: 0.50,
        description: 'Teleports to marked employees and strikes',
        message: '💙 The Claw opens a map of the facility! Blue circles mark their targets!',
        attackSkill: { name: 'Serum W: Teleport Strike', damageType: 'black', basePower: 30, description: 'The Claw teleports and strikes for 25-35 Black damage' },
      },
      green: {
        name: 'Serum K',
        emoji: '💚',
        effect: 'heal',
        healAmount: 150,
        healTime: 9000,
        windup: 3000,
        interruptible: true,
        interruptDamage: 200,
        stunDuration: 12,
        cooldown: 0,
        triggersBelowHp: 120,
        triggerHpPercent: 0.25,
        description: 'Rapidly regenerates 150 HP',
        message: '💚 The Claw holds its hand out as a green glowing aura floats in its palm...',
        healMessage: '💚 The Claw\'s wounds begin closing rapidly! It heals 150 HP!',
      },
    },
    specialAttack: {
      name: 'Final Judgment',
      emoji: '💀',
      triggersBelowHpPercent: 0.25,
      damage: { min: 60, max: 85 },
      damageType: 'pale',
      marksTargets: 6,
      preparationTime: 9000,
      immune: true,
      cooldown: 85,
      bypassCooldownOnHeal: true,
      description: 'The Claw marks 6 employees and unleashes devastating dashes',
      message: '💀 The Claw injects all 3 syringes! FINAL JUDGMENT approaches!',
      attackSkill: { name: 'Final Judgment', damageType: 'pale', basePower: 72, description: 'The Claw dashes to marked targets, dealing 60-85 Pale damage' },
    },
    serumOrder: ['orange', 'blue', 'green'],
    serumInterval: 30,
    serumMessages: {
      orange: '🧡 The Claw injects **Serum R**! It begins charging at blinding speed!',
      blue: '💙 The Claw injects **Serum W**! It starts flickering in and out of sight!',
      green: '💚 The Claw injects **Serum K**! Wounds begin closing at an alarming rate!',
    },
    interruptMessage: '⚡ SERUM INTERRUPTED! The Claw takes {damage} damage and is STUNNED for {duration} seconds!',
    stunMessage: '💫 The Claw is STUNNED! It cannot act for {duration} seconds! Attack now!',
  },
  phases: [
    { hpPercent: 0.75, trigger: 'first_serum', message: '⚠️ The Claw\'s syringes begin to glow... It prepares its first serum!' },
    { hpPercent: 0.50, trigger: 'second_serum', message: '⚠️ The Claw\'s movements become more erratic! It prepares another serum!' },
    { hpPercent: 0.25, trigger: 'final_judgment_warning', message: '💀 THE CLAW PREPARES ITS FINAL JUDGMENT! Get ready!' },
  ],
  onDeathMessage: '💀 The Claw\'s body dissolves into a pool of black liquid... Its syringes shatter. It is finally over. 💀',
  onDeathEffect: 'drop_ego_gift',
  description: 'A tall figure in a business suit with a massive iron claw. It uses serums to enhance its abilities. Only appears on Days 46-49.',
};

// Midnight Ordeal Collection
export const MIDNIGHT_ORDEAL_ENEMIES: OrdealEnemy[] = [
  AMBER_MIDNIGHT,
  CRIMSON_MIDNIGHT,
  GREEN_MIDNIGHT,
  VIOLET_MIDNIGHT,
  WHITE_MIDNIGHT,
];

export const MIDNIGHT_ORDEAL = {
  id: 'midnight_ordeal',
  name: 'Midnight Ordeal',
  risk: 'ALEPH',
  ordealLevel: 'midnight',
  isMultiWave: true,
  isDynamic: true,
  waves: MIDNIGHT_ORDEAL_ENEMIES.map(enemy => {
    if (enemy.minions) {
      return {
        ...enemy,
        minions: enemy.minions.map(m => ({ ...m, currentHp: m.hp })),
        currentHp: enemy.hp,
      };
    }
    return { ...enemy, currentHp: enemy.hp };
  }),
  description: 'The ultimate challenge. Failure means the end of your facility.',
  getRandomEnemy: function(day: number = 1) {
    let availableEnemies = MIDNIGHT_ORDEAL_ENEMIES;
    if (day < 46) {
      availableEnemies = MIDNIGHT_ORDEAL_ENEMIES.filter(enemy => enemy.id !== 'white_midnight');
    }
    const randomIndex = Math.floor(Math.random() * availableEnemies.length);
    const enemy = availableEnemies[randomIndex];
    if (enemy.minions) {
      return {
        ...enemy,
        minions: enemy.minions.map(m => ({ ...m, currentHp: m.hp })),
        currentHp: enemy.hp,
      };
    }
    return { ...enemy, currentHp: enemy.hp };
  },
  getAllEnemies: function(day: number = 1) {
    if (day < 46) {
      return MIDNIGHT_ORDEAL_ENEMIES.filter(enemy => enemy.id !== 'white_midnight').map(enemy => {
        if (enemy.minions) {
          return {
            ...enemy,
            minions: enemy.minions.map(m => ({ ...m, currentHp: m.hp })),
            currentHp: enemy.hp,
          };
        }
        return { ...enemy, currentHp: enemy.hp };
      });
    }
    return MIDNIGHT_ORDEAL_ENEMIES.map(enemy => {
      if (enemy.minions) {
        return {
          ...enemy,
          minions: enemy.minions.map(m => ({ ...m, currentHp: m.hp })),
          currentHp: enemy.hp,
        };
      }
      return { ...enemy, currentHp: enemy.hp };
    });
  },
};

// ============================================================================
// SPECIAL ORDEALS
// ============================================================================

// White Special – WhiteNight's Cycle of Life
export const WHITE_SPECIAL: OrdealEnemy = {
  id: 'white_special',
  name: 'The Cycle of Life',
  risk: 'ALEPH',
  ordealLevel: 'special',
  color: 'WHITE',
  hp: 8000,
  maxHp: 8000,
  resistances: res({ red: 0.8, white: 0.3, black: 0.5, pale: 0.2 }),
  skills: [
    skill({ name: 'Pillar of Light', damageType: 'pale', coins: 3, basePower: 25, coinPower: 8, description: 'A pillar of divine light descends' }),
    skill({ name: 'Divine Judgment', damageType: 'pale', coins: 2, basePower: 40, coinPower: 12, description: 'Divine judgment is passed' }),
    skill({ name: 'Apostle Call', damageType: 'white', coins: 1, basePower: 15, coinPower: 5, description: 'Calls upon the Apostles for support' }),
  ],
  specialMechanics: {
    isDepartmentSpecific: true,
    triggerAbnormality: 'WhiteNight',
    apostles: {
      totalApostles: 11,
      damageReductionPerApostle: 0.05,
    },
  },
  defenseSkill: {
    name: 'Divine Protection',
    description: 'Apostles protect WhiteNight, reducing damage taken',
    effect: 'Damage reduction per living apostle',
  },
  imageUrl: 'white_night',
  imageId: 'white_night',
};

// Indigo Special – Apocalypse Bird
export const INDIGO_SPECIAL: OrdealEnemy = {
  id: 'indigo_special',
  name: 'The Apocalypse',
  risk: 'ALEPH',
  ordealLevel: 'special',
  color: 'INDIGO',
  hp: 8000,
  maxHp: 8000,
  resistances: res({ red: 0.6, white: 0.6, black: 0.6, pale: 0.4 }),
  skills: [
    skill({ name: 'Big Bird\'s Gaze', damageType: 'white', coins: 3, basePower: 25, coinPower: 8, description: 'A piercing gaze that deals White damage' }),
    skill({ name: 'Judgment Bird\'s Scales', damageType: 'pale', coins: 2, basePower: 30, coinPower: 12, description: 'Weighs the sins of the target' }),
    skill({ name: 'Punishing Bird\'s Beak', damageType: 'red', coins: 4, basePower: 20, coinPower: 6, description: 'A swift punishing strike' }),
    skill({ name: 'Trinity Apocalypse', damageType: 'mixed', coins: 5, basePower: 35, coinPower: 10, description: 'The combined power of all three birds', damageComponents: { red: 0.33, white: 0.33, black: 0.34 } }),
  ],
  specialMechanics: {
    isDepartmentSpecific: true,
    triggerAbnormality: 'Apocalypse Bird',
    phases: 4,
    eggMode: true,
    eggPhases: 2,
  },
  defenseSkill: {
    name: 'Eclipse',
    description: 'The facility darkens, reducing visibility and healing',
    effect: 'Reduced healing during Apocalypse Bird fight',
  },
  imageUrl: 'apocalypse_bird',
  imageId: 'apocalypse_bird',
};

// ============================================================================
// EXPORTS – All ordeals combined
// ============================================================================

export const ALL_ORDEALS = {
  dawn: DAWN_ORDEAL_ENEMIES,
  noon: NOON_ORDEAL_ENEMIES,
  dusk: DUSK_ORDEAL_ENEMIES,
  midnight: MIDNIGHT_ORDEAL_ENEMIES,
  special: [WHITE_SPECIAL, INDIGO_SPECIAL],
};

// ─── Helper: get ordeal by level and day ──────────────────────────────
export function getOrdealByLevel(
  level: 'dawn' | 'noon' | 'dusk' | 'midnight' | 'special',
  day: number = 1
): OrdealEnemy | undefined {
  const pools: Record<string, OrdealEnemy[]> = {
    dawn: DAWN_ORDEAL_ENEMIES,
    noon: NOON_ORDEAL_ENEMIES,
    dusk: DUSK_ORDEAL_ENEMIES,
    midnight: MIDNIGHT_ORDEAL_ENEMIES,
    special: [WHITE_SPECIAL, INDIGO_SPECIAL],
  };

  let pool = pools[level] || [];
  // Filter by minDay/maxDay
  pool = pool.filter(o => !o.minDay || day >= o.minDay);
  pool = pool.filter(o => !o.maxDay || day <= o.maxDay);

  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Helper: get random ordeal for day ──────────────────────────────
export function getRandomOrdeal(day: number = 1): OrdealEnemy | undefined {
  const levels: ('dawn' | 'noon' | 'dusk' | 'midnight' | 'special')[] = ['dawn', 'noon', 'dusk', 'midnight'];
  // Special ordeals are triggered manually, not random
  const all = levels.flatMap(l => {
    const pool = ALL_ORDEALS[l] || [];
    return pool.filter(o => !o.minDay || day >= o.minDay);
  });

  if (all.length === 0) return undefined;
  return all[Math.floor(Math.random() * all.length)];
}
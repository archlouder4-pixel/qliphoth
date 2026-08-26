// src/data/ordeals.ts
// Complete Ordeal system based on the official Lobotomy Corporation Wiki
// https://lobotomycorp.fandom.com/wiki/Ordeals

import { OrdealEnemy } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type OrdealTier = 'Dawn' | 'Noon' | 'Dusk' | 'Midnight';
export type OrdealEnemyType = 'Crimson' | 'Amber' | 'Green' | 'Indigo' | 'Violet' | 'White';

export interface OrdealPhase {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  enemies: OrdealEnemy[];
  mechanics?: {
    type: 'spawn' | 'buff' | 'debuff' | 'heal' | 'shield' | 'enrage' | 'explode' | 'burrow' | 'deactivate' | 'upset_abno' | 'corpse_heal';
    description: string;
    value?: number;
    spawnTarget?: string; // for spawn mechanics (e.g., 'crimson_dawn')
  }[];
}

export interface OrdealDefinition {
  id: string;
  tier: OrdealTier;
  enemyType: OrdealEnemyType;
  name: string;
  description: string;
  wikiReference: string; // link to the wiki page
  totalEnemies: number;
  phases: OrdealPhase[];
  rewardEnergy: number | 'quota_percent'; // 'quota_percent' = 10% of daily quota
  rewardLunacy?: number;
  riskLevel: 'TETH' | 'HE' | 'WAW' | 'ALEPH';
  spawnCountPerDepartment?: boolean; // if true, spawns per department
  globalMechanics?: {
    type: 'time_limit' | 'timer' | 'phase_transition';
    description: string;
    value?: number;
  }[];
}

// ============================================================================
// HELPER FUNCTIONS TO BUILD ENEMIES
// ============================================================================

function createEnemy(
  name: string,
  hp: number,
  atk: number,
  def: number,
  resistDamageType: string = 'Red',
  resistInfusion: string = 'Slash',
  skills: Array<{ name: string; power: number; coins: number; damageType: string; infusion: string }>
): OrdealEnemy {
  return {
    id: `enemy_${name.toLowerCase().replace(/\s/g, '_')}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    hp,
    maxHp: hp,
    atk,
    def,
    resistDamageType,
    resistInfusion,
    skills,
  };
}

// ============================================================================
// ORDEAL DEFINITIONS
// ============================================================================

export const ORDEALS: OrdealDefinition[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // CRIMSON ORDEALS (Carnival Theme)
  // ────────────────────────────────────────────────────────────────────────────

  {
    id: 'crimson_dawn',
    tier: 'Dawn',
    enemyType: 'Crimson',
    name: 'Crimson Dawn',
    description: 'The Cheers for the Beginning – Small clowns that teleport to containment units, reducing Qliphoth Counters. Explode on death.',
    wikiReference: 'https://lobotomycorp.fandom.com/wiki/Ordeals#Crimson_Dawn',
    totalEnemies: 1,
    riskLevel: 'TETH', // Displayed as TETH, actual is HE due to bug
    spawnCountPerDepartment: true,
    rewardEnergy: 'quota_percent', // 10% of quota
    phases: [
      {
        id: 'crimson_dawn_phase',
        name: 'Cheers for the Beginning',
        description: 'A small clown teleports to a containment unit. Stop it before it reduces the Qliphoth Counter!',
        duration: 30,
        enemies: [
          createEnemy(
            'Crimson Dawn Clown',
            80,
            5,
            0,
            'Red',
            'Slash',
            [{ name: 'Explode', power: 15, coins: 1, damageType: 'Red', infusion: 'Blunt' }]
          ),
        ],
        mechanics: [
          {
            type: 'upset_abno',
            description: 'If not stopped, reduces Qliphoth Counter by 1.',
            value: 1,
          },
          {
            type: 'explode',
            description: 'On death, explodes dealing 10-15 Red Damage to nearby agents.',
            value: 15,
          },
        ],
      },
    ],
  },

  {
    id: 'crimson_noon',
    tier: 'Noon',
    enemyType: 'Crimson',
    name: 'Crimson Noon',
    description: 'The Harmony of Skin – A larger clown that spawns 3 Crimson Dawn clowns on death.',
    wikiReference: 'https://lobotomycorp.fandom.com/wiki/Ordeals#Crimson_Noon',
    totalEnemies: 4, // 1 boss + 3 spawns
    riskLevel: 'HE',
    rewardEnergy: 30,
    rewardLunacy: 10,
    phases: [
      {
        id: 'crimson_noon_phase',
        name: 'Harmony of Skin',
        description: 'A larger clown appears. When defeated, it spawns three smaller clowns.',
        duration: 45,
        enemies: [
          createEnemy(
            'Crimson Noon Clown',
            200,
            12,
            4,
            'Red',
            'Blunt',
            [
              { name: 'Slam', power: 8, coins: 2, damageType: 'Red', infusion: 'Blunt' },
              { name: 'Explode', power: 20, coins: 1, damageType: 'Red', infusion: 'Blunt' },
            ]
          ),
        ],
        mechanics: [
          {
            type: 'spawn',
            description: 'On death, spawns 3 Crimson Dawn clowns.',
            value: 3,
            spawnTarget: 'crimson_dawn',
          },
        ],
      },
    ],
  },

  {
    id: 'crimson_dusk',
    tier: 'Dusk',
    enemyType: 'Crimson',
    name: 'Crimson Dusk',
    description: 'Cirque du Sang / The Struggle at the Climax – Two massive fleshy clowns that explode on contact, dealing massive damage. On death, spawns Crimson Noon.',
    wikiReference: 'https://lobotomycorp.fandom.com/wiki/Ordeals#Crimson_Dusk',
    totalEnemies: 2,
    riskLevel: 'WAW',
    rewardEnergy: 50,
    rewardLunacy: 25,
    phases: [
      {
        id: 'crimson_dusk_phase',
        name: 'Cirque du Sang',
        description: 'Two massive clowns roam the facility seeking victims. They inflate and explode on contact!',
        duration: 90,
        enemies: [
          createEnemy(
            'Crimson Dusk Clown',
            350,
            20,
            10,
            'Red',
            'Blunt',
            [
              { name: 'Explosion', power: 35, coins: 1, damageType: 'Red', infusion: 'Blunt' },
              { name: 'Slam', power: 15, coins: 3, damageType: 'Red', infusion: 'Blunt' },
            ]
          ),
          createEnemy(
            'Crimson Dusk Clown',
            350,
            20,
            10,
            'Red',
            'Blunt',
            [
              { name: 'Explosion', power: 35, coins: 1, damageType: 'Red', infusion: 'Blunt' },
              { name: 'Slam', power: 15, coins: 3, damageType: 'Red', infusion: 'Blunt' },
            ]
          ),
        ],
        mechanics: [
          {
            type: 'enrage',
            description: 'On death, spawns a Crimson Noon.',
            value: 1,
          },
          {
            type: 'explode',
            description: 'Explodes when destroyed, dealing massive Red damage.',
            value: 35,
          },
        ],
      },
    ],
  },

  {
    id: 'crimson_midnight',
    tier: 'Midnight',
    enemyType: 'Crimson',
    name: 'Crimson Midnight',
    description: 'A massive festival of clowns. The ultimate Crimson ordeal.',
    wikiReference: 'https://lobotomycorp.fandom.com/wiki/Ordeals#Crimson_Midnight',
    totalEnemies: 10,
    riskLevel: 'ALEPH',
    rewardEnergy: 100,
    rewardLunacy: 75,
    phases: [
      {
        id: 'crimson_midnight_phase_1',
        name: 'Crimson Carnival',
        description: 'A wave of Crimson clowns attacks the facility.',
        duration: 60,
        enemies: [
          createEnemy(
            'Crimson Clown',
            100,
            12,
            3,
            'Red',
            'Slash',
            [{ name: 'Slash', power: 8, coins: 2, damageType: 'Red', infusion: 'Slash' }]
          ),
          createEnemy(
            'Crimson Clown',
            100,
            12,
            3,
            'Red',
            'Slash',
            [{ name: 'Slash', power: 8, coins: 2, damageType: 'Red', infusion: 'Slash' }]
          ),
          createEnemy(
            'Crimson Clown',
            100,
            12,
            3,
            'Red',
            'Slash',
            [{ name: 'Slash', power: 8, coins: 2, damageType: 'Red', infusion: 'Slash' }]
          ),
        ],
        mechanics: [
          {
            type: 'explode',
            description: 'All clowns explode on death, dealing Red damage.',
            value: 15,
          },
        ],
      },
      {
        id: 'crimson_midnight_phase_2',
        name: 'Crimson Ringmaster',
        description: 'The ringmaster appears, commanding the remaining clowns.',
        duration: 60,
        enemies: [
          createEnemy(
            'Crimson Ringmaster',
            500,
            30,
            15,
            'Red',
            'Blunt',
            [
              { name: 'Slash', power: 20, coins: 4, damageType: 'Red', infusion: 'Blunt' },
              { name: 'Explosion', power: 40, coins: 1, damageType: 'Red', infusion: 'Blunt' },
            ]
          ),
        ],
        mechanics: [
          {
            type: 'enrage',
            description: 'Below 50% HP, deals +50% damage.',
            value: 50,
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // AMBER ORDEALS (Food/Worm Theme)
  // ────────────────────────────────────────────────────────────────────────────

  {
    id: 'amber_dawn',
    tier: 'Dawn',
    enemyType: 'Amber',
    name: 'Amber Dawn',
    description: 'The Perfect Meal – Worm-like creatures that swarm hallways and leap at targets.',
    wikiReference: 'https://lobotomycorp.fandom.com/wiki/Ordeals#Amber_Dawn',
    totalEnemies: 5,
    riskLevel: 'TETH',
    spawnCountPerDepartment: true,
    rewardEnergy: 'quota_percent',
    phases: [
      {
        id: 'amber_dawn_phase',
        name: 'The Perfect Meal',
        description: 'Worms burrow through hallways, attacking anything in their path. They burrow and reappear!',
        duration: 60,
        enemies: [
          createEnemy(
            'Amber Worm',
            35,
            2,
            0,
            'Red',
            'Pierce',
            [{ name: 'Leap', power: 2, coins: 1, damageType: 'Red', infusion: 'Pierce' }]
          ),
          createEnemy(
            'Amber Worm',
            35,
            2,
            0,
            'Red',
            'Pierce',
            [{ name: 'Leap', power: 2, coins: 1, damageType: 'Red', infusion: 'Pierce' }]
          ),
          createEnemy(
            'Amber Worm',
            35,
            2,
            0,
            'Red',
            'Pierce',
            [{ name: 'Leap', power: 2, coins: 1, damageType: 'Red', infusion: 'Pierce' }]
          ),
          createEnemy(
            'Amber Worm',
            35,
            2,
            0,
            'Red',
            'Pierce',
            [{ name: 'Leap', power: 2, coins: 1, damageType: 'Red', infusion: 'Pierce' }]
          ),
          createEnemy(
            'Amber Worm',
            35,
            2,
            0,
            'Red',
            'Pierce',
            [{ name: 'Leap', power: 2, coins: 1, damageType: 'Red', infusion: 'Pierce' }]
          ),
        ],
        mechanics: [
          {
            type: 'burrow',
            description: 'Worms burrow and reappear in random hallways every 15 seconds.',
            value: 15,
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // GREEN ORDEALS (Mechanical Theme)
  // ────────────────────────────────────────────────────────────────────────────

  {
    id: 'green_dawn',
    tier: 'Dawn',
    enemyType: 'Green',
    name: 'Green Dawn',
    description: 'Doubt – Humanoid robots with lances that wander and attack. They deactivate periodically.',
    wikiReference: 'https://lobotomycorp.fandom.com/wiki/Ordeals#Green_Dawn',
    totalEnemies: 3,
    riskLevel: 'TETH',
    rewardEnergy: 'quota_percent',
    phases: [
      {
        id: 'green_dawn_phase',
        name: 'Doubt',
        description: 'Mechanical beings patrol the facility. They deactivate and become vulnerable.',
        duration: 60,
        enemies: [
          createEnemy(
            'Green Robot',
            60,
            8,
            3,
            'Red',
            'Pierce',
            [{ name: 'Lance Strike', power: 6, coins: 1, damageType: 'Red', infusion: 'Pierce' }]
          ),
          createEnemy(
            'Green Robot',
            60,
            8,
            3,
            'Red',
            'Pierce',
            [{ name: 'Lance Strike', power: 6, coins: 1, damageType: 'Red', infusion: 'Pierce' }]
          ),
          createEnemy(
            'Green Robot',
            60,
            8,
            3,
            'Red',
            'Pierce',
            [{ name: 'Lance Strike', power: 6, coins: 1, damageType: 'Red', infusion: 'Pierce' }]
          ),
        ],
        mechanics: [
          {
            type: 'deactivate',
            description: 'Robots deactivate for 5 seconds every 20 seconds, taking double damage.',
            value: 20,
          },
        ],
      },
    ],
  },

  {
    id: 'green_noon',
    tier: 'Noon',
    enemyType: 'Green',
    name: 'Green Noon',
    description: 'Mechanical soldiers armed with various weapons.',
    wikiReference: 'https://lobotomycorp.fandom.com/wiki/Ordeals#Green_Noon',
    totalEnemies: 4,
    riskLevel: 'HE',
    rewardEnergy: 30,
    rewardLunacy: 10,
    phases: [
      {
        id: 'green_noon_phase',
        name: 'Mechanical March',
        description: 'Four robots with different weapons attack the facility.',
        duration: 60,
        enemies: [
          createEnemy(
            'Green Soldier (Sword)',
            150,
            15,
            5,
            'Red',
            'Slash',
            [{ name: 'Slash', power: 10, coins: 2, damageType: 'Red', infusion: 'Slash' }]
          ),
          createEnemy(
            'Green Soldier (Lance)',
            120,
            18,
            3,
            'Red',
            'Pierce',
            [{ name: 'Pierce', power: 12, coins: 2, damageType: 'Red', infusion: 'Pierce' }]
          ),
          createEnemy(
            'Green Soldier (Hammer)',
            180,
            12,
            8,
            'Black',
            'Blunt',
            [{ name: 'Blunt', power: 8, coins: 2, damageType: 'Black', infusion: 'Blunt' }]
          ),
          createEnemy(
            'Green Soldier (Rifle)',
            100,
            20,
            2,
            'White',
            'Pierce',
            [{ name: 'Shot', power: 14, coins: 1, damageType: 'White', infusion: 'Pierce' }]
          ),
        ],
        mechanics: [],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // INDIGO ORDEALS (Industrial/War Theme) – Only appears Day 26+
  // ────────────────────────────────────────────────────────────────────────────

  {
    id: 'indigo_noon',
    tier: 'Noon',
    enemyType: 'Indigo',
    name: 'Indigo Noon',
    description: 'Sweeper – Armored humanoids with hook hands that heal from corpses.',
    wikiReference: 'https://lobotomycorp.fandom.com/wiki/Ordeals#Indigo_Noon',
    totalEnemies: 12, // 4 groups of 3
    riskLevel: 'HE',
    rewardEnergy: 30,
    rewardLunacy: 10,
    minDay: 26, // Only appears from Day 26 onward
    phases: [
      {
        id: 'indigo_noon_phase',
        name: 'Sweeper',
        description: 'Sweepers appear in groups of 3, seeking to clean the facility.',
        duration: 90,
        enemies: [
          createEnemy(
            'Sweeper',
            100,
            12,
            5,
            'Black',
            'Pierce',
            [
              { name: 'Hook', power: 8, coins: 2, damageType: 'Black', infusion: 'Pierce' },
              { name: 'Sweep', power: 6, coins: 1, damageType: 'Black', infusion: 'Pierce' },
            ]
          ),
          createEnemy(
            'Sweeper',
            100,
            12,
            5,
            'Black',
            'Pierce',
            [
              { name: 'Hook', power: 8, coins: 2, damageType: 'Black', infusion: 'Pierce' },
              { name: 'Sweep', power: 6, coins: 1, damageType: 'Black', infusion: 'Pierce' },
            ]
          ),
          createEnemy(
            'Sweeper',
            100,
            12,
            5,
            'Black',
            'Pierce',
            [
              { name: 'Hook', power: 8, coins: 2, damageType: 'Black', infusion: 'Pierce' },
              { name: 'Sweep', power: 6, coins: 1, damageType: 'Black', infusion: 'Pierce' },
            ]
          ),
        ],
        mechanics: [
          {
            type: 'corpse_heal',
            description: 'Sweepers heal 20 HP from nearby corpses.',
            value: 20,
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // VIOLET ORDEALS (Religious/Ancestral Theme)
  // ────────────────────────────────────────────────────────────────────────────

  {
    id: 'violet_dawn',
    tier: 'Dawn',
    enemyType: 'Violet',
    name: 'Violet Dawn',
    description: 'Fruit of Understanding – Slow-moving purple entities that explode, dealing White damage and releasing abnormalities.',
    wikiReference: 'https://lobotomycorp.fandom.com/wiki/Ordeals#Violet_Dawn',
    totalEnemies: 3,
    riskLevel: 'TETH',
    rewardEnergy: 'quota_percent',
    phases: [
      {
        id: 'violet_dawn_phase',
        name: 'Fruit of Understanding',
        description: 'Purple entities move slowly. If they explode, they deal White damage and upset an abnormality.',
        duration: 120,
        enemies: [
          createEnemy(
            'Violet Entity',
            50,
            5,
            2,
            'White',
            'Blunt',
            [{ name: 'Explode', power: 20, coins: 1, damageType: 'White', infusion: 'Blunt' }]
          ),
          createEnemy(
            'Violet Entity',
            50,
            5,
            2,
            'White',
            'Blunt',
            [{ name: 'Explode', power: 20, coins: 1, damageType: 'White', infusion: 'Blunt' }]
          ),
          createEnemy(
            'Violet Entity',
            50,
            5,
            2,
            'White',
            'Blunt',
            [{ name: 'Explode', power: 20, coins: 1, damageType: 'White', infusion: 'Blunt' }]
          ),
        ],
        mechanics: [
          {
            type: 'upset_abno',
            description: 'On explosion, reduces the Qliphoth Counter of a random abnormality by 1.',
            value: 1,
          },
          {
            type: 'explode',
            description: 'Explodes dealing 15-20 White Damage to nearby agents.',
            value: 20,
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // WHITE ORDEALS (Fixer Theme) – Appears Day 46+
  // ────────────────────────────────────────────────────────────────────────────

  {
    id: 'white_dawn',
    tier: 'Dawn',
    enemyType: 'White',
    name: 'White Dawn',
    description: 'A Request – A single Fixer appears to test the facility.',
    wikiReference: 'https://lobotomycorp.fandom.com/wiki/Ordeals#White_Dawn',
    totalEnemies: 1,
    riskLevel: 'TETH',
    rewardEnergy: 'quota_percent',
    minDay: 46,
    phases: [
      {
        id: 'white_dawn_phase',
        name: 'A Request',
        description: 'A Fixer arrives. Defeat them quickly!',
        duration: 60,
        enemies: [
          createEnemy(
            'Red Fixer',
            150,
            15,
            5,
            'Red',
            'Slash',
            [{ name: 'Slash', power: 10, coins: 2, damageType: 'Red', infusion: 'Slash' }]
          ),
        ],
        mechanics: [
          {
            type: 'buff',
            description: 'Fixer has high resistances to all damage types.',
            value: 1,
          },
        ],
      },
    ],
  },

  {
    id: 'white_noon',
    tier: 'Noon',
    enemyType: 'White',
    name: 'White Noon',
    description: 'Two Fixers appear, each with different specialties.',
    wikiReference: 'https://lobotomycorp.fandom.com/wiki/Ordeals#White_Noon',
    totalEnemies: 2,
    riskLevel: 'HE',
    rewardEnergy: 30,
    rewardLunacy: 10,
    minDay: 46,
    phases: [
      {
        id: 'white_noon_phase',
        name: 'The Request Continues',
        description: 'Two Fixers with different weapons attack.',
        duration: 60,
        enemies: [
          createEnemy(
            'White Fixer (Sword)',
            200,
            18,
            6,
            'Red',
            'Slash',
            [{ name: 'Slash', power: 12, coins: 2, damageType: 'Red', infusion: 'Slash' }]
          ),
          createEnemy(
            'White Fixer (Gun)',
            150,
            22,
            3,
            'White',
            'Pierce',
            [{ name: 'Shot', power: 15, coins: 1, damageType: 'White', infusion: 'Pierce' }]
          ),
        ],
        mechanics: [],
      },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get ordeal definition by ID
 */
export function getOrdealById(id: string): OrdealDefinition | undefined {
  return ORDEALS.find(o => o.id === id);
}

/**
 * Get all ordeals of a specific tier
 */
export function getOrdealsByTier(tier: OrdealTier): OrdealDefinition[] {
  return ORDEALS.filter(o => o.tier === tier);
}

/**
 * Get all ordeals of a specific enemy type
 */
export function getOrdealsByType(type: OrdealEnemyType): OrdealDefinition[] {
  return ORDEALS.filter(o => o.enemyType === type);
}

/**
 * Get a random ordeal of a specific tier, respecting minDay
 */
export function getRandomOrdealByTier(tier: OrdealTier, day: number): OrdealDefinition | undefined {
  const available = ORDEALS.filter(o => o.tier === tier && (!o.minDay || o.minDay <= day));
  if (available.length === 0) return undefined;
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Get all ordeals available at a given day
 */
export function getAvailableOrdeals(day: number): OrdealDefinition[] {
  return ORDEALS.filter(o => !o.minDay || o.minDay <= day);
}

/**
 * Check if a given tier is a Midnight ordeal (has multiple phases)
 */
export function isMidnightTier(tier: OrdealTier): boolean {
  return tier === 'Midnight';
}

/**
 * Get total enemy count for an ordeal (sum of all phases)
 */
export function getTotalEnemyCount(ordeal: OrdealDefinition): number {
  return ordeals.phases.reduce((sum, phase) => sum + phase.enemies.length, 0);
}

/**
 * Calculate ordeal reward energy
 */
export function calculateOrdealReward(ordeal: OrdealDefinition, dailyQuota: number): number {
  if (ordeal.rewardEnergy === 'quota_percent') {
    return Math.floor(dailyQuota * 0.1);
  }
  return ordeal.rewardEnergy;
}

/**
 * Check if an ordeal spawns per department
 */
export function spawnsPerDepartment(ordeal: OrdealDefinition): boolean {
  return ordeal.spawnCountPerDepartment || false;
}
// src/data/weapons.ts
export interface WeaponPassive {
  name: string;
  description: string;
  mechanics: Record<string, any>;
}

export interface Weapon {
  id: string;
  name: string;
  type: string;
  rarity: 'SR' | 'SSR';
  atk: number;
  description: string;
  signatureFor?: string; // identity id this weapon is meant for
  passive?: WeaponPassive;
  // Added for stat scaling
  baseStats?: { atk: number };
  atkGrowth?: number;
  levelCap?: number;
  icon?: string;
}

export const weapons: Weapon[] = [
  // ─── ARTHUR ─────────────────────────────────────────────────────
  {
    id: 'eclipse_blade',
    name: 'Excalibur Greatsword',
    type: 'Greatsword',
    rarity: 'SSR',
    atk: 85,
    description: 'The legendary blade of the once and future king, resonating with pale resolve.',
    signatureFor: 'arthur_excalibur',
    icon: '⚔️',
    baseStats: { atk: 85 },
    atkGrowth: 2.5,
    levelCap: 70,
    passive: {
      name: 'Golden Resolve',
      description: 'On kill with True Execution, gain 1 Golden Heart Will per stack. Auto‑select passive at 25% chance.',
      mechanics: {
        autoSelectChance: 0.25,
        goldenHeartWillOnKill: true,
      },
    },
  },

  // ─── GENEVIEVE ──────────────────────────────────────────────────
  {
    id: 'weeping_garden_gauntlets',
    name: 'Weeping Garden Gauntlets',
    type: 'Gauntlets',
    rarity: 'SR',
    atk: 60,
    description: 'Gauntlets that weep with the sorrow of a thousand fallen.',
    signatureFor: 'genevieve_weeping_blade',
    icon: '🌹',
    baseStats: { atk: 60 },
    atkGrowth: 1.8,
    levelCap: 60,
    passive: {
      name: "Garden's Wither",
      description: 'During transformation, apply 1 Wither stack to the enemy each turn.',
      mechanics: {
        witherPerTurn: 1,
        onlyDuringTransformation: true,
      },
    },
  },

  // ─── KAELEN ─────────────────────────────────────────────────────
  {
    id: 'eclipse_shard',
    name: 'Eclipse Shard',
    type: 'Dagger',
    rarity: 'SSR',
    atk: 78,
    description: 'A shard of twilight that cuts through shadows.',
    signatureFor: 'kaelen_dusk_reaper',
    icon: '🌑',
    baseStats: { atk: 78 },
    atkGrowth: 2.3,
    levelCap: 70,
    passive: {
      name: 'Shadow Mark Mastery',
      description: 'Each Shadow Mark reduces enemy DEF by an additional 2%. At 5+ Shadow Marks, deal 15% bonus damage.',
      mechanics: {
        extraDefReductionPerMark: 0.02,
        bonusDmgThreshold: 5,
        bonusDmgPercent: 0.15,
      },
    },
  },

  // ─── SERAPHINA ──────────────────────────────────────────────────
  {
    id: 'radiant_scepter',
    name: 'Radiant Scepter',
    type: 'Staff',
    rarity: 'SSR',
    atk: 70,
    description: 'A scepter that glows with the warmth of the Eternal Flame.',
    signatureFor: 'seraphina_radiant_martyr',
    icon: '☀️',
    baseStats: { atk: 70 },
    atkGrowth: 2.1,
    levelCap: 70,
    passive: {
      name: 'Radiance Amplifier',
      description: 'Each heal grants 1 Radiance stack (max 6). At 6 stacks, next Ego is free. Healing bonus scales with Radiance.',
      mechanics: {
        radiancePerHeal: 1,
        maxRadiance: 6,
        freeEgoAtMax: true,
        healBonusPerRadiance: 0.05,
      },
    },
  },

  // ─── VALERIUS ───────────────────────────────────────────────────
  {
    id: 'crimson_edge',
    name: 'Crimson Edge',
    type: 'Rapier',
    rarity: 'SR',
    atk: 68,
    description: 'A blade that feeds on the blood of the arena.',
    signatureFor: 'valerius_crimson_reaver',
    icon: '🔥',
    baseStats: { atk: 68 },
    atkGrowth: 2.0,
    levelCap: 60,
    passive: {
      name: 'Fury of the Blood',
      description: 'Each Fury stack grants +5% crit chance. At 10 Fury, all attacks become Unbreakable and gain 30% crit damage.',
      mechanics: {
        critPerFury: 0.05,
        maxFury: 10,
        unbreakableAtMax: true,
        critDmgAtMax: 0.30,
      },
    },
  },

  // ─── MORWEN ─────────────────────────────────────────────────────
  {
    id: 'abyssal_anchor',
    name: 'Abyssal Anchor',
    type: 'Greatsword',
    rarity: 'SSR',
    atk: 82,
    description: 'An anchor from the deepest trench, crushing foes with pressure.',
    signatureFor: 'morwen_lamenting_tides',
    icon: '🌊',
    baseStats: { atk: 82 },
    atkGrowth: 2.4,
    levelCap: 70,
    passive: {
      name: 'Depth Charge',
      description: 'Each time you Guard, gain 2 Depth (max 6). At 6 Depth, all attacks become Unbreakable and deal 25% bonus damage.',
      mechanics: {
        depthPerGuard: 2,
        maxDepth: 6,
        unbreakableAtMax: true,
        bonusDmgAtMax: 0.25,
      },
    },
  },

  // ─── RAGNAR ─────────────────────────────────────────────────────
  {
    id: 'world_cleaver',
    name: 'World Cleaver',
    type: 'Axe',
    rarity: 'SSR',
    atk: 90,
    description: 'A massive axe that cleaves through mountains and enemies alike.',
    signatureFor: 'ragnar_unchained',
    icon: '🔥',
    baseStats: { atk: 90 },
    atkGrowth: 2.6,
    levelCap: 70,
    passive: {
      name: 'Unchained Rage',
      description: 'Each Rage stack grants +3% crit chance. At 5 Rage, all attacks become Unbreakable and deal 50% bonus damage.',
      mechanics: {
        critPerRage: 0.03,
        maxRage: 5,
        unbreakableAtMax: true,
        bonusDmgAtMax: 0.50,
      },
    },
  },

  // ─── ISOLDE ─────────────────────────────────────────────────────
  {
    id: 'vengeance_blade',
    name: 'Vengeance Blade',
    type: 'Sword',
    rarity: 'SR',
    atk: 65,
    description: 'A blade forged from the tears of the fallen.',
    signatureFor: 'isolde_mournful',
    icon: '💀',
    baseStats: { atk: 65 },
    atkGrowth: 1.9,
    levelCap: 60,
    passive: {
      name: 'Oath of Vengeance',
      description: 'On ally death, all allies gain 3 Resolve and +20% healing received for 2 turns. Attacks apply 1 extra Weaken.',
      mechanics: {
        resolveOnAllyDeath: 3,
        healBoostOnDeath: 0.20,
        durationHealBoost: 2,
        extraWeakenOnHit: 1,
      },
    },
  },

  // ─── THERON ─────────────────────────────────────────────────────
  {
    id: 'harmonic_baton',
    name: 'Harmonic Baton',
    type: 'Rapier',
    rarity: 'SSR',
    atk: 75,
    description: 'A baton that conducts the symphony of balance.',
    signatureFor: 'theron_equilibrium',
    icon: '⚖️',
    baseStats: { atk: 75 },
    atkGrowth: 2.2,
    levelCap: 70,
    passive: {
      name: 'Perfect Harmony',
      description: 'When buff count equals debuff count, gain 2 Balance and cleanse all allies. Damage bonus scales with Harmony stacks.',
      mechanics: {
        balanceGainOnEquilibrium: 2,
        cleanseOnEquilibrium: true,
        dmgBonusPerHarmony: 0.05,
      },
    },
  },

  // ─── SIORA ──────────────────────────────────────────────────────
  {
    id: 'shepherds_staff',
    name: "Shepherd's Staff",
    type: 'Staff',
    rarity: 'SR',
    atk: 62,
    description: 'A staff that channels the blood of the flock to protect them.',
    signatureFor: 'siora_crimson_shepherd',
    icon: '🩸',
    baseStats: { atk: 62 },
    atkGrowth: 1.8,
    levelCap: 60,
    passive: {
      name: 'Blood Shepherd',
      description: 'If any ally is below 30% HP, healing is increased by 50%. Each Bleed stack on self gives +5% DEF (max 3).',
      mechanics: {
        healBoostLowAlly: 0.50,
        defPerBleed: 0.05,
        maxBleedForDef: 3,
      },
    },
  },

  // ─── ORIN ───────────────────────────────────────────────────────
  {
    id: 'echoing_resonator',
    name: 'Echoing Resonator',
    type: 'Dagger',
    rarity: 'SSR',
    atk: 72,
    description: 'A dagger that resonates with the void, amplifying echoes.',
    signatureFor: 'orin_echoing_void',
    icon: '👁️',
    baseStats: { atk: 72 },
    atkGrowth: 2.1,
    levelCap: 70,
    passive: {
      name: 'Echo Amplifier',
      description: 'Each debuff applied grants 1 Shadow stack (max 5). At 5 Shadow, gain +20% crit damage and ignore 10% DEF.',
      mechanics: {
        shadowPerDebuff: 1,
        maxShadow: 5,
        critDmgAtMax: 0.20,
        ignoreDefAtMax: 0.10,
      },
    },
  },
];

// ─── Helper function to check if an identity can equip a weapon ───
export function canEquipWeapon(identityId: string, weaponId: string): boolean {
  const weapon = weapons.find(w => w.id === weaponId);
  if (!weapon) return false;
  // If weapon has a signatureFor, only that identity can equip it.
  if (weapon.signatureFor) {
    return weapon.signatureFor === identityId;
  }
  // If no signature, assume any identity can equip it (fallback).
  return true;
}

// ─── Helper to get all weapons compatible with an identity ──────
export function compatibleWeapons(identityId: string): Weapon[] {
  return weapons.filter(w => canEquipWeapon(identityId, w.id));
}

// ─── Expose weapons for lookup ─────────────────────────────────────
export function getWeaponById(id: string): Weapon | undefined {
  return weapons.find(w => w.id === id);
}
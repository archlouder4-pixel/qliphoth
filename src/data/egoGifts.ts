// src/data/egoGifts.ts
import { getClassCategory, type CombatCategory } from './identities';

// ─── Slot Definitions ──────────────────────────────────────────────────
export type EgoGiftSlot =
  | 'left_back'
  | 'right_back'
  | 'mouth'
  | 'mouth2'
  | 'face'
  | 'eye'
  | 'cheek'
  | 'helmet'
  | 'hat'
  | 'neck'
  | 'torso'
  | 'waist'
  | 'hand1'
  | 'hand2'
  | 'armband';

export const EGO_GIFT_SLOTS: { id: EgoGiftSlot; name: string; type: 'set' | 'buff'; description: string }[] = [
  { id: 'left_back',   name: 'Left Back',   type: 'set', description: 'Left shoulder blade attachment' },
  { id: 'right_back',  name: 'Right Back',  type: 'set', description: 'Right shoulder blade attachment' },
  { id: 'mouth',       name: 'Mouth',       type: 'set', description: 'Oral accessories and face coverings' },
  { id: 'mouth2',      name: 'Mouth 2',     type: 'set', description: 'Secondary oral accessories' },
  { id: 'face',        name: 'Face',        type: 'set', description: 'Facial adornments and masks' },
  { id: 'eye',         name: 'Eye',         type: 'set', description: 'Eye-related accessories' },
  { id: 'cheek',       name: 'Cheek',       type: 'set', description: 'Cheek and cheekbone attachments' },
  { id: 'helmet',      name: 'Helmet',      type: 'set', description: 'Head and helmet attachments' },
  { id: 'hat',         name: 'Hat',         type: 'set', description: 'Headwear and hats' },
  { id: 'neck',        name: 'Neck',        type: 'set', description: 'Neck and throat accessories' },
  { id: 'torso',       name: 'Torso',       type: 'set', description: 'Chest and body attachments' },
  { id: 'waist',       name: 'Waist',       type: 'set', description: 'Waist and belt accessories' },
  { id: 'hand1',       name: 'Hand 1',      type: 'set', description: 'Right hand attachments' },
  { id: 'hand2',       name: 'Hand 2',      type: 'set', description: 'Left hand attachments' },
  { id: 'armband',     name: 'Armband',     type: 'buff', description: 'Arm and shoulder accessories' },
];

// ─── Gift Stats ──────────────────────────────────────────────────────
export interface EgoGiftStats {
  hp?: number;
  atk?: number;
  def?: number;
  spd?: number;
  sanity?: number;
  resistRed?: number;
  resistPale?: number;
  resistBlack?: number;
  resistWhite?: number;
  clashPower?: number;
  healBonus?: number;
  // Legacy fields (converted)
  fortitude?: number;
  prudence?: number;
  temperance?: number;
  justice?: number;
}

export interface EgoGift {
  id: string;
  name: string;
  slot: EgoGiftSlot;
  set: string | null;
  rarity: 'SR' | 'SSR' | 'HE' | 'WAW' | 'ALEPH' | 'TETH' | 'ZAYIN';
  stats: EgoGiftStats;
  description: string;
  icon: string;
  cost: number;
  classRequirement?: CombatCategory;
  special?: string;
}

// ─── Resonance Stats (for gift resonance) ──────────────────────────────
export const RESONANCE_STATS: Record<string, { atk: number; hp: number; def: number; spd?: number; crit?: number }> = {
  ATK: { atk: 15, hp: 0, def: 0 },
  HP: { atk: 0, hp: 80, def: 0 },
  DEF: { atk: 0, hp: 0, def: 10 },
  SPD: { atk: 0, hp: 0, def: 0, spd: 8 },
  CRIT: { atk: 0, hp: 0, def: 0, crit: 5 },
  CLASH: { atk: 0, hp: 0, def: 0, spd: 0, crit: 0 },
};

// ─── Hypertune Levels ──────────────────────────────────────────────────
export interface HypertuneLevel {
  level: number;
  cost: number;
  stats: { atk: number; hp: number; def: number; spd?: number; crit?: number };
}

export const HYPERTUNE_LEVELS: HypertuneLevel[] = [
  { level: 0, cost: 0, stats: { atk: 0, hp: 0, def: 0 } },
  { level: 1, cost: 500, stats: { atk: 10, hp: 50, def: 5 } },
  { level: 2, cost: 1000, stats: { atk: 20, hp: 100, def: 10 } },
  { level: 3, cost: 2000, stats: { atk: 35, hp: 175, def: 15 } },
  { level: 4, cost: 3500, stats: { atk: 50, hp: 250, def: 25 } },
  { level: 5, cost: 5000, stats: { atk: 70, hp: 350, def: 35 } },
];

// ─── Set Bonuses ──────────────────────────────────────────────────────
export interface SetBonus {
  pieces: number;        // 2, 4, or 6
  description: string;
  effect: string;
}

export const setBonuses: Record<string, SetBonus[]> = {
  // ═══════════════════════════════════════════════════════════════════
  // FUNERAL OF THE DEAD BUTTERFLIES – "Solemn Lament"
  // ═══════════════════════════════════════════════════════════════════
  'Funeral of the Dead Butterflies': [
    { pieces: 2, description: 'ATK +5%, HP +5%', effect: 'atk_pct:0.05,hp_pct:0.05' },
    { pieces: 4, description: 'EGO skills deal +30% damage to enemies with Wither. Gain 1 Resolve on Ego cast.', effect: 'wither_bonus:0.30,resolve_on_ego:1' },
    { pieces: 6, description: 'All damage +10%. Wither reduces enemy ATK by an additional 3% per stack. EGO skills ignore 20% DEF.', effect: 'all_dmg:0.10,wither_atk:0.03,def_ignore:0.20' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // DA CAPO – "Da Capo"
  // ═══════════════════════════════════════════════════════════════════
  'Da Capo': [
    { pieces: 2, description: 'Sanity +10, Heal Bonus +5%', effect: 'sanity:10,heal_pct:0.05' },
    { pieces: 4, description: 'EGO skills absorb 50% of White damage as healing. Gain 2 Resolve on Ego cast.', effect: 'white_absorb:0.50,resolve_on_ego:2' },
    { pieces: 6, description: 'All White damage +15%. +20% healing received. EGO skills cleanse all debuffs from allies.', effect: 'white_dmg:0.15,heal_bonus:0.20,cleanse_allies:true' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // TWILIGHT – "Twilight"
  // ═══════════════════════════════════════════════════════════════════
  'Twilight': [
    { pieces: 2, description: 'ATK +5%, All Element DMG +5%', effect: 'atk_pct:0.05,all_element_dmg:0.05' },
    { pieces: 4, description: 'EGO skills deal +35% damage. Gain 1 Golden Heart Will on Ego cast.', effect: 'ego_dmg:0.35,golden_heart:1' },
    { pieces: 6, description: 'All Pale damage +15%. Coin Power +2. EGO skills ignore 25% DEF.', effect: 'pale_dmg:0.15,coin_power:2,def_ignore:0.25' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // PARADISE LOST – "Paradise Lost"
  // ═══════════════════════════════════════════════════════════════════
  'Paradise Lost': [
    { pieces: 2, description: 'HP +10%, ATK +5%', effect: 'hp_pct:0.10,atk_pct:0.05' },
    { pieces: 4, description: 'EGO skills deal +30% damage. Shield allies for 25% max HP on Ego cast.', effect: 'ego_dmg:0.30,shield:0.25' },
    { pieces: 6, description: 'All damage +15%. Coin Power +3. EGO skills heal allies for 20% max HP.', effect: 'all_dmg:0.15,coin_power:3,ego_heal:0.20' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // MIMICRY – "Mimicry"
  // ═══════════════════════════════════════════════════════════════════
  'Mimicry': [
    { pieces: 2, description: 'HP +8%, Heal Bonus +5%', effect: 'hp_pct:0.08,heal_pct:0.05' },
    { pieces: 4, description: 'EGO skills deal +25% damage. Gain 10% lifesteal on Ego cast for 2 turns.', effect: 'ego_dmg:0.25,lifesteal:0.10' },
    { pieces: 6, description: 'All damage +10%. Healing received +25%. EGO skills heal allies for 15% max HP.', effect: 'all_dmg:0.10,heal_bonus:0.25,ego_heal:0.15' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // JUSTITIA – "Justitia"
  // ═══════════════════════════════════════════════════════════════════
  'Justitia': [
    { pieces: 2, description: 'ATK +5%, Clash Power +2', effect: 'atk_pct:0.05,clash_power:2' },
    { pieces: 4, description: 'EGO skills gain +30% damage. Apply 3 Weaken on Ego cast.', effect: 'ego_dmg:0.30,weaken_apply:3' },
    { pieces: 6, description: 'All damage +10%. Clash Power +3. EGO skills ignore 25% DEF.', effect: 'all_dmg:0.10,clash_power:3,def_ignore:0.25' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // CENSORED – "[CENSORED]"
  // ═══════════════════════════════════════════════════════════════════
  'CENSORED': [
    { pieces: 2, description: 'Sanity +15, Heal Bonus +5%', effect: 'sanity:15,heal_pct:0.05' },
    { pieces: 4, description: 'EGO skills deal +30% damage to enemies with mental debuffs. Gain 2 Resolve on Ego cast.', effect: 'mental_debuff_bonus:0.30,resolve_on_ego:2' },
    { pieces: 6, description: 'All damage +10%. Sanity +20. EGO skills heal allies for 20% max HP.', effect: 'all_dmg:0.10,sanity:20,ego_heal:0.20' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // SOUND OF A STAR – "Sound of a Star"
  // ═══════════════════════════════════════════════════════════════════
  'Sound of a Star': [
    { pieces: 2, description: 'ATK +5%, All Element DMG +5%', effect: 'atk_pct:0.05,all_element_dmg:0.05' },
    { pieces: 4, description: 'EGO skills deal +30% damage. Gain 1 Golden Heart Will on Ego cast.', effect: 'ego_dmg:0.30,golden_heart:1' },
    { pieces: 6, description: 'All damage +10%. Coin Power +3. EGO skills apply 3 Bleed to all enemies.', effect: 'all_dmg:0.10,coin_power:3,bleed_apply:3' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // ADORATION – "Adoration"
  // ═══════════════════════════════════════════════════════════════════
  'Adoration': [
    { pieces: 2, description: 'Sanity +10, HP +5%', effect: 'sanity:10,hp_pct:0.05' },
    { pieces: 4, description: 'EGO skills deal +25% damage. Shield allies for 20% max HP on Ego cast.', effect: 'ego_dmg:0.25,shield:0.20' },
    { pieces: 6, description: 'All damage +10%. Sanity +15. EGO skills cleanse debuffs from all allies.', effect: 'all_dmg:0.10,sanity:15,cleanse_allies:true' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // CRIMSON SCAR – "Crimson Scar"
  // ═══════════════════════════════════════════════════════════════════
  'Crimson Scar': [
    { pieces: 2, description: 'ATK +3%, Crit Rate +3%', effect: 'atk_pct:0.03,crit_rate:0.03' },
    { pieces: 4, description: 'EGO skills detonate Bleed stacks for 200% damage. Apply 3 Bleed on Ego cast.', effect: 'bleed_detonate:2.00,bleed_apply:3' },
    { pieces: 6, description: 'Bleed DMG +40%. +15% crit damage. EGO skills heal for 20% of damage dealt.', effect: 'bleed_dmg:0.40,crit_dmg:0.15,heal_on_dmg:0.20' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // FALSE THRONE – "False Throne"
  // ═══════════════════════════════════════════════════════════════════
  'False Throne': [
    { pieces: 2, description: 'All Stats +3%', effect: 'all_stats:0.03' },
    { pieces: 4, description: 'EGO skills deal +30% damage. Shield allies for 30% max HP on Ego cast.', effect: 'ego_dmg:0.30,shield:0.30' },
    { pieces: 6, description: 'All damage +15%. All Stats +5%. EGO skills revive one ally at 30% HP.', effect: 'all_dmg:0.15,all_stats:0.05,revive:0.30' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // DIPSIA – "Dipsia"
  // ═══════════════════════════════════════════════════════════════════
  'Dipsia': [
    { pieces: 2, description: 'ATK +5%, HP +5%', effect: 'atk_pct:0.05,hp_pct:0.05' },
    { pieces: 4, description: 'EGO skills deal +25% damage. Apply 3 Weaken on Ego cast.', effect: 'ego_dmg:0.25,weaken_apply:3' },
    { pieces: 6, description: 'All damage +10%. Coin Power +2. EGO skills heal allies for 15% max HP.', effect: 'all_dmg:0.10,coin_power:2,ego_heal:0.15' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // HARMONY – "Harmony"
  // ═══════════════════════════════════════════════════════════════════
  'Harmony': [
    { pieces: 2, description: 'HP +8%, Healing +5%', effect: 'hp_pct:0.08,heal_pct:0.05' },
    { pieces: 4, description: 'EGO skills heal allies for 30% of damage dealt. Apply 2 Harmony on Ego cast.', effect: 'heal_on_dmg:0.30,harmony_apply:2' },
    { pieces: 6, description: 'All damage +10%. Heal Bonus +20%. EGO skills cleanse all debuffs from allies.', effect: 'all_dmg:0.10,heal_bonus:0.20,cleanse_allies:true' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // PINK – "Pink"
  // ═══════════════════════════════════════════════════════════════════
  'Pink': [
    { pieces: 2, description: 'ATK +5%, Sanity +5', effect: 'atk_pct:0.05,sanity:5' },
    { pieces: 4, description: 'EGO skills deal +30% damage. Gain 2 Resolve on Ego cast.', effect: 'ego_dmg:0.30,resolve_on_ego:2' },
    { pieces: 6, description: 'All damage +10%. Sanity +10. EGO skills apply 3 Bleed to all enemies.', effect: 'all_dmg:0.10,sanity:10,bleed_apply:3' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // HYPOCRISY – "Hypocrisy"
  // ═══════════════════════════════════════════════════════════════════
  'Hypocrisy': [
    { pieces: 2, description: 'HP +5%, Sanity +5', effect: 'hp_pct:0.05,sanity:5' },
    { pieces: 4, description: 'EGO skills deal +25% damage to enemies with debuffs. Apply 3 Weaken on Ego cast.', effect: 'debuff_bonus:0.25,weaken_apply:3' },
    { pieces: 6, description: 'All damage +10%. Sanity +10. EGO skills shield allies for 20% max HP.', effect: 'all_dmg:0.10,sanity:10,shield:0.20' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // MAGIC BULLET – "Magic Bullet"
  // ═══════════════════════════════════════════════════════════════════
  'Magic Bullet': [
    { pieces: 2, description: 'ATK +5%, Crit Rate +3%', effect: 'atk_pct:0.05,crit_rate:0.03' },
    { pieces: 4, description: 'EGO skills deal +35% damage. Gain 1 Golden Heart Will on Ego cast.', effect: 'ego_dmg:0.35,golden_heart:1' },
    { pieces: 6, description: 'All damage +10%. Crit Rate +5%. EGO skills ignore 20% DEF.', effect: 'all_dmg:0.10,crit_rate:0.05,def_ignore:0.20' },
  ],

  // ═══════════════════════════════════════════════════════════════════
  // CLASS-SPECIFIC BUFF SETS (armband only)
  // ═══════════════════════════════════════════════════════════════════
  "Attacker's Edge": [
    { pieces: 1, description: 'ATK +5%, Crit Rate +5%', effect: 'atk_pct:0.05,crit_rate:0.05' },
  ],
  "Tank's Bastion": [
    { pieces: 1, description: 'DEF +10%, HP +10%', effect: 'def_pct:0.10,hp_pct:0.10' },
  ],
  "Amplifier's Resonance": [
    { pieces: 1, description: 'Element DMG +10%, Healing +5%', effect: 'element_dmg:0.10,heal_pct:0.05' },
  ],
  "Support's Grace": [
    { pieces: 1, description: 'Healing +10%, SPD +10%', effect: 'heal_pct:0.10,spd_pct:0.10' },
  ],
};

// ─── Legacy Stat Conversion ────────────────────────────────────────────
export function convertLegacyStats(stats: EgoGiftStats): EgoGiftStats {
  const result: EgoGiftStats = { ...stats };
  if (stats.fortitude !== undefined) {
    result.hp = (result.hp || 0) + stats.fortitude * 10;
    delete result.fortitude;
  }
  if (stats.prudence !== undefined) {
    result.sanity = (result.sanity || 0) + stats.prudence * 5;
    delete result.prudence;
  }
  if (stats.temperance !== undefined) {
    result.healBonus = (result.healBonus || 0) + stats.temperance * 2;
    delete result.temperance;
  }
  if (stats.justice !== undefined) {
    result.atk = (result.atk || 0) + stats.justice * 2;
    result.clashPower = (result.clashPower || 0) + stats.justice * 1;
    delete result.justice;
  }
  return result;
}

// ─── All Ego Gifts ──────────────────────────────────────────────────────
export const egoGifts: EgoGift[] = [
  // ═══ FUNERAL OF THE DEAD BUTTERFLIES ═══════════════════════════════
  {
    id: 'solemn_lament_gift',
    name: 'Solemn Lament',
    slot: 'right_back',
    set: 'Funeral of the Dead Butterflies',
    rarity: 'HE',
    stats: { fortitude: 1, prudence: 1, temperance: 2, justice: 2 },
    description: 'A tearful requiem from the dead butterflies. Increases work success and attack weight.',
    icon: '💀',
    cost: 800,
    special: 'From Funeral of the Dead Butterflies.',
  },
  {
    id: 'penitence_gift',
    name: 'Penitence',
    slot: 'hat',
    set: 'Funeral of the Dead Butterflies',
    rarity: 'ZAYIN',
    stats: { prudence: 2 },
    description: 'A crown of thorns that brings penitence. Success rate +10% when working with the corresponding abnormality.',
    icon: '🙏',
    cost: 300,
    special: 'From Funeral of the Dead Butterflies.',
  },
  {
    id: 'regret_gift',
    name: 'Regret',
    slot: 'mouth',
    set: 'Funeral of the Dead Butterflies',
    rarity: 'TETH',
    stats: { fortitude: 2, prudence: 2 },
    description: 'The weight of regret manifests physically. Boosts HP and SP.',
    icon: '😔',
    cost: 500,
    special: 'From Funeral of the Dead Butterflies.',
  },
  {
    id: 'beak_gift',
    name: 'Beak',
    slot: 'neck',
    set: 'Funeral of the Dead Butterflies',
    rarity: 'TETH',
    stats: { justice: 2 },
    description: 'A beak that pecks at the remains of the dead. Improves coin power.',
    icon: '🐦',
    cost: 500,
    special: 'From Funeral of the Dead Butterflies.',
  },
  {
    id: 'frag_from_somewhere_gift',
    name: 'Fragments from Somewhere',
    slot: 'torso',
    set: 'Funeral of the Dead Butterflies',
    rarity: 'TETH',
    stats: { temperance: 4 },
    description: 'Shattered memories of a forgotten funeral. Increases Work Success Rate and Speed.',
    icon: '🧩',
    cost: 500,
    special: 'From Funeral of the Dead Butterflies.',
  },

  // ═══ DA CAPO ═══════════════════════════════════════════════════════
  {
    id: 'da_capo',
    name: 'Da Capo',
    slot: 'eye',
    set: 'Da Capo',
    rarity: 'ALEPH',
    stats: { temperance: 4 },
    description: 'The song that loops eternally. Absorbs all White damage (converts to healing) when the suit is equipped.',
    icon: '🎵',
    cost: 3000,
    special: 'From Da Capo.',
  },
  {
    id: 'dead_silence',
    name: 'Dead Silence',
    slot: 'neck',
    set: 'Da Capo',
    rarity: 'WAW',
    stats: { prudence: 3 },
    description: 'The silence after the song ends. +3 SP. 10% chance to reduce target SP by 5 on damage.',
    icon: '🤫',
    cost: 2000,
    special: 'From Da Capo.',
  },
  {
    id: 'faint_aroma_gift',
    name: 'Faint Aroma',
    slot: 'face',
    set: 'Da Capo',
    rarity: 'WAW',
    stats: { temperance: 2, prudence: 4 },
    description: 'A lingering scent of the eternal performance. Increases Temperance and Prudence.',
    icon: '🌸',
    cost: 2000,
    special: 'From Da Capo.',
  },
  {
    id: 'laetitia_gift',
    name: 'Laetitia',
    slot: 'helmet',
    set: 'Da Capo',
    rarity: 'HE',
    stats: { prudence: 4 },
    description: 'Joy in the face of eternity. Increases SP by 4.',
    icon: '🌈',
    cost: 800,
    special: 'From Da Capo.',
  },

  // ═══ TWILIGHT ══════════════════════════════════════════════════════
  {
    id: 'twilight_gift',
    name: 'Twilight',
    slot: 'right_back',
    set: 'Twilight',
    rarity: 'ALEPH',
    stats: { fortitude: 7, prudence: 7, temperance: 7, justice: 7 },
    description: 'The light that exists between day and night. +7 to all stats; +7 Coin Power.',
    icon: '🌅',
    cost: 3500,
    special: 'From Twilight.',
  },
  {
    id: 'sound_of_a_star_gift',
    name: 'Sound of a Star',
    slot: 'eye',
    set: 'Twilight',
    rarity: 'ALEPH',
    stats: { justice: 11 },
    description: 'The melody of a dying star. Justice +11 – dramatically increases coin power.',
    icon: '⭐',
    cost: 3500,
    special: 'From Sound of a Star.',
  },
  {
    id: 'dipsia_gift',
    name: 'Dipsia',
    slot: 'hat',
    set: 'Twilight',
    rarity: 'WAW',
    stats: { justice: 8 },
    description: 'The thirst for the end. Justice +8 – improves attack weight and coin power.',
    icon: '🍷',
    cost: 2000,
    special: 'From Dipsia.',
  },
  {
    id: 'justitia_gift',
    name: 'Justitia',
    slot: 'eye',
    set: 'Twilight',
    rarity: 'WAW',
    stats: { justice: 6 },
    description: 'The scales of judgment. Justice +6 – improves coin power and attack weight.',
    icon: '⚖️',
    cost: 2000,
    special: 'From Justitia.',
  },

  // ═══ PARADISE LOST ═════════════════════════════════════════════════
  {
    id: 'paradise_lost_gift',
    name: 'Paradise Lost',
    slot: 'left_back',
    set: 'Paradise Lost',
    rarity: 'ALEPH',
    stats: { fortitude: 10, prudence: 10, temperance: 10, justice: 10 },
    description: 'The fallen garden of Eden. +10 to all stats; +10 Coin Power.',
    icon: '😇',
    cost: 4000,
    special: 'From Paradise Lost.',
  },
  {
    id: 'false_throne_gift',
    name: 'False Throne',
    slot: 'torso',
    set: 'Paradise Lost',
    rarity: 'ALEPH',
    stats: { fortitude: 9, prudence: 9, temperance: 9, justice: 9 },
    description: 'A throne built on lies. +9 to all stats – enhances HP, SP, work success, and damage.',
    icon: '👑',
    cost: 4000,
    special: 'From False Throne.',
  },
  {
    id: 'contempt_awe_gift',
    name: 'Awe',
    slot: 'hat',
    set: 'Paradise Lost',
    rarity: 'ALEPH',
    stats: { fortitude: 8, prudence: 5, temperance: 7, justice: 4 },
    description: 'The fear and reverence of the divine. Balanced stat boost.',
    icon: '🌀',
    cost: 3500,
    special: 'From Contempt, Awe.',
  },

  // ═══ MIMICRY ══════════════════════════════════════════════════════
  {
    id: 'smile_gift',
    name: 'Smile',
    slot: 'eye',
    set: 'Mimicry',
    rarity: 'ALEPH',
    stats: { fortitude: 5, prudence: 5 },
    description: 'A smile that never reaches the eyes. HP +5, SP +5.',
    icon: '😊',
    cost: 3000,
    special: 'From Mimicry.',
  },
  {
    id: 'mimicry_gift',
    name: 'Mimicry',
    slot: 'cheek',
    set: 'Mimicry',
    rarity: 'ALEPH',
    stats: { fortitude: 1 },
    description: 'The face that mirrors others. HP +10 and +5% healing received.',
    icon: '🎭',
    cost: 3000,
    special: 'From Mimicry.',
  },
  {
    id: 'gold_rush_gift',
    name: 'Gold Rush',
    slot: 'hand1',
    set: 'Mimicry',
    rarity: 'WAW',
    stats: { fortitude: 6 },
    description: 'The greed that consumes. HP +6. Instinct work success rate +6%.',
    icon: '💰',
    cost: 2000,
    special: 'From Gold Rush.',
  },
  {
    id: 'cobalt_scar_gift',
    name: 'Cobalt Scar',
    slot: 'face',
    set: 'Mimicry',
    rarity: 'WAW',
    stats: { fortitude: 4, justice: 2 },
    description: 'A scar that never heals. Fortitude +4, Justice +2 – boosts HP and attack.',
    icon: '💙',
    cost: 2000,
    special: 'From Cobalt Scar.',
  },
  {
    id: 'crimson_scar_gift',
    name: 'Crimson Scar',
    slot: 'mouth',
    set: 'Mimicry',
    rarity: 'WAW',
    stats: { fortitude: 3, justice: 3 },
    description: 'A wound that still bleeds. Fortitude +3, Justice +3 – increases HP and attack.',
    icon: '❤️',
    cost: 2000,
    special: 'From Crimson Scar.',
  },
  {
    id: 'hypocrisy_gift',
    name: 'Hypocrisy',
    slot: 'helmet',
    set: 'Mimicry',
    rarity: 'WAW',
    stats: { fortitude: 3, prudence: 3 },
    description: 'The mask of virtue. HP +3, SP +3.',
    icon: '🎭',
    cost: 2000,
    special: 'From Hypocrisy.',
  },

  // ═══ JUSTITIA ══════════════════════════════════════════════════════
  {
    id: 'hatred_gift',
    name: 'In the name of love and hate',
    slot: 'hat',
    set: 'Justitia',
    rarity: 'WAW',
    stats: { temperance: 2, justice: 4 },
    description: 'A name that holds both love and hate. Increases Temperance and Justice.',
    icon: '❤️‍🔥',
    cost: 2000,
    special: 'From In the name of love and hate.',
  },
  {
    id: 'magic_bullet_gift',
    name: 'Magic Bullet',
    slot: 'mouth2',
    set: 'Justitia',
    rarity: 'HE',
    stats: { justice: 10 },
    description: 'A bullet that always finds its mark. Justice +10.',
    icon: '🔫',
    cost: 800,
    special: 'From Magic Bullet.',
  },
  {
    id: 'kod_gift',
    name: 'The Sword Sharpened with Tears',
    slot: 'cheek',
    set: 'Justitia',
    rarity: 'WAW',
    stats: { justice: 4 },
    description: 'A blade forged from sorrow. SP +2, Justice +4.',
    icon: '⚔️',
    cost: 2000,
    special: 'From The Sword Sharpened with Tears.',
  },
  {
    id: 'midsummer_gift',
    name: 'Midsummer',
    slot: 'waist',
    set: 'Justitia',
    rarity: 'ALEPH',
    stats: { justice: 16 },
    description: 'The peak of the sun\'s fury. Justice +16 – dramatically increases attack weight and coin power.',
    icon: '🌺',
    cost: 3500,
    special: 'From Midsummer.',
  },

  // ═══ CENSORED ══════════════════════════════════════════════════════
  {
    id: 'censored_gift',
    name: '[CENSORED]',
    slot: 'eye',
    set: 'CENSORED',
    rarity: 'ALEPH',
    stats: { prudence: 15 },
    description: 'That which cannot be named. SP +15. Grants resistance to mental attacks.',
    icon: '❓',
    cost: 3500,
    special: 'From [CENSORED].',
  },
  {
    id: 'adoration_gift',
    name: 'Adoration',
    slot: 'helmet',
    set: 'CENSORED',
    rarity: 'ALEPH',
    stats: { fortitude: 5, prudence: 10 },
    description: 'The worship of the unknown. Fortitude +5, Prudence +10 – significantly boosts HP and SP.',
    icon: '✨',
    cost: 3000,
    special: 'From Adoration.',
  },
  {
    id: 'hornet_gift',
    name: 'Hornet',
    slot: 'helmet',
    set: 'CENSORED',
    rarity: 'WAW',
    stats: { fortitude: 2, prudence: 4 },
    description: 'The sting of the forgotten. HP +2, SP +4. Increases work success slightly.',
    icon: '🐝',
    cost: 2000,
    special: 'From Hornet.',
  },

  // ═══ FALSE THRONE ══════════════════════════════════════════════════
  {
    id: 'false_throne_gift',
    name: 'False Throne',
    slot: 'torso',
    set: 'False Throne',
    rarity: 'ALEPH',
    stats: { fortitude: 9, prudence: 9, temperance: 9, justice: 9 },
    description: 'A throne that was never meant to be sat upon. +9 to all stats.',
    icon: '👑',
    cost: 4000,
    special: 'From False Throne.',
  },
  {
    id: 'paradise_lost_gift',
    name: 'Paradise Lost',
    slot: 'left_back',
    set: 'False Throne',
    rarity: 'ALEPH',
    stats: { fortitude: 10, prudence: 10, temperance: 10, justice: 10 },
    description: 'The memory of what was lost. +10 to all stats.',
    icon: '😇',
    cost: 4000,
    special: 'From Paradise Lost.',
  },

  // ═══ HARMONY ═══════════════════════════════════════════════════════
  {
    id: 'harmony_gift',
    name: 'Harmony',
    slot: 'cheek',
    set: 'Harmony',
    rarity: 'HE',
    stats: { fortitude: 8 },
    description: 'The balance of all things. HP +8.',
    icon: '☯️',
    cost: 800,
    special: 'From Harmony.',
  },

  // ═══ PINK ══════════════════════════════════════════════════════════
  {
    id: 'pink_gift',
    name: 'Pink',
    slot: 'helmet',
    set: 'Pink',
    rarity: 'ALEPH',
    stats: { justice: 10 },
    description: 'The color of the abyss. Justice +10 – Increases weapon damage by 15% when the corresponding armor is equipped.',
    icon: '🩷',
    cost: 3000,
    special: 'From Pink.',
  },

  // ═══ UNASSIGNED GIFTS (no set bonus) ══════════════════════════════
  {
    id: 'our_galaxy_gift',
    name: 'Our Galaxy',
    slot: 'neck',
    set: null,
    rarity: 'HE',
    stats: { fortitude: 2, temperance: 2 },
    description: 'A galaxy contained in a single gift. Success Rate +3, Work Speed +3. Heals HP at intervals.',
    icon: '🌌',
    cost: 800,
    special: 'From Our Galaxy.',
  },
  {
    id: 'wrist_cutter_gift',
    name: 'Wrist Cutter',
    slot: 'hand2',
    set: null,
    rarity: 'TETH',
    stats: { temperance: 4 },
    description: 'A blade that cuts the bonds of fate. Success rate +2% (each temperance point gives 0.5% success).',
    icon: '🔪',
    cost: 500,
    special: 'From Wrist Cutter.',
  },
  {
    id: 'lamp_gift',
    name: 'Lamp',
    slot: 'helmet',
    set: null,
    rarity: 'WAW',
    stats: { fortitude: 3, temperance: 6 },
    description: 'A lamp that illuminates the path. HP +3, Success Rate +3%.',
    icon: '🪔',
    cost: 2000,
    special: 'From Lamp.',
  },
  {
    id: 'red_eyes_gift',
    name: 'Red Eyes',
    slot: 'eye',
    set: null,
    rarity: 'TETH',
    stats: { temperance: 3 },
    description: 'Eyes that see through the darkness. Temperance +3 – increases attachment work success.',
    icon: '👁️',
    cost: 500,
    special: 'From Red Eyes.',
  },
  {
    id: 'logging_gift',
    name: 'Logging',
    slot: 'torso',
    set: null,
    rarity: 'HE',
    stats: { fortitude: 2, temperance: 4 },
    description: 'The records of the past. HP +2, Success Rate +2, Work Speed +2.',
    icon: '🪵',
    cost: 800,
    special: 'From Logging.',
  },
  {
    id: 'harvest_gift',
    name: 'Harvest',
    slot: 'neck',
    set: null,
    rarity: 'HE',
    stats: { prudence: 4 },
    description: 'The gathering of souls. SP +4.',
    icon: '🌾',
    cost: 800,
    special: 'From Harvest.',
  },
  {
    id: 'soda_gift',
    name: 'Soda',
    slot: 'mouth2',
    set: null,
    rarity: 'ZAYIN',
    stats: { fortitude: 2 },
    description: 'The sweetness of oblivion. HP +2.',
    icon: '🥤',
    cost: 300,
    special: 'From Soda.',
  },

  // ═══ CLASS-SPECIFIC BUFF GIFTS (armband) ══════════════════════════
  {
    id: 'attackers_edge_armband',
    name: 'Edge Armband',
    slot: 'armband',
    set: "Attacker's Edge",
    rarity: 'SSR',
    stats: { atk: 140, spd: 12 },
    description: 'An armband that hones the killer instinct. For Attackers only.',
    icon: '🗡️',
    cost: 2000,
    classRequirement: 'Attacker',
  },
  {
    id: 'tanks_bastion_armband',
    name: 'Bastion Armband',
    slot: 'armband',
    set: "Tank's Bastion",
    rarity: 'SSR',
    stats: { def: 150, hp: 500 },
    description: 'An armband that has weathered a thousand sieges. For Tanks only.',
    icon: '🛡️',
    cost: 2000,
    classRequirement: 'Tank',
  },
  {
    id: 'amplifiers_resonance_armband',
    name: 'Resonance Armband',
    slot: 'armband',
    set: "Amplifier's Resonance",
    rarity: 'SSR',
    stats: { atk: 100, hp: 400 },
    description: 'An armband that amplifies elemental resonance. For Amplifiers only.',
    icon: '💎',
    cost: 2000,
    classRequirement: 'Amplifier',
  },
  {
    id: 'supports_grace_armband',
    name: 'Grace Armband',
    slot: 'armband',
    set: "Support's Grace",
    rarity: 'SSR',
    stats: { hp: 600, spd: 20 },
    description: 'An armband of healing and hope. For Supports only.',
    icon: '🪄',
    cost: 2000,
    classRequirement: 'Support',
  },
];

// ─── Helper Functions ──────────────────────────────────────────────────
export function getSetGifts(setName: string): EgoGift[] {
  return egoGifts.filter(g => g.set === setName);
}

export function getClassGiftsForCategory(category: CombatCategory): EgoGift[] {
  return egoGifts.filter(g => g.classRequirement === category);
}

export function getSetCounts(equippedGifts: EgoGift[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const gift of equippedGifts) {
    if (gift.set) {
      counts[gift.set] = (counts[gift.set] || 0) + 1;
    }
  }
  return counts;
}

export function isSetBonusActive(
  setName: string,
  piecesEquipped: number,
  isHarmonized: boolean = false
): { twoPcActive: boolean; fourPcActive: boolean; sixPcActive: boolean } {
  const bonuses = setBonuses[setName];
  if (!bonuses) return { twoPcActive: false, fourPcActive: false, sixPcActive: false };
  const has2 = bonuses.some(b => b.pieces === 2);
  const has4 = bonuses.some(b => b.pieces === 4);
  const has6 = bonuses.some(b => b.pieces === 6);
  return {
    twoPcActive: piecesEquipped >= 2 && has2,
    fourPcActive: piecesEquipped >= 4 && has4 && isHarmonized,
    sixPcActive: piecesEquipped >= 6 && has6 && isHarmonized,
  };
}

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

// ─── Gift Stats – includes resistances ──────────────────────────────
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
  signatureFor?: string;
  classRequirement?: CombatCategory;
  special?: string;
}

// ─── Set Bonuses ──────────────────────────────────────────────────────
export interface SetBonus {
  pieces: number;
  description: string;
  effect: string;
}

export const setBonuses: Record<string, SetBonus[]> = {
  // ARTHUR
  'Excalibur Sovereign': [
    { pieces: 2, description: 'ATK +5%, Pale DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'True Execution +100% vs Wither. +2 Resolve on Ego.', effect: 'execution_wither_bonus:1.00,resolve_on_ego:2' },
    { pieces: 6, description: 'Pale DMG +15%. Wither cap 15. True Execution ignores 30% DEF.', effect: 'pale_dmg:0.15,wither_cap:15,def_ignore:0.30' },
  ],
  'Weeping Garden': [
    { pieces: 2, description: 'ATK +5%, Healing +5%', effect: 'atk_pct:0.05,heal_pct:0.05' },
    { pieces: 4, description: 'Bleed detonate 300%. +2 Resolve on Ego.', effect: 'bleed_detonate:3.00,resolve_on_ego:2' },
    { pieces: 6, description: 'Bleed DMG +50%. Bleed heals 10%. Ego revives 30% HP.', effect: 'bleed_dmg:0.50,bleed_heal:0.10,revive:0.30' },
  ],
  'Eclipse of Oblivion': [
    { pieces: 2, description: 'ATK +5%, Dark DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: '+50% dmg per 10 Shadow Marks. +5 Marks on Ego.', effect: 'shadow_mark_dmg:0.50,shadow_mark_apply:5' },
    { pieces: 6, description: 'Shadow cap 12. +30% crit vs 8+ Marks. +2 Eclipse on Ego.', effect: 'shadow_cap:12,shadow_crit:0.30,eclipse_on_ego:2' },
  ],
  'Dawn of Sacrifice': [
    { pieces: 2, description: 'ATK +5%, DEF +5%', effect: 'atk_pct:0.05,def_pct:0.05' },
    { pieces: 4, description: '50% shield, +30% heal, cleanse on Ego.', effect: 'shield:0.50,heal_buff:0.30,cleanse_allies:true' },
    { pieces: 6, description: 'Shield +25%. Radiance = +5% ATK/stack. Ego heals 30%.', effect: 'shield_bonus:0.25,radiance_atk:0.05,ego_heal:0.30' },
  ],
  'Crimson Carnage': [
    { pieces: 2, description: 'ATK +5%, Crit +5%', effect: 'atk_pct:0.05,crit_rate:0.05' },
    { pieces: 4, description: '+25% dmg per 5 Fury. +2 Golden Heart on Ego.', effect: 'fury_dmg:0.25,golden_heart:2' },
    { pieces: 6, description: 'Fury cap 15. +50% crit at 10 Fury. +5 Hemorrhage on Ego.', effect: 'fury_cap:15,fury_crit:0.50,hemorrhage_apply:5' },
  ],
  'Drowned Cathedral': [
    { pieces: 2, description: 'ATK +5%, DEF +5%', effect: 'atk_pct:0.05,def_pct:0.05' },
    { pieces: 4, description: '+50% vs 8+ Drowning. 30% shield on Ego.', effect: 'drowning_dmg:0.50,shield:0.30' },
    { pieces: 6, description: 'Drowning -5% ATK/stack. Shield +20%. +5 Drowning on Ego.', effect: 'drowning_atk:0.05,shield_bonus:0.20,drowning_apply:5' },
  ],
  'Unchained Rage': [
    { pieces: 2, description: 'ATK +5%, HP +5%', effect: 'atk_pct:0.05,hp_pct:0.05' },
    { pieces: 4, description: '+15% dmg per Rage. +5 Bleed + 50% heal on Ego.', effect: 'rage_dmg:0.15,bleed_apply:5,heal:0.50' },
    { pieces: 6, description: 'Rage cap 10. +20% lifesteal at 5 Rage. 30% shield on Ego.', effect: 'rage_cap:10,lifesteal:0.20,shield_allies:0.30' },
  ],
  'Vengeance': [
    { pieces: 2, description: 'ATK +5%, Healing +5%', effect: 'atk_pct:0.05,heal_pct:0.05' },
    { pieces: 4, description: 'Revive 40% HP. +5 Weaken + 3 Resolve on Ego.', effect: 'revive:0.40,weaken_apply:5,resolve:3' },
    { pieces: 6, description: 'Weaken -10% ATK. Resolve +8% dmg/stack. 40% shield on Ego.', effect: 'weaken_atk:0.10,resolve_dmg:0.08,shield:0.40' },
  ],
  'Perfect Balance': [
    { pieces: 2, description: 'ATK +5%, All Element +5%', effect: 'atk_pct:0.05,all_element_dmg:0.05' },
    { pieces: 4, description: '+50% when buffs=debuffs. +3 Harmony/Dissonance on Ego.', effect: 'balance_dmg:0.50,harmony:3,dissonance:3' },
    { pieces: 6, description: 'Harmony +10% ATK/stack. Dissonance -5% DEF/stack. Ego heals 25%.', effect: 'harmony_atk:0.10,dissonance_def:0.05,ego_heal:0.25' },
  ],
  'Blood Shepherd': [
    { pieces: 2, description: 'ATK +5%, Healing +5%', effect: 'atk_pct:0.05,heal_pct:0.05' },
    { pieces: 4, description: '40% heal on damage. +5 Bleed + 2 Golden Heart on Ego.', effect: 'heal_on_dmg:0.40,bleed_apply:5,golden_heart:2' },
    { pieces: 6, description: 'Bleed +40% dmg. +20% heal below 50%. Ego revives 25%.', effect: 'bleed_dmg:0.40,heal_low:0.20,revive:0.25' },
  ],
  'Void Echo': [
    { pieces: 2, description: 'ATK +5%, SPD +5%', effect: 'atk_pct:0.05,spd_pct:0.05' },
    { pieces: 4, description: '+30% dmg per 5 Echo. +5 Echo + 3 Weaken on Ego.', effect: 'echo_dmg:0.30,echo_apply:5,weaken_apply:3' },
    { pieces: 6, description: 'Echo -4% DEF/stack. Weaken cap 6. +2 Shadow on Ego.', effect: 'echo_def:0.04,weaken_cap:6,shadow_apply:2' },
  ],

  // Class-specific buff sets (armband)
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
  // ═══ Generic Gifts (from your JSON) ══════════════════════════════════
  {
    id: 'solemn_lament_gift',
    name: 'Solemn Lament',
    slot: 'right_back',
    set: null,
    rarity: 'HE',
    stats: { fortitude: 1, prudence: 1, temperance: 2, justice: 2 },
    description: 'Increases work success rate and speed, and attack weight.',
    icon: '💀',
    cost: 800,
    special: 'Increases work success rate and speed, and attack weight.',
  },
  {
    id: 'da_capo',
    name: 'Da Capo',
    slot: 'eye',
    set: null,
    rarity: 'ALEPH',
    stats: { temperance: 4 },
    description: 'When the suit "da_capo" is equipped, absorbs all white damage (converts to healing).',
    icon: '🎵',
    cost: 3000,
    special: 'When the suit "da_capo" is equipped, absorbs all white damage (converts to healing).',
  },
  {
    id: 'penitence_gift',
    name: 'Penitence',
    slot: 'hat',
    set: null,
    rarity: 'ZAYIN',
    stats: { prudence: 2 },
    description: 'Success rate increases by 10% when working with the corresponding abnormality.',
    icon: '🙏',
    cost: 300,
    special: 'Success rate increases by 10% when working with the corresponding abnormality.',
  },
  {
    id: 'smile_gift',
    name: 'Smile',
    slot: 'eye',
    set: null,
    rarity: 'ALEPH',
    stats: { fortitude: 5, prudence: 5 },
    description: 'HP +5, SP +5 (approximated as +1 Fortitude and +1 Prudence).',
    icon: '😊',
    cost: 3000,
    special: 'HP +5, SP +5 (approximated as +1 Fortitude and +1 Prudence).',
  },
  {
    id: 'mimicry_gift',
    name: 'Mimicry',
    slot: 'cheek',
    set: null,
    rarity: 'ALEPH',
    stats: { fortitude: 1 },
    description: 'HP +10 and increases all HP healing received by 5%.',
    icon: '🎭',
    cost: 3000,
    special: 'HP +10 and increases all HP healing received by 5%.',
  },
  {
    id: 'twilight_gift',
    name: 'Twilight',
    slot: 'right_back',
    set: null,
    rarity: 'ALEPH',
    stats: { fortitude: 7, prudence: 7, temperance: 7, justice: 7 },
    description: 'HP +7; SP +7; Success Rate +7; Work Speed +7; Attack Weight +7; Coin Power +7',
    icon: '🌅',
    cost: 3500,
    special: 'HP +7; SP +7; Success Rate +7; Work Speed +7; Attack Weight +7; Coin Power +7',
  },
  {
    id: 'our_galaxy_gift',
    name: 'Our Galaxy',
    slot: 'neck',
    set: null,
    rarity: 'HE',
    stats: { fortitude: 2, temperance: 2 },
    description: 'Success Rate +3, Work Speed +3. Heals a small amount of HP at short intervals.',
    icon: '🌌',
    cost: 800,
    special: 'Success Rate +3, Work Speed +3. Heals a small amount of HP at short intervals.',
  },
  {
    id: 'paradise_lost_gift',
    name: 'Paradise Lost',
    slot: 'left_back',
    set: null,
    rarity: 'ALEPH',
    stats: { fortitude: 10, prudence: 10, temperance: 10, justice: 10 },
    description: 'HP +10; SP +10; Coin Power +10; Attack Weight +10',
    icon: '😇',
    cost: 4000,
    special: 'HP +10; SP +10; Coin Power +10; Attack Weight +10',
  },
  {
    id: 'gold_rush_gift',
    name: 'Gold Rush',
    slot: 'hand1',
    set: null,
    rarity: 'WAW',
    stats: { fortitude: 6 },
    description: 'HP +6. Instinct work success rate increased by 6%.',
    icon: '💰',
    cost: 2000,
    special: 'HP +6. Instinct work success rate increased by 6%.',
  },
  {
    id: 'wrist_cutter_gift',
    name: 'Wrist Cutter',
    slot: 'hand2',
    set: null,
    rarity: 'TETH',
    stats: { temperance: 4 },
    description: 'Success rate +2% (each temperance point gives 0.5% success).',
    icon: '🔪',
    cost: 500,
    special: 'Success rate +2% (each temperance point gives 0.5% success).',
  },
  {
    id: 'lamp_gift',
    name: 'Lamp',
    slot: 'helmet',
    set: null,
    rarity: 'WAW',
    stats: { fortitude: 3, temperance: 6 },
    description: 'HP +3, Success Rate +3%.',
    icon: '🪔',
    cost: 2000,
    special: 'HP +3, Success Rate +3%.',
  },
  {
    id: 'magic_bullet_gift',
    name: 'Magic Bullet',
    slot: 'mouth2',
    set: null,
    rarity: 'HE',
    stats: { justice: 10 },
    description: 'Justice +10.',
    icon: '🔫',
    cost: 800,
    special: 'Justice +10.',
  },
  {
    id: 'kod_gift',
    name: 'The Sword Sharpened with Tears',
    slot: 'cheek',
    set: null,
    rarity: 'WAW',
    stats: { justice: 4 },
    description: 'SP +2, Justice +4 (SP bonus not reflected in stats).',
    icon: '⚔️',
    cost: 2000,
    special: 'SP +2, Justice +4 (SP bonus not reflected in stats).',
  },
  {
    id: 'midsummer_gift',
    name: 'Midsummer',
    slot: 'waist',
    set: null,
    rarity: 'ALEPH',
    stats: { justice: 16 },
    description: 'Justice +16 (increases attack weight and coin power).',
    icon: '🌺',
    cost: 3500,
    special: 'Justice +16 (increases attack weight and coin power).',
  },
  {
    id: 'hatred_gift',
    name: 'In the name of love and hate',
    slot: 'hat',
    set: null,
    rarity: 'WAW',
    stats: { temperance: 2, justice: 4 },
    description: 'Increases Temperance and Justice, boosting work success and damage.',
    icon: '❤️‍🔥',
    cost: 2000,
    special: 'Increases Temperance and Justice, boosting work success and damage.',
  },
  {
    id: 'justitia_gift',
    name: 'Justitia',
    slot: 'eye',
    set: null,
    rarity: 'WAW',
    stats: { justice: 6 },
    description: 'Justice +6 – improves coin power and attack weight.',
    icon: '⚖️',
    cost: 2000,
    special: 'Justice +6 – improves coin power and attack weight.',
  },
  {
    id: 'regret_gift',
    name: 'Regret',
    slot: 'mouth',
    set: null,
    rarity: 'TETH',
    stats: { fortitude: 2, prudence: 2 },
    description: 'Fortitude +2, Prudence +2 – boosts HP and SP.',
    icon: '😔',
    cost: 500,
    special: 'Fortitude +2, Prudence +2 – boosts HP and SP.',
  },
  {
    id: 'beak_gift',
    name: 'Beak',
    slot: 'neck',
    set: null,
    rarity: 'TETH',
    stats: { justice: 2 },
    description: 'Justice +2 – improves coin power.',
    icon: '🐦',
    cost: 500,
    special: 'Justice +2 – improves coin power.',
  },
  {
    id: 'adoration_gift',
    name: 'Adoration',
    slot: 'helmet',
    set: null,
    rarity: 'ALEPH',
    stats: { fortitude: 5, prudence: 10 },
    description: 'Fortitude +5, Prudence +10 – significantly boosts HP and SP.',
    icon: '✨',
    cost: 3000,
    special: 'Fortitude +5, Prudence +10 – significantly boosts HP and SP.',
  },
  {
    id: 'sound_of_a_star_gift',
    name: 'Sound of a Star',
    slot: 'eye',
    set: null,
    rarity: 'ALEPH',
    stats: { justice: 11 },
    description: 'Justice +11 – dramatically increases coin power and attack weight.',
    icon: '⭐',
    cost: 3500,
    special: 'Justice +11 – dramatically increases coin power and attack weight.',
  },
  {
    id: 'dead_silence',
    name: 'Dead Silence',
    slot: 'neck',
    set: null,
    rarity: 'WAW',
    stats: { prudence: 3 },
    description: 'Increases SP by 3. When dealing damage, has a 10% chance to reduce the target\'s SP by 5.',
    icon: '🤫',
    cost: 2000,
    special: 'Increases SP by 3. When dealing damage, has a 10% chance to reduce the target\'s SP by 5.',
  },
  {
    id: 'faint_aroma_gift',
    name: 'Faint Aroma',
    slot: 'face',
    set: null,
    rarity: 'WAW',
    stats: { temperance: 2, prudence: 4 },
    description: 'Increases Temperance (attachment work success) by 2 and Prudence (SP) by 4.',
    icon: '🌸',
    cost: 2000,
    special: 'Increases Temperance (attachment work success) by 2 and Prudence (SP) by 4.',
  },
  {
    id: 'hornet_gift',
    name: 'Hornet',
    slot: 'helmet',
    set: null,
    rarity: 'WAW',
    stats: { fortitude: 2, prudence: 4 },
    description: 'HP +2, SP +4. Increases work success slightly.',
    icon: '🐝',
    cost: 2000,
    special: 'HP +2, SP +4. Increases work success slightly.',
  },
  {
    id: 'red_eyes_gift',
    name: 'Red Eyes',
    slot: 'eye',
    set: null,
    rarity: 'TETH',
    stats: { temperance: 3 },
    description: 'Increases Temperance (attachment work success) by 3.',
    icon: '👁️',
    cost: 500,
    special: 'Increases Temperance (attachment work success) by 3.',
  },
  {
    id: 'harmony_gift',
    name: 'Harmony',
    slot: 'cheek',
    set: null,
    rarity: 'HE',
    stats: { fortitude: 8 },
    description: 'Increases HP by 8.',
    icon: '☯️',
    cost: 800,
    special: 'Increases HP by 8.',
  },
  {
    id: 'false_throne_gift',
    name: 'False Throne',
    slot: 'torso',
    set: null,
    rarity: 'ALEPH',
    stats: { fortitude: 9, prudence: 9, temperance: 9, justice: 9 },
    description: 'Increases all base stats by 9, greatly enhancing HP, SP, work success, and damage output.',
    icon: '👑',
    cost: 4000,
    special: 'Increases all base stats by 9, greatly enhancing HP, SP, work success, and damage output.',
  },
  {
    id: 'dipsia_gift',
    name: 'Dipsia',
    slot: 'hat',
    set: null,
    rarity: 'WAW',
    stats: { justice: 8 },
    description: 'Increases Justice by 8, improving attack weight and coin power.',
    icon: '🍷',
    cost: 2000,
    special: 'Increases Justice by 8, improving attack weight and coin power.',
  },
  {
    id: 'censored_gift',
    name: '[CENSORED]',
    slot: 'eye',
    set: null,
    rarity: 'ALEPH',
    stats: { prudence: 15 },
    description: 'Increases SP by 15. Grants resistance to mental attacks.',
    icon: '❓',
    cost: 3500,
    special: 'Increases SP by 15. Grants resistance to mental attacks.',
  },
  {
    id: 'cobalt_scar_gift',
    name: 'Cobalt Scar',
    slot: 'face',
    set: null,
    rarity: 'WAW',
    stats: { fortitude: 4, justice: 2 },
    description: 'Fortitude +4, Justice +2 – boosts HP and attack power.',
    icon: '💙',
    cost: 2000,
    special: 'Fortitude +4, Justice +2 – boosts HP and attack power.',
  },
  {
    id: 'crimson_scar_gift',
    name: 'Crimson Scar',
    slot: 'mouth',
    set: null,
    rarity: 'WAW',
    stats: { fortitude: 3, justice: 3 },
    description: 'Fortitude +3, Justice +3 – increases HP and attack power.',
    icon: '❤️',
    cost: 2000,
    special: 'Fortitude +3, Justice +3 – increases HP and attack power.',
  },
  {
    id: 'contempt_awe_gift',
    name: 'Awe',
    slot: 'hat',
    set: null,
    rarity: 'ALEPH',
    stats: { fortitude: 8, prudence: 5, temperance: 7, justice: 4 },
    description: 'Fortitude +8, Prudence +5, Temperance +7, Justice +4 – balanced stat boost.',
    icon: '🌀',
    cost: 3500,
    special: 'Fortitude +8, Prudence +5, Temperance +7, Justice +4 – balanced stat boost.',
  },
  {
    id: 'laetitia_gift',
    name: 'Laetitia',
    slot: 'helmet',
    set: null,
    rarity: 'HE',
    stats: { prudence: 4 },
    description: 'Increases SP by 4 – boosts SP.',
    icon: '🌈',
    cost: 800,
    special: 'Increases SP by 4 – boosts SP.',
  },
  {
    id: 'pink_gift',
    name: 'Pink',
    slot: 'helmet',
    set: null,
    rarity: 'ALEPH',
    stats: { justice: 10 },
    description: 'Justice +10 – Increases the damage of this Abnormality\'s weapon by 15% when the corresponding Abnormality\'s armor is equipped.',
    icon: '🩷',
    cost: 3000,
    special: 'Justice +10 – Increases the damage of this Abnormality\'s weapon by 15% when the corresponding Abnormality\'s armor is equipped.',
  },
  {
    id: 'logging_gift',
    name: 'Logging',
    slot: 'torso',
    set: null,
    rarity: 'HE',
    stats: { fortitude: 2, temperance: 4 },
    description: 'HP +2, Success Rate +2, Work Speed +2 – Increases HP, Work Success Rate and Work Speed by 2.',
    icon: '🪵',
    cost: 800,
    special: 'HP +2, Success Rate +2, Work Speed +2 – Increases HP, Work Success Rate and Work Speed by 2.',
  },
  {
    id: 'harvest_gift',
    name: 'Harvest',
    slot: 'neck',
    set: null,
    rarity: 'HE',
    stats: { prudence: 4 },
    description: 'SP +4 – Increases SP by 4.',
    icon: '🌾',
    cost: 800,
    special: 'SP +4 – Increases SP by 4.',
  },
  {
    id: 'soda_gift',
    name: 'Soda',
    slot: 'mouth2',
    set: null,
    rarity: 'ZAYIN',
    stats: { fortitude: 2 },
    description: 'HP +4 – Increases HP by 2.',
    icon: '🥤',
    cost: 300,
    special: 'HP +4 – Increases HP by 2.',
  },
  {
    id: 'hypocrisy_gift',
    name: 'Hypocrisy',
    slot: 'helmet',
    set: null,
    rarity: 'WAW',
    stats: { fortitude: 3, prudence: 3 },
    description: 'HP +3, SP +3 – Increases HP and SP by 3.',
    icon: '🎭',
    cost: 2000,
    special: 'HP +3, SP +3 – Increases HP and SP by 3.',
  },
  {
    id: 'frag_from_somewhere_gift',
    name: 'Fragments from Somewhere',
    slot: 'torso',
    set: null,
    rarity: 'TETH',
    stats: { temperance: 4 },
    description: 'Work Success Rate +2, Work Speed +2 – Increases Work Success Rate and Work Speed by 2.',
    icon: '🧩',
    cost: 500,
    special: 'Work Success Rate +2, Work Speed +2 – Increases Work Success Rate and Work Speed by 2.',
  },

  // ═══ ARTHUR – Excalibur Sovereign (12 pieces) ═══════════════════════
  {
    id: 'excalibur_crown',
    name: 'Excalibur Crown',
    slot: 'hat',
    set: 'Excalibur Sovereign',
    rarity: 'SSR',
    stats: { hp: 500, atk: 60 },
    description: 'A crown that bears the weight of a king\'s resolve. Part of the Excalibur Sovereign set.',
    icon: '👑',
    cost: 2500,
    signatureFor: 'arthur_excalibur',
  },
  {
    id: 'excalibur_mask',
    name: 'Excalibur Mask',
    slot: 'face',
    set: 'Excalibur Sovereign',
    rarity: 'SSR',
    stats: { def: 55, hp: 350 },
    description: 'A mask of pale resolve that hides the king\'s doubt. Part of the Excalibur Sovereign set.',
    icon: '🎭',
    cost: 2500,
    signatureFor: 'arthur_excalibur',
  },
  {
    id: 'excalibur_eye',
    name: 'Excalibur Eye',
    slot: 'eye',
    set: 'Excalibur Sovereign',
    rarity: 'SSR',
    stats: { atk: 80, spd: 10 },
    description: 'An eye that sees the path of kings. Part of the Excalibur Sovereign set.',
    icon: '👁️',
    cost: 2500,
    signatureFor: 'arthur_excalibur',
  },
  {
    id: 'excalibur_mantle',
    name: 'Excalibur Mantle',
    slot: 'neck',
    set: 'Excalibur Sovereign',
    rarity: 'SSR',
    stats: { def: 60, hp: 350 },
    description: 'A mantle woven from pale light and determination. Part of the Excalibur Sovereign set.',
    icon: '🧥',
    cost: 2500,
    signatureFor: 'arthur_excalibur',
  },
  {
    id: 'excalibur_armor',
    name: 'Excalibur Armor',
    slot: 'torso',
    set: 'Excalibur Sovereign',
    rarity: 'SSR',
    stats: { hp: 450, def: 50 },
    description: 'Armor forged from the light of a thousand promises. Part of the Excalibur Sovereign set.',
    icon: '🛡️',
    cost: 2500,
    signatureFor: 'arthur_excalibur',
  },
  {
    id: 'excalibur_sigil',
    name: 'Excalibur Sigil',
    slot: 'waist',
    set: 'Excalibur Sovereign',
    rarity: 'SSR',
    stats: { atk: 90, hp: 250 },
    description: 'The sigil of the one true king. Part of the Excalibur Sovereign set.',
    icon: '⚔️',
    cost: 3000,
    signatureFor: 'arthur_excalibur',
  },
  {
    id: 'excalibur_ring',
    name: 'Excalibur Ring',
    slot: 'hand1',
    set: 'Excalibur Sovereign',
    rarity: 'SSR',
    stats: { atk: 75, spd: 8 },
    description: 'A ring that pulses with the king\'s will. Part of the Excalibur Sovereign set.',
    icon: '💍',
    cost: 2500,
    signatureFor: 'arthur_excalibur',
  },
  {
    id: 'excalibur_gauntlet',
    name: 'Excalibur Gauntlet',
    slot: 'hand2',
    set: 'Excalibur Sovereign',
    rarity: 'SSR',
    stats: { atk: 70, def: 30 },
    description: 'The gauntlet that wields Excalibur. Part of the Excalibur Sovereign set.',
    icon: '🧤',
    cost: 2500,
    signatureFor: 'arthur_excalibur',
  },
  {
    id: 'excalibur_cheek',
    name: 'Excalibur Cheek',
    slot: 'cheek',
    set: 'Excalibur Sovereign',
    rarity: 'SSR',
    stats: { hp: 300, def: 40 },
    description: 'A cheek marking that shines with pale light. Part of the Excalibur Sovereign set.',
    icon: '✨',
    cost: 2500,
    signatureFor: 'arthur_excalibur',
  },
  {
    id: 'excalibur_mouth',
    name: 'Excalibur Mouth',
    slot: 'mouth',
    set: 'Excalibur Sovereign',
    rarity: 'SSR',
    stats: { atk: 65, spd: 12 },
    description: 'A mouthpiece that speaks the king\'s truth. Part of the Excalibur Sovereign set.',
    icon: '🗣️',
    cost: 2500,
    signatureFor: 'arthur_excalibur',
  },
  {
    id: 'excalibur_back_left',
    name: 'Excalibur Left Wing',
    slot: 'left_back',
    set: 'Excalibur Sovereign',
    rarity: 'SSR',
    stats: { hp: 400, spd: 5 },
    description: 'A left wing of pale light. Part of the Excalibur Sovereign set.',
    icon: '🪽',
    cost: 2500,
    signatureFor: 'arthur_excalibur',
  },
  {
    id: 'excalibur_back_right',
    name: 'Excalibur Right Wing',
    slot: 'right_back',
    set: 'Excalibur Sovereign',
    rarity: 'SSR',
    stats: { atk: 85, spd: 5 },
    description: 'A right wing of pale light. Part of the Excalibur Sovereign set.',
    icon: '🪽',
    cost: 2500,
    signatureFor: 'arthur_excalibur',
  },

  // ═══ CLASS-SPECIFIC BUFF GIFTS (armband slot) ═══════════════════════
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
export function getSignatureGiftsForIdentity(identityId: string): EgoGift[] {
  return egoGifts.filter(g => g.signatureFor === identityId);
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
  isHarmonized: boolean
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

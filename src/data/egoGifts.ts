// egoGifts.ts – Full file with PGR-style set bonuses, resonance, and hypertune
// Includes new class-specific buff relics for slots 5-6

export interface EgoGift {
  id: string;
  name: string;
  slot: number;
  set: string | null;
  rarity: 'SR' | 'SSR';
  stats: { hp?: number; atk?: number; def?: number; spd?: number };
  description: string;
  icon: string;
  cost: number; // threads cost
  signatureFor?: string; // identity id this set is for
}

// ── Resonance stat bonuses ──
export const RESONANCE_STATS: Record<string, { atk: number; hp: number; def: number }> = {
  ATK: { atk: 15, hp: 0, def: 0 },
  HP: { atk: 0, hp: 80, def: 0 },
  DEF: { atk: 0, hp: 0, def: 10 },
  SPD: { atk: 5, hp: 0, def: 0 },
};

// ── Hypertune (Qliphoth Sync) levels ──
export const HYPERTUNE_LEVELS = [
  { level: 0, cost: 0, stats: { atk: 0, hp: 0, def: 0 } },
  { level: 1, cost: 500, stats: { atk: 10, hp: 50, def: 5 } },
  { level: 2, cost: 1000, stats: { atk: 20, hp: 100, def: 10 } },
  { level: 3, cost: 2000, stats: { atk: 35, hp: 175, def: 15 } },
  { level: 4, cost: 3500, stats: { atk: 50, hp: 250, def: 25 } },
  { level: 5, cost: 5000, stats: { atk: 70, hp: 350, def: 35 } },
];

// ── PGR-style Set Bonuses ──
// 2pc: Basic stat bonuses
// 4pc: Signature effects that require Harmonization to activate
export const setBonuses: Record<string, { pieces: number; description: string; effect: string }[]> = {
  // ═══════════════════════════════════════════════════════
  // SSR SIGNATURE 4-PIECE SETS (Require Harmonization for 4pc)
  // ═══════════════════════════════════════════════════════

  // Rover Eclipse - Eclipse Sovereign
  'Eclipse Sovereign': [
    { pieces: 2, description: 'ATK +5%, Void DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'Ego skill damage ×2 on clash win. After casting Ego, gain 20% SP.', effect: 'ego_double_on_win:true,sp_gain:20' },
  ],

  // Apollyon Abyss - Abyss Sovereign
  'Abyss Sovereign': [
    { pieces: 2, description: 'ATK +5%, Dark DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'Ego skill applies 2 random debuffs and deals 30% bonus damage to debuffed enemies.', effect: 'ego_debuff:2,ego_dmg_vs_debuff:0.30' },
  ],

  // Verg - Dark Slayer
  'Dark Slayer': [
    { pieces: 2, description: 'ATK +5%, Dark DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'Ego skill ignores 30% DEF. If enemy is below 50% HP, Ego skill deals 50% bonus damage.', effect: 'ego_def_ignore:0.30,ego_execute_bonus:0.50' },
  ],

  // Sparda - Legendary Knight
  'Legendary Knight': [
    { pieces: 2, description: 'ATK +5%, Dark DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'Ego skill grants all allies 25% HP shield and +20% ATK for 2 turns.', effect: 'ego_shield:0.25,ego_atk_buff:0.20' },
  ],

  // Rin - Devil Hunter
  'Devil Hunter': [
    { pieces: 2, description: 'ATK +5%, Fire DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'Ego skill deals 40% bonus damage and refreshes all normal skill cooldowns.', effect: 'ego_dmg_bonus:0.40,ego_reset_cooldowns:true' },
  ],

  // Butterfly - Funeral
  'Funeral': [
    { pieces: 2, description: 'ATK +5%, Void DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'Ego skill executes enemies below 25% HP. On kill, gain 30% HP and 20 SP.', effect: 'ego_execute:0.25,ego_kill_heal:0.30,ego_kill_sp:20' },
  ],

  // Miastro - Orchestra
  'Orchestra': [
    { pieces: 2, description: 'ATK +5%, Light DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'Ego skill buffs all allies\' ATK by 30% for 2 turns. Heals all allies for 20% of damage dealt.', effect: 'ego_atk_buff:0.30,ego_heal:0.20' },
  ],

  // Don Papa - Shorekeeper
  'Shorekeeper': [
    { pieces: 2, description: 'ATK +5%, Fire DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'Ego skill detonates all Bleed stacks for 300% damage. Applies 3 Bleed to all enemies.', effect: 'ego_bleed_detonate:3.00,ego_bleed_apply:3' },
  ],

  // Aemeath - Threnodia
  'Threnodia': [
    { pieces: 2, description: 'ATK +5%, Spectro DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'Ego skill consumes all Concerto for 15% bonus damage per stack (max 150%).', effect: 'ego_concerto_dmg:0.15,ego_max_bonus:1.50' },
  ],

  // Shorekeeper - Eternal Tide
  'Eternal Tide': [
    { pieces: 2, description: 'ATK +5%, Water DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'Ego skill heals all allies for 50% of damage dealt and grants +25% healing for 2 turns.', effect: 'ego_heal:0.50,ego_heal_buff:0.25' },
  ],

  // Xenon - Chaos Sovereign
  'Chaos Sovereign': [
    { pieces: 2, description: 'ATK +5%, Chaos DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'Ego skill applies random debuff to all enemies. Deals 30% bonus damage per debuff on target (max 90%).', effect: 'ego_debuff_all:true,ego_dmg_per_debuff:0.30' },
  ],

  // ─── NEW: Doran's Set: Warden's Judgment ───
  'Warden\'s Judgment': [
    { pieces: 2, description: 'ATK +5%, Physical DMG +5%', effect: 'atk_pct:0.05,element_dmg:0.05' },
    { pieces: 4, description: 'Ego skill applies 3 Dull stacks to all enemies and deals 40% bonus damage to bleeding enemies.', effect: 'ego_dull:3,ego_dmg_vs_bleed:0.40' },
  ],

  // ─── NEW: Gwendolyn's Set: Oath of Faith ───
  'Oath of Faith': [
    { pieces: 2, description: 'ATK +5%, DEF +5%', effect: 'atk_pct:0.05,def_pct:0.05' },
    { pieces: 4, description: 'Ego skill grants all allies a shield equal to 35% of Gwendolyn\'s max HP and reduces enemy ATK by 25% for 2 turns.', effect: 'ego_shield:0.35,ego_enemy_atk_down:0.25' },
  ],

  // ─── NEW: Mira's Set: Shepherd's Lament ───
  'Shepherd\'s Lament': [
    { pieces: 2, description: 'ATK +5%, Healing +5%', effect: 'atk_pct:0.05,heal_pct:0.05' },
    { pieces: 4, description: 'Ego skill heals all allies for 60% of damage dealt and extends all Bleed durations by 2 turns.', effect: 'ego_heal:0.60,ego_bleed_extend:2' },
  ],

  // ═══════════════════════════════════════════════════════
  // SSR 2-PIECE SETS (Slots 5-6)
  // ═══════════════════════════════════════════════════════

  'Eclipse Echo': [
    { pieces: 2, description: 'ATK +5%, All Element DMG +5%', effect: 'atk_pct:0.05,all_element_dmg:0.05' },
  ],
  'Devil Pact': [
    { pieces: 2, description: 'ATK +5%, Crit Rate +5%', effect: 'atk_pct:0.05,crit_rate:0.05' },
  ],
  'Stellar Veil': [
    { pieces: 2, description: 'ATK +5%, Healing +5%', effect: 'atk_pct:0.05,heal_pct:0.05' },
  ],
  'Voidborne': [
    { pieces: 2, description: 'ATK +5%, All Element DMG +5%', effect: 'atk_pct:0.05,all_element_dmg:0.05' },
  ],

  // ═══════════════════════════════════════════════════════
  // SR 2-PIECE SETS (Slots 5-6)
  // ═══════════════════════════════════════════════════════

  'Vitality': [
    { pieces: 2, description: 'ATK +3%, HP +7%', effect: 'atk_pct:0.03,hp_pct:0.07' },
  ],
  'Aggression': [
    { pieces: 2, description: 'ATK +3%, Fire DMG +7%', effect: 'atk_pct:0.03,element_dmg:0.07' },
  ],
  'Bulwark': [
    { pieces: 2, description: 'ATK +3%, DEF +7%', effect: 'atk_pct:0.03,def_pct:0.07' },
  ],
  'Swiftness': [
    { pieces: 2, description: 'ATK +3%, SPD +7%', effect: 'atk_pct:0.03,spd_pct:0.07' },
  ],
  'Entropy': [
    { pieces: 2, description: 'ATK +3%, Chaos DMG +7%', effect: 'atk_pct:0.03,element_dmg:0.07' },
  ],

  // ═══════════════════════════════════════════════════════
  // NEW: Element Corrosion Set (Hybrid 2pc/4pc)
  // ═══════════════════════════════════════════════════════

  'Corrosion': [
    { pieces: 2, description: 'ATK +3%, Element DMG +7%', effect: 'atk_pct:0.03,element_dmg:0.07' },
    { pieces: 4, description: 'Extra DMG Bonus +10%. Attacks apply Element Corrosion (-15% RES). Corroded targets trigger Element Blast (600% DMG, 6s CD).', effect: 'corrosion:true,element_blast:true' },
  ],

  // ═══════════════════════════════════════════════════════
  // NEW: Class-specific SSR 2-PIECE BUFF SETS (Slots 5-6)
  // ═══════════════════════════════════════════════════════

  'Attacker\'s Edge': [
    { pieces: 2, description: 'ATK +5%, Crit Rate +5%', effect: 'atk_pct:0.05,crit_rate:0.05' },
  ],
  'Tank\'s Bastion': [
    { pieces: 2, description: 'DEF +10%, HP +10%', effect: 'def_pct:0.10,hp_pct:0.10' },
  ],
  'Amplifier\'s Resonance': [
    { pieces: 2, description: 'Element DMG +10%, Healing +5%', effect: 'element_dmg:0.10,heal_pct:0.05' },
  ],
  'Support\'s Grace': [
    { pieces: 2, description: 'Healing +10%, SPD +10%', effect: 'heal_pct:0.10,spd_pct:0.10' },
  ],
};

// ── All Ego Gifts ──

export const egoGifts: EgoGift[] = [
  // ═══ Eclipse Sovereign (Rover Eclipse) ═══
  {
    id: 'eclipse_crown',
    name: 'Eclipse Crown',
    slot: 1,
    set: 'Eclipse Sovereign',
    rarity: 'SSR',
    stats: { hp: 500, atk: 50 },
    description: 'A crown that dims the light around it. Part of the Eclipse Sovereign set.',
    icon: '👑',
    cost: 2500,
    signatureFor: 'rover_eclipse',
  },
  {
    id: 'eclipse_mantle',
    name: 'Eclipse Mantle',
    slot: 2,
    set: 'Eclipse Sovereign',
    rarity: 'SSR',
    stats: { def: 60, hp: 300 },
    description: 'A mantle woven from shadow and starlight. Part of the Eclipse Sovereign set.',
    icon: '🧥',
    cost: 2500,
    signatureFor: 'rover_eclipse',
  },
  {
    id: 'eclipse_ring',
    name: 'Eclipse Ring',
    slot: 3,
    set: 'Eclipse Sovereign',
    rarity: 'SSR',
    stats: { atk: 70, spd: 8 },
    description: 'A ring pulsing with eclipsed energy. Part of the Eclipse Sovereign set.',
    icon: '💍',
    cost: 2500,
    signatureFor: 'rover_eclipse',
  },
  {
    id: 'eclipse_sigil_shard',
    name: 'Sigil Shard',
    slot: 4,
    set: 'Eclipse Sovereign',
    rarity: 'SSR',
    stats: { atk: 80, hp: 200 },
    description: 'A fragment of the original Eclipse Sigil. Part of the Eclipse Sovereign set.',
    icon: '💎',
    cost: 3000,
    signatureFor: 'rover_eclipse',
  },

  // ═══ Abyss Sovereign (Apollyon) ═══
  {
    id: 'abyssal_mask',
    name: 'Abyssal Mask',
    slot: 1,
    set: 'Abyss Sovereign',
    rarity: 'SSR',
    stats: { hp: 450, def: 40 },
    description: 'A mask that reveals darkness. Part of the Abyss Sovereign set.',
    icon: '🎭',
    cost: 2500,
    signatureFor: 'apollyon_abyss',
  },
  {
    id: 'abyssal_shroud',
    name: 'Abyssal Shroud',
    slot: 2,
    set: 'Abyss Sovereign',
    rarity: 'SSR',
    stats: { def: 70, spd: 5 },
    description: 'A shroud that drinks in light. Part of the Abyss Sovereign set.',
    icon: '🖤',
    cost: 2500,
    signatureFor: 'apollyon_abyss',
  },
  {
    id: 'abyssal_chains',
    name: 'Warden Chains',
    slot: 3,
    set: 'Abyss Sovereign',
    rarity: 'SSR',
    stats: { atk: 60, hp: 350 },
    description: 'Chains that bound the abyss. Part of the Abyss Sovereign set.',
    icon: '⛓️',
    cost: 2500,
    signatureFor: 'apollyon_abyss',
  },
  {
    id: 'abyssal_heart',
    name: 'Abyssal Heart',
    slot: 4,
    set: 'Abyss Sovereign',
    rarity: 'SSR',
    stats: { atk: 85, def: 30 },
    description: 'Crystallized heart of an abyssal entity. Part of the Abyss Sovereign set.',
    icon: '🫀',
    cost: 3000,
    signatureFor: 'apollyon_abyss',
  },

  // ═══ Dark Slayer (Verg) ═══
  {
    id: 'yamato_sheath',
    name: 'Yamato Sheath',
    slot: 1,
    set: 'Dark Slayer',
    rarity: 'SSR',
    stats: { atk: 70, spd: 15 },
    description: 'The sheath of the legendary blade. Part of the Dark Slayer set.',
    icon: '🗡️',
    cost: 2500,
    signatureFor: 'verg_dark_slayer',
  },
  {
    id: 'dark_coat',
    name: 'Dark Coat',
    slot: 2,
    set: 'Dark Slayer',
    rarity: 'SSR',
    stats: { def: 60, hp: 250 },
    description: 'A coat worn by the Dark Slayer. Part of the Dark Slayer set.',
    icon: '🧥',
    cost: 2500,
    signatureFor: 'verg_dark_slayer',
  },
  {
    id: 'motivation_charm',
    name: 'Motivation Charm',
    slot: 3,
    set: 'Dark Slayer',
    rarity: 'SSR',
    stats: { atk: 80, hp: 200 },
    description: 'A charm that fuels the thirst for power. Part of the Dark Slayer set.',
    icon: '⚡',
    cost: 2500,
    signatureFor: 'verg_dark_slayer',
  },
  {
    id: 'devil_core',
    name: 'Devil Core',
    slot: 4,
    set: 'Dark Slayer',
    rarity: 'SSR',
    stats: { atk: 95, spd: 8 },
    description: 'The crystallized essence of demonic power. Part of the Dark Slayer set.',
    icon: '💜',
    cost: 3000,
    signatureFor: 'verg_dark_slayer',
  },

  // ═══ Legendary Knight (Sparda) ═══
  {
    id: 'sparda_crown',
    name: 'Dark Crown',
    slot: 1,
    set: 'Legendary Knight',
    rarity: 'SSR',
    stats: { hp: 600, def: 30 },
    description: 'The crown of the legendary dark knight. Part of the Legendary Knight set.',
    icon: '👑',
    cost: 2500,
    signatureFor: 'sparda_legendary',
  },
  {
    id: 'sparda_cape',
    name: 'Knight Cape',
    slot: 2,
    set: 'Legendary Knight',
    rarity: 'SSR',
    stats: { def: 80, hp: 200 },
    description: 'A cape that has seen countless battles. Part of the Legendary Knight set.',
    icon: '🧥',
    cost: 2500,
    signatureFor: 'sparda_legendary',
  },
  {
    id: 'sparda_gauntlet',
    name: 'Knight Gauntlet',
    slot: 3,
    set: 'Legendary Knight',
    rarity: 'SSR',
    stats: { atk: 70, def: 20 },
    description: 'Gauntlets of the legendary knight. Part of the Legendary Knight set.',
    icon: '🧤',
    cost: 2500,
    signatureFor: 'sparda_legendary',
  },
  {
    id: 'sparda_soul',
    name: 'Knight Soul',
    slot: 4,
    set: 'Legendary Knight',
    rarity: 'SSR',
    stats: { atk: 90, hp: 300 },
    description: 'The soul of the knight that never yields. Part of the Legendary Knight set.',
    icon: '👻',
    cost: 3000,
    signatureFor: 'sparda_legendary',
  },

  // ═══ Devil Hunter (Rin) ═══
  {
    id: 'rin_jacket',
    name: 'Red Jacket',
    slot: 1,
    set: 'Devil Hunter',
    rarity: 'SSR',
    stats: { hp: 400, atk: 50 },
    description: 'The iconic red jacket of a devil hunter. Part of the Devil Hunter set.',
    icon: '🧥',
    cost: 2500,
    signatureFor: 'rin_devil_hunter',
  },
  {
    id: 'rin_gloves',
    name: 'Hunter Gloves',
    slot: 2,
    set: 'Devil Hunter',
    rarity: 'SSR',
    stats: { atk: 65, spd: 10 },
    description: 'Gloves worn from countless battles. Part of the Devil Hunter set.',
    icon: '🧤',
    cost: 2500,
    signatureFor: 'rin_devil_hunter',
  },
  {
    id: 'rin_amulet',
    name: 'Amulet of Style',
    slot: 3,
    set: 'Devil Hunter',
    rarity: 'SSR',
    stats: { atk: 75, spd: 8 },
    description: 'An amulet that radiates pure style. Part of the Devil Hunter set.',
    icon: '📿',
    cost: 2500,
    signatureFor: 'rin_devil_hunter',
  },
  {
    id: 'rin_devil_core',
    name: 'Devil Hunter Core',
    slot: 4,
    set: 'Devil Hunter',
    rarity: 'SSR',
    stats: { atk: 90, hp: 200 },
    description: 'The core of a true devil hunter. Part of the Devil Hunter set.',
    icon: '❤️',
    cost: 3000,
    signatureFor: 'rin_devil_hunter',
  },

  // ═══ Funeral (Butterfly) ═══
  {
    id: 'butterfly_wings_gift',
    name: 'Butterfly Wings',
    slot: 1,
    set: 'Funeral',
    rarity: 'SSR',
    stats: { spd: 20, atk: 40 },
    description: 'Delicate wings that sing the song of death. Part of the Funeral set.',
    icon: '🦋',
    cost: 2500,
    signatureFor: 'butterfly_funeral',
  },
  {
    id: 'butterfly_cocoon',
    name: 'Cocoon of Rest',
    slot: 2,
    set: 'Funeral',
    rarity: 'SSR',
    stats: { def: 50, hp: 300 },
    description: 'A cocoon where souls find peace. Part of the Funeral set.',
    icon: '🕸️',
    cost: 2500,
    signatureFor: 'butterfly_funeral',
  },
  {
    id: 'butterfly_charm',
    name: 'Spectral Charm',
    slot: 3,
    set: 'Funeral',
    rarity: 'SSR',
    stats: { atk: 65, spd: 10 },
    description: 'A charm that resonates with departed souls. Part of the Funeral set.',
    icon: '📿',
    cost: 2500,
    signatureFor: 'butterfly_funeral',
  },
  {
    id: 'butterfly_soul',
    name: 'Butterfly Soul',
    slot: 4,
    set: 'Funeral',
    rarity: 'SSR',
    stats: { atk: 85, spd: 12 },
    description: 'The soul of a butterfly that chose to stay. Part of the Funeral set.',
    icon: '💙',
    cost: 3000,
    signatureFor: 'butterfly_funeral',
  },

  // ═══ Conductor (Miastro) ═══
  {
    id: 'miastro_baton_gift',
    name: 'Conductor Baton',
    slot: 1,
    set: 'Orchestra',
    rarity: 'SSR',
    stats: { atk: 55, spd: 12 },
    description: 'The baton that leads the symphony. Part of the Orchestra set.',
    icon: '🎼',
    cost: 2500,
    signatureFor: 'miastro_conductor',
  },
  {
    id: 'miastro_suit',
    name: 'Concert Suit',
    slot: 2,
    set: 'Orchestra',
    rarity: 'SSR',
    stats: { def: 55, hp: 300 },
    description: 'An immaculate concert suit. Part of the Orchestra set.',
    icon: '🤵',
    cost: 2500,
    signatureFor: 'miastro_conductor',
  },
  {
    id: 'miastro_score',
    name: 'War Score',
    slot: 3,
    set: 'Orchestra',
    rarity: 'SSR',
    stats: { atk: 70, def: 15 },
    description: 'Sheet music for the symphony of battle. Part of the Orchestra set.',
    icon: '📜',
    cost: 2500,
    signatureFor: 'miastro_conductor',
  },
  {
    id: 'miastro_soul',
    name: 'Conductor Soul',
    slot: 4,
    set: 'Orchestra',
    rarity: 'SSR',
    stats: { atk: 85, spd: 8 },
    description: 'The soul of the eternal conductor. Part of the Orchestra set.',
    icon: '🎵',
    cost: 3000,
    signatureFor: 'miastro_conductor',
  },

  // ═══ Shorekeeper (Don Papa) ═══
  {
    id: 'don_anchor_gift',
    name: 'Anchor Charm',
    slot: 1,
    set: 'Shorekeeper',
    rarity: 'SSR',
    stats: { hp: 550, def: 30 },
    description: 'A charm shaped like a weathered anchor. Part of the Shorekeeper set.',
    icon: '⚓',
    cost: 2500,
    signatureFor: 'don_papa',
  },
  {
    id: 'don_coat',
    name: 'Sailor Coat',
    slot: 2,
    set: 'Shorekeeper',
    rarity: 'SSR',
    stats: { def: 70, hp: 250 },
    description: 'A coat worn through countless storms. Part of the Shorekeeper set.',
    icon: '🧥',
    cost: 2500,
    signatureFor: 'don_papa',
  },
  {
    id: 'don_compass',
    name: 'Tide Compass',
    slot: 3,
    set: 'Shorekeeper',
    rarity: 'SSR',
    stats: { atk: 60, spd: 10 },
    description: 'A compass that always points to the tide. Part of the Shorekeeper set.',
    icon: '🧭',
    cost: 2500,
    signatureFor: 'don_papa',
  },
  {
    id: 'don_heart',
    name: 'Ocean Heart',
    slot: 4,
    set: 'Shorekeeper',
    rarity: 'SSR',
    stats: { atk: 80, hp: 350 },
    description: 'A heart as vast as the ocean. Part of the Shorekeeper set.',
    icon: '💙',
    cost: 3000,
    signatureFor: 'don_papa',
  },

  // ═══ Threnodia (Aemeath) ═══
  {
    id: 'aemeath_veil',
    name: 'Threnodian Veil',
    slot: 1,
    set: 'Threnodia',
    rarity: 'SSR',
    stats: { hp: 450, atk: 50 },
    description: 'A veil that separates life from death. Part of the Threnodia set.',
    icon: '🪦',
    cost: 2500,
    signatureFor: 'aemeath_sentinel',
  },
  {
    id: 'aemeath_robe',
    name: 'Sentinel Robe',
    slot: 2,
    set: 'Threnodia',
    rarity: 'SSR',
    stats: { def: 60, hp: 300 },
    description: 'The robe of the Sentinel of Threnodia. Part of the Threnodia set.',
    icon: '👘',
    cost: 2500,
    signatureFor: 'aemeath_sentinel',
  },
  {
    id: 'aemeath_bell',
    name: 'Funeral Bell',
    slot: 3,
    set: 'Threnodia',
    rarity: 'SSR',
    stats: { atk: 70, spd: 8 },
    description: 'A bell that tolls for the departed. Part of the Threnodia set.',
    icon: '🔔',
    cost: 2500,
    signatureFor: 'aemeath_sentinel',
  },
  {
    id: 'aemeath_soul',
    name: 'Sentinel Soul',
    slot: 4,
    set: 'Threnodia',
    rarity: 'SSR',
    stats: { atk: 90, def: 20 },
    description: 'The soul of the eternal sentinel. Part of the Threnodia set.',
    icon: '💜',
    cost: 3000,
    signatureFor: 'aemeath_sentinel',
  },

  // ═══ Eternal Tide (Shorekeeper) ═══
  {
    id: 'tide_crown',
    name: 'Tide Crown',
    slot: 1,
    set: 'Eternal Tide',
    rarity: 'SSR',
    stats: { hp: 400, atk: 55 },
    description: 'A crown formed from ocean foam. Part of the Eternal Tide set.',
    icon: '👑',
    cost: 2500,
    signatureFor: 'shorekeeper_tide',
  },
  {
    id: 'tide_robe',
    name: 'Tide Robe',
    slot: 2,
    set: 'Eternal Tide',
    rarity: 'SSR',
    stats: { def: 55, spd: 10 },
    description: 'A robe woven from ocean currents. Part of the Eternal Tide set.',
    icon: '👘',
    cost: 2500,
    signatureFor: 'shorekeeper_tide',
  },
  {
    id: 'tide_pearl',
    name: 'Ocean Pearl',
    slot: 3,
    set: 'Eternal Tide',
    rarity: 'SSR',
    stats: { atk: 65, hp: 250 },
    description: 'A pearl that contains the ocean\'s blessing. Part of the Eternal Tide set.',
    icon: '🫧',
    cost: 2500,
    signatureFor: 'shorekeeper_tide',
  },
  {
    id: 'tide_heart',
    name: 'Tide Heart',
    slot: 4,
    set: 'Eternal Tide',
    rarity: 'SSR',
    stats: { atk: 85, spd: 8 },
    description: 'The heart of the eternal tide. Part of the Eternal Tide set.',
    icon: '🌊',
    cost: 3000,
    signatureFor: 'shorekeeper_tide',
  },

  // ═══ Chaos Sovereign (Xenon) ═══
  {
    id: 'chaos_crown',
    name: 'Chaos Crown',
    slot: 1,
    set: 'Chaos Sovereign',
    rarity: 'SSR',
    stats: { hp: 500, atk: 60 },
    description: 'A crown of swirling chaos. Part of the Chaos Sovereign set.',
    icon: '👑',
    cost: 2500,
    signatureFor: 'xenon_chaos',
  },
  {
    id: 'chaos_mantle',
    name: 'Chaos Mantle',
    slot: 2,
    set: 'Chaos Sovereign',
    rarity: 'SSR',
    stats: { def: 70, hp: 300 },
    description: 'A mantle woven from entropy. Part of the Chaos Sovereign set.',
    icon: '🧥',
    cost: 2500,
    signatureFor: 'xenon_chaos',
  },
  {
    id: 'chaos_ring',
    name: 'Chaos Ring',
    slot: 3,
    set: 'Chaos Sovereign',
    rarity: 'SSR',
    stats: { atk: 80, spd: 10 },
    description: 'A ring that warps reality. Part of the Chaos Sovereign set.',
    icon: '💍',
    cost: 2500,
    signatureFor: 'xenon_chaos',
  },
  {
    id: 'chaos_heart',
    name: 'Chaos Heart',
    slot: 4,
    set: 'Chaos Sovereign',
    rarity: 'SSR',
    stats: { atk: 90, hp: 200 },
    description: 'The crystallized heart of chaos. Part of the Chaos Sovereign set.',
    icon: '💜',
    cost: 3000,
    signatureFor: 'xenon_chaos',
  },

  // ─── NEW: Warden's Judgment (Doran) ───
  {
    id: 'doran_crown',
    name: 'Warden Crown',
    slot: 1,
    set: 'Warden\'s Judgment',
    rarity: 'SSR',
    stats: { hp: 500, atk: 50 },
    description: 'A crown that bears the weight of judgment. Part of the Warden\'s Judgment set.',
    icon: '👑',
    cost: 2500,
    signatureFor: 'doran_warden',
  },
  {
    id: 'doran_mantle',
    name: 'Warden Mantle',
    slot: 2,
    set: 'Warden\'s Judgment',
    rarity: 'SSR',
    stats: { def: 60, hp: 300 },
    description: 'A mantle woven from rust and resolve. Part of the Warden\'s Judgment set.',
    icon: '🧥',
    cost: 2500,
    signatureFor: 'doran_warden',
  },
  {
    id: 'doran_ring',
    name: 'Warden Ring',
    slot: 3,
    set: 'Warden\'s Judgment',
    rarity: 'SSR',
    stats: { atk: 70, spd: 8 },
    description: 'A ring that pulses with the weight of old judgments. Part of the Warden\'s Judgment set.',
    icon: '💍',
    cost: 2500,
    signatureFor: 'doran_warden',
  },
  {
    id: 'doran_sigil',
    name: 'Warden Sigil',
    slot: 4,
    set: 'Warden\'s Judgment',
    rarity: 'SSR',
    stats: { atk: 80, hp: 200 },
    description: 'A sigil that holds the memories of every sentence passed. Part of the Warden\'s Judgment set.',
    icon: '💎',
    cost: 3000,
    signatureFor: 'doran_warden',
  },

  // ─── NEW: Oath of Faith (Gwendolyn) ───
  {
    id: 'gwendolyn_crown',
    name: 'Faith Crown',
    slot: 1,
    set: 'Oath of Faith',
    rarity: 'SSR',
    stats: { hp: 600, def: 30 },
    description: 'A crown that bears the weight of a broken oath. Part of the Oath of Faith set.',
    icon: '👑',
    cost: 2500,
    signatureFor: 'gwendolyn_anvil',
  },
  {
    id: 'gwendolyn_armor',
    name: 'Faith Armor',
    slot: 2,
    set: 'Oath of Faith',
    rarity: 'SSR',
    stats: { def: 80, hp: 200 },
    description: 'Armor that has been reforged from shattered faith. Part of the Oath of Faith set.',
    icon: '🛡️',
    cost: 2500,
    signatureFor: 'gwendolyn_anvil',
  },
  {
    id: 'gwendolyn_gauntlet',
    name: 'Faith Gauntlet',
    slot: 3,
    set: 'Oath of Faith',
    rarity: 'SSR',
    stats: { atk: 60, def: 20 },
    description: 'Gauntlets that have held both sword and shield. Part of the Oath of Faith set.',
    icon: '🧤',
    cost: 2500,
    signatureFor: 'gwendolyn_anvil',
  },
  {
    id: 'gwendolyn_soul',
    name: 'Faith Soul',
    slot: 4,
    set: 'Oath of Faith',
    rarity: 'SSR',
    stats: { atk: 70, hp: 300 },
    description: 'The soul of a knight who chose mercy over order. Part of the Oath of Faith set.',
    icon: '💛',
    cost: 3000,
    signatureFor: 'gwendolyn_anvil',
  },

  // ─── NEW: Shepherd's Lament (Mira) ───
  {
    id: 'mira_crown',
    name: 'Shepherd Crown',
    slot: 1,
    set: 'Shepherd\'s Lament',
    rarity: 'SSR',
    stats: { hp: 450, atk: 40 },
    description: 'A crown of bellflowers that weeps with the rain. Part of the Shepherd\'s Lament set.',
    icon: '👑',
    cost: 2500,
    signatureFor: 'mira_shepherd',
  },
  {
    id: 'mira_robe',
    name: 'Shepherd Robe',
    slot: 2,
    set: 'Shepherd\'s Lament',
    rarity: 'SSR',
    stats: { def: 55, hp: 300 },
    description: 'A robe woven from the silence of a mother’s grief. Part of the Shepherd\'s Lament set.',
    icon: '👘',
    cost: 2500,
    signatureFor: 'mira_shepherd',
  },
  {
    id: 'mira_bell',
    name: 'Shepherd Bell',
    slot: 3,
    set: 'Shepherd\'s Lament',
    rarity: 'SSR',
    stats: { atk: 60, spd: 10 },
    description: 'A bell that sings sorrow into hope. Part of the Shepherd\'s Lament set.',
    icon: '🔔',
    cost: 2500,
    signatureFor: 'mira_shepherd',
  },
  {
    id: 'mira_soul',
    name: 'Shepherd Soul',
    slot: 4,
    set: 'Shepherd\'s Lament',
    rarity: 'SSR',
    stats: { atk: 75, hp: 250 },
    description: 'The soul of a mother who learned to sing again. Part of the Shepherd\'s Lament set.',
    icon: '💜',
    cost: 3000,
    signatureFor: 'mira_shepherd',
  },

  // ═══════════════════════════════════════════════════════
  // SR 2-PIECE SETS (Slots 5-6)
  // ═══════════════════════════════════════════════════════

  // Vitality Set (HP focus)
  {
    id: 'vitality_charm',
    name: 'Vitality Charm',
    slot: 5,
    set: 'Vitality',
    rarity: 'SR',
    stats: { hp: 800 },
    description: 'A charm that bolsters vitality. Part of the Vitality set.',
    icon: '💪',
    cost: 800,
  },
  {
    id: 'vitality_seal',
    name: 'Vitality Seal',
    slot: 6,
    set: 'Vitality',
    rarity: 'SR',
    stats: { hp: 600, def: 30 },
    description: 'A seal of life that reinforces the body. Part of the Vitality set.',
    icon: '❤️',
    cost: 800,
  },

  // Aggression Set (ATK focus)
  {
    id: 'attack_talisman',
    name: 'Attack Talisman',
    slot: 5,
    set: 'Aggression',
    rarity: 'SR',
    stats: { atk: 100 },
    description: 'Enhances offensive power. Part of the Aggression set.',
    icon: '⚡',
    cost: 800,
  },
  {
    id: 'rage_token',
    name: 'Rage Token',
    slot: 6,
    set: 'Aggression',
    rarity: 'SR',
    stats: { atk: 75, spd: 10 },
    description: 'Burns with battle fury. Part of the Aggression set.',
    icon: '🔥',
    cost: 800,
  },

  // Bulwark Set (DEF focus)
  {
    id: 'guardian_plate',
    name: 'Guardian Plate',
    slot: 5,
    set: 'Bulwark',
    rarity: 'SR',
    stats: { def: 80, hp: 300 },
    description: 'A protective plate. Part of the Bulwark set.',
    icon: '🛡️',
    cost: 800,
  },
  {
    id: 'warding_totem',
    name: 'Warding Totem',
    slot: 6,
    set: 'Bulwark',
    rarity: 'SR',
    stats: { def: 60, hp: 500 },
    description: 'A totem blessed by ancients. Part of the Bulwark set.',
    icon: '🗿',
    cost: 800,
  },

  // Swiftness Set (SPD focus)
  {
    id: 'speed_feather',
    name: 'Speed Feather',
    slot: 5,
    set: 'Swiftness',
    rarity: 'SR',
    stats: { spd: 20, atk: 50 },
    description: 'A feather light as wind. Part of the Swiftness set.',
    icon: '🪶',
    cost: 800,
  },
  {
    id: 'wind_anklet',
    name: 'Wind Anklet',
    slot: 6,
    set: 'Swiftness',
    rarity: 'SR',
    stats: { spd: 18, atk: 40 },
    description: 'An anklet that grants the speed of the gale. Part of the Swiftness set.',
    icon: '💨',
    cost: 800,
  },

  // Entropy Set (Chaos focus)
  {
    id: 'entropy_charm',
    name: 'Entropy Charm',
    slot: 5,
    set: 'Entropy',
    rarity: 'SR',
    stats: { atk: 80, hp: 300 },
    description: 'Charm of ever-increasing disorder. Part of the Entropy set.',
    icon: '🌀',
    cost: 800,
  },
  {
    id: 'entropy_seal',
    name: 'Entropy Seal',
    slot: 6,
    set: 'Entropy',
    rarity: 'SR',
    stats: { atk: 60, def: 30 },
    description: 'Seal of chaotic energy. Part of the Entropy set.',
    icon: '⚡',
    cost: 800,
  },

  // ═══════════════════════════════════════════════════════
  // SSR 2-PIECE SETS (Slots 5-6)
  // ═══════════════════════════════════════════════════════

  // Eclipse Echo Set (premium HP+ATK)
  {
    id: 'eclipse_echo_charm',
    name: 'Eclipse Echo Charm',
    slot: 5,
    set: 'Eclipse Echo',
    rarity: 'SSR',
    stats: { hp: 1200, atk: 80 },
    description: 'A charm resonating with the eclipse. Part of the Eclipse Echo set.',
    icon: '🌑',
    cost: 2000,
  },
  {
    id: 'eclipse_echo_seal',
    name: 'Eclipse Echo Seal',
    slot: 6,
    set: 'Eclipse Echo',
    rarity: 'SSR',
    stats: { hp: 900, atk: 60, def: 40 },
    description: 'A seal of eclipsed power. Part of the Eclipse Echo set.',
    icon: '🌒',
    cost: 2000,
  },

  // Devil Pact Set (Crit/ATK focus)
  {
    id: 'devil_pact_amulet',
    name: 'Devil Pact Amulet',
    slot: 5,
    set: 'Devil Pact',
    rarity: 'SSR',
    stats: { atk: 150, spd: 15 },
    description: 'A pact with demonic powers. Part of the Devil Pact set.',
    icon: '😈',
    cost: 2000,
  },
  {
    id: 'devil_pact_ring',
    name: 'Devil Pact Ring',
    slot: 6,
    set: 'Devil Pact',
    rarity: 'SSR',
    stats: { atk: 130, spd: 12, hp: 300 },
    description: 'A ring sealed with demonic might. Part of the Devil Pact set.',
    icon: '💍',
    cost: 2000,
  },

  // Stellar Veil Set (Support/Healing focus)
  {
    id: 'stellar_veil_orb',
    name: 'Stellar Veil Orb',
    slot: 5,
    set: 'Stellar Veil',
    rarity: 'SSR',
    stats: { hp: 800, def: 70 },
    description: 'An orb that channels starlight. Part of the Stellar Veil set.',
    icon: '⭐',
    cost: 2000,
  },
  {
    id: 'stellar_veil_pendant',
    name: 'Stellar Veil Pendant',
    slot: 6,
    set: 'Stellar Veil',
    rarity: 'SSR',
    stats: { hp: 600, def: 60, spd: 10 },
    description: 'A pendant of cosmic protection. Part of the Stellar Veil set.',
    icon: '🌟',
    cost: 2000,
  },

  // Voidborne Set (ATK/SPD focus)
  {
    id: 'voidborne_orb',
    name: 'Voidborne Orb',
    slot: 5,
    set: 'Voidborne',
    rarity: 'SSR',
    stats: { atk: 120, hp: 500 },
    description: 'Orb of the void. Part of the Voidborne set.',
    icon: '🪐',
    cost: 2000,
  },
  {
    id: 'voidborne_pendant',
    name: 'Voidborne Pendant',
    slot: 6,
    set: 'Voidborne',
    rarity: 'SSR',
    stats: { atk: 100, def: 40 },
    description: 'Pendant of void resonance. Part of the Voidborne set.',
    icon: '🌌',
    cost: 2000,
  },

  // ── NEW: Element Corrosion set ──
  {
    id: 'corrosion_charm',
    name: 'Corrosion Charm',
    slot: 5,
    set: 'Corrosion',
    rarity: 'SSR',
    stats: { atk: 90, hp: 400 },
    description: 'Charm of elemental decay. Part of the Corrosion set.',
    icon: '☣️',
    cost: 2000,
  },
  {
    id: 'corrosion_seal',
    name: 'Corrosion Seal',
    slot: 6,
    set: 'Corrosion',
    rarity: 'SSR',
    stats: { atk: 70, def: 50 },
    description: 'Seal of corrosive force. Part of the Corrosion set.',
    icon: '⚗️',
    cost: 2000,
  },

  // ═══════════════════════════════════════════════════════
  // NEW: Class-specific SSR 2-PIECE BUFF SETS (Slots 5-6)
  // ═══════════════════════════════════════════════════════

  // ── Attacker's Edge ──
  {
    id: 'attackers_edge_orb',
    name: 'Edge Orb',
    slot: 5,
    set: 'Attacker\'s Edge',
    rarity: 'SSR',
    stats: { atk: 140, crit: 5 }, // crit rate not displayed but set effect handles it
    description: 'A sharp-edged orb that hones the killer instinct. Part of the Attacker\'s Edge set.',
    icon: '🗡️',
    cost: 2000,
  },
  {
    id: 'attackers_edge_ring',
    name: 'Edge Ring',
    slot: 6,
    set: 'Attacker\'s Edge',
    rarity: 'SSR',
    stats: { atk: 110, spd: 12 },
    description: 'A ring that marks the wielder as a true attacker. Part of the Attacker\'s Edge set.',
    icon: '💍',
    cost: 2000,
  },

  // ── Tank's Bastion ──
  {
    id: 'tanks_bastion_shield',
    name: 'Bastion Shield',
    slot: 5,
    set: 'Tank\'s Bastion',
    rarity: 'SSR',
    stats: { def: 150, hp: 500 },
    description: 'A shield that has weathered a thousand sieges. Part of the Tank\'s Bastion set.',
    icon: '🛡️',
    cost: 2000,
  },
  {
    id: 'tanks_bastion_plate',
    name: 'Bastion Plate',
    slot: 6,
    set: 'Tank\'s Bastion',
    rarity: 'SSR',
    stats: { def: 120, hp: 400 },
    description: 'Unbreakable plate armour. Part of the Tank\'s Bastion set.',
    icon: '⚔️',
    cost: 2000,
  },

  // ── Amplifier's Resonance ──
  {
    id: 'amplifiers_resonance_gem',
    name: 'Resonance Gem',
    slot: 5,
    set: 'Amplifier\'s Resonance',
    rarity: 'SSR',
    stats: { atk: 100, hp: 400 },
    description: 'A gem that amplifies elemental resonance. Part of the Amplifier\'s Resonance set.',
    icon: '💎',
    cost: 2000,
  },
  {
    id: 'amplifiers_resonance_orb',
    name: 'Resonance Orb',
    slot: 6,
    set: 'Amplifier\'s Resonance',
    rarity: 'SSR',
    stats: { atk: 80, def: 40 },
    description: 'Orb that channels pure elemental energy. Part of the Amplifier\'s Resonance set.',
    icon: '🔮',
    cost: 2000,
  },

  // ── Support's Grace ──
  {
    id: 'supports_grace_staff',
    name: 'Grace Staff',
    slot: 5,
    set: 'Support\'s Grace',
    rarity: 'SSR',
    stats: { hp: 600, spd: 20 },
    description: 'A staff of healing and hope. Part of the Support\'s Grace set.',
    icon: '🪄',
    cost: 2000,
  },
  {
    id: 'supports_grace_amulet',
    name: 'Grace Amulet',
    slot: 6,
    set: 'Support\'s Grace',
    rarity: 'SSR',
    stats: { hp: 400, spd: 16 },
    description: 'An amulet that speeds the flow of life. Part of the Support\'s Grace set.',
    icon: '📿',
    cost: 2000,
  },
];

// ── Helper: Check if a set bonus is active ──
export function isSetBonusActive(
  setName: string,
  piecesEquipped: number,
  isHarmonized: boolean
): { twoPcActive: boolean; fourPcActive: boolean } {
  const bonuses = setBonuses[setName];
  if (!bonuses) return { twoPcActive: false, fourPcActive: false };

  const twoPc = bonuses.find(b => b.pieces === 2);
  const fourPc = bonuses.find(b => b.pieces === 4);

  return {
    twoPcActive: piecesEquipped >= 2 && !!twoPc,
    fourPcActive: piecesEquipped >= 4 && !!fourPc && isHarmonized,
  };
}

// ── Helper: Get active set bonus effects ──
export function getActiveSetEffects(
  setName: string,
  piecesEquipped: number,
  isHarmonized: boolean
): { twoPcEffect: string | null; fourPcEffect: string | null } {
  const bonuses = setBonuses[setName];
  if (!bonuses) return { twoPcEffect: null, fourPcEffect: null };

  const twoPc = bonuses.find(b => b.pieces === 2);
  const fourPc = bonuses.find(b => b.pieces === 4);

  return {
    twoPcEffect: piecesEquipped >= 2 && twoPc ? twoPc.effect : null,
    fourPcEffect: piecesEquipped >= 4 && fourPc && isHarmonized ? fourPc.effect : null,
  };
}
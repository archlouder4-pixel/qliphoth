// src/data/identities.ts – Full data with damage types, infusions, signature weapons, and passives
export type Rarity = 'SR' | 'SSR';

export type SkillType = 'normal1' | 'normal2' | 'normal3' | 'ego' | 'class';

export type CharacterClass = 
  | 'speedster' 
  | 'support' 
  | 'tank' 
  | 'amplifier' 
  | 'esoteric' 
  | 'attacker';

export interface IdentitySkill {
  name: string;
  description: string;
  type: SkillType;
  basePower: number;
  baseCoins: number;
  powerGrowth: number;
  coinGrowth: number;
  buffEffect?: string;
  damageType?: 'red' | 'pale' | 'black' | 'white';
  infusion?: 'slash' | 'pierce' | 'blunt';
  coinType?: 'normal' | 'unbreakable' | 'counter' | 'incision';
  isUltimate?: boolean;
}

export interface IdentityPassive {
  rankRequired: number;
  name: string;
  description: string;
}

export interface CorePassive {
  name: string;
  description: string;
  effect: string;
  rankRequired: number;
  mechanics: Record<string, any>;
}

export interface Identity {
  id: string;
  name: string;
  title: string;
  rarity: Rarity;
  classes: CharacterClass[];
  element: 'Red' | 'Pale' | 'Black' | 'White';
  baseInfusion?: 'Slash' | 'Pierce' | 'Blunt';
  faction: string;
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    sanity: number; // Mental stat. Boosts clash power (win chance). White dmg scales off sanity only, Black off both sanity+atk, Red off atk only, Pale is % dmg (uses clash power but not scaled by either stat directly). Low sanity risks Panic.
  };
  skills: IdentitySkill[];
  passives: IdentityPassive[];
  rankUpgrades: {
    ssr?: number[];
    sr?: number[];
  };
  levelCap: number;
  description: string;
  portrait: string;
  corePassive?: CorePassive;
  unreleased?: boolean;
  grade?: '000' | '00' | '0';
  defenses?: {
    endured: string[];
    weak: string[];
    normal: string[];
  };
  panicNote?: string;
  transformedSkills?: IdentitySkill[];
  transformationTrigger?: 'timer' | 'ultimate' | 'custom';
  transformationCondition?: string;
  triggerTurns?: number;
  ultimateDuration?: number;
  transformationPassive?: {
    name: string;
    description: string;
    mechanics: Record<string, any>;
  };
  signatureWeaponId?: string;
  autoSelectPassive?: {
    probability: number;
  };
}

export type CombatCategory = 'Attacker' | 'Tank' | 'Amplifier' | 'Support';

export const CLASS_CATEGORY_INFO: Record<CombatCategory, { icon: string; bgClass: string; textClass: string; description: string }> = {
  Attacker: { icon: '⚔️', bgClass: 'bg-rose-500/20', textClass: 'text-rose-400', description: 'Extra damage bonus when attacking.' },
  Tank: { icon: '🛡️', bgClass: 'bg-blue-500/20', textClass: 'text-blue-400', description: 'Attacks reduce target\'s damage reduction.' },
  Amplifier: { icon: '✨', bgClass: 'bg-amber-500/20', textClass: 'text-amber-400', description: 'Amplifies damage and heals allies.' },
  Support: { icon: '💚', bgClass: 'bg-emerald-500/20', textClass: 'text-emerald-400', description: 'Healing amount increases.' },
};

export const CLASS_INFO: Record<CharacterClass, { name: string; icon: string; description: string; color: string }> = {
  speedster: { name: 'Speedster', icon: '💨', description: 'Can reach higher speed values easily.', color: '#00d4ff' },
  support:    { name: 'Support',   icon: '💚', description: 'Provides healing or boosting support.', color: '#05ffa1' },
  tank:       { name: 'Tank',      icon: '🛡️', description: 'Can tank more heavy hits.', color: '#4ECDC4' },
  amplifier:  { name: 'Amplifier', icon: '✨', description: 'Helps the supporter and boosts team damage.', color: '#FFD700' },
  esoteric:   { name: 'Esoteric',  icon: '🌀', description: 'Defies basic definitions. Unique mechanics.', color: '#B9F2FF' },
  attacker:   { name: 'Attacker',  icon: '⚔️', description: 'Can win clashes or reach higher damage easily.', color: '#ff2a6d' },
};

// ─── Damage type and infusion info ──────────────────────────────
export const DAMAGE_TYPE_INFO: Record<string, { icon: string; bgClass: string; textClass: string }> = {
  Red:   { icon: '🔴', bgClass: 'bg-red-500/20', textClass: 'text-red-400' },
  Pale:  { icon: '⚪', bgClass: 'bg-white/10',    textClass: 'text-gray-300' },
  Black: { icon: '⚫', bgClass: 'bg-black/30',    textClass: 'text-gray-400' },
  White: { icon: '💠', bgClass: 'bg-blue-500/20', textClass: 'text-blue-300' },
};

export const INFUSION_INFO: Record<string, { icon: string; bgClass: string; textClass: string }> = {
  Slash:  { icon: '🗡️', bgClass: 'bg-pink-500/20', textClass: 'text-pink-400' },
  Pierce: { icon: '💉', bgClass: 'bg-purple-500/20', textClass: 'text-purple-400' },
  Blunt:  { icon: '🔨', bgClass: 'bg-orange-500/20', textClass: 'text-orange-400' },
};

// ─── Damage debuffs per damage type ─────────────────────────────
export const DAMAGE_DEBUFFS: Record<string, { name: string; icon: string; effect: string }> = {
  Red:   { name: 'Bleed', icon: '🩸', effect: 'Deals 2% max HP per turn (max 10 stacks).' },
  Pale:  { name: 'Wither', icon: '💀', effect: 'Reduces ATK by 3% per stack (max 10).' },
  Black: { name: 'Corrosion', icon: '☠️', effect: 'Reduces DEF by 3% per stack (max 8).' },
  White: { name: 'Fragile', icon: '💔', effect: 'Increases damage taken by 5% per stack (max 5).' },
};

export const INFUSION_DEBUFFS: Record<string, { name: string; icon: string; effect: string }> = {
  Slash:  { name: 'Laceration', icon: '🗡️', effect: 'Reduces healing received by 10% per stack (max 5).' },
  Pierce: { name: 'Puncture', icon: '💉', effect: 'Reduces SPD by 5% per stack (max 6).' },
  Blunt:  { name: 'Stagger', icon: '🔨', effect: 'Reduces clash power by 2 per stack (max 3).' },
};

// ─── Multiplier lookup ────────────────────────────────────────────
export function damageTypeMult(attackerType: string, defenderResist: string): number {
  const map: Record<string, Record<string, number>> = {
    Red:   { Red: 1.0, Pale: 1.2, Black: 1.2, White: 0.8 },
    Pale:  { Red: 0.8, Pale: 1.0, Black: 1.2, White: 1.2 },
    Black: { Red: 1.2, Pale: 0.8, Black: 1.0, White: 1.2 },
    White: { Red: 1.2, Pale: 1.2, Black: 0.8, White: 1.0 },
  };
  return map[attackerType]?.[defenderResist] ?? 1.0;
}

export function infusionMult(attackerInf: string, defenderResistInf: string): number {
  const map: Record<string, Record<string, number>> = {
    Slash:  { Slash: 1.0, Pierce: 1.2, Blunt: 0.8 },
    Pierce: { Slash: 0.8, Pierce: 1.0, Blunt: 1.2 },
    Blunt:  { Slash: 1.2, Pierce: 0.8, Blunt: 1.0 },
  };
  return map[attackerInf]?.[defenderResistInf] ?? 1.0;
}

// ─── Convert legacy element names ───────────────────────────────
export function convertElement(oldEl: string): { damageType: string; infusion: string } {
  const map: Record<string, { dmg: string; inf: string }> = {
    Physical: { dmg: 'Red', inf: 'Blunt' },
    Fire:     { dmg: 'Red', inf: 'Slash' },
    Water:    { dmg: 'Pale', inf: 'Pierce' },
    Dark:     { dmg: 'Black', inf: 'Slash' },
    Light:    { dmg: 'White', inf: 'Pierce' },
    Chaos:    { dmg: 'Black', inf: 'Blunt' },
    Void:     { dmg: 'Pale', inf: 'Pierce' },
    Spectro:  { dmg: 'White', inf: 'Slash' },
  };
  const mapped = map[oldEl] || { dmg: 'Red', inf: 'Slash' };
  return { damageType: mapped.dmg, infusion: mapped.inf };
}

// ─── Element and Infusion getters (for UI) ──────────────────────
export function getElementInfo(element: string) {
  return DAMAGE_TYPE_INFO[element] || { icon: '✦', bgClass: 'bg-gray-500/20', textClass: 'text-gray-300' };
}

export function getInfusionInfo(infusion: string) {
  return INFUSION_INFO[infusion] || { icon: '🗡️', bgClass: 'bg-gray-500/20', textClass: 'text-gray-300' };
}

export function getClassInfo(classType: CharacterClass) {
  return CLASS_INFO[classType] || { name: 'Unknown', icon: '❓', description: '', color: '#666' };
}

export const combatCategories: Record<CharacterClass, CombatCategory> = {
  speedster: 'Attacker',
  support: 'Support',
  tank: 'Tank',
  amplifier: 'Amplifier',
  esoteric: 'Support',
  attacker: 'Attacker',
};

export const classCategoryOverrides: Partial<Record<string, CombatCategory[]>> = {};

export function getClassCategories(identityId: string): CombatCategory[] {
  const override = classCategoryOverrides[identityId];
  if (override) return override;
  const identity = identities.find(i => i.id === identityId);
  if (!identity) return ['Attacker'];
  const cats = Array.from(new Set(identity.classes.map(c => combatCategories[c])));
  return cats.length > 0 ? cats : ['Attacker'];
}

export function getClassCategory(identityId: string): CombatCategory {
  return getClassCategories(identityId)[0];
}

export function classCategoryEffect(classLevel: number): number {
  const clamped = Math.min(20, Math.max(1, classLevel));
  return (clamped * 2) / 100;
}

export function classCategoryHealBonus(classLevel: number, category: CombatCategory): number {
  const clamped = Math.min(20, Math.max(1, classLevel));
  if (category === 'Support') return (clamped * 2) / 100;
  if (category === 'Amplifier') return (clamped) / 100;
  return 0;
}

export function classCategoryBonus(category: CombatCategory, classLevel: number): { atk: number; hp: number; def: number; spd: number } {
  const levelFactor = 1 + (classLevel - 1) * 0.01;
  switch (category) {
    case 'Attacker': return { atk: 1.1 * levelFactor, hp: 1, def: 1, spd: 1 };
    case 'Tank': return { atk: 1, hp: 1, def: 1.1 * levelFactor, spd: 1 };
    case 'Support': return { atk: 1, hp: 1.1 * levelFactor, def: 1, spd: 1 };
    case 'Amplifier': return { atk: 1.05 * levelFactor, hp: 1, def: 1.05 * levelFactor, spd: 1 };
    default: return { atk: 1, hp: 1, def: 1, spd: 1 };
  }
}

export function scaledStats(identity: Identity, level: number, classSkillLevel: number = 1) {
  const scale = 1 + (level - 1) * 0.03;
  const classBoost = 1 + ((classSkillLevel - 1) * 0.00095);
  const cat = getClassCategory(identity.id);
  const catBonus = classCategoryBonus(cat, classSkillLevel);
  return {
    hp: Math.floor(identity.baseStats.hp * scale * classBoost * catBonus.hp),
    atk: Math.floor(identity.baseStats.atk * scale * classBoost * catBonus.atk),
    def: Math.floor(identity.baseStats.def * scale * classBoost * catBonus.def),
    spd: Math.floor(identity.baseStats.spd * scale * classBoost * catBonus.spd),
  };
}

export function skillDmgMult(skillType: SkillType, skillLevel: number): number {
  const lvls = Math.max(0, skillLevel - 1);
  if (skillType === 'ego') return 1 + lvls * 0.00025;
  if (skillType === 'normal1' || skillType === 'normal2' || skillType === 'normal3') return 1 + lvls * 0.0005;
  return 1;
}

export function expForLevel(level: number): number {
  if (level < 1) level = 1;
  const exponential = 100 * Math.pow(1.15, level - 1);
  const linear = 50 * (level - 1);
  return Math.floor(exponential + linear);
}

export function totalExpForLevel(targetLevel: number): number {
  let total = 0;
  for (let l = 1; l < targetLevel; l++) {
    total += expForLevel(l);
  }
  return total;
}

// ─── Leader Skills ─────────────────────────────────────────────────────
export interface LeaderSkill {
  name: string;
  description: string;
  buffEffect: string;
}

export const leaderSkills: Record<string, LeaderSkill> = {
  arthur_excalibur: {
    name: 'Excalibur: Appropriate',
    description: 'All allies gain +12% ATK. Allies with "Resolve" gain an additional +10% ATK and +5% DEF.',
    buffEffect: '+12% ATK all; +10% ATK & +5% DEF for Resolve allies',
  },
  genevieve_weeping_blade: {
    name: 'The Weight of Memory',
    description: 'All allies gain +10% ATK and +8% DEF. Allies with 3+ Bleed stacks gain an additional +10% ATK and +10% effect healing.',
    buffEffect: '+10% ATK, +8% DEF all; +10% ATK & +10% healing for Bleed allies',
  },
  kaelen_dusk_reaper: {
    name: 'The Weight of Shadows',
    description: 'All allies gain +12% ATK & +6% SPD. Allies with 5+ Eclipse stacks gain +10% ATK & +8% DEF, and their attacks apply 2 Shadow Marks on hit.',
    buffEffect: '+12% ATK, +6% SPD all; +10% ATK, +8% DEF for Eclipse allies; attacks apply 2 Marks',
  },
  seraphina_radiant_martyr: {
    name: 'The Weight of Sacrifice',
    description: 'All allies gain +8% ATK & +12% DEF. Allies with Radiance stacks gain +10% healing received and +10% damage dealt.',
    buffEffect: '+8% ATK, +12% DEF all; +10% heal, +10% damage for Radiance allies',
  },
  valerius_crimson_reaver: {
    name: 'The Weight of Bloodshed',
    description: 'All allies gain +15% ATK & +5% SPD. Allies with Fury stacks gain +10% ATK and +10% critical chance.',
    buffEffect: '+15% ATK, +5% SPD all; +10% ATK, +10% crit for Fury allies',
  },
  morwen_lamenting_tides: {
    name: 'The Weight of the Deep',
    description: 'All allies gain +8% ATK & +12% DEF. Allies with Depth stacks gain +10% DEF and +10% healing received.',
    buffEffect: '+8% ATK, +12% DEF all; +10% DEF, +10% heal for Depth allies',
  },
  ragnar_unchained: {
    name: 'The Weight of Fury',
    description: 'All allies gain +10% ATK & +6% crit chance. Allies with Rage stacks gain +10% ATK and +5% damage reduction.',
    buffEffect: '+10% ATK, +6% crit all; +10% ATK, +5% dmg reduction for Rage allies',
  },
  isolde_mournful: {
    name: 'The Weight of Memory',
    description: 'All allies gain +12% ATK & +8% DEF. Allies with Resolve stacks gain +10% damage dealt and +10% healing received.',
    buffEffect: '+12% ATK, +8% DEF all; +10% damage, +10% heal for Resolve allies',
  },
  theron_equilibrium: {
    name: 'The Weight of Balance',
    description: 'All allies gain +10% ATK & +10% DEF. Allies with Harmony stacks gain +8% damage dealt and +8% healing received.',
    buffEffect: '+10% ATK, +10% DEF all; +8% damage, +8% heal for Harmony allies',
  },
  siora_crimson_shepherd: {
    name: 'The Weight of Blood',
    description: 'All allies gain +10% ATK & +8% DEF. Allies with Fury stacks gain +10% damage dealt and +10% healing received.',
    buffEffect: '+10% ATK, +8% DEF all; +10% damage, +10% heal for Fury allies',
  },
  orin_echoing_void: {
    name: 'The Weight of Silence',
    description: 'All allies gain +8% ATK & +8% SPD. Allies with Shadow stacks gain +10% ATK and +10% critical chance.',
    buffEffect: '+8% ATK, +8% SPD all; +10% ATK, +10% crit for Shadow allies',
  },
};

export interface LeaderBuff {
  atkPct?: number;
  defPct?: number;
  elements?: string[];
}

export const leaderBuffs: Record<string, LeaderBuff> = {
  arthur_excalibur: { atkPct: 0.12 },
  genevieve_weeping_blade: { atkPct: 0.10, defPct: 0.08 },
  kaelen_dusk_reaper: { atkPct: 0.12, defPct: 0.06 },
  seraphina_radiant_martyr: { atkPct: 0.08, defPct: 0.12 },
  valerius_crimson_reaver: { atkPct: 0.15, defPct: 0.05 },
  morwen_lamenting_tides: { atkPct: 0.08, defPct: 0.12 },
  ragnar_unchained: { atkPct: 0.10, defPct: 0.00 },
  isolde_mournful: { atkPct: 0.12, defPct: 0.08 },
  theron_equilibrium: { atkPct: 0.10, defPct: 0.10 },
  siora_crimson_shepherd: { atkPct: 0.10, defPct: 0.08 },
  orin_echoing_void: { atkPct: 0.08, defPct: 0.08 },
};

export function getLeaderBuff(
  leaderId: string | undefined,
  memberElement: string,
  hpPct: number,
): { atkMult: number; defMult: number; applies: boolean } {
  const b = leaderId ? leaderBuffs[leaderId] : undefined;
  if (!b) return { atkMult: 1, defMult: 1, applies: false };
  const elementOk = !b.elements || b.elements.length === 0 || b.elements.includes(memberElement);
  if (!elementOk) return { atkMult: 1, defMult: 1, applies: false };
  let atk = b.atkPct ?? 0;
  let def = b.defPct ?? 0;
  return { atkMult: 1 + atk, defMult: 1 + def, applies: atk > 0 || def > 0 };
}

export const SSR_RANK_BUFFS: Record<number, { egoDmg?: number; normal1Dmg?: number; normal2Dmg?: number; normal3Dmg?: number }> = {
  5: { normal1Dmg: 0.15 },
  6: { normal2Dmg: 0.20 },
  7: { egoDmg: 0.25 },
  8: { egoDmg: 0.15 },
};

export const SR_RANK_BUFFS: Record<number, { egoDmg?: number; normal1Dmg?: number; normal2Dmg?: number }> = {
  6: { normal1Dmg: 0.12 },
  7: { egoDmg: 0.12 },
  8: { egoDmg: 0.08 },
};

// ─── IDENTITIES ────────────────────────────────────────────────────────
export const identities: Identity[] = [
  // ─── ARTHUR ──────────────────────────────────────────────────────────
  {
    id: 'arthur_excalibur',
    name: 'Arthur',
    title: 'The Wielder of Excalibur',
    rarity: 'SSR',
    grade: '000',
    classes: ['esoteric', 'support'],
    element: 'Pale',
    baseInfusion: 'slash',
    faction: 'LCA: Frontline',
    baseStats: { hp: 4000, atk: 620, def: 280, spd: 130, sanity: 280 },
    levelCap: 70,
    description: '"A flawless king is the one who can contain their sword, however, there\'s no king and no sword *to be contained*."',
    portrait: '⚔️',
    rankUpgrades: { ssr: [9, 9, 18, 18, 27, 32, 36, 40] },
    defenses: {
      endured: ['red', 'pale', 'slash', 'pierce'],
      weak: ['black', 'blunt'],
      normal: ['white'],
    },
    panicNote: 'Unit does not act for this turn. Panic does not memetically spread to other units.',
    transformationTrigger: 'timer',
    triggerTurns: 10,
    ultimateDuration: 10,
    transformedSkills: [
      { name: 'Excalibur: Resolve', description: 'An incision strike. Apply Wither. For every 5 Wither stacks, gain 1 Resolve.', type: 'normal1', basePower: 7, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'slash', coinType: 'incision', buffEffect: 'Apply Wither. Every 5 Wither → 1 Resolve.' },
      { name: 'Excalibur: Slay and Behead', description: 'Two devastating unbreakable strikes.', type: 'normal2', basePower: 10, baseCoins: 2, powerGrowth: 2, coinGrowth: 0, damageType: 'pale', infusion: 'slash', coinType: 'unbreakable', buffEffect: '2 Unbreakable coins.' },
      { name: '"SHIT! I\'ll solve this myself"', description: 'A reckless strike. 2 Normal coins. If Resolve is at 25, use "Excalibur: True Execution" instead.', type: 'normal3', basePower: 9, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'blunt', coinType: 'normal', buffEffect: 'If Resolve ≥ 25: Replace with Excalibur: True Execution.' },
      { name: 'Excalibur: True Execution', description: 'The ultimate execution. 1 Unbreakable coin. Deals 100% bonus damage against enemies with any Wither stack. On kill: Gain 1 "Golden Heart Will".', type: 'ego', basePower: 15, baseCoins: 1, powerGrowth: 3, coinGrowth: 0, damageType: 'pale', infusion: 'slash', coinType: 'unbreakable', buffEffect: '+100% DMG vs Wither targets. On kill: +2% DMG (Golden Heart Will).', isUltimate: false },
    ],
    transformationPassive: {
      name: 'Excalibur\'s Shred',
      description: 'Each turn during Excalibur Overdrive, apply 1 stack of Corrosion to the enemy (reduce DEF by 3% per stack, max 5 stacks).',
      mechanics: { corrosionPerTurn: 1, maxStacks: 5, defReductionPerStack: 0.03 },
    },
    skills: [
      { name: 'Excalibur: Pummel', description: 'A pummeling strike with the legendary blade. 1 Normal coin, 1 Counter die.', type: 'normal1', basePower: 8, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'normal', buffEffect: '1 Counter die' },
      { name: 'Excalibur: Wither', description: 'Strike the enemy with withering force. 3 Normal coins. On hit, apply "Wither" stack. At 15 stacks, apply Fragile.', type: 'normal2', basePower: 6, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'slash', coinType: 'normal', buffEffect: 'On hit: Apply Wither (weakens per stack). At 15 stacks: Apply Fragile.' },
      { name: 'Excalibur: Behead', description: 'A decapitating strike. 1 Unbreakable coin.', type: 'normal3', basePower: 12, baseCoins: 1, powerGrowth: 2, coinGrowth: 0, damageType: 'pale', infusion: 'slash', coinType: 'unbreakable', buffEffect: 'Unbreakable coin.' },
      { name: 'Effloresced E.G.O: Excalibur', description: 'Unleash the full power of Excalibur. For the next 10 moves, all skills change.', type: 'ego', basePower: 1, baseCoins: 1, powerGrowth: 0, coinGrowth: 0, damageType: 'pale', infusion: 'slash', coinType: 'normal', buffEffect: 'Transforms all skills for 10 moves.', isUltimate: false },
      { name: 'Pale Resonance 2', description: 'Elevate your damage by 1.2 per Resolve stack. Heals SP on hit.', type: 'class', basePower: 0, baseCoins: 0, powerGrowth: 0, coinGrowth: 0, buffEffect: '+1.2 DMG per Resolve. SP heal on hit.' },
    ],
    passives: [
      { rankRequired: 0, name: 'Pale Resonance 2', description: 'Elevate your damage by 1.2 per Resolve stack. Heals SP on hit.' },
      { rankRequired: 2, name: 'Golden Heart Will', description: 'On kill with True Execution: Gain 2% damage increase per stack (stacks infinitely).' },
      { rankRequired: 4, name: 'Pale Resonance Mastery', description: 'Resolve stacks generate 2x faster. True Execution deals +50% damage to enemies with 10+ Wither stacks.' },
    ],
    corePassive: {
      name: 'Pale Resonance 2',
      description: 'The pale light of Excalibur resonates with your resolve.',
      effect: 'Each Resolve stack increases damage dealt by 1.2. Healing SP on every hit. At 25 Resolve, True Execution becomes available instantly.',
      rankRequired: 0,
      mechanics: { damagePerResolve: 1.2, spHealOnHit: true, trueExecutionThreshold: 25 },
    },
    signatureWeaponId: 'excalibur_greatsword',
    autoSelectPassive: { probability: 0.25 },
  },

  // ─── GENEVIEVE ──────────────────────────────────────────────────────
  {
    id: 'genevieve_weeping_blade',
    name: 'Genevieve',
    title: 'The Weeping Blade',
    rarity: 'SR',
    grade: '00',
    unreleased: true,
    classes: ['support', 'amplifier'],
    element: 'Pale',
    baseInfusion: 'slash',
    faction: 'LCA: Vanguard',
    baseStats: { hp: 3800, atk: 450, def: 300, spd: 110, sanity: 250 },
    levelCap: 60,
    description: '"A knight who carries the weight of a thousand fallen comrades. Her tears are not of sorrow, but of resolve – each drop a promise to those who fell before her."',
    portrait: '🌹',
    rankUpgrades: { sr: [6, 6, 12, 12, 18, 22, 25, 28] },
    defenses: {
      endured: ['red', 'slash', 'pierce'],
      weak: ['black', 'blunt'],
      normal: ['pale', 'white'],
    },
    panicNote: 'Unit does not act for this turn. Allies gain +15% DEF for 2 turns.',
    transformationTrigger: 'ultimate',
    ultimateDuration: 8,
    transformedSkills: [
      { name: 'Tears of the Garden', description: 'A rain of grieving tears. 1 Unbreakable coin. Apply 3 Bleed to all enemies. Heal allies for 2% max HP per Bleed applied.', type: 'normal1', basePower: 6, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Apply 3 Bleed all enemies. Heal allies 2% HP per Bleed.' },
      { name: 'Garden of Thorns', description: 'Thorns pierce the bleeding. 2 Normal coins. +20% damage vs enemies with Bleed. Gain 1 "Thorn" (next skill +10% damage, max 3).', type: 'normal2', basePower: 7, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'normal', buffEffect: '+20% DMG vs Bleed enemies. Gain 1 Thorn (+10% next skill).' },
      { name: '"For Those Who Fell"', description: 'A desperate strike for the fallen. 1 Unbreakable + 1 Normal coin. If ally has died this battle, +50% damage. Revive most recent fallen ally at 30% HP (once).', type: 'normal3', basePower: 8, baseCoins: 1, powerGrowth: 2, coinGrowth: 0, damageType: 'pale', infusion: 'slash', coinType: 'normal', buffEffect: '+50% DMG if ally died. Revive 1 ally at 30% HP (once per battle).' },
      { name: 'Final Lament', description: 'The ultimate mourning. 2 Unbreakable coins. Deals 100% bonus damage to enemies with 5+ Bleed. On kill: Apply 1 Golden Heart Will to all allies.', type: 'ego', basePower: 12, baseCoins: 2, powerGrowth: 2, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'unbreakable', buffEffect: '+100% DMG vs 5+ Bleed. On kill: +1 Golden Heart Will to all allies.', isUltimate: true },
    ],
    transformationPassive: {
      name: 'Garden\'s Blessing',
      description: 'Each turn during The Weeping Garden, heal all allies for 5% of ATK and increase all allies\' damage dealt by 3% per turn (stacks up to 5).',
      mechanics: { healPercent: 0.05, damageBoostPerTurn: 0.03, maxStacks: 5 },
    },
    skills: [
      { name: 'Weeping Edge', description: 'A tearful strike that leaves lasting wounds. 2 Normal coins. On hit, apply 1 Bleed stack.', type: 'normal1', basePower: 6, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'slash', coinType: 'normal', buffEffect: 'On hit: Apply 1 Bleed (2% max HP/turn, max 10).' },
      { name: 'Tears of the Fallen', description: 'A piercing lament. 1 Normal + 1 Counter die. On hit, heal allies for 5% of damage dealt. Counter applies 2 Bleed.', type: 'normal2', basePower: 5, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'pierce', coinType: 'normal', buffEffect: 'Heal allies 5% dmg. Counter: Apply 2 Bleed.' },
      { name: 'Grieving Blade', description: 'A mournful execution. 3 Normal coins. +3% damage per Bleed stack on enemy. On kill: Grant all allies 1 "Resolve" stack.', type: 'normal3', basePower: 5, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'slash', coinType: 'normal', buffEffect: '+3% DMG per Bleed. On kill: +1 Resolve to allies.' },
      { name: 'Effloresced E.G.O: The Weeping Garden', description: 'Manifest the garden of thorns. For the next 8 moves, all skills change.', type: 'ego', basePower: 1, baseCoins: 1, powerGrowth: 0, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'normal', buffEffect: 'Transforms all skills for 8 moves.', isUltimate: true },
      { name: 'Blood and Tears', description: 'Gain 1 Bleed on self each turn. At turn end, if 3+ Bleed, heal all allies for 15% of missing HP.', type: 'class', basePower: 0, baseCoins: 0, powerGrowth: 0, coinGrowth: 0, buffEffect: 'Self: +1 Bleed/turn. 3+ Bleed → heal allies 15% missing HP.' },
    ],
    passives: [
      { rankRequired: 0, name: 'Blood and Tears', description: 'Gain 1 Bleed on self each turn. At turn end, if 3+ Bleed, heal all allies for 15% of missing HP.' },
      { rankRequired: 2, name: 'Shared Grief', description: 'For every ally with 2+ Bleed stacks, all allies gain +5% ATK and +3% DEF (max +20% ATK, +12% DEF).' },
      { rankRequired: 4, name: 'Persistent Grief', description: 'Bleed stacks on self increase healing output by 2% per stack. Gain 2 Bleed per turn instead of 1.' },
    ],
    corePassive: {
      name: 'The Weeping Garden (Amplifier)',
      description: 'The garden blooms from your grief, amplifying the strength of your allies and preserving their resolve.',
      effect: 'For every enemy with Bleed, all allies gain +5% ATK (max +25%). Whenever Genevieve hits a Bleeding enemy, all allies with "Resolve" have their stacks extended by 1 turn (max 5 extra turns). At 5 Bleed stacks on self, double all healing and amplify ally damage by an additional 20%.',
      rankRequired: 0,
      mechanics: { atkPerBleedEnemy: 0.05, maxBleedEnemyAtk: 0.25, resolveExtension: 1, maxResolveExtension: 5, selfBleedThreshold: 5, thresholdMultiplier: 2 },
    },
    signatureWeaponId: 'weeping_garden_gauntlets',
  },

  // ─── KAELEN ──────────────────────────────────────────────────────────
  {
    id: 'kaelen_dusk_reaper',
    name: 'Kaelen',
    title: 'The Dusk Reaper',
    rarity: 'SSR',
    grade: '000',
    classes: ['attacker', 'esoteric'],
    element: 'Black',
    baseInfusion: 'slash',
    faction: 'The Dusk Syndicate',
    baseStats: { hp: 4200, atk: 680, def: 250, spd: 140, sanity: 320 },
    levelCap: 70,
    description: '"Born from the ashes of a forgotten kingdom, Kaelen wields the power of twilight itself. Every step he takes leaves shadows in his wake, and every strike drains the light from his enemies."',
    portrait: '🌑',
    rankUpgrades: { ssr: [8, 8, 16, 16, 24, 30, 34, 38] },
    defenses: {
      endured: ['black', 'slash'],
      weak: ['white', 'blunt'],
      normal: ['red', 'pale', 'pierce'],
    },
    panicNote: 'Unit does not act for this turn. All enemies gain 2 Shadow Mark stacks and are Blinded (ATK –20%, 2 turns).',
    transformationTrigger: 'custom',
    transformationCondition: 'Twilight’s Harvest – triggers when Kaelen lands the killing blow on an enemy that has at least 3 Shadow Marks on them. Permanent.',
    ultimateDuration: 0,
    transformedSkills: [
      { name: 'Shadow Tide', description: 'Apply 3 Shadow Marks to all enemies. For every enemy with 5+ Shadow Marks, Kaelen heals for 10% of his max HP. Gain 2 Eclipse stacks.', type: 'normal1', basePower: 7, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'black', infusion: 'slash', coinType: 'unbreakable', buffEffect: 'Apply Shadow Mark, heal, gain Eclipse.' },
      { name: 'Midnight Requiem', description: '+15% damage per Eclipse stack (max +120%). Counter die: apply 4 Shadow Marks to attacker and gain 1 Eclipse.', type: 'normal2', basePower: 8, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'black', infusion: 'pierce', coinType: 'normal', buffEffect: '+15% DMG per Eclipse; Counter applies 4 Shadow Marks.' },
      { name: '"The Abyss Remembers"', description: 'If 10+ Eclipse, +100% damage and all coins become Unbreakable. On kill, allies gain 2 Golden Heart Will.', type: 'normal3', basePower: 10, baseCoins: 2, powerGrowth: 2, coinGrowth: 0, damageType: 'black', infusion: 'blunt', coinType: 'unbreakable', buffEffect: '+100% DMG if 10+ Eclipse; on kill +2 Golden Heart Will.' },
      { name: 'Final Eclipse', description: 'Deals 150% bonus damage to enemies with 8+ Shadow Marks. Consume all Eclipse (min 5) for +50% damage per stack. After use, lose all Eclipse.', type: 'ego', basePower: 14, baseCoins: 2, powerGrowth: 2, coinGrowth: 0, damageType: 'black', infusion: 'slash', coinType: 'unbreakable', buffEffect: '+150% DMG vs 8+ Shadow Marks; consume Eclipse for extra damage.', isUltimate: false },
    ],
    transformationPassive: {
      name: 'Eclipse Resonance',
      description: 'At start of turn, apply 1 Shadow Mark to a random enemy. At turn end, if 5+ Eclipse stacks, deal Black damage equal to 15% ATK to all enemies with Shadow Marks.',
      mechanics: { shadowMarkPerTurn: 1, eclipseThreshold: 5, damagePercent: 0.15 },
    },
    skills: [
      { name: 'Shadow Rend', description: 'On hit, apply 1 Shadow Mark (DEF –3% per stack, max 8). If enemy has 4+ Marks, +25% damage.', type: 'normal1', basePower: 6, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'black', infusion: 'slash', coinType: 'normal', buffEffect: 'Apply Shadow Mark; extra damage at 4+ stacks.' },
      { name: 'Duskfall Strike', description: '1 Unbreakable + 1 Normal coin. Unbreakable cannot be negated. On hit, gain 1 Eclipse (+5% ATK, max 8). If target < 40% HP, Unbreakable deals double damage.', type: 'normal2', basePower: 7, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'black', infusion: 'pierce', coinType: 'unbreakable', buffEffect: 'Gain Eclipse; double damage on low HP.' },
      { name: 'Twilight Execution', description: 'For every Shadow Mark on enemy, +5% damage. On kill, allies gain 1 Resolve and Kaelen gains 2 Eclipse.', type: 'normal3', basePower: 8, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'black', infusion: 'blunt', coinType: 'normal', buffEffect: '+5% DMG per Shadow Mark; on kill Resolve/Eclipse.' },
      { name: 'Effloresced E.G.O: Eclipse of Oblivion', description: 'Transforms all skills permanently when transformation triggers.', type: 'ego', basePower: 1, baseCoins: 1, powerGrowth: 0, coinGrowth: 0, damageType: 'black', infusion: 'slash', coinType: 'normal', buffEffect: 'Transformation passive.', isUltimate: false },
      { name: 'Shadow Communion', description: 'At turn start, gain 1 Eclipse stack if any enemy has 3+ Shadow Marks.', type: 'class', basePower: 0, baseCoins: 0, powerGrowth: 0, coinGrowth: 0, buffEffect: 'Passive stack gain.' },
    ],
    passives: [
      { rankRequired: 0, name: 'Eclipse Resonance', description: 'Gain 1 Eclipse stack each turn. At 5+ Eclipse, gain +10% ATK.' },
      { rankRequired: 2, name: 'Shadow Communion (Ally)', description: 'For every ally with 2+ Shadow Marks on enemies, all allies gain +6% ATK and +4% SPD (max +24% ATK, +16% SPD). Enemies with 8+ Shadow Marks take +15% damage.' },
      { rankRequired: 4, name: 'Void Stare', description: 'When panicked, all enemies gain 2 Shadow Marks and Blinded (ATK –20% for 2 turns).' },
    ],
    corePassive: {
      name: 'The Weight of Shadows',
      description: 'All allies gain +12% ATK and +6% SPD. Allies with 5+ Eclipse stacks gain +10% ATK, +8% DEF, and attacks apply 2 Shadow Marks on hit.',
      effect: 'Leader buff.',
      rankRequired: 0,
      mechanics: { atkPct: 0.12, spdPct: 0.06, extraAtk: 0.10, extraDef: 0.08 },
    },
  },

  // ─── SERAPHINA ──────────────────────────────────────────────────────
  {
    id: 'seraphina_radiant_martyr',
    name: 'Seraphina',
    title: 'The Radiant Martyr',
    rarity: 'SSR',
    grade: '000',
    classes: ['support', 'amplifier'],
    element: 'White',
    baseInfusion: 'blunt',
    faction: 'The Order of the Eternal Flame',
    baseStats: { hp: 3600, atk: 420, def: 290, spd: 115, sanity: 380 },
    levelCap: 70,
    description: '"A flame that burns twice as bright, Seraphina gave her soul to the divine light. Now she walks the battlefield as a living beacon, healing her allies with her own life force and smiting darkness with purifying radiance."',
    portrait: '☀️',
    rankUpgrades: { ssr: [8, 8, 15, 15, 22, 28, 32, 36] },
    defenses: {
      endured: ['white', 'blunt'],
      weak: ['black', 'pierce'],
      normal: ['red', 'pale', 'slash'],
    },
    panicNote: 'Unit does not act for this turn. All allies gain a shield equal to 30% of max HP and recover 10% missing HP.',
    transformationTrigger: 'custom',
    transformationCondition: 'Martyr’s Resolve – triggers when Seraphina has cumulatively healed allies for a total of 200% of her max HP over the entire battle. Permanent.',
    ultimateDuration: 0,
    transformedSkills: [
      { name: 'Luminary Cascade', description: 'Heal all allies for 12% max HP. For each ally healed above 80% HP, deal White damage equal to 30% ATK to all enemies. Gain 2 Radiance stacks.', type: 'normal1', basePower: 6, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'white', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Heal; damage based on healing overflow.' },
      { name: 'Purge the Unworthy', description: '+10% damage per Radiance stack (max +60%). Counter die: removes all enemy buffs and applies Silence (cannot use skills for 1 turn).', type: 'normal2', basePower: 7, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'white', infusion: 'blunt', coinType: 'normal', buffEffect: '+10% per Radiance; Counter purges.' },
      { name: '"For the Greater Good"', description: 'Consume all Radiance. For each stack, heal allies 5% max HP and deal White damage equal to 20% ATK to all enemies. If ally would die this turn, survive with 1 HP (once).', type: 'normal3', basePower: 9, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'white', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Consume Radiance for healing/damage; death prevention.' },
      { name: 'Final Benediction', description: 'Deal 200% damage to one enemy. If kill, resurrect highest ATK ally at 50% HP and grant +20% ATK for 3 turns. If no ally dead, shield all allies for 50% of damage dealt.', type: 'ego', basePower: 15, baseCoins: 1, powerGrowth: 3, coinGrowth: 0, damageType: 'white', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Execution; conditional rez or shield.', isUltimate: false },
    ],
    transformationPassive: {
      name: 'Radiant Martyrdom',
      description: 'Each turn, lose 5% current HP to heal allies 8% max HP. At 4+ Radiance stacks, cleanse 2 debuffs from all allies and gain 1 Martyr\'s Grace (stacks 3).',
      mechanics: { hpCost: 0.05, healPct: 0.08, cleanseCount: 2, graceMax: 3 },
    },
    skills: [
      { name: 'Purifying Ray', description: 'Remove 1 debuff from lowest HP ally; if none, heal 8% max HP. +15% damage vs enemies with Corruption.', type: 'normal1', basePower: 5, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'white', infusion: 'blunt', coinType: 'normal', buffEffect: 'Cleanse or heal; bonus vs Dark.' },
      { name: 'Martyr\'s Aegis', description: 'Unbreakable coin shields allies for 15% damage dealt (max 30% HP). Counter die: heal Seraphina 20% missing HP and gain 2 Radiance.', type: 'normal2', basePower: 5, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'white', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Shield; Counter heals and gives Radiance.' },
      { name: 'Reckoning of Light', description: '+20% damage per ally below 50% HP. On kill, all allies gain 2 Golden Heart Will and Seraphina gains 1 Martyr\'s Grace (-50% next damage).', type: 'normal3', basePower: 8, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'white', infusion: 'blunt', coinType: 'normal', buffEffect: 'Bonus vs low allies; on kill buffs.' },
      { name: 'Effloresced E.G.O: Dawn of Sacrifice', description: 'Transforms all skills permanently when transformation triggers.', type: 'ego', basePower: 1, baseCoins: 1, powerGrowth: 0, coinGrowth: 0, damageType: 'white', infusion: 'blunt', coinType: 'normal', buffEffect: 'Transformation.', isUltimate: false },
      { name: 'Shared Radiance', description: 'Each turn, gain 1 Radiance stack if any ally has a shield.', type: 'class', basePower: 0, baseCoins: 0, powerGrowth: 0, coinGrowth: 0, buffEffect: 'Passive stack gain.' },
    ],
    passives: [
      { rankRequired: 0, name: 'Radiant Martyrdom', description: 'Lose 5% HP to heal all allies 8% max HP each turn.' },
      { rankRequired: 2, name: 'Shared Radiance (Ally)', description: 'For every ally with a shield, all gain +8% DEF and +5% SPD (max +24% DEF, +15% SPD). Allies with Martyr\'s Grace take 15% less damage.' },
      { rankRequired: 4, name: 'Hollow Light', description: 'When panicked, all allies get 30% max HP shield and recover 10% missing HP.' },
    ],
    corePassive: {
      name: 'The Weight of Sacrifice',
      description: 'All allies gain +8% ATK and +12% DEF. Allies with Radiance stacks gain +10% healing received and +10% damage dealt.',
      effect: 'Leader buff.',
      rankRequired: 0,
      mechanics: { atkPct: 0.08, defPct: 0.12, extraHeal: 0.10, extraDmg: 0.10 },
    },
  },

  // ─── VALERIUS ────────────────────────────────────────────────────────
  {
    id: 'valerius_crimson_reaver',
    name: 'Valerius',
    title: 'The Crimson Reaver',
    rarity: 'SR',
    grade: '00',
    classes: ['attacker', 'speedster'],
    element: 'Red',
    baseInfusion: 'pierce',
    faction: 'The Crimson Arena',
    baseStats: { hp: 3900, atk: 580, def: 220, spd: 155, sanity: 170 },
    levelCap: 60,
    description: '"Born in the blood-soaked arenas of the underworld, Valerius fights with raw, unbridled fury. Every scar tells a story of survival, and every strike is a declaration of war against those who wronged him."',
    portrait: '🔥',
    rankUpgrades: { sr: [6, 6, 12, 12, 18, 22, 25, 28] },
    defenses: {
      endured: ['red', 'pierce'],
      weak: ['black', 'blunt'],
      normal: ['pale', 'white', 'slash'],
    },
    panicNote: 'Unit does not act for this turn. Valerius gains 5 Fury and becomes Enraged (+50% damage, +25% taken) for 2 turns.',
    transformationTrigger: 'custom',
    transformationCondition: 'Blood Rush – triggers when Valerius has landed 10 critical hits during the battle (cumulative). Permanent.',
    ultimateDuration: 0,
    transformedSkills: [
      { name: 'Sanguine Swarm', description: 'Apply 3 Hemorrhage to all enemies. For each Hemorrhage applied, heal Valerius 5% max HP. Gain 1 Fury per enemy hit (max 3).', type: 'normal1', basePower: 6, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'unbreakable', buffEffect: 'AOE Hemorrhage, healing, Fury gain.' },
      { name: 'Blade Dance of Ruin', description: '+12% damage per Fury stack (max +120%). Each hit extends Hemorrhage duration by 1 turn.', type: 'normal2', basePower: 8, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'normal', buffEffect: 'Scaling damage; extend bleed.' },
      { name: '"The Reaper\'s Due"', description: 'If 8+ Fury, +100% damage and ignore 50% DEF. On kill, all allies gain 1 Golden Heart Will and Valerius gains 2 Fury.', type: 'normal3', basePower: 10, baseCoins: 2, powerGrowth: 2, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'unbreakable', buffEffect: '+100% DMG if 8+ Fury; on kill buffs.' },
      { name: 'Final Carnage', description: 'Consume all Fury (min 5). For each stack, deal Red damage equal to 30% ATK to all enemies and 50% chance to apply 2 Hemorrhage. Reset Fury to 0.', type: 'ego', basePower: 12, baseCoins: 3, powerGrowth: 2, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'unbreakable', buffEffect: 'Consume Fury for AOE damage and Hemorrhage.', isUltimate: false },
    ],
    transformationPassive: {
      name: 'Unquenchable Fury',
      description: 'At start of turn, gain 1 Fury (max 10). At 10 Fury, all attacks +30% crit damage and heal for 10% of damage dealt.',
      mechanics: { furyPerTurn: 1, maxFury: 10, critDmgBoost: 0.30, healOnDmg: 0.10 },
    },
    skills: [
      { name: 'Bloodletting Slash', description: 'Apply 1 Hemorrhage (3% current HP/turn, max 10). If 5+ Hemorrhage, +30% crit chance.', type: 'normal1', basePower: 6, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'normal', buffEffect: 'Apply Hemorrhage; crit bonus.' },
      { name: 'Reaping Wind', description: 'Unbreakable coin cannot be evaded. Gain 1 Fury (+6% ATK, max 10) on hit. At 8 Fury, all coins Unbreakable for 2 turns.', type: 'normal2', basePower: 7, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'unbreakable', buffEffect: 'Gain Fury; at 8 Fury, Unbreakable all.' },
      { name: 'Gory Execution', description: '+4% damage per Hemorrhage stack. On kill, gain 2 Fury and heal 15% max HP. If 8+ Hemorrhage, +50% damage.', type: 'normal3', basePower: 8, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'normal', buffEffect: 'Scaling with Hemorrhage; on kill heal and Fury.' },
      { name: 'Effloresced E.G.O: Crimson Carnage', description: 'Transforms all skills permanently when transformation triggers.', type: 'ego', basePower: 1, baseCoins: 1, powerGrowth: 0, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'normal', buffEffect: 'Transformation.', isUltimate: false },
      { name: 'Blood Pact', description: 'Each turn, gain 1 Fury if any enemy has Hemorrhage.', type: 'class', basePower: 0, baseCoins: 0, powerGrowth: 0, coinGrowth: 0, buffEffect: 'Passive Fury gain.' },
    ],
    passives: [
      { rankRequired: 0, name: 'Unquenchable Fury', description: 'Gain 1 Fury per turn. At 10 Fury, +30% crit damage and heal 10% of damage dealt.' },
      { rankRequired: 2, name: 'Blood Pact (Ally)', description: 'For every ally with 2+ Hemorrhage on target, all gain +5% ATK and +5% SPD (max +20% ATK, +20% SPD). Enemies with 8+ Hemorrhage have DEF –20%.' },
      { rankRequired: 4, name: 'Frenzied Void', description: 'When panicked, gain 5 Fury and become Enraged (+50% damage, +25% taken) for 2 turns.' },
    ],
    corePassive: {
      name: 'The Weight of Bloodshed',
      description: 'All allies gain +15% ATK and +5% SPD. Allies with Fury stacks gain +10% ATK and +10% critical chance.',
      effect: 'Leader buff.',
      rankRequired: 0,
      mechanics: { atkPct: 0.15, spdPct: 0.05, extraAtk: 0.10, extraCrit: 0.10 },
    },
  },

  // ─── MORWEN ──────────────────────────────────────────────────────────
  {
    id: 'morwen_lamenting_tides',
    name: 'Morwen',
    title: 'The Lamenting Tides',
    rarity: 'SSR',
    grade: '000',
    classes: ['esoteric', 'tank'],
    element: 'Pale',
    baseInfusion: 'blunt',
    faction: 'The Drowned Cathedral',
    baseStats: { hp: 4800, atk: 380, def: 370, spd: 100, sanity: 220 },
    levelCap: 70,
    description: '"From the deep abyss where sorrow meets the sea, Morwen rises – a spirit of the drowned, carrying the echoes of a lost civilization. Her tears are saltwater, and her voice commands the crushing waves."',
    portrait: '🌊',
    rankUpgrades: { ssr: [9, 9, 17, 17, 25, 31, 35, 39] },
    defenses: {
      endured: ['pale', 'blunt'],
      weak: ['white', 'slash'],
      normal: ['red', 'black', 'pierce'],
    },
    panicNote: 'Unit does not act for this turn. All enemies gain 3 Drowning and are Chilled (damage –30% for 2 turns). All allies gain 20% max HP shield.',
    transformationTrigger: 'custom',
    transformationCondition: 'Abyssal Endurance – triggers when Morwen has blocked cumulative damage equal to 300% of her max HP using Guard. Permanent.',
    ultimateDuration: 0,
    transformedSkills: [
      { name: 'Crushing Depths', description: 'Apply 3 Drowning to all enemies. For each enemy with 5+ Drowning, allies get 10% max HP shield. Gain 1 Depth per enemy hit.', type: 'normal1', basePower: 5, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'AOE Drowning, shields, Depth gain.' },
      { name: 'Monsoon of Sorrow', description: '+10% damage per Depth stack (max +60%). Each coin has 50% chance to apply extra Drowning. If enemy 8+ Drowning, this skill becomes Unbreakable.', type: 'normal2', basePower: 7, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'normal', buffEffect: 'Scaling with Depth; extra Drowning; becomes Unbreakable.' },
      { name: '"For the Drowned"', description: 'If 8+ Depth stacks, +100% damage and stun enemy for 1 turn. Counter die: apply 4 Drowning to all enemies and reduce SPD by 20% for 2 turns.', type: 'normal3', basePower: 9, baseCoins: 2, powerGrowth: 2, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Extra damage and stun; Counter AOE debuff.' },
      { name: 'Final Abyss', description: 'Consume all Depth stacks (min 6). For each, deal Pale damage equal to 25% ATK to all enemies and apply 1 Drowning. Reset Depth to 0; all allies gain 2 Golden Heart Will.', type: 'ego', basePower: 13, baseCoins: 3, powerGrowth: 2, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Consume Depth for AOE damage and Drowning; reset for Golden Heart.', isUltimate: false },
    ],
    transformationPassive: {
      name: 'Depths of Grief',
      description: 'At start of turn, apply 1 Drowning to enemy with highest ATK. At turn end, if 4+ Depth stacks, heal all allies 10% max HP and cleanse 1 debuff from Morwen.',
      mechanics: { drowningPerTurn: 1, depthThreshold: 4, healPct: 0.10, cleanseCount: 1 },
    },
    skills: [
      { name: 'Abyssal Pressure', description: 'Apply 1 Drowning (ATK –4% per stack, max 8). If 5+ Drowning, gain +1 coin (3 coins).', type: 'normal1', basePower: 5, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'normal', buffEffect: 'Apply Drowning; extra coin at 5+.' },
      { name: 'Tidal Crush', description: 'Unbreakable coin +50% damage vs Drowning enemies. Counter die: apply 2 Drowning to attacker and gain 1 Depth (+5% DEF, max 6).', type: 'normal2', basePower: 6, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Bonus vs Drowning; Counter gains Depth.' },
      { name: 'Grave of the Deep', description: '+3% damage per Drowning stack and reduce incoming healing by 5% per stack. On kill, all allies gain 1 Resolve and Morwen gains 2 Depth.', type: 'normal3', basePower: 7, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'normal', buffEffect: 'Scaling and healing reduction; on kill buffs.' },
      { name: 'Effloresced E.G.O: The Drowned Cathedral', description: 'Transforms all skills permanently when transformation triggers.', type: 'ego', basePower: 1, baseCoins: 1, powerGrowth: 0, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'normal', buffEffect: 'Transformation.', isUltimate: false },
      { name: 'Tidal Bond', description: 'Each turn, gain 1 Depth if any enemy has 3+ Drowning.', type: 'class', basePower: 0, baseCoins: 0, powerGrowth: 0, coinGrowth: 0, buffEffect: 'Passive Depth gain.' },
    ],
    passives: [
      { rankRequired: 0, name: 'Depths of Grief', description: 'Apply 1 Drowning to highest ATK enemy each turn. At 4+ Depth, heal allies and cleanse Morwen.' },
      { rankRequired: 2, name: 'Tidal Bond (Ally)', description: 'For every enemy with 3+ Drowning, all allies gain +6% DEF and +4% ATK (max +24% DEF, +16% ATK). Enemies with 8+ Drowning are slowed (SPD –20%).' },
      { rankRequired: 4, name: 'Sunken Silence', description: 'When panicked, all enemies gain 3 Drowning and Chilled (damage –30% for 2 turns). Allies gain 20% max HP shield.' },
    ],
    corePassive: {
      name: 'The Weight of the Deep',
      description: 'All allies gain +8% ATK and +12% DEF. Allies with Depth stacks gain +10% DEF and +10% healing received.',
      effect: 'Leader buff.',
      rankRequired: 0,
      mechanics: { atkPct: 0.08, defPct: 0.12, extraDef: 0.10, extraHeal: 0.10 },
    },
  },

  // ─── RAGNAR ──────────────────────────────────────────────────────────
  {
    id: 'ragnar_unchained',
    name: 'Ragnar',
    title: 'The Unchained',
    rarity: 'SSR',
    grade: '000',
    classes: ['attacker', 'tank'],
    element: 'Red',
    baseInfusion: 'slash',
    faction: 'The Northern Tribes',
    baseStats: { hp: 5000, atk: 620, def: 340, spd: 105, sanity: 160 },
    levelCap: 70,
    description: '"A berserker whose fury knows no bounds. With every blow he lands, his rage intensifies until he becomes an unstoppable force of destruction – a living storm of steel and blood."',
    portrait: '🔥',
    rankUpgrades: { ssr: [9, 9, 18, 18, 26, 32, 36, 40] },
    defenses: {
      endured: ['red', 'slash', 'blunt'],
      weak: ['black', 'pierce'],
      normal: ['pale', 'white'],
    },
    panicNote: 'Unit does not act for this turn. Ragnar gains 3 Rage and becomes Unstoppable (immune to CC for 2 turns). Allies gain 20% damage boost for 2 turns.',
    transformationTrigger: 'custom',
    transformationCondition: 'Berserker’s Wrath – triggers when Ragnar has taken cumulative damage equal to 200% of his max HP (without dying). Permanent.',
    ultimateDuration: 0,
    transformedSkills: [
      { name: 'Frenzied Butchery', description: '3 Unbreakable coins. Each applies 1 Bleed (2% max HP/turn, max 8). +5% damage per Bleed on target. Heal 3% of damage dealt per coin.', type: 'normal1', basePower: 7, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'slash', coinType: 'unbreakable', buffEffect: 'Apply Bleed; scaling damage; lifesteal.' },
      { name: 'World Breaker', description: '+15% damage per Rage stack (max +75%). Counter die: apply 3 Stagger to attacker and reduce their next turn damage by 20%.', type: 'normal2', basePower: 9, baseCoins: 2, powerGrowth: 2, coinGrowth: 0, damageType: 'red', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Scaling with Rage; Counter debuff.' },
      { name: '"Ragnarök\'s Embrace"', description: 'If 5 Rage, +100% damage and ignore 50% DEF. On kill, allies gain 2 Golden Heart Will and Ragnar gains 50% max HP shield for 2 turns.', type: 'normal3', basePower: 10, baseCoins: 3, powerGrowth: 2, coinGrowth: 0, damageType: 'red', infusion: 'slash', coinType: 'unbreakable', buffEffect: '+100% DMG at 5 Rage; on kill shield and Golden Heart.' },
      { name: 'Final Cataclysm', description: 'Consume all Rage stacks (min 5). For each stack, deal Red damage equal to 40% ATK to all enemies and apply 2 Bleed. Reset Rage to 0 (transformation stays).', type: 'ego', basePower: 14, baseCoins: 2, powerGrowth: 2, coinGrowth: 0, damageType: 'red', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Consume Rage for AOE damage and Bleed.', isUltimate: false },
    ],
    transformationPassive: {
      name: 'Unyielding Rage',
      description: 'At start of turn, if below 50% HP, gain 1 Rage (max 5). Rage also grants +5% damage resistance per stack.',
      mechanics: { rageOnLowHP: 1, maxRage: 5, dmgResistPerRage: 0.05 },
    },
    skills: [
      { name: 'Savage Cleave', description: 'On hit, gain 1 Rage (+5% ATK and +3% crit chance per stack, max 5). If target below 50% HP, gain additional Rage.', type: 'normal1', basePower: 6, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'slash', coinType: 'normal', buffEffect: 'Gain Rage; extra if enemy low HP.' },
      { name: 'Battering Ram', description: 'Unbreakable coin +40% damage if 3+ Rage. Normal coin applies 1 Stagger (DEF –10% per stack, max 3). Gain 1 Rage on hit.', type: 'normal2', basePower: 7, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Bonus damage with Rage; apply Stagger; gain Rage.' },
      { name: 'Reckless Onslaught', description: '+8% damage per Rage stack. On kill, gain 2 Rage (can exceed max by 2) and heal 20% max HP.', type: 'normal3', basePower: 8, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'slash', coinType: 'normal', buffEffect: 'Scaling with Rage; on kill heal and extra Rage.' },
      { name: 'Effloresced E.G.O: Unchained Rage', description: 'Transforms all skills permanently when transformation triggers.', type: 'ego', basePower: 1, baseCoins: 1, powerGrowth: 0, coinGrowth: 0, damageType: 'red', infusion: 'slash', coinType: 'normal', buffEffect: 'Transformation.', isUltimate: false },
      { name: 'Bloodlust Aura', description: 'Each turn, gain 1 Rage if any enemy has Bleed.', type: 'class', basePower: 0, baseCoins: 0, powerGrowth: 0, coinGrowth: 0, buffEffect: 'Passive Rage gain.' },
    ],
    passives: [
      { rankRequired: 0, name: 'Unyielding Rage', description: 'Below 50% HP, gain 1 Rage per turn. Rage also gives 5% damage resistance per stack.' },
      { rankRequired: 2, name: 'Bloodlust Aura (Ally)', description: 'For every ally with at least 1 Rage (or similar), all gain +8% ATK and +4% crit chance (max +24% ATK, +12% crit). Enemies with 3+ Bleed take +15% damage from Ragnar.' },
      { rankRequired: 4, name: 'Frenzied Rampage', description: 'When panicked, gain 3 Rage and become Unstoppable (immune to CC for 2 turns). Allies gain 20% damage boost for 2 turns.' },
    ],
    corePassive: {
      name: 'The Weight of Fury',
      description: 'All allies gain +10% ATK and +6% crit chance. Allies with Rage stacks gain +10% ATK and +5% damage reduction.',
      effect: 'Leader buff.',
      rankRequired: 0,
      mechanics: { atkPct: 0.10, critPct: 0.06, extraAtk: 0.10, dmgReduction: 0.05 },
    },
  },

  // ─── ISOLDE ──────────────────────────────────────────────────────────
  {
    id: 'isolde_mournful',
    name: 'Isolde',
    title: 'The Mournful',
    rarity: 'SR',
    grade: '00',
    classes: ['support', 'amplifier'],
    element: 'Pale',
    baseInfusion: 'slash',
    faction: 'The Knights of the Fallen',
    baseStats: { hp: 3800, atk: 400, def: 310, spd: 120, sanity: 260 },
    levelCap: 60,
    description: '"A knight who swore to protect her comrades at all costs. When one falls, her grief turns to cold fury, and she becomes an avenging specter – her sorrow sharpened into a blade that cuts through fate itself."',
    portrait: '💀',
    rankUpgrades: { sr: [6, 6, 12, 12, 18, 22, 25, 28] },
    defenses: {
      endured: ['white', 'blunt'],
      weak: ['black', 'slash'],
      normal: ['red', 'pale', 'pierce'],
    },
    panicNote: 'Unit does not act for this turn. All allies gain 3 Resolve stacks and a 25% max HP shield. Isolde heals 30% missing HP.',
    transformationTrigger: 'custom',
    transformationCondition: 'Vow of Vengeance – triggers on the first ally death in the battle. Permanent.',
    ultimateDuration: 0,
    transformedSkills: [
      { name: 'Vengeful Light', description: 'Heal all allies for 8% of ATK. For each ally healed above 70%, deal White damage equal to 30% ATK to highest ATK enemy. Grant all allies 1 Resolve (ATK +5%, max 5).', type: 'normal1', basePower: 5, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'white', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Heal, damage overflow, Resolve.' },
      { name: 'Mourning Tide', description: 'Apply 2 Weaken to all enemies. Counter die: apply 4 Weaken to attacker and reduce SPD by 30% for 2 turns. Each hit heals Isolde 5% max HP.', type: 'normal2', basePower: 5, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'pierce', coinType: 'unbreakable', buffEffect: 'AOE Weaken; Counter debuff; self-heal.' },
      { name: '"Never Again"', description: 'If ally has died this battle, +100% damage and revive most recent fallen ally with 40% HP (once). If no death, instead shield all allies for 30% max HP.', type: 'normal3', basePower: 8, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'white', infusion: 'slash', coinType: 'unbreakable', buffEffect: 'Conditional revive or shield.' },
      { name: 'Final Lament of the Fallen', description: 'Consume all Resolve from allies (min 5 total). For each, deal Pale damage equal to 25% ATK to all enemies and heal allies 5% max HP. After use, allies keep Resolve but Isolde loses all stacks. Apply 3 Golden Heart Will to all allies.', type: 'ego', basePower: 12, baseCoins: 2, powerGrowth: 2, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Consume Resolve for AOE damage/heal; applies Golden Heart.', isUltimate: false },
    ],
    transformationPassive: {
      name: 'Grief Unleashed',
      description: 'At start of each turn, if an ally has died, Isolde gains 2 Resolve and all allies gain +10% healing received. Attacks apply 1 Weaken on hit.',
      mechanics: { resolveGain: 2, healBoost: 0.10, weakenOnHit: true },
    },
    skills: [
      { name: 'Warding Strike', description: 'Grant lowest HP ally 15% max HP shield (max 30%). If no shield needed, heal 10% max HP. +15% damage vs enemies that attacked an ally this turn.', type: 'normal1', basePower: 5, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'white', infusion: 'blunt', coinType: 'normal', buffEffect: 'Shield or heal; bonus vs attackers.' },
      { name: 'Sorrowful Parry', description: 'Counter die: reduce attacker ATK by 20% for 2 turns and apply 2 Weaken (DMG –5% per stack, max 4). Normal coin: heal Isolde 10% missing HP.', type: 'normal2', basePower: 4, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'pierce', coinType: 'normal', buffEffect: 'Counter debuffs; self-heal.' },
      { name: 'Grieving Slash', description: '+20% damage per ally below 50% HP. If ally has died this battle, +50% damage and all coins become Unbreakable.', type: 'normal3', basePower: 7, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'slash', coinType: 'normal', buffEffect: 'Scaling with low allies; bonus after death.' },
      { name: 'Effloresced E.G.O: Vengeance', description: 'Transforms all skills permanently when transformation triggers.', type: 'ego', basePower: 1, baseCoins: 1, powerGrowth: 0, coinGrowth: 0, damageType: 'white', infusion: 'blunt', coinType: 'normal', buffEffect: 'Transformation.', isUltimate: false },
      { name: 'Shared Mourning', description: 'Each turn, gain 1 Resolve if any enemy has 3+ Weaken.', type: 'class', basePower: 0, baseCoins: 0, powerGrowth: 0, coinGrowth: 0, buffEffect: 'Passive Resolve gain.' },
    ],
    passives: [
      { rankRequired: 0, name: 'Grief Unleashed', description: 'After ally death, gain 2 Resolve per turn and allies get +10% healing received. Attacks apply Weaken.' },
      { rankRequired: 2, name: 'Shared Mourning (Ally)', description: 'For every ally with 2+ Weaken on enemies, all gain +5% ATK and +5% DEF (max +20% ATK, +20% DEF). Enemies with 4+ Weaken are slowed and deal 15% less damage.' },
      { rankRequired: 4, name: 'Grief-Stricken', description: 'When panicked, allies gain 3 Resolve and 25% max HP shield; Isolde heals 30% missing HP.' },
    ],
    corePassive: {
      name: 'The Weight of Memory',
      description: 'All allies gain +12% ATK and +8% DEF. Allies with Resolve stacks gain +10% damage dealt and +10% healing received.',
      effect: 'Leader buff.',
      rankRequired: 0,
      mechanics: { atkPct: 0.12, defPct: 0.08, extraDmg: 0.10, extraHeal: 0.10 },
    },
  },

  // ─── THERON ──────────────────────────────────────────────────────────
  {
    id: 'theron_equilibrium',
    name: 'Theron',
    title: 'The Equilibrium',
    rarity: 'SSR',
    grade: '000',
    classes: ['esoteric', 'amplifier'],
    element: 'Pale',
    baseInfusion: 'slash',
    faction: 'The Equilibrium Accord',
    baseStats: { hp: 4100, atk: 550, def: 280, spd: 125, sanity: 290 },
    levelCap: 70,
    description: '"A blade that balances light and dark, Theron walks the razor\'s edge between order and chaos. He seeks perfect harmony – and when he finds it, he becomes a force that bends reality itself."',
    portrait: '⚖️',
    rankUpgrades: { ssr: [8, 8, 16, 16, 24, 30, 34, 38] },
    defenses: {
      endured: ['pale', 'slash'],
      weak: ['red', 'blunt'],
      normal: ['white', 'black', 'pierce'],
    },
    panicNote: 'Unit does not act for this turn. All allies gain 3 Harmony and all enemies gain 3 Dissonance. Allies heal 10% max HP.',
    transformationTrigger: 'custom',
    transformationCondition: 'Perfect Harmony – triggers when total buffs on allies equals total debuffs on enemies (global counts). Permanent.',
    ultimateDuration: 0,
    transformedSkills: [
      { name: 'Universe\'s Pulse', description: '+10% damage per Balance stack (max +50%). On hit, apply 2 Harmony to allies and 2 Dissonance to enemies. If equilibrium maintained during this skill, all coins become Unbreakable.', type: 'normal1', basePower: 6, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'slash', coinType: 'unbreakable', buffEffect: 'Scaling with Balance; apply Harmony/Dissonance; conditional Unbreakable.' },
      { name: 'Cosmic Reckoning', description: 'Counter die: Silence attacker (cannot use skills for 1 turn) and gain 3 Balance. Normal attacks remove 1 debuff from most debuffed ally.', type: 'normal2', basePower: 7, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'white', infusion: 'pierce', coinType: 'unbreakable', buffEffect: 'Counter silences and gives Balance; cleanse ally.' },
      { name: '"The Scale Tips"', description: 'If buffs > debuffs, +100% damage. If debuffs > buffs, instead shield allies for 40% of ATK. On kill, apply 3 Golden Heart Will to all allies.', type: 'normal3', basePower: 9, baseCoins: 3, powerGrowth: 2, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'unbreakable', buffEffect: 'Conditional damage or shield; on kill Golden Heart.' },
      { name: 'Final Balance', description: 'Consume all Balance stacks (min 5). For each, deal Pale damage equal to 30% ATK to all enemies and apply 1 Harmony to allies. Reset Balance to 0 (transformation stays). If kill, allies recover 20% missing HP.', type: 'ego', basePower: 12, baseCoins: 2, powerGrowth: 2, coinGrowth: 0, damageType: 'pale', infusion: 'slash', coinType: 'unbreakable', buffEffect: 'Consume Balance for AOE damage/Harmony; reset; heal on kill.', isUltimate: false },
    ],
    transformationPassive: {
      name: 'Attuned Soul',
      description: 'At start of turn, if buffs = debuffs, gain 2 Balance and cleanse 1 random debuff from each ally.',
      mechanics: { balanceGain: 2, cleanseCount: 1 },
    },
    skills: [
      { name: 'Harmonic Blade', description: 'On hit, if enemy has debuff, gain 1 Balance (max 5). If lowest HP ally has buff, heal 8% max HP.', type: 'normal1', basePower: 5, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'slash', coinType: 'normal', buffEffect: 'Gain Balance; heal buffed ally.' },
      { name: 'Tuning Strike', description: 'Normal coin: apply 1 Dissonance (ATK –5% per stack, max 6). Counter die: remove 1 debuff from most debuffed ally and gain 1 Balance.', type: 'normal2', basePower: 5, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'white', infusion: 'pierce', coinType: 'normal', buffEffect: 'Apply Dissonance; Counter cleanse and Balance.' },
      { name: 'Resonant Slash', description: '+8% damage per Balance stack and apply 1 Harmony (healing +5% per stack, max 4) to all allies. On kill, gain 2 Balance.', type: 'normal3', basePower: 7, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'pale', infusion: 'blunt', coinType: 'normal', buffEffect: 'Scaling with Balance; apply Harmony; on kill Balance.' },
      { name: 'Effloresced E.G.O: Perfect Balance', description: 'Transforms all skills permanently when transformation triggers.', type: 'ego', basePower: 1, baseCoins: 1, powerGrowth: 0, coinGrowth: 0, damageType: 'pale', infusion: 'slash', coinType: 'normal', buffEffect: 'Transformation.', isUltimate: false },
      { name: 'Shared Equilibrium', description: 'Each turn, gain 1 Balance if any ally has Harmony and any enemy has Dissonance.', type: 'class', basePower: 0, baseCoins: 0, powerGrowth: 0, coinGrowth: 0, buffEffect: 'Passive Balance gain.' },
    ],
    passives: [
      { rankRequired: 0, name: 'Attuned Soul', description: 'At turn start, if buffs = debuffs, gain 2 Balance and cleanse 1 debuff from all allies.' },
      { rankRequired: 2, name: 'Shared Equilibrium (Ally)', description: 'For every ally with 2+ Harmony, all gain +6% ATK and +6% DEF (max +24% ATK, +24% DEF). Enemies with 3+ Dissonance take 15% more damage.' },
      { rankRequired: 4, name: 'Chaotic Void', description: 'When panicked, allies gain 3 Harmony and enemies gain 3 Dissonance; allies heal 10% max HP.' },
    ],
    corePassive: {
      name: 'The Weight of Balance',
      description: 'All allies gain +10% ATK and +10% DEF. Allies with Harmony stacks gain +8% damage dealt and +8% healing received.',
      effect: 'Leader buff.',
      rankRequired: 0,
      mechanics: { atkPct: 0.10, defPct: 0.10, extraDmg: 0.08, extraHeal: 0.08 },
    },
  },

  // ─── SIORA ──────────────────────────────────────────────────────────
  {
    id: 'siora_crimson_shepherd',
    name: 'Siora',
    title: 'The Crimson Shepherd',
    rarity: 'SR',
    grade: '00',
    classes: ['support', 'attacker'],
    element: 'Red',
    baseInfusion: 'pierce',
    faction: 'The Scarlet Covenant',
    baseStats: { hp: 3700, atk: 480, def: 260, spd: 130, sanity: 200 },
    levelCap: 60,
    description: '"A healer who learned that sometimes the only way to save the flock is to become the wolf. She carries the blood of her fallen patients and wields it as a weapon – when the battlefield turns desperate, she becomes the reckoning."',
    portrait: '🩸',
    rankUpgrades: { sr: [6, 6, 12, 12, 18, 22, 25, 28] },
    defenses: {
      endured: ['red', 'pierce'],
      weak: ['black', 'slash'],
      normal: ['pale', 'white', 'blunt'],
    },
    panicNote: 'Unit does not act for this turn. Siora gains 4 Fury and all allies are healed for 20% missing HP. All enemies gain 2 Bleed.',
    transformationTrigger: 'custom',
    transformationCondition: 'Desperate Measure – triggers when any ally (including herself) drops below 25% HP. Permanent, once per battle.',
    ultimateDuration: 0,
    transformedSkills: [
      { name: 'Bloodletting Hymn', description: 'Apply 2 Bleed to all enemies. For each Bleed on enemies, heal allies 3% of Siora\'s ATK. Gain 1 Fury (healing +5%, max 6) on hit.', type: 'normal1', basePower: 5, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'unbreakable', buffEffect: 'AOE Bleed, healing, Fury gain.' },
      { name: 'Scarlet Grace', description: 'Counter die: attacker takes 4 Bleed and Siora heals 20% missing HP. Normal coins deal +20% damage per Bleed stack on target.', type: 'normal2', basePower: 6, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'slash', coinType: 'unbreakable', buffEffect: 'Counter inflicts Bleed and heals; scaling damage.' },
      { name: '"For the Fallen"', description: 'If any ally below 25% HP at start, +100% damage and revive most recent fallen ally with 30% HP (once). If none low, instead heal allies 15% max HP.', type: 'normal3', basePower: 8, baseCoins: 2, powerGrowth: 2, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'unbreakable', buffEffect: 'Conditional revive or heal.' },
      { name: 'Final Redemption', description: 'Consume all Fury stacks (min 3). For each, deal Red damage equal to 35% ATK to all enemies and heal allies 10% missing HP. Reset Fury to 0. On kill, allies gain 2 Golden Heart Will.', type: 'ego', basePower: 11, baseCoins: 3, powerGrowth: 2, coinGrowth: 0, damageType: 'red', infusion: 'slash', coinType: 'unbreakable', buffEffect: 'Consume Fury for AOE damage/heal; on kill Golden Heart.', isUltimate: false },
    ],
    transformationPassive: {
      name: 'Lifeblood Covenant',
      description: 'At start of turn, if any ally below 30% HP, Siora gains 2 Fury and all allies get +15% healing received for the turn. Bleed on allies reduced by 1 stack per turn.',
      mechanics: { furyGain: 2, healBoost: 0.15, bleedReduction: 1 },
    },
    skills: [
      { name: 'Compassionate Edge', description: 'Heal lowest HP ally for 10% of ATK. If enemy has 3+ Bleed, double the healing.', type: 'normal1', basePower: 5, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'normal', buffEffect: 'Heal; bonus with Bleed.' },
      { name: 'Triage Strike', description: 'Normal coin: apply 2 Bleed. Counter die: cleanse 1 debuff from lowest HP ally and heal 5% max HP.', type: 'normal2', basePower: 5, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'slash', coinType: 'normal', buffEffect: 'Apply Bleed; Counter cleanse and heal.' },
      { name: 'Merciful Execution', description: '+15% damage per ally below 50% HP and apply extra Bleed on hit. On kill, heal all allies for 10% missing HP.', type: 'normal3', basePower: 7, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'normal', buffEffect: 'Scaling with low allies; on kill heal.' },
      { name: 'Effloresced E.G.O: Blood Shepherd', description: 'Transforms all skills permanently when transformation triggers.', type: 'ego', basePower: 1, baseCoins: 1, powerGrowth: 0, coinGrowth: 0, damageType: 'red', infusion: 'pierce', coinType: 'normal', buffEffect: 'Transformation.', isUltimate: false },
      { name: 'Blood Bond', description: 'Each turn, gain 1 Fury if any ally has Bleed on themselves.', type: 'class', basePower: 0, baseCoins: 0, powerGrowth: 0, coinGrowth: 0, buffEffect: 'Passive Fury gain.' },
    ],
    passives: [
      { rankRequired: 0, name: 'Lifeblood Covenant', description: 'Low HP ally triggers Fury and healing boost; reduce Bleed on allies.' },
      { rankRequired: 2, name: 'Blood Bond (Ally)', description: 'For every ally with 2+ Bleed on self, all gain +5% ATK and +5% DEF (max +20% ATK, +20% DEF). Allies with Bleed gain 5% damage reduction.' },
      { rankRequired: 4, name: 'Bloodrage', description: 'When panicked, gain 4 Fury, heal all allies 20% missing HP, and apply 2 Bleed to all enemies.' },
    ],
    corePassive: {
      name: 'The Weight of Blood',
      description: 'All allies gain +10% ATK and +8% DEF. Allies with Fury stacks gain +10% damage dealt and +10% healing received.',
      effect: 'Leader buff.',
      rankRequired: 0,
      mechanics: { atkPct: 0.10, defPct: 0.08, extraDmg: 0.10, extraHeal: 0.10 },
    },
  },

  // ─── ORIN ──────────────────────────────────────────────────────────
  {
    id: 'orin_echoing_void',
    name: 'Orin',
    title: 'The Echoing Void',
    rarity: 'SSR',
    grade: '000',
    classes: ['esoteric', 'speedster'],
    element: 'Black',
    baseInfusion: 'slash',
    faction: 'The Void Researchers',
    baseStats: { hp: 3800, atk: 560, def: 230, spd: 160, sanity: 350 },
    levelCap: 70,
    description: '"A researcher who delved too deep into the void and returned with a fragment of its consciousness. He speaks in whispers and his enemies hear their own dying screams – when the echoes grow loud enough, reality bends to his will."',
    portrait: '👁️',
    rankUpgrades: { ssr: [8, 8, 16, 16, 24, 30, 34, 38] },
    defenses: {
      endured: ['black', 'slash'],
      weak: ['white', 'pierce'],
      normal: ['red', 'pale', 'blunt'],
    },
    panicNote: 'Unit does not act for this turn. All enemies gain 3 Echo and 2 Weaken. All allies gain 2 Shadow and 20% SPD boost for 2 turns.',
    transformationTrigger: 'custom',
    transformationCondition: 'Echoing Silence – triggers when Orin has cumulatively applied a total of 30 debuff stacks over the course of the battle. Permanent.',
    ultimateDuration: 0,
    transformedSkills: [
      { name: 'Cascade of Nothing', description: 'Apply 2 Echo to all enemies. For each Echo, +5% damage. Heal for 5% of damage dealt per Shadow stack.', type: 'normal1', basePower: 6, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'black', infusion: 'slash', coinType: 'unbreakable', buffEffect: 'AOE Echo; scaling damage; lifesteal based on Shadow.' },
      { name: 'Temporal Fracture', description: 'Counter die: Stun attacker (cannot act for 1 turn) and remove all their buffs. Normal coins apply 3 Weaken to all enemies.', type: 'normal2', basePower: 6, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'black', infusion: 'pierce', coinType: 'unbreakable', buffEffect: 'Counter stuns and dispels; AOE Weaken.' },
      { name: '"The Void Remembers"', description: 'If total debuff stacks >= 12, +150% damage and ignore DEF. On kill, all allies gain 2 Golden Heart Will.', type: 'normal3', basePower: 9, baseCoins: 3, powerGrowth: 2, coinGrowth: 0, damageType: 'black', infusion: 'slash', coinType: 'unbreakable', buffEffect: 'Extra damage at high debuff count; on kill Golden Heart.' },
      { name: 'Final Echo', description: 'Consume all Echo stacks from a single enemy (min 5). For each, deal Black damage equal to 40% ATK to all enemies and apply 1 Void Corruption (max HP –5% per stack, max 4). Reset Echo on that enemy (transformation stays).', type: 'ego', basePower: 14, baseCoins: 2, powerGrowth: 2, coinGrowth: 0, damageType: 'black', infusion: 'slash', coinType: 'unbreakable', buffEffect: 'Consume Echo for AOE damage and max HP reduction.', isUltimate: false },
    ],
    transformationPassive: {
      name: 'Void Resonance',
      description: 'At start of turn, if total debuff stacks >= 6, all allies gain +10% ATK and +10% SPD for the turn. Orin\'s attacks apply extra Echo if enemy has 4+ Echo.',
      mechanics: { debuffThreshold: 6, atkSpdBoost: 0.10, extraEchoOnHigh: true },
    },
    skills: [
      { name: 'Whispering Edge', description: 'Apply 1 Echo (+3% damage taken from Orin per stack, max 8). If enemy has 3+ Echo, apply Silence (cannot use counter dice for 1 turn).', type: 'normal1', basePower: 5, baseCoins: 2, powerGrowth: 1, coinGrowth: 0, damageType: 'black', infusion: 'slash', coinType: 'normal', buffEffect: 'Apply Echo; Silence at 3+ Echo.' },
      { name: 'Void Slip', description: 'Unbreakable coin +20% damage per Echo stack on target. Normal coin applies 1 Weaken. Gain 1 Shadow (+4% SPD, max 5).', type: 'normal2', basePower: 6, baseCoins: 1, powerGrowth: 1, coinGrowth: 0, damageType: 'black', infusion: 'pierce', coinType: 'unbreakable', buffEffect: 'Bonus vs Echo; apply Weaken; gain Shadow.' },
      { name: 'Reaping Echo', description: '+5% damage per Echo stack and extend all debuffs on enemy by 1 turn. On kill, gain 2 Shadow and all enemies gain 1 Echo.', type: 'normal3', basePower: 7, baseCoins: 3, powerGrowth: 1, coinGrowth: 0, damageType: 'black', infusion: 'blunt', coinType: 'normal', buffEffect: 'Scaling with Echo; extend debuffs; on kill Echo/Shadow.' },
      { name: 'Effloresced E.G.O: Void Echo', description: 'Transforms all skills permanently when transformation triggers.', type: 'ego', basePower: 1, baseCoins: 1, powerGrowth: 0, coinGrowth: 0, damageType: 'black', infusion: 'slash', coinType: 'normal', buffEffect: 'Transformation.', isUltimate: false },
      { name: 'Echo Chamber', description: 'Each turn, gain 1 Shadow if any enemy has 3+ debuff stacks.', type: 'class', basePower: 0, baseCoins: 0, powerGrowth: 0, coinGrowth: 0, buffEffect: 'Passive Shadow gain.' },
    ],
    passives: [
      { rankRequired: 0, name: 'Void Resonance', description: 'At >=6 total debuffs, allies gain +10% ATK/SPD. Orin applies extra Echo if enemy has 4+ Echo.' },
      { rankRequired: 2, name: 'Echo Chamber (Ally)', description: 'For every enemy with 3+ debuff stacks, all gain +6% ATK and +4% SPD (max +24% ATK, +16% SPD). Enemies with 6+ debuffs take 20% more damage.' },
      { rankRequired: 4, name: 'Void Gaze', description: 'When panicked, all enemies gain 3 Echo and 2 Weaken; all allies gain 2 Shadow and 20% SPD boost for 2 turns.' },
    ],
    corePassive: {
      name: 'The Weight of Silence',
      description: 'All allies gain +8% ATK and +8% SPD. Allies with Shadow stacks gain +10% ATK and +10% critical chance.',
      effect: 'Leader buff.',
      rankRequired: 0,
      mechanics: { atkPct: 0.08, spdPct: 0.08, extraAtk: 0.10, extraCrit: 0.10 },
    },
  },
];

export const storyOnlyIdentities = new Set<string>([]);

export const gachaSSRPool = identities
  .filter(i => i.rarity === 'SSR' && !storyOnlyIdentities.has(i.id) && !i.unreleased)
  .map(i => i.id);

export const gachaSRPool = identities
  .filter(i => i.rarity === 'SR' && !storyOnlyIdentities.has(i.id) && !i.unreleased)
  .map(i => i.id);

export const featuredSSRs = ['arthur_excalibur', 'kaelen_dusk_reaper', 'seraphina_radiant_martyr', 'morwen_lamenting_tides', 'ragnar_unchained', 'theron_equilibrium', 'orin_echoing_void'];
export const featuredFates = ['arthur_excalibur', 'kaelen_dusk_reaper'];

export function computeBattlePower(
  identity: Identity,
  owned: { level: number; rank: number; skillLevels: [number, number, number, number] },
  weaponAtk: number,
  egoGiftStats: { atk: number; hp: number; def: number; sanity?: number },
  giftResonanceBonus: { atk: number; hp: number; def: number; sanity?: number } = { atk: 0, hp: 0, def: 0, sanity: 0 },
  hypertuneBonus: { atk: number; hp: number; def: number; sanity?: number } = { atk: 0, hp: 0, def: 0, sanity: 0 }
): number {
  const lvlScale = 1 + (owned.level - 1) * 0.03;
  const totalAtk = Math.floor((identity.baseStats.atk + egoGiftStats.atk + giftResonanceBonus.atk + hypertuneBonus.atk) * lvlScale + weaponAtk);
  const totalHp = Math.floor((identity.baseStats.hp + egoGiftStats.hp + giftResonanceBonus.hp + hypertuneBonus.hp) * lvlScale);
  const totalDef = Math.floor((identity.baseStats.def + egoGiftStats.def + giftResonanceBonus.def + hypertuneBonus.def) * lvlScale);
  const totalSanity = Math.floor(
    (identity.baseStats.sanity + (egoGiftStats.sanity ?? 0) + (giftResonanceBonus.sanity ?? 0) + (hypertuneBonus.sanity ?? 0)) * lvlScale
  );

  const totalSkillPower = identity.skills
    .filter(s => s.type !== 'class')
    .reduce((sum, s, i) => {
      const sl = owned.skillLevels[i] ?? 1;
      return sum + (s.basePower + s.powerGrowth * (sl - 1));
    }, 0);

  // Sanity feeds clash power (win chance) for every damage type, so it counts toward BP
  // for all identities, weighted a bit lighter than the three physical stats.
  const baseBp = Math.floor((totalAtk * 0.35 + totalHp * 0.25 + totalDef * 0.25 + totalSanity * 0.15) * (1 + totalSkillPower / 10));
  const cappedBase = Math.min(baseBp, 7000);
  const rankBonus = owned.rank * 125;
  const bp = Math.min(cappedBase + rankBonus, 8000);
  return bp;
}

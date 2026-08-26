// src/utils.ts
// Utility functions for the department system and reception/duel system

import { PanicType } from './types';

// ============================================================================
// ENERGY & DAY
// ============================================================================

/**
 * Calculate required energy to advance to the next day
 */
export function getRequiredEnergyForDay(day: number): number {
  if (day <= 1) return 50;
  return Math.min(50 + (day - 1) * 20, 2000);
}

/**
 * Calculate Qliphoth max threshold based on day
 */
export function calculateQliphothMax(day: number): number {
  return Math.min(12, 5 + Math.floor(day / 5));
}

// ============================================================================
// ORDEAL TRIGGERING
// ============================================================================

/**
 * Determine if an ordeal should trigger based on day and work count
 */
export function shouldTriggerOrdeal(day: number, workCount: number): boolean {
  const base = 0.02 + (day * 0.001);
  const workModifier = Math.min(0.03, workCount * 0.001);
  return Math.random() < (base + workModifier);
}

/**
 * Pick a random ordeal tier based on day
 */
export function pickOrdealTier(day: number): 'Dawn' | 'Noon' | 'Dusk' | 'Midnight' {
  if (day < 10) return 'Dawn';
  if (day < 20) {
    const r = Math.random();
    if (r < 0.6) return 'Dawn';
    return 'Noon';
  }
  if (day < 35) {
    const r = Math.random();
    if (r < 0.3) return 'Dusk';
    if (r < 0.6) return 'Noon';
    return 'Dawn';
  }
  if (day < 45) {
    const r = Math.random();
    if (r < 0.5) return 'Dusk';
    if (r < 0.7) return 'Noon';
    if (r < 0.9) return 'Dawn';
    return 'Midnight';
  }
  const r = Math.random();
  if (r < 0.2) return 'Dawn';
  if (r < 0.4) return 'Noon';
  if (r < 0.7) return 'Dusk';
  return 'Midnight';
}

// ============================================================================
// PANIC
// ============================================================================

/**
 * Determine panic type based on highest stat
 */
export function getPanicType(stats: {
  fortitude: number;
  prudence: number;
  temperance: number;
  justice: number;
}): PanicType {
  const { fortitude, prudence, temperance, justice } = stats;
  const max = Math.max(fortitude, prudence, temperance, justice);
  if (max === fortitude) return 'fortitude';
  if (max === prudence) return 'prudence';
  if (max === temperance) return 'temperance';
  return 'justice';
}

/**
 * Get panic effect description based on type
 */
export function getPanicEffect(panicType: PanicType): string {
  const effects: Record<PanicType, string> = {
    fortitude: 'Agent becomes reckless: +50% damage taken, +30% damage dealt.',
    prudence: 'Agent becomes paranoid: -50% SP, cannot work on WAW/ALEPH.',
    temperance: 'Agent becomes erratic: work success chance reduced by 40%.',
    justice: 'Agent becomes obsessive: attacks random targets, including allies.',
  };
  return effects[panicType];
}

// ============================================================================
// COMBAT (clash, rollCoin, damage type multipliers)
// ============================================================================

/**
 * Roll a coin with given power (returns either power or 1)
 */
export function rollCoin(power: number): number {
  return Math.random() < 0.5 ? power : 1;
}

/**
 * Perform clash between player and enemy
 */
export function clash(
  playerPower: number,
  enemyPower: number,
  playerCoins: number,
  enemyCoins: number
): { playerTotal: number; enemyTotal: number } {
  let pt = rollCoin(playerPower);
  let et = rollCoin(enemyPower);
  for (let i = 1; i < Math.max(playerCoins, enemyCoins); i++) {
    if (i < playerCoins) pt += rollCoin(playerPower);
    if (i < enemyCoins) et += rollCoin(enemyPower);
  }
  return { playerTotal: pt, enemyTotal: et };
}

/**
 * Calculate damage type multiplier
 */
export function damageTypeMult(damageType: string, resistType: string): number {
  const map: Record<string, Record<string, number>> = {
    Red: { Red: 1, White: 0.5, Black: 0.5, Pale: 0.5 },
    White: { Red: 0.5, White: 1, Black: 0.5, Pale: 0.5 },
    Black: { Red: 0.5, White: 0.5, Black: 1, Pale: 0.5 },
    Pale: { Red: 0.5, White: 0.5, Black: 0.5, Pale: 1 },
  };
  return map[damageType]?.[resistType] ?? 1;
}

/**
 * Calculate infusion multiplier
 */
export function infusionMult(infusion: string, resistInfusion: string): number {
  const map: Record<string, Record<string, number>> = {
    Slash: { Slash: 1, Pierce: 0.5, Blunt: 0.5 },
    Pierce: { Slash: 0.5, Pierce: 1, Blunt: 0.5 },
    Blunt: { Slash: 0.5, Pierce: 0.5, Blunt: 1 },
  };
  return map[infusion]?.[resistInfusion] ?? 1;
}

/**
 * Calculate skill damage multiplier based on skill level
 */
export function skillDmgMult(skillType: string, skillLevel: number): number {
  if (skillType === 'ego') return 1 + (skillLevel - 1) * 0.1;
  return 1 + (skillLevel - 1) * 0.05;
}

// ============================================================================
// DEPLOYMENT COST
// ============================================================================

/**
 * Calculate energy cost to deploy an abnormality based on risk and day
 */
export function getDeployCost(day: number, risk: string): number {
  if (risk === 'ZAYIN' || risk === 'TETH') return 0;
  if (risk === 'HE') return 10 + Math.floor(day * 0.5);
  if (risk === 'WAW') return 25 + Math.floor(day * 0.8);
  if (risk === 'ALEPH') return 50 + day;
  return 0;
}

// ============================================================================
// RANK INFO (for reception/duel system)
// ============================================================================

export interface RankInfo {
  name: string;
  icon: string;
  minScore: number;
}

const RANKS: RankInfo[] = [
  { name: 'Manager', icon: '👔', minScore: 0 },
  { name: 'Senior Manager', icon: '👔', minScore: 100 },
  { name: 'Director', icon: '📋', minScore: 300 },
  { name: 'Senior Director', icon: '📋', minScore: 600 },
  { name: 'Executive', icon: '⭐', minScore: 1000 },
  { name: 'Senior Executive', icon: '⭐', minScore: 1500 },
  { name: 'President', icon: '👑', minScore: 2100 },
  { name: 'CEO', icon: '👑', minScore: 2800 },
];

/**
 * Get rank info based on score
 */
export function getRankInfo(score: number): RankInfo {
  let best = RANKS[0];
  for (const rank of RANKS) {
    if (score >= rank.minScore) {
      best = rank;
    }
  }
  return best;
}

// ============================================================================
// RESEARCH EFFECTS (apply research bonuses to facility)
// ============================================================================

/**
 * Apply research effects to facility state (mutates facility object)
 */
export function applyResearchEffects(
  unlockedResearch: string[],
  facility: any
): void {
  // MALKUTH
  if (unlockedResearch.includes('tt2_protocol')) {
    // work speed +10% - applied elsewhere
  }
  if (unlockedResearch.includes('meeting_call')) {
    // retreat per 5 turns - applied in combat
  }

  // YESOD
  if (unlockedResearch.includes('damage_normalization')) {
    // +5% damage consistency - applied in combat
  }
  if (unlockedResearch.includes('corrective_measures')) {
    // +10% PE Boxes - applied in work
  }

  // HOD
  if (unlockedResearch.includes('education_manuals')) {
    // +15% stat gain - applied in work
  }
  if (unlockedResearch.includes('professional_education')) {
    // +25% stat gain - applied in work
  }

  // NETZACH
  if (unlockedResearch.includes('regenerator_mk2')) {
    // +20% healing - applied in work/combat
  }
  if (unlockedResearch.includes('mental_neutralizer')) {
    // -15% SP damage - applied in combat
  }

  // TIPHERETH
  if (unlockedResearch.includes('shield_bullets')) {
    // shield bullets unlocked - handled in bullets
  }

  // GEBURA
  if (unlockedResearch.includes('qliphoth_intervention')) {
    // Qliphoth damage -20% - applied in meltdown
  }

  // CHESED
  if (unlockedResearch.includes('hp_sp_bullets')) {
    // HP/SP bullets unlocked - handled in bullets
  }
  if (unlockedResearch.includes('hp_sp_refinement')) {
    // Improved HP/SP bullets - handled in bullets
  }

  // BINAH
  if (unlockedResearch.includes('re_extraction')) {
    // re-roll available - UI only
  }
  if (unlockedResearch.includes('extraction_endurance')) {
    // 3 extractions per day - UI only
  }
  if (unlockedResearch.includes('gift_division')) {
    // +2 gift slots - UI only
  }

  // HOKMA
  if (unlockedResearch.includes('limit_breakers')) {
    // stat caps to 130 - applied in stats calculation
  }

  // DA'AT
  if (unlockedResearch.includes('today_ordeals')) {
    // ordeal preview - UI only
  }
  if (unlockedResearch.includes('instability_fix')) {
    // qliphoth overload -30% for WAW/ALEPH - applied in work
  }

  // KETER
  if (unlockedResearch.includes('memory_repository_overclock')) {
    facility.memoryRepositoryAvailable = true;
  }
  if (unlockedResearch.includes('awakening')) {
    // awakening mode below 50% HP - applied in combat
  }
}

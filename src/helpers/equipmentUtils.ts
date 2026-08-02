// src/helpers/equipmentUtils.ts
import weaponsData from '../data/weapons.json';
import gearsData from '../data/gears.json';
import giftsData from '../data/gifts.json';

export function computeEquipmentStats(
  weaponId: string | null,
  gearId: string | null,
  giftId: string | null
): { atk: number; def: number; maxHp: number; sp: number; resistances: Record<string, number> } {
  let atk = 10;
  let def = 5;
  let maxHp = 100;
  let sp = 50;
  const resistances: Record<string, number> = { red: 1.0, white: 1.0, black: 1.0, pale: 1.0 };

  // ---- Weapon ----
  if (weaponId && weaponsData[weaponId]) {
    const w = weaponsData[weaponId];
    const rankMult: Record<string, number> = { ZAYIN: 1, TETH: 1.5, HE: 2, WAW: 3, ALEPH: 4 };
    const mult = rankMult[w.rank] || 1;
    atk += Math.floor(5 * mult);
    if (w.skills) {
      const powers = Object.values(w.skills).map((s: any) => s.basePower + s.coinPower * (s.coins || 1));
      const avg = powers.reduce((a: number, b: number) => a + b, 0) / powers.length;
      atk += Math.floor(avg * 0.2);
    }
  }

  // ---- Gear (suit) ----
  if (gearId && gearsData[gearId]) {
    const g = gearsData[gearId];
    const rankMult: Record<string, number> = { ZAYIN: 1, TETH: 1.5, HE: 2, WAW: 3, ALEPH: 4 };
    const mult = rankMult[g.rank] || 1;
    def += Math.floor(3 * mult);
    if (g.resistances) {
      Object.keys(g.resistances).forEach(key => {
        if (resistances[key] !== undefined) resistances[key] = g.resistances[key];
      });
    }
  }

  // ---- Gift ----
  if (giftId) {
    const giftData = giftsData.gifts.find((g: any) => g.id === giftId);
    if (giftData && giftData.stats) {
      const stats = giftData.stats;
      if (stats.fortitude) maxHp += stats.fortitude * 5;
      if (stats.prudence) sp += stats.prudence * 2;
      if (stats.justice) atk += Math.floor(stats.justice * 0.5);
      if (stats.temperance) {
        // temperance affects work success – we'll handle that separately
      }
    }
  }

  return { atk, def, maxHp, sp, resistances };
}

export function computeDepartmentBonus(facility: any): {
  damageMultiplier: number;
  defenseMultiplier: number;
  rewardMultiplier: number;
  workSuccessMultiplier: number;
} {
  let dmgMult = 1.0;
  let defMult = 1.0;
  let rewardMult = 1.0;
  let workMult = 1.0;

  if (!facility || !facility.unlockedResearch) return { damageMultiplier: dmgMult, defenseMultiplier: defMult, rewardMultiplier: rewardMult, workSuccessMultiplier: workMult };

  // Research bonuses – add as many as you like
  if (facility.unlockedResearch.includes('tt2_protocol')) workMult *= 1.10;
  if (facility.unlockedResearch.includes('join_command')) defMult *= 1.05;
  if (facility.unlockedResearch.includes('corrective_measures')) rewardMult *= 1.10;
  if (facility.unlockedResearch.includes('malkuth_reward')) rewardMult *= 1.20;
  if (facility.unlockedResearch.includes('gebura_reward')) dmgMult *= 1.25;
  if (facility.unlockedResearch.includes('chesed_reward')) defMult *= 1.10;
  if (facility.unlockedResearch.includes('education_manuals')) workMult *= 1.15;
  if (facility.unlockedResearch.includes('professional_education')) workMult *= 1.25;

  return { damageMultiplier: dmgMult, defenseMultiplier: defMult, rewardMultiplier: rewardMult, workSuccessMultiplier: workMult };
}
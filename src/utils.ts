export function rollCoin(power: number): number {
  return Math.random() < 0.5 ? power : 1;
}

export function clash(pP: number, eP: number, pC: number, eC: number) {
  let pt = rollCoin(pP), et = rollCoin(eP);
  for (let i = 1; i < Math.max(pC, eC); i++) {
    if (i < pC) pt += rollCoin(pP);
    if (i < eC) et += rollCoin(eP);
  }
  return { playerTotal: pt, enemyTotal: et };
}

export function damageTypeMult(playerDmg: string, enemyResist: string): number {
  const map: Record<string, Record<string, number>> = {
    Red: { Red: 1.0, White: 0.5, Black: 0.5, Pale: 0.5 },
    White: { Red: 0.5, White: 1.0, Black: 0.5, Pale: 0.5 },
    Black: { Red: 0.5, White: 0.5, Black: 1.0, Pale: 0.5 },
    Pale: { Red: 0.5, White: 0.5, Black: 0.5, Pale: 1.0 },
  };
  return map[playerDmg]?.[enemyResist] ?? 1.0;
}

export function infusionMult(playerInf: string, enemyResistInf: string): number {
  return playerInf === enemyResistInf ? 0.5 : 1.0;
}

export function skillDmgMult(skillType: string, level: number): number {
  return 1.0 + (level - 1) * 0.05;
}

export function getRankInfo(score: number) {
  const ranks = [
    { name: 'Manager', minScore: 0 },
    { name: 'Professional', minScore: 401 },
    { name: 'Librarian', minScore: 801 },
    { name: 'Patron', minScore: 1201 },
  ];
  let rank = ranks[0];
  for (const r of ranks) {
    if (score >= r.minScore) rank = r;
  }
  return rank;
}

export function getRequiredEnergyForDay(day: number): number {
  if (day <= 1) return 50;
  return Math.min(50 + (day - 1) * 20, 2000);
}

export function getRiskEmoji(risk: string): string {
  const map: Record<string, string> = {
    ZAYIN: '🟢',
    TETH: '🔵',
    HE: '🟡',
    WAW: '🟠',
    ALEPH: '🔴',
  };
  return map[risk?.toUpperCase()] || '⚪';
}
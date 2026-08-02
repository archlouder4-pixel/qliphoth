// Competitive Reception data: zones, regions, squads, leaderboards
export type CRRegion = 'NA' | 'SEA' | 'Asia' | 'AP';

export const CR_REGIONS: { id: CRRegion; label: string; flag: string }[] = [
  { id: 'NA', label: 'North America', flag: '🌎' },
  { id: 'SEA', label: 'Southeast Asia', flag: '🌏' },
  { id: 'Asia', label: 'Asia', flag: '🗾' },
  { id: 'AP', label: 'Asia-Pacific', flag: '🇦🇺' },
];

// ── Rank tiers (bracket system) ──
export type Squad = 'Beginner' | 'Amateur' | 'Expert' | 'Professional';

export interface SquadInfo {
  id: Squad;
  rank: number; // 1 = lowest, 4 = highest
  members: number;
  promotionRange: [number, number] | null;
  defendingRange: [number, number];
  demotionRange: [number, number] | null; // null for Beginner (no demotion possible)
  badgeIcon: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  defendReward: number;
  demoteReward: number;
  promoteReward: number;
  meritRequired: number; // merit cost for AUTO promotion (only Expert→Professional uses this)
}

export const SQUAD_INFO: Record<Squad, SquadInfo> = {
  Beginner: {
    id: 'Beginner', rank: 1, members: 20,
    promotionRange: [1, 3], defendingRange: [4, 10], demotionRange: null,
    badgeIcon: '🌱', bgClass: 'bg-stone-500/20', textClass: 'text-stone-300', borderClass: 'border-stone-500/40',
    defendReward: 500, demoteReward: 0, promoteReward: 750, meritRequired: 0,
  },
  Amateur: {
    id: 'Amateur', rank: 2, members: 20,
    promotionRange: [1, 3], defendingRange: [4, 10], demotionRange: [11, 20],
    badgeIcon: '🥈', bgClass: 'bg-sky-500/20', textClass: 'text-sky-300', borderClass: 'border-sky-500/40',
    defendReward: 800, demoteReward: 200, promoteReward: 1100, meritRequired: 0,
  },
  Expert: {
    id: 'Expert', rank: 3, members: 20,
    promotionRange: [1, 3], defendingRange: [4, 10], demotionRange: [11, 20],
    badgeIcon: '🥇', bgClass: 'bg-amber-500/20', textClass: 'text-amber-300', borderClass: 'border-amber-500/40',
    defendReward: 1200, demoteReward: 400, promoteReward: 1500, meritRequired: 100,
  },
  Professional: {
    id: 'Professional', rank: 4, members: 20,
    promotionRange: null, defendingRange: [1, 5], demotionRange: [11, 20],
    badgeIcon: '🏆', bgClass: 'bg-rose-500/20', textClass: 'text-rose-300', borderClass: 'border-rose-500/40',
    defendReward: 2000, demoteReward: 1000, promoteReward: 0, meritRequired: 0,
  },
};

export function getSquadByPoints(totalPoints: number): Squad {
  if (totalPoints >= 900000) return 'Professional';
  if (totalPoints >= 500000) return 'Expert';
  if (totalPoints >= 200000) return 'Amateur';
  return 'Beginner';
}

// Predict next-week squad change based on bracket placement
export function predictPromotion(currentSquad: Squad, bracketRank: number, currentMerit: number): { nextSquad: Squad; reason: string } {
  const info = SQUAD_INFO[currentSquad];
  const order: Squad[] = ['Beginner', 'Amateur', 'Expert', 'Professional'];
  const idx = order.indexOf(currentSquad);

  // Promotion check
  if (info.promotionRange && bracketRank >= info.promotionRange[0] && bracketRank <= info.promotionRange[1]) {
    const next = order[idx + 1];
    // Expert → Professional requires merit
    if (currentSquad === 'Expert' && currentMerit < 100) {
      return { nextSquad: 'Expert', reason: `Top 3, but Expert → Professional requires 100 merit (you have ${currentMerit})` };
    }
    return { nextSquad: next, reason: `Top 3 finish — auto promoted to ${next}!` };
  }
  // Demotion check
  if (info.demotionRange && bracketRank >= info.demotionRange[0] && bracketRank <= info.demotionRange[1]) {
    const prev = order[idx - 1];
    return { nextSquad: prev, reason: `Bottom finish — demoted to ${prev}` };
  }
  return { nextSquad: currentSquad, reason: `Defending — stays in ${currentSquad}` };
}

// ── Zones (3 random per week, deterministic) ──
export const ZONE_ELEMENTS = ['Void', 'Light', 'Dark', 'Chaos', 'Fire', 'Water', 'Physical', 'Spectro'] as const;
export type ZoneElement = typeof ZONE_ELEMENTS[number];

export function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = (now.getTime() - start.getTime()) / 86400000;
  return Math.floor((diff + start.getDay()) / 7) + now.getFullYear() * 100;
}

// Format the weekly period as a date range string
export function getWeekRange(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(-2)}`;
  return `${fmt(monday)}-${fmt(sunday)}`;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export function getWeeklyZones(week: number): ZoneElement[] {
  const rng = seededRandom(week);
  const pool = [...ZONE_ELEMENTS];
  const picked: ZoneElement[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

// ── Leaderboard generation ──
const NAME_POOLS: Record<CRRegion, string[]> = {
  NA: ['Maverick', 'Phoenix', 'Wolfgang', 'Eclipse', 'Storm', 'Ranger', 'Specter', 'Talon', 'Nova', 'Raven', 'Atlas', 'Cipher', 'Echo', 'Vector', 'Zephyr', 'Frost', 'Blade', 'Surge', 'Onyx', 'Vortex', 'Falcon', 'Jaguar', 'Sentinel', 'Apex', 'Crimson', 'Knight', 'Drift', 'Glitch', 'Hawk', 'Ronin'],
  SEA: ['Naga', 'Garuda', 'Tigris', 'Cendana', 'Bayu', 'Mahkota', 'Selasih', 'Jambu', 'Kilat', 'Anggun', 'Bidadari', 'Mentari', 'Pelangi', 'Samudra', 'Bumi', 'Awan', 'Hujan', 'Bintang', 'Bulan', 'Mawar', 'Cahaya', 'Permata', 'Lautan', 'Sinar', 'Topan', 'Kabut', 'Petir', 'Embun', 'Mega', 'Indra'],
  Asia: ['Ryu', 'Haruki', 'Yumi', 'Sora', 'Hiroto', 'Akira', 'Kaito', 'Mei', 'Lin', 'Wei', 'Xin', 'Chen', 'Aria', 'Soshi', 'Renji', 'Yuna', 'Tora', 'Hoshi', 'Sakura', 'Daichi', 'Sweetmilk', 'sol', 'larslaurent', 'VICTORIA', 'Fuwa', 'Shiro', 'Kuro', 'Akane', 'Hisao', 'Kenji'],
  AP: ['Koa', 'Tane', 'Aroha', 'Whetu', 'Mana', 'Maru', 'Kura', 'Awa', 'Hine', 'Tama', 'Rangi', 'Marama', 'Wairua', 'Pounamu', 'Aotea', 'Tūī', 'Kōtuku', 'Kahu', 'Kiwa', 'Tāwhiri', 'Roa', 'Hana', 'Atea', 'Manaia', 'Tipua', 'Tāne', 'Hiwa', 'Whatu', 'Kaiwhiri', 'Mahi'],
};

export interface BracketEntry {
  rank: number;
  name: string;
  score: number;
  isPlayer: boolean;
  squad: Squad;
  avatar: string;
}

// Player's squad-bracket leaderboard.
// Only includes the player + nearby NPCs (existing players in the bracket near them).
// At early stages, brackets show only the player and a handful of similar-score NPCs.
export function generateBracket(region: CRRegion, week: number, squad: Squad, playerScore: number, playerName: string): BracketEntry[] {
  const info = SQUAD_INFO[squad];
  const seed = region.charCodeAt(0) * 1000 + week + info.rank * 100;
  const rng = seededRandom(seed);
  const names = NAME_POOLS[region];

  const baseRange: Record<Squad, [number, number]> = {
    Beginner: [0, 350000],
    Amateur: [200000, 700000],
    Expert: [500000, 1200000],
    Professional: [900000, 2500000],
  };
  const [lo, hi] = baseRange[squad];

  // Fewer "active" players — half the bracket (~10) instead of full 20
  // This represents only players who actually played this week
  const activeCount = Math.floor(info.members / 2);

  const npcs: { name: string; score: number }[] = [];
  for (let i = 0; i < activeCount - 1; i++) {
    const score = lo + Math.floor(rng() * (hi - lo));
    npcs.push({
      name: names[i % names.length] + (i >= names.length ? Math.floor(i / names.length) + 1 : ''),
      score,
    });
  }
  const allEntries = [
    ...npcs.map(n => ({ ...n, isPlayer: false })),
    { name: playerName, score: playerScore, isPlayer: true },
  ];
  allEntries.sort((a, b) => b.score - a.score);

  const avatars = ['🌟', '🔥', '⚔️', '🛡️', '✨', '💎', '🪷', '🌑', '☀️', '🦋', '🗡️', '🌊', '🪦', '🎼', '⚓', '👹', '🍕', '🪨', '🌿', '🔮', '🌗'];
  return allEntries.map((e, i) => ({
    rank: i + 1,
    name: e.name,
    score: e.score,
    isPlayer: e.isPlayer,
    squad,
    avatar: avatars[i % avatars.length],
  }));
}

export interface PointsRankingEntry {
  rank: number;
  name: string;
  score: number;
  isPlayer: boolean;
  avatar: string;
  percentile?: string;
}

// Cross-server (single region) Points Ranking. Top 50 + player row.
export function generatePointsRanking(region: CRRegion, week: number, playerScore: number, playerName: string): { top: PointsRankingEntry[]; playerEntry: PointsRankingEntry } {
  const seed = region.charCodeAt(0) * 7777 + week * 13;
  const rng = seededRandom(seed);
  const names = NAME_POOLS[region];
  const avatars = ['🌟', '🔥', '⚔️', '🛡️', '✨', '💎', '🪷', '🌑', '☀️', '🦋', '🗡️', '🌊', '🪦', '🎼', '⚓'];

  const npcs: { name: string; score: number; avatar: string }[] = [];
  for (let i = 0; i < 200; i++) {
    const score = Math.floor(75000000 * Math.exp(-i / 60) + rng() * 5000000);
    npcs.push({
      name: names[i % names.length] + (i >= names.length ? Math.floor(i / names.length) + 1 : ''),
      score,
      avatar: avatars[Math.floor(rng() * avatars.length)],
    });
  }
  const allEntries = [
    ...npcs.map(n => ({ ...n, isPlayer: false })),
    { name: playerName, score: playerScore, isPlayer: true, avatar: '🌗' },
  ];
  allEntries.sort((a, b) => b.score - a.score);

  const top = allEntries.slice(0, 50).map((e, i) => ({
    rank: i + 1,
    name: e.name,
    score: e.score,
    isPlayer: e.isPlayer,
    avatar: e.avatar,
  }));

  const playerIdx = allEntries.findIndex(e => e.isPlayer);
  const percentile = Math.max(1, Math.round(((allEntries.length - playerIdx) / allEntries.length) * 100));
  const playerEntry: PointsRankingEntry = {
    rank: playerIdx + 1,
    name: playerName,
    score: playerScore,
    isPlayer: true,
    avatar: '🌗',
    percentile: `${percentile}%`,
  };
  return { top, playerEntry };
}

const LEADERBOARD_KEY = 'qliphoth_competitive_leaderboard';

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  isGuest: boolean;
  bestScore: number;
  bestWave: number;
  bestZone: string;
  grade: string;
  totalRuns: number;
  lastPlayed: number;
}

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLeaderboard(entries: LeaderboardEntry[]): void {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

export function updateLeaderboardEntry(
  userId: string, displayName: string, isGuest: boolean,
  score: number, wave: number, zone: string,
): void {
  const lb = getLeaderboard();
  const grade = calculateGrade(score);
  const idx = lb.findIndex(e => e.userId === userId);
  if (idx >= 0) {
    lb[idx].displayName = displayName;
    lb[idx].isGuest = isGuest;
    lb[idx].totalRuns += 1;
    lb[idx].lastPlayed = Date.now();
    if (score > lb[idx].bestScore) {
      lb[idx].bestScore = score;
      lb[idx].bestWave = wave;
      lb[idx].bestZone = zone;
      lb[idx].grade = grade;
    }
  } else {
    lb.push({ userId, displayName, isGuest, bestScore: score, bestWave: wave, bestZone: zone, grade, totalRuns: 1, lastPlayed: Date.now() });
  }
  saveLeaderboard(lb);
}

export function calculateGrade(score: number): string {
  if (score >= 250000) return 'S';
  if (score >= 150000) return 'A';
  if (score >= 75000) return 'B';
  if (score >= 25000) return 'C';
  return 'D';
}

export function gradeColor(g: string) {
  return g === 'S' ? 'text-amber-400' : g === 'A' ? 'text-violet-400' : g === 'B' ? 'text-blue-400' : g === 'C' ? 'text-green-400' : 'text-gray-400';
}

export function gradeBg(g: string) {
  return g === 'S' ? 'bg-amber-500/20 border-amber-500/30' : g === 'A' ? 'bg-violet-500/20 border-violet-500/30' : g === 'B' ? 'bg-blue-500/20 border-blue-500/30' : g === 'C' ? 'bg-green-500/20 border-green-500/30' : 'bg-gray-500/20 border-gray-500/30';
}

export function gradeRewards(g: string) {
  switch (g) {
    case 'S': return { enkephalin: 500, threads: 200, fragments: 100 };
    case 'A': return { enkephalin: 350, threads: 150, fragments: 75 };
    case 'B': return { enkephalin: 200, threads: 100, fragments: 50 };
    case 'C': return { enkephalin: 100, threads: 50, fragments: 25 };
    default:  return { enkephalin: 50, threads: 20, fragments: 10 };
  }
}
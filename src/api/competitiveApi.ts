// Client for the Qliphoth competitive backend.
// In development, uses localhost:3001; in production, uses the Cloudflare Worker.

// ─── Use local server in development ──────────────────────────────
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3001'          // local Node.js server (socket + REST)
  : 'https://qliphoth-backend.archlouder4.workers.dev';

export type CRRegion = 'NA' | 'SEA' | 'Asia' | 'AP';
export type Squad = 'Beginner' | 'Amateur' | 'Expert' | 'Professional';
export type ZoneElement = 'Red' | 'Pale' | 'White' | 'Black';

export interface RemotePlayerEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
  isGuest: boolean;
}

export interface RemoteRankingEntry extends RemotePlayerEntry {
  percentile?: string;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed: ${res.status}`);
  }
  return data as T;
}

async function getJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed: ${res.status}`);
  }
  return data as T;
}

// Call once after login (and whenever Discord identity info changes) so the
// backend has a record for this player before any score/region calls.
export function syncPlayer(params: {
  userId: string;
  isGuest: boolean;
  discordUsername?: string;
  discordGlobalName?: string;
  avatar?: string;
}): Promise<{ ok: true }> {
  return postJson('/api/player/sync', params);
}

// One-time, permanent region lock. Throws if the account already has a region.
export function setPlayerRegion(userId: string, region: CRRegion): Promise<{ ok: true; region: CRRegion }> {
  return postJson('/api/player/region', { userId, region });
}

// Guest-only display name change. Throws (403) if called for a Discord account.
export function setGuestName(userId: string, name: string): Promise<{ ok: true; name: string }> {
  return postJson('/api/player/name', { userId, name });
}

export function submitScore(params: {
  userId: string;
  region: CRRegion;
  week: number;
  zone: ZoneElement;
  score: number;
  squad: Squad;
  merit: number;
  reputation: number;
}): Promise<{ ok: true }> {
  return postJson('/api/score/submit', params);
}

export function fetchBracket(region: CRRegion, week: number, squad: Squad): Promise<{
  region: CRRegion; week: number; squad: Squad; entries: RemotePlayerEntry[];
}> {
  return getJson('/api/bracket', { region, week: String(week), squad });
}

export function fetchRanking(region: CRRegion, week: number, userId: string): Promise<{
  region: CRRegion; week: number; total: number; top: RemoteRankingEntry[]; playerEntry: RemoteRankingEntry | null;
}> {
  return getJson('/api/ranking', { region, week: String(week), userId });
}
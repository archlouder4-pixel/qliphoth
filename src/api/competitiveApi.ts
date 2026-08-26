// src/api/competitiveApi.ts
// Client for the Qliphoth competitive backend – now uses VITE_SERVER_URL

const BASE_URL = (import.meta.env.VITE_SERVER_URL || 'http://ENV_VAR_MISSING:9999').replace(/\/+$/, '');

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
  const res = await fetch(`${BASE_URL}${path}`, {
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
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed: ${res.status}`);
  }
  return data as T;
}

// ─── Player sync ──────────────────────────────────────────────────────
export function syncPlayer(params: {
  userId: string;
  isGuest: boolean;
  discordUsername?: string;
  discordGlobalName?: string;
  avatar?: string;
}): Promise<{ ok: true }> {
  return postJson('/api/player/sync', params);
}

// ─── Region locking ──────────────────────────────────────────────────
export function setPlayerRegion(userId: string, region: CRRegion): Promise<{ ok: true; region: CRRegion }> {
  return postJson('/api/player/region', { userId, region });
}

// ─── Guest name change ──────────────────────────────────────────────
export function setGuestName(userId: string, name: string): Promise<{ ok: true; name: string }> {
  return postJson('/api/player/name', { userId, name });
}

// ─── Score submission ─────────────────────────────────────────────────
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

// ─── Bracket ──────────────────────────────────────────────────────────
export function fetchBracket(region: CRRegion, week: number, squad: Squad): Promise<{
  region: CRRegion; week: number; squad: Squad; entries: RemotePlayerEntry[];
}> {
  return getJson('/api/bracket', { region, week: String(week), squad });
}

// ─── Ranking ──────────────────────────────────────────────────────────
export function fetchRanking(region: CRRegion, week: number, userId: string): Promise<{
  region: CRRegion; week: number; total: number; top: RemoteRankingEntry[]; playerEntry: RemoteRankingEntry | null;
}> {
  return getJson('/api/ranking', { region, week: String(week), userId });
}

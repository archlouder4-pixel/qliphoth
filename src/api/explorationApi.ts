// src/api/explorationApi.ts – rewritten for Durable Objects backend
import { BASE_URL } from './competitiveApi'; // reuse the base URL

export interface ExplorationSession {
  id: string;
  partyLeader: string;
  members: string[];
  difficulty: string;
  modifiers: string[];
  currentWave: number;
  maxWaves: number;
  status: 'preparing' | 'active' | 'completed' | 'failed';
  enemiesDefeated: number;
  score: number;
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

export function startExploration(difficulty: string, modifiers: string[]): Promise<{ ok: true; session: ExplorationSession }> {
  return postJson('/api/exploration/start', { difficulty, modifiers });
}

export function joinExploration(sessionId: string): Promise<{ ok: true }> {
  return postJson('/api/exploration/join', { sessionId });
}

export function getExplorationStatus(sessionId: string): Promise<{ ok: true; session: ExplorationSession }> {
  return getJson('/api/exploration/status', { sessionId });
}

export function abandonExploration(sessionId: string): Promise<{ ok: true }> {
  return postJson('/api/exploration/abandon', { sessionId });
}
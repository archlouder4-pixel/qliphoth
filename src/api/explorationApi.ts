// src/api/explorationApi.ts
import { API_BASE } from './competitiveApi';

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

export async function startExploration(difficulty: string, modifiers: string[]): Promise<{ ok: true; session: ExplorationSession }> {
  const res = await fetch(`${API_BASE}/api/exploration/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty, modifiers }),
  });
  if (!res.ok) throw new Error('Failed to start exploration');
  return res.json();
}

export async function joinExploration(sessionId: string): Promise<{ ok: true }> {
  const res = await fetch(`${API_BASE}/api/exploration/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error('Failed to join exploration');
  return res.json();
}

export async function getExplorationStatus(sessionId: string): Promise<{ ok: true; session: ExplorationSession }> {
  const res = await fetch(`${API_BASE}/api/exploration/status?sessionId=${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch exploration status');
  return res.json();
}
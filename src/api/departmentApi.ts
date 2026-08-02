// src/api/departmentApi.ts – rewritten for Durable Objects backend
import { BASE_URL } from './competitiveApi';

export interface Department {
  id: string;
  name: string;
  managerId: string;
  members: string[];
  energy: number;
  totalEnergy: number;
  currentDay: number;
  meltdownLevel: number;
  deployedAbnos: any[];
  research: any[];
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

export function createDepartment(name: string): Promise<{ ok: true; department: Department }> {
  return postJson('/api/department/create', { name });
}

export function joinDepartment(departmentId: string): Promise<{ ok: true }> {
  return postJson('/api/department/join', { departmentId });
}

export function getDepartmentStatus(departmentId?: string): Promise<{ ok: true; department: Department }> {
  return getJson('/api/department/status', departmentId ? { departmentId } : {});
}

export function workOnAbnormality(abnoId: string, workType: string): Promise<{ ok: true; result: any }> {
  return postJson('/api/department/work', { abnoId, workType });
}

export function advanceDay(departmentId: string): Promise<{ ok: true; newDay: number; energy: number }> {
  return postJson('/api/department/advance', { departmentId });
}
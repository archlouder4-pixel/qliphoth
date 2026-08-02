// src/api/departmentApi.ts
import { API_BASE } from './competitiveApi';

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

export async function createDepartment(name: string): Promise<{ ok: true; department: Department }> {
  const res = await fetch(`${API_BASE}/api/department/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create department');
  return res.json();
}

export async function joinDepartment(departmentId: string): Promise<{ ok: true }> {
  const res = await fetch(`${API_BASE}/api/department/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ departmentId }),
  });
  if (!res.ok) throw new Error('Failed to join department');
  return res.json();
}

export async function getDepartmentStatus(): Promise<{ ok: true; department: Department }> {
  const res = await fetch(`${API_BASE}/api/department/status`);
  if (!res.ok) throw new Error('Failed to fetch department status');
  return res.json();
}

export async function workOnAbnormality(abnoId: string, workType: string): Promise<{ ok: true; result: any }> {
  const res = await fetch(`${API_BASE}/api/department/work`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ abnoId, workType }),
  });
  if (!res.ok) throw new Error('Failed to work on abnormality');
  return res.json();
}
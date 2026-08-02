// src/types/exploration.ts
export interface ExplorationPlace {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Very Hard';
  maxMembers: number;
  minMembers: number;
  waves: ExplorationWave[];
}

export interface ExplorationWave {
  waveNumber: number;
  isBoss: boolean;
  bossRank?: 'ZAYIN' | 'TETH' | 'HE' | 'WAW' | 'ALEPH';
  enemies: string[]; // enemy IDs
  description: string;
  rewards: {
    lunacy: { min: number; max: number };
    exp: { min: number; max: number };
  };
}

export interface ExplorationEnemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  element: string;
  resist: string;
  skills: Array<{ name: string; power: number; coins: number; damageType?: string; description?: string }>;
  portrait: string;
  isBoss?: boolean;
  risk?: 'ZAYIN' | 'TETH' | 'HE' | 'WAW' | 'ALEPH';
}
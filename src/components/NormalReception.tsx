// NormalReception.tsx – UI layer with enemy generation; imports mechanics from identitiesPassives.ts
import { useState, useEffect } from 'react';
import useGameStore from '../store/gameStore';
import {
  identities,
  scaledStats,
  leaderSkills,
  skillDmgMult,
  getClassCategory,
  classCategoryEffect,
  type Identity,
  type CombatCategory,
  type Enemy,
  DAMAGE_TYPE_INFO,
  INFUSION_INFO,
  DAMAGE_DEBUFFS,
  INFUSION_DEBUFFS,
  damageTypeMult,
  infusionMult,
  getElementInfo,
} from '../data/identities';
import {
  buildTransformedSkills,
  checkTransformationTrigger,
  applyTransformationPassive,
  getTransformationInfo,
  type TransformedSkill,
} from '../data/identitiesPassives';
import { weapons, canEquipWeapon } from '../data/weapons';
import { egoGifts } from '../data/egoGifts';
import TeamSelector from './TeamSelector';

const MAX_CLASH_POWER = 50;
const ULTIMATE_GAIN_MIN = 0.003;
const ULTIMATE_GAIN_MAX = 0.03;

// ─── Enemy generation helpers (local) ───────────────────────────────
const oldToNew: Record<string, { dmg: string; inf: string }> = {
  Physical: { dmg: 'Red', inf: 'Blunt' },
  Fire: { dmg: 'Red', inf: 'Slash' },
  Water: { dmg: 'Pale', inf: 'Pierce' },
  Dark: { dmg: 'Black', inf: 'Slash' },
  Light: { dmg: 'White', inf: 'Pierce' },
  Chaos: { dmg: 'Black', inf: 'Blunt' },
  Void: { dmg: 'Pale', inf: 'Pierce' },
  Spectro: { dmg: 'White', inf: 'Slash' },
};

const convertElement = (oldEl: string): { damageType: string; infusion: string } => {
  const mapped = oldToNew[oldEl] || { dmg: 'Red', inf: 'Slash' };
  return { damageType: mapped.dmg, infusion: mapped.inf };
};

// ─── Full enemy generation ──────────────────────────────────────────
function generateStoryEnemy(chapterIndex: number, playerAtk: number, playerDef: number, playerMaxHp: number): Enemy[] {
  const w = chapterIndex;
  const s = 0.85 + w * 0.12;
  const hpS = Math.floor(playerMaxHp * s * 1.5);
  const atkS = Math.floor(playerAtk * s * 0.85);
  const defS = Math.floor(playerDef * s * 1.4);
  const cap = (p: number) => Math.min(p, MAX_CLASH_POWER);

  if (w === 1) return [
    { name: 'Q-Security Alpha', hp: hpS, maxHp: hpS, atk: atkS, def: defS, spd: 60, ...convertElement('Physical'), resistDamageType: 'Pale', resistInfusion: 'Blunt', skills: [{ name: 'Containment Strike', power: cap(4), coins: 1 }, { name: 'Riot Shield', power: cap(5), coins: 1 }], portrait: '🔒' },
    { name: 'Q-Security Beta', hp: Math.floor(hpS * 0.8), maxHp: Math.floor(hpS * 0.8), atk: Math.floor(atkS * 0.9), def: Math.floor(defS * 0.9), spd: 65, ...convertElement('Physical'), resistDamageType: 'White', resistInfusion: 'Pierce', skills: [{ name: 'Suppression Fire', power: cap(3), coins: 2 }], portrait: '🔒' },
  ];
  if (w === 2) return [
    { name: 'Corrupted Operative', hp: Math.floor(hpS * 1.2), maxHp: Math.floor(hpS * 1.2), atk: Math.floor(atkS * 1.1), def: Math.floor(defS * 1.1), spd: 62, ...convertElement('Dark'), resistDamageType: 'White', resistInfusion: 'Pierce', skills: [{ name: 'Corrupted Slash', power: cap(5), coins: 2 }, { name: 'Qliphoth Surge', power: cap(7), coins: 1 }], portrait: '💀' },
    { name: 'Qliphoth Spawn', hp: Math.floor(hpS * 0.9), maxHp: Math.floor(hpS * 0.9), atk: Math.floor(atkS * 0.9), def: Math.floor(defS * 0.9), spd: 70, ...convertElement('Chaos'), resistDamageType: 'Red', resistInfusion: 'Slash', skills: [{ name: 'Tendril Whip', power: cap(4), coins: 3 }], portrait: '👾' },
  ];
  if (w === 3) return [{
    name: 'Verg - The Dark Slayer', hp: Math.floor(hpS * 1.8), maxHp: Math.floor(hpS * 1.8), atk: Math.floor(atkS * 1.4), def: Math.floor(defS * 1.3), spd: 85,
    ...convertElement('Dark'), resistDamageType: 'Black', resistInfusion: 'Blunt',
    skills: [
      { name: 'Judgment Cut', power: cap(8), coins: 2, damageType: 'Black', infusion: 'Slash' },
      { name: 'Storm Blades', power: cap(6), coins: 3, damageType: 'Black', infusion: 'Pierce' },
      { name: 'Hell on Earth', power: cap(13), coins: 2, damageType: 'Red', infusion: 'Blunt' }
    ],
    portrait: '🗡️',
  }];
  if (w === 4) return [{
    name: 'Apollyon Shade', hp: Math.floor(hpS * 2), maxHp: Math.floor(hpS * 2), atk: Math.floor(atkS * 1.3), def: Math.floor(defS * 1.4), spd: 72,
    ...convertElement('Dark'), resistDamageType: 'Pale', resistInfusion: 'Pierce',
    skills: [
      { name: 'Umbral Slash', power: cap(7), coins: 2, damageType: 'Black', infusion: 'Slash' },
      { name: 'Abyssal Collapse', power: cap(11), coins: 3, damageType: 'Black', infusion: 'Blunt' },
      { name: 'Shackle of Despair', power: cap(8), coins: 2, damageType: 'Pale', infusion: 'Pierce' }
    ],
    portrait: '🌘',
  }];
  if (w === 5) return [
    { name: 'Qliphoth Enforcer', hp: Math.floor(hpS * 1.2), maxHp: Math.floor(hpS * 1.2), atk: Math.floor(atkS * 1.1), def: Math.floor(defS * 1.2), spd: 68, ...convertElement('Chaos'), resistDamageType: 'Pale', resistInfusion: 'Pierce', skills: [{ name: 'Enforcement', power: cap(7), coins: 2, damageType: 'Black', infusion: 'Blunt' }, { name: 'Corruption Wave', power: cap(8), coins: 2, damageType: 'Black', infusion: 'Slash' }], portrait: '💀' },
    { name: 'Tree Warden', hp: Math.floor(hpS * 1), maxHp: Math.floor(hpS * 1), atk: Math.floor(atkS * 1.05), def: Math.floor(defS * 1.1), spd: 72, ...convertElement('Fire'), resistDamageType: 'White', resistInfusion: 'Slash', skills: [{ name: 'Root Strike', power: cap(6), coins: 3, damageType: 'Red', infusion: 'Blunt' }], portrait: '🌿' },
  ];
  if (w === 6) return [
    { name: 'Sefirot Guardian', hp: Math.floor(hpS * 1.5), maxHp: Math.floor(hpS * 1.5), atk: Math.floor(atkS * 1.2), def: Math.floor(defS * 1.3), spd: 65, ...convertElement('Chaos'), resistDamageType: 'Black', resistInfusion: 'Slash', skills: [{ name: 'Sefirot Beam', power: cap(9), coins: 2, damageType: 'White', infusion: 'Pierce' }, { name: 'Guardian Shield', power: cap(5), coins: 3, damageType: 'Pale', infusion: 'Blunt' }], portrait: '🔮' },
    { name: 'Corrupted Q-Operative', hp: Math.floor(hpS * 1.1), maxHp: Math.floor(hpS * 1.1), atk: Math.floor(atkS * 1.1), def: Math.floor(defS * 0.9), spd: 75, ...convertElement('Fire'), resistDamageType: 'Red', resistInfusion: 'Blunt', skills: [{ name: 'Incendiary Burst', power: cap(7), coins: 2, damageType: 'Red', infusion: 'Slash' }], portrait: '🔥' },
  ];
  if (w === 7) return [{
    name: 'Lotus - Qliphoth Administrator', hp: Math.floor(hpS * 3), maxHp: Math.floor(hpS * 3), atk: Math.floor(atkS * 1.6), def: Math.floor(defS * 1.6), spd: 82,
    ...convertElement('Chaos'), resistDamageType: 'White', resistInfusion: 'Pierce',
    skills: [
      { name: 'Seed of Corruption', power: cap(9), coins: 3, damageType: 'Black', infusion: 'Blunt' },
      { name: 'Qliphoth Overload', power: cap(14), coins: 4, damageType: 'Black', infusion: 'Slash' },
      { name: 'Sefirot Lash', power: cap(8), coins: 3, damageType: 'Pale', infusion: 'Pierce' }
    ],
    portrait: '🪷',
  }];
  if (w === 8) return [
    { name: 'Spectral Shade', hp: Math.floor(hpS * 1.3), maxHp: Math.floor(hpS * 1.3), atk: Math.floor(atkS * 1.1), def: Math.floor(defS * 1.1), spd: 75, ...convertElement('Spectro'), resistDamageType: 'Black', resistInfusion: 'Slash', skills: [{ name: 'Echoing Strike', power: cap(8), coins: 2, damageType: 'White', infusion: 'Slash' }, { name: 'Lament Wave', power: cap(7), coins: 3, damageType: 'White', infusion: 'Pierce' }], portrait: '🪦' },
    { name: 'Veil Wraith', hp: Math.floor(hpS * 1), maxHp: Math.floor(hpS * 1), atk: Math.floor(atkS * 1), def: Math.floor(defS * 0.9), spd: 80, ...convertElement('Spectro'), resistDamageType: 'Red', resistInfusion: 'Slash', skills: [{ name: 'Spectral Claw', power: cap(6), coins: 2, damageType: 'White', infusion: 'Slash' }], portrait: '👻' },
  ];
  if (w === 9) return [
    { name: 'Qliphoth Root', hp: Math.floor(hpS * 1.5), maxHp: Math.floor(hpS * 1.5), atk: Math.floor(atkS * 1.2), def: Math.floor(defS * 1.4), spd: 50, ...convertElement('Water'), resistDamageType: 'Red', resistInfusion: 'Slash', skills: [{ name: 'Crushing Root', power: cap(10), coins: 1, damageType: 'Pale', infusion: 'Blunt' }, { name: 'Thorn Storm', power: cap(6), coins: 4, damageType: 'Pale', infusion: 'Pierce' }], portrait: '🌿' },
    { name: 'Drowned Security', hp: Math.floor(hpS * 1.1), maxHp: Math.floor(hpS * 1.1), atk: Math.floor(atkS * 0.9), def: Math.floor(defS * 1), spd: 58, ...convertElement('Water'), resistDamageType: 'Pale', resistInfusion: 'Pierce', skills: [{ name: 'Waterlogged Strike', power: cap(6), coins: 2, damageType: 'Pale', infusion: 'Blunt' }], portrait: '🔒' },
  ];
  if (w === 10) return [
    { name: 'Dimensional Shade', hp: Math.floor(hpS * 1.2), maxHp: Math.floor(hpS * 1.2), atk: Math.floor(atkS * 1.1), def: Math.floor(defS * 1.1), spd: 78, ...convertElement('Void'), resistDamageType: 'White', resistInfusion: 'Pierce', skills: [{ name: 'Rift Slash', power: cap(8), coins: 2, damageType: 'Pale', infusion: 'Slash' }, { name: 'Timeline Fracture', power: cap(7), coins: 3, damageType: 'Pale', infusion: 'Blunt' }], portrait: '🌑' },
    { name: 'Golden Sentinel', hp: Math.floor(hpS * 1), maxHp: Math.floor(hpS * 1), atk: Math.floor(atkS * 0.95), def: Math.floor(defS * 1.2), spd: 65, ...convertElement('Light'), resistDamageType: 'Pale', resistInfusion: 'Pierce', skills: [{ name: 'Bough Strike', power: cap(7), coins: 2, damageType: 'White', infusion: 'Blunt' }], portrait: '✨' },
  ];
  if (w === 11) return [{
    name: 'Lotus - Timeline Weaver', hp: Math.floor(hpS * 2.5), maxHp: Math.floor(hpS * 2.5), atk: Math.floor(atkS * 1.5), def: Math.floor(defS * 1.4), spd: 90,
    ...convertElement('Chaos'), resistDamageType: 'White', resistInfusion: 'Slash',
    skills: [
      { name: 'Timeline Rend', power: cap(10), coins: 3, damageType: 'Black', infusion: 'Slash' },
      { name: 'Golden Bough', power: cap(13), coins: 3, damageType: 'White', infusion: 'Blunt' },
      { name: 'Infinite Possibility', power: cap(8), coins: 4, damageType: 'Pale', infusion: 'Pierce' }
    ],
    portrait: '🪷',
  }];
  if (w === 12) return [{
    name: 'Alt-Rover - Eclipse Tyrant', hp: Math.floor(hpS * 3), maxHp: Math.floor(hpS * 3), atk: Math.floor(atkS * 1.7), def: Math.floor(defS * 1.5), spd: 88,
    ...convertElement('Void'), resistDamageType: 'White', resistInfusion: 'Pierce',
    skills: [
      { name: 'Corrupted Void Rend', power: cap(10), coins: 3, damageType: 'Pale', infusion: 'Slash' },
      { name: 'Dark Eclipse Protocol', power: cap(14), coins: 4, damageType: 'Black', infusion: 'Blunt' }
    ],
    portrait: '🌑',
  }];
  if (w === 13) return [{
    name: 'Lotus - Qliphoth Avatar', hp: Math.floor(hpS * 4), maxHp: Math.floor(hpS * 4), atk: Math.floor(atkS * 2), def: Math.floor(defS * 1.8), spd: 95,
    ...convertElement('Chaos'), resistDamageType: 'All', resistInfusion: 'All',
    skills: [
      { name: 'Qliphoth Cataclysm', power: cap(14), coins: 4, damageType: 'Black', infusion: 'Blunt' },
      { name: 'Golden Apocalypse', power: cap(16), coins: 3, damageType: 'White', infusion: 'Slash' },
      { name: 'Timeline Erasure', power: cap(11), coins: 5, damageType: 'Pale', infusion: 'Pierce' }
    ],
    portrait: '🪷',
  }];
  if (w === 14) return [
    { name: 'Shadow Verg', hp: Math.floor(hpS * 1.5), maxHp: Math.floor(hpS * 1.5), atk: Math.floor(atkS * 1.4), def: Math.floor(defS * 1.2), spd: 85, ...convertElement('Dark'), resistDamageType: 'Black', resistInfusion: 'Blunt', skills: [{ name: 'Dark Judgment Cut', power: cap(11), coins: 3, damageType: 'Black', infusion: 'Slash' }], portrait: '🗡️' },
    { name: 'Qliphoth Avatar Remnant', hp: Math.floor(hpS * 3.5), maxHp: Math.floor(hpS * 3.5), atk: Math.floor(atkS * 1.8), def: Math.floor(defS * 1.6), spd: 88, ...convertElement('Chaos'), resistDamageType: 'All', resistInfusion: 'All', skills: [{ name: 'Dying Surge', power: cap(15), coins: 4, damageType: 'Black', infusion: 'Blunt' }], portrait: '🪷' },
  ];
  if (w === 15) return [
    { name: 'Dormant Seedling', hp: Math.floor(hpS * 1.2), maxHp: Math.floor(hpS * 1.2), atk: Math.floor(atkS * 1.1), def: Math.floor(defS * 1.3), spd: 60, ...convertElement('Chaos'), resistDamageType: 'Red', resistInfusion: 'Slash', skills: [{ name: 'Slow Awakening', power: cap(7), coins: 2, damageType: 'Black', infusion: 'Blunt' }], portrait: '🌱' },
    { name: 'Ancient Root', hp: Math.floor(hpS * 1.4), maxHp: Math.floor(hpS * 1.4), atk: Math.floor(atkS * 0.95), def: Math.floor(defS * 1.5), spd: 50, ...convertElement('Water'), resistDamageType: 'White', resistInfusion: 'Pierce', skills: [{ name: 'Crushing Coil', power: cap(9), coins: 2, damageType: 'Pale', infusion: 'Blunt' }], portrait: '🌿' },
  ];
  if (w === 16) return [{
    name: 'Mother\'s Voice (Echo)', hp: Math.floor(hpS * 2.5), maxHp: Math.floor(hpS * 2.5), atk: Math.floor(atkS * 1.4), def: Math.floor(defS * 1.5), spd: 80,
    ...convertElement('Chaos'), resistDamageType: 'White', resistInfusion: 'Slash',
    skills: [
      { name: 'Mournful Lullaby', power: cap(9), coins: 3, damageType: 'Pale', infusion: 'Pierce' },
      { name: 'Wishing Vine', power: cap(11), coins: 2, damageType: 'Black', infusion: 'Slash' },
      { name: 'Gentle Sorrow', power: cap(8), coins: 3, damageType: 'Pale', infusion: 'Blunt' }
    ],
    portrait: '🌳',
  }];
  if (w === 17) return [
    { name: 'Wishtree Wraith', hp: Math.floor(hpS * 1.8), maxHp: Math.floor(hpS * 1.8), atk: Math.floor(atkS * 1.3), def: Math.floor(defS * 1.4), spd: 75, ...convertElement('Chaos'), resistDamageType: 'White', resistInfusion: 'Pierce', skills: [{ name: 'Stolen Wish', power: cap(10), coins: 3, damageType: 'Black', infusion: 'Blunt' }, { name: 'Forgotten Voice', power: cap(8), coins: 2, damageType: 'Pale', infusion: 'Slash' }], portrait: '🌲' },
    { name: 'Desire Fragment', hp: Math.floor(hpS * 1.2), maxHp: Math.floor(hpS * 1.2), atk: Math.floor(atkS * 1.5), def: Math.floor(defS * 0.9), spd: 90, ...convertElement('Spectro'), resistDamageType: 'Black', resistInfusion: 'Slash', skills: [{ name: 'Heartstring Pull', power: cap(9), coins: 4, damageType: 'White', infusion: 'Pierce' }], portrait: '💔' },
  ];
  if (w === 18) return [{
    name: 'Garden Guardian', hp: Math.floor(hpS * 3.5), maxHp: Math.floor(hpS * 3.5), atk: Math.floor(atkS * 1.8), def: Math.floor(defS * 1.8), spd: 85,
    ...convertElement('Chaos'), resistDamageType: 'All', resistInfusion: 'All',
    skills: [
      { name: 'Thousand-Arm Embrace', power: cap(12), coins: 4, damageType: 'Black', infusion: 'Blunt' },
      { name: 'Root Spear Volley', power: cap(14), coins: 3, damageType: 'Pale', infusion: 'Pierce' },
      { name: 'Mother\'s Lament', power: cap(16), coins: 2, damageType: 'White', infusion: 'Slash' }
    ],
    portrait: '🌳',
  }];
  if (w === 19) return [{
    name: 'MOTHER — She Who Births Trees', hp: Math.floor(hpS * 6), maxHp: Math.floor(hpS * 6), atk: Math.floor(atkS * 2.3), def: Math.floor(defS * 2.2), spd: 100,
    ...convertElement('Chaos'), resistDamageType: 'All', resistInfusion: 'All',
    skills: [
      { name: 'Garden of Sorrows', power: cap(18), coins: 5, damageType: 'Pale', infusion: 'Pierce' },
      { name: 'Womb of the World', power: cap(22), coins: 3, damageType: 'Black', infusion: 'Blunt' },
      { name: 'Wishing-Tree Genesis', power: cap(15), coins: 6, damageType: 'White', infusion: 'Slash' },
      { name: 'Mother\'s Final Embrace', power: cap(25), coins: 4, damageType: 'Pale', infusion: 'Blunt' }
    ],
    portrait: '🌳',
  }];
  if (w === 20) return [
    { name: 'Fading Echo', hp: Math.floor(hpS * 0.5), maxHp: Math.floor(hpS * 0.5), atk: Math.floor(atkS * 0.6), def: Math.floor(defS * 0.6), spd: 70, ...convertElement('Void'), resistDamageType: 'Red', resistInfusion: 'Blunt', skills: [{ name: 'Last Whisper', power: cap(5), coins: 2, damageType: 'Pale', infusion: 'Pierce' }], portrait: '🌑' },
  ];
  if (w === 22) return [{
    name: 'Shadow Verg - Dark Reflection',
    hp: Math.floor(hpS * 1.8),
    maxHp: Math.floor(hpS * 1.8),
    atk: Math.floor(atkS * 1.5),
    def: Math.floor(defS * 1.3),
    spd: 88,
    ...convertElement('Dark'),
    resistDamageType: 'Black',
    resistInfusion: 'Blunt',
    skills: [
      { name: 'Dark Judgment Cut', power: cap(10), coins: 3, damageType: 'Black', infusion: 'Slash' },
      { name: 'Shadow Storm', power: cap(8), coins: 4, damageType: 'Black', infusion: 'Pierce' },
      { name: 'Void Execution', power: cap(14), coins: 2, damageType: 'Pale', infusion: 'Blunt' }
    ],
    portrait: '🗡️',
  }];
  if (w === 23) return [{
    name: 'Shadow Sparda - Dark Legend',
    hp: Math.floor(hpS * 2.2),
    maxHp: Math.floor(hpS * 2.2),
    atk: Math.floor(atkS * 1.6),
    def: Math.floor(defS * 1.5),
    spd: 82,
    ...convertElement('Dark'),
    resistDamageType: 'All',
    resistInfusion: 'All',
    skills: [
      { name: 'Dark Force Edge', power: cap(12), coins: 2, damageType: 'Black', infusion: 'Slash' },
      { name: 'Legendary Void Slash', power: cap(10), coins: 4, damageType: 'Pale', infusion: 'Slash' },
      { name: 'Nightmare Judgment', power: cap(16), coins: 3, damageType: 'Black', infusion: 'Blunt' }
    ],
    portrait: '👹',
  }];
  if (w === 24) return [{
    name: 'Shadow Rin - Hollow Hunter',
    hp: Math.floor(hpS * 1.9),
    maxHp: Math.floor(hpS * 1.9),
    atk: Math.floor(atkS * 1.5),
    def: Math.floor(defS * 1.2),
    spd: 92,
    ...convertElement('Fire'),
    resistDamageType: 'White',
    resistInfusion: 'Slash',
    skills: [
      { name: 'Inferno Rebellion', power: cap(11), coins: 3, damageType: 'Red', infusion: 'Slash' },
      { name: 'Echoing Blaze', power: cap(9), coins: 5, damageType: 'Red', infusion: 'Pierce' },
      { name: 'Devil\'s Gambit', power: cap(13), coins: 2, damageType: 'Black', infusion: 'Blunt' }
    ],
    portrait: '🍕',
  }];
  if (w === 25) return [{
    name: 'Shadow Butterfly - Funeral Echo',
    hp: Math.floor(hpS * 1.7),
    maxHp: Math.floor(hpS * 1.7),
    atk: Math.floor(atkS * 1.4),
    def: Math.floor(defS * 1.2),
    spd: 95,
    ...convertElement('Void'),
    resistDamageType: 'White',
    resistInfusion: 'Pierce',
    skills: [
      { name: 'Wing of Despair', power: cap(9), coins: 4, damageType: 'Pale', infusion: 'Slash' },
      { name: 'Eternal Requiem', power: cap(12), coins: 2, damageType: 'Pale', infusion: 'Pierce' },
      { name: 'Butterfly Effect', power: cap(7), coins: 5, damageType: 'White', infusion: 'Blunt' }
    ],
    portrait: '🦋',
  }];
  if (w === 26) return [{
    name: 'Shadow Miastro - Dissonant Conductor',
    hp: Math.floor(hpS * 1.6),
    maxHp: Math.floor(hpS * 1.6),
    atk: Math.floor(atkS * 1.3),
    def: Math.floor(defS * 1.3),
    spd: 85,
    ...convertElement('Light'),
    resistDamageType: 'Black',
    resistInfusion: 'Slash',
    skills: [
      { name: 'Cacophony of Chaos', power: cap(10), coins: 3, damageType: 'White', infusion: 'Pierce' },
      { name: 'Broken Crescendo', power: cap(8), coins: 4, damageType: 'White', infusion: 'Slash' },
      { name: 'Finale of Silence', power: cap(14), coins: 2, damageType: 'Pale', infusion: 'Blunt' }
    ],
    portrait: '🎼',
  }];
  if (w === 27) return [{
    name: 'Shadow Don - Broken Fixer',
    hp: Math.floor(hpS * 2.0),
    maxHp: Math.floor(hpS * 2.0),
    atk: Math.floor(atkS * 1.5),
    def: Math.floor(defS * 1.4),
    spd: 80,
    ...convertElement('Fire'),
    resistDamageType: 'Pale',
    resistInfusion: 'Pierce',
    skills: [
      { name: 'Justice of the Damned', power: cap(11), coins: 3, damageType: 'Red', infusion: 'Slash' },
      { name: 'Bloody Olé', power: cap(9), coins: 4, damageType: 'Red', infusion: 'Pierce' },
      { name: 'La Sangre Oscura', power: cap(15), coins: 2, damageType: 'Black', infusion: 'Blunt' }
    ],
    portrait: '⚔️',
  }];
  if (w === 28) return [{
    name: 'Shadow Shorekeeper - Corrupted Tide',
    hp: Math.floor(hpS * 2.1),
    maxHp: Math.floor(hpS * 2.1),
    atk: Math.floor(atkS * 1.4),
    def: Math.floor(defS * 1.6),
    spd: 75,
    ...convertElement('Water'),
    resistDamageType: 'Red',
    resistInfusion: 'Slash',
    skills: [
      { name: 'Abyssal Bloom', power: cap(10), coins: 3, damageType: 'Pale', infusion: 'Pierce' },
      { name: 'Drowning Garden', power: cap(12), coins: 2, damageType: 'Pale', infusion: 'Blunt' },
      { name: 'Eternal Surge', power: cap(14), coins: 3, damageType: 'White', infusion: 'Slash' }
    ],
    portrait: '🌊',
  }];
  if (w === 29) return [{
    name: 'Shadow Aemeath - Hollow Sentinel',
    hp: Math.floor(hpS * 2.0),
    maxHp: Math.floor(hpS * 2.0),
    atk: Math.floor(atkS * 1.6),
    def: Math.floor(defS * 1.5),
    spd: 82,
    ...convertElement('Spectro'),
    resistDamageType: 'Pale',
    resistInfusion: 'Pierce',
    skills: [
      { name: 'Funeral of Echoes', power: cap(12), coins: 3, damageType: 'White', infusion: 'Slash' },
      { name: 'Havoc Bane', power: cap(10), coins: 4, damageType: 'White', infusion: 'Pierce' },
      { name: 'Threnodian Requiem', power: cap(16), coins: 2, damageType: 'Pale', infusion: 'Blunt' }
    ],
    portrait: '🪦',
  }];
  if (w === 40) return [{
    name: 'Warden of Rust',
    hp: Math.floor(playerMaxHp * 2.0),
    maxHp: Math.floor(playerMaxHp * 2.0),
    atk: Math.floor(playerAtk * 1.3),
    def: Math.floor(playerDef * 1.5),
    spd: 70,
    ...convertElement('Physical'),
    resistDamageType: 'Red',
    resistInfusion: 'Blunt',
    skills: [
      { name: 'Rust Cleave', power: cap(9), coins: 2, damageType: 'Red', infusion: 'Slash' },
      { name: 'Chain of Guilt', power: cap(11), coins: 3, damageType: 'Red', infusion: 'Pierce' },
      { name: 'Iron Verdict', power: cap(14), coins: 2, damageType: 'Red', infusion: 'Blunt' }
    ],
    portrait: '🔗',
  }];
  if (w === 41) return [{
    name: 'Fractured Commander',
    hp: Math.floor(playerMaxHp * 2.2),
    maxHp: Math.floor(playerMaxHp * 2.2),
    atk: Math.floor(playerAtk * 1.4),
    def: Math.floor(playerDef * 1.6),
    spd: 65,
    ...convertElement('Light'),
    resistDamageType: 'White',
    resistInfusion: 'Pierce',
    skills: [
      { name: 'Lance Charge', power: cap(10), coins: 2, damageType: 'White', infusion: 'Pierce' },
      { name: 'Oathbreaker', power: cap(12), coins: 3, damageType: 'White', infusion: 'Slash' },
      { name: 'Final Judgment', power: cap(16), coins: 1, damageType: 'White', infusion: 'Blunt' }
    ],
    portrait: '⚔️',
  }];
  if (w === 42) return [{
    name: 'Echo of Despair',
    hp: Math.floor(playerMaxHp * 1.8),
    maxHp: Math.floor(playerMaxHp * 1.8),
    atk: Math.floor(playerAtk * 1.5),
    def: Math.floor(playerDef * 1.4),
    spd: 80,
    ...convertElement('Chaos'),
    resistDamageType: 'Black',
    resistInfusion: 'Blunt',
    skills: [
      { name: 'Thorn Lullaby', power: cap(8), coins: 3, damageType: 'Pale', infusion: 'Pierce' },
      { name: 'Silent Scream', power: cap(13), coins: 2, damageType: 'Black', infusion: 'Slash' },
      { name: 'Eternal Dirge', power: cap(15), coins: 2, damageType: 'White', infusion: 'Blunt' }
    ],
    portrait: '🌿',
  }];

  // Fallback for any unhandled chapter
  return [
    { name: 'Fading Echo', hp: Math.floor(hpS * 0.5), maxHp: Math.floor(hpS * 0.5), atk: Math.floor(atkS * 0.6), def: Math.floor(defS * 0.6), spd: 70, ...convertElement('Void'), resistDamageType: 'Red', resistInfusion: 'Blunt', skills: [{ name: 'Last Whisper', power: cap(5), coins: 2, damageType: 'Pale', infusion: 'Pierce' }], portrait: '🌑' },
  ];
}

// ─── Combat helpers ──────────────────────────────────────────────────
function rollCoin(power: number): number {
  return Math.random() < 0.5 ? power : 1;
}

function clash(pP: number, eP: number, pC: number, eC: number) {
  let pt = rollCoin(pP),
    et = rollCoin(eP);
  for (let i = 1; i < Math.max(pC, eC); i++) {
    if (i < pC) pt += rollCoin(pP);
    if (i < eC) et += rollCoin(eP);
  }
  return { playerTotal: pt, enemyTotal: et };
}

// ─── Debuff application (uses imports) ──────────────────────────────
function applyDebuff(identityName: string, damageType: string, infusion: string, addLog: (msg: string) => void) {
  const dmgDebuff = DAMAGE_DEBUFFS[damageType];
  if (dmgDebuff) {
    addLog(`⚔️ ${dmgDebuff.icon} ${dmgDebuff.name} applied! ${dmgDebuff.effect} (from ${identityName})`);
  }
  const infDebuff = INFUSION_DEBUFFS[infusion];
  if (infDebuff) {
    addLog(`⚔️ ${infDebuff.icon} ${infDebuff.name} applied! ${infDebuff.effect} (from ${identityName})`);
  }
}

function createStoryOwned(identityId: string) {
  return {
    identityId,
    rank: 8,
    level: 65,
    exp: 0,
    shards: 0,
    skillLevels: [15, 15, 15, 15],
    classSkillLevel: 20,
    equippedWeaponId: undefined,
  };
}

// ─── Main Component ──────────────────────────────────────────────────
interface Props {
  chapterTitle: string;
  chapterIndex: number;
  onComplete: () => void;
  availableIdentities: string[];
  useDawnbreaker?: boolean;
  forcedIdentity?: string;
}

export default function NormalReception({
  chapterTitle,
  chapterIndex,
  onComplete,
  availableIdentities,
  useDawnbreaker = false,
  forcedIdentity,
}: Props) {
  const {
    ownedIdentities,
    ownedWeapons,
    team,
    recordEnemyDefeats,
    setEquippedWeapon,
    addThreads,
    equippedGifts,
    prepareChapter,
    roverAwakened,
    trialIdentities,
  } = useGameStore();

  useEffect(() => {
    if (forcedIdentity || useDawnbreaker) {
      prepareChapter(chapterIndex);
    }
  }, [chapterIndex, forcedIdentity, useDawnbreaker]);

  // ─── State ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<'teamSelect' | 'fighting' | 'victory' | 'defeat'>('teamSelect');
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [memberHp, setMemberHp] = useState<number[]>([100, 100, 100]);
  const [memberMaxHp, setMemberMaxHp] = useState<number[]>([100, 100, 100]);
  const [memberShield, setMemberShield] = useState<number[]>([0, 0, 0]);
  const [memberSp, setMemberSp] = useState<number[]>([50, 50, 50]);
  const [memberUltimate, setMemberUltimate] = useState<number[]>([0, 0, 0]);
  const [selectedSkill, setSelectedSkill] = useState(0);
  const [turn, setTurn] = useState<'player' | 'clashResult'>('player');
  const [clashInfo, setClashInfo] = useState<{
    p: number;
    e: number;
    pName: string;
    eName: string;
    won: boolean;
    dmg: number;
    mult: number;
    actorName: string;
  } | null>(null);
  const [log, setLog] = useState<string[]>(['[SYSTEM] Normal Reception — Combat Engaged!']);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [ampDamageBoost, setAmpDamageBoost] = useState(0);
  const [allyEgoAmpBuff, setAllyEgoAmpBuff] = useState({ pct: 0, turnsLeft: 0, casterId: '' });
  const [tankShredPct, setTankShredPct] = useState(0);
  const [amplifierHealCooldown, setAmplifierHealCooldown] = useState(0);
  const [attackerBuffTurns, setAttackerBuffTurns] = useState(0);
  const [corrosionTurns, setCorrosionTurns] = useState(0);
  const [amplifierAtkBuffCooldown, setAmplifierAtkBuffCooldown] = useState(0);

  // ─── Transformation state ──────────────────────────────────────────
  const [transformationActive, setTransformationActive] = useState(false);
  const [transformationTurnsLeft, setTransformationTurnsLeft] = useState(0);
  const [transformedSkills, setTransformedSkills] = useState<TransformedSkill[]>([]);
  const [transformationCountdown, setTransformationCountdown] = useState(0);

  // ─── Passive auto‑select ──────────────────────────────────────────
  const [passiveActivating, setPassiveActivating] = useState(false);

  const giftStats = equippedGifts.reduce(
    (acc, g) => {
      const gift = egoGifts.find((eg) => eg.id === g.giftId);
      if (gift) {
        acc.hp += gift.stats.hp || 0;
        acc.atk += gift.stats.atk || 0;
        acc.def += gift.stats.def || 0;
        acc.spd += gift.stats.spd || 0;
      }
      return acc;
    },
    { hp: 0, atk: 0, def: 0, spd: 0 }
  );

  const useDawnbreakerForm = useDawnbreaker && roverAwakened;
  const effectiveTeam = forcedIdentity ? [forcedIdentity] : team;

  // ─── Build team members ────────────────────────────────────────────
  const teamMembers = effectiveTeam
    .map((id) => {
      let owned = ownedIdentities.find((o) => o.identityId === id);
      let isStory = false;
      if (!owned) {
        owned = createStoryOwned(id);
        isStory = true;
      }
      let dataId = owned.identityId;
      if (useDawnbreakerForm && dataId === 'rover_eclipse') {
        dataId = 'rover_dawnbreaker_story';
      }
      const data = identities.find((i) => i.id === dataId);
      if (!data) return null;

      let weaponId = owned.equippedWeaponId || null;
      // Arthur forced equip
      if (data.id === 'arthur_excalibur') {
        const targetWeaponId = data.signatureWeaponId || 'excalibur_greatsword';
        if (canEquipWeapon(data.id, targetWeaponId)) {
          const ownedWeapon = ownedWeapons.find((ow) => ow.weaponId === targetWeaponId);
          if (ownedWeapon) {
            if (owned.equippedWeaponId !== targetWeaponId) {
              setEquippedWeapon(data.id, targetWeaponId);
            }
            weaponId = targetWeaponId;
          }
        }
      } else {
        if (!weaponId && data.signatureWeaponId) {
          const sigWeaponId = data.signatureWeaponId;
          if (canEquipWeapon(data.id, sigWeaponId)) {
            const ownedWeapon = ownedWeapons.find((ow) => ow.weaponId === sigWeaponId);
            if (ownedWeapon) {
              if (!owned.equippedWeaponId) {
                setEquippedWeapon(data.id, sigWeaponId);
              }
              weaponId = sigWeaponId;
            }
          }
        }
      }

      const updatedOwned = { ...owned, equippedWeaponId: weaponId };
      return { owned: updatedOwned, data, isStory };
    })
    .filter(Boolean) as { owned: any; data: Identity; isStory: boolean }[];

  const aliveIndices = teamMembers.map((_, i) => i).filter((i) => (memberHp[i] ?? 0) > 0);
  const activeIdx = aliveIndices.length > 0 ? aliveIndices[currentTurnIndex % aliveIndices.length] : 0;
  const activeMember = teamMembers[activeIdx];
  const playerHp = memberHp[activeIdx] ?? 0;
  const playerMaxHp = memberMaxHp[activeIdx] ?? 100;
  const playerShield = memberShield[activeIdx] ?? 0;
  const spBar = memberSp[activeIdx] ?? 0;
  const ultimateBar = memberUltimate[activeIdx] ?? 0;

  const setPlayerHp = (updater: number | ((p: number) => number)) => {
    setMemberHp((prev) =>
      prev.map((v, i) => (i === activeIdx ? (typeof updater === 'function' ? updater(v) : updater) : v))
    );
  };
  const setPlayerShield = (updater: number | ((p: number) => number)) => {
    setMemberShield((prev) =>
      prev.map((v, i) => (i === activeIdx ? (typeof updater === 'function' ? updater(v) : updater) : v))
    );
  };
  const setSpBar = (updater: number | ((p: number) => number)) => {
    setMemberSp((prev) =>
      prev.map((v, i) => (i === activeIdx ? (typeof updater === 'function' ? updater(v) : updater) : v))
    );
  };
  const identityData = activeMember?.data ?? null;
  const activeIdentity = activeMember?.owned ?? null;
  const isStoryChar = activeMember?.isStory ?? false;

  // ─── Determine equipped weapon ──────────────────────────────────────
  const equippedWeaponId = activeIdentity?.equippedWeaponId;
  let equippedWeapon = equippedWeaponId ? weapons.find((w) => w.id === equippedWeaponId) : undefined;
  let weaponData: typeof weapons[0] | undefined = equippedWeapon;
  let weaponLevel = 1;
  if (!weaponData && isStoryChar && identityData) {
    const sig = weapons.find((w) => w.signatureFor === identityData.id);
    if (sig) {
      weaponData = sig;
      weaponLevel = sig.levelCap;
    } else {
      const fallback = weapons.find((w) => w.fallbackFor === identityData.id);
      if (fallback) {
        weaponData = fallback;
        weaponLevel = fallback.levelCap;
      }
    }
  } else if (weaponData) {
    const ownedWeapon = ownedWeapons.find((o) => o.weaponId === weaponData.id);
    if (ownedWeapon) weaponLevel = ownedWeapon.level;
  } else if (identityData) {
    const sig = weapons.find((w) => w.signatureFor === identityData.id);
    if (sig) {
      const ow = ownedWeapons.find((o) => o.weaponId === sig.id);
      if (ow) {
        weaponData = sig;
        weaponLevel = ow.level;
      }
    }
    if (!weaponData) {
      const fallback = weapons.find((w) => w.fallbackFor === identityData.id);
      if (fallback) {
        const ow = ownedWeapons.find((o) => o.weaponId === fallback.id);
        if (ow) {
          weaponData = fallback;
          weaponLevel = ow.level;
        }
      }
    }
    if (!weaponData && identityData) {
      const sigType = weapons.find((w) => w.signatureFor === identityData.id)?.type;
      if (sigType) {
        const sr = ownedWeapons.find((o) => {
          const w = weapons.find((x) => x.id === o.weaponId);
          return !!(w && w.rarity === 'SR' && w.type === sigType);
        });
        if (sr) {
          weaponData = weapons.find((w) => w.id === sr.weaponId);
          weaponLevel = sr.level;
        }
      }
    }
  }

  const stats = identityData
    ? scaledStats(identityData, activeIdentity?.level || 1, activeIdentity?.classSkillLevel ?? 1)
    : { hp: 3200, atk: 100, def: 60, spd: 80 };
  const totalStats = {
    hp: stats.hp + giftStats.hp,
    atk: stats.atk + giftStats.atk,
    def: stats.def + giftStats.def,
    spd: stats.spd + giftStats.spd,
  };
  const playerAtk = totalStats.atk + (weaponData?.baseStats.atk || 0);
  const playerDef = totalStats.def;
  const playerDamageType = identityData?.element || 'Red';
  const playerInfusion = weaponData?.type === 'Blunt' ? 'Blunt' : weaponData?.type === 'Pierce' ? 'Pierce' : 'Slash';
  const playerClassCat: CombatCategory = identityData ? getClassCategory(identityData.id) : 'Attacker';
  const playerClassEffect = classCategoryEffect(activeIdentity?.classSkillLevel ?? 1);

  // ─── Determine active skills ──────────────────────────────────────
  let baseSkills = identityData
    ? identityData.skills
        .filter((s) => s.type !== 'class')
        .map((skill) => {
          const idx = identityData.skills.indexOf(skill);
          const sl = activeIdentity?.skillLevels?.[idx] ?? 1;
          const rawPower = skill.basePower + skill.powerGrowth * (sl - 1);
          const power = Math.min(rawPower, MAX_CLASH_POWER);
          const coins =
            skill.coinGrowth > 0
              ? skill.baseCoins + Math.floor((sl - 1) / skill.coinGrowth)
              : skill.baseCoins;
          const dmgMult = skillDmgMult(skill.type, sl);
          return {
            name: skill.name,
            power,
            coins,
            type: skill.type,
            dmgMult,
            skillLevel: sl,
            isEgo: skill.type === 'ego',
            damageType: skill.damageType || playerDamageType,
            infusion: skill.infusion || playerInfusion,
          };
        })
    : [
        { name: 'Basic Strike', power: Math.min(4, MAX_CLASH_POWER), coins: 1, type: 'normal1' as const, dmgMult: 1, skillLevel: 1, isEgo: false, damageType: playerDamageType, infusion: playerInfusion },
        { name: 'Heavy Blow', power: Math.min(6, MAX_CLASH_POWER), coins: 1, type: 'normal2' as const, dmgMult: 1, skillLevel: 1, isEgo: false, damageType: playerDamageType, infusion: playerInfusion },
        { name: 'Quick Slash', power: Math.min(3, MAX_CLASH_POWER), coins: 2, type: 'normal3' as const, dmgMult: 1, skillLevel: 1, isEgo: false, damageType: playerDamageType, infusion: playerInfusion },
        { name: 'Ego Burst', power: Math.min(8, MAX_CLASH_POWER), coins: 2, type: 'ego' as const, dmgMult: 1, skillLevel: 1, isEgo: true, damageType: playerDamageType, infusion: playerInfusion },
      ];

  const playerSkills =
    transformationActive && transformedSkills.length > 0 ? transformedSkills : baseSkills;

  // ─── Helpers ──────────────────────────────────────────────────────────
  const addLog = (msg: string) => setLog((prev) => [...prev.slice(-20), msg]);

  const advanceTurn = () => {
    if (amplifierHealCooldown > 0) setAmplifierHealCooldown((prev) => prev - 1);
    if (attackerBuffTurns > 0) setAttackerBuffTurns((prev) => prev - 1);
    if (corrosionTurns > 0) setCorrosionTurns((prev) => prev - 1);
    if (amplifierAtkBuffCooldown > 0) setAmplifierAtkBuffCooldown((prev) => prev - 1);

    // ─── Timer‑based transformation (data‑driven) ──────────────────────
    if (!transformationActive && identityData && identityData.transformationTrigger === 'timer') {
      // We decrement the countdown each turn.
      setTransformationCountdown((prev) => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          // Check if transformation should trigger using the shared function.
          const triggerCtx = {
            ultimateBar,
            isEgo: false,
            stacks: { ...memberUltimate, transformationCountdown: prev },
            enemyStacks: {},
            allyCount: teamMembers.length,
            deadAllyCount: teamMembers.filter((_, i) => memberHp[i] <= 0).length,
            totalEnemiesDefeated: 0,
          };
          const shouldTrigger = checkTransformationTrigger(identityData, triggerCtx);
          if (shouldTrigger.shouldTrigger) {
            const newSkills = buildTransformedSkills(identityData, playerDamageType, playerInfusion);
            setTransformedSkills(newSkills);
            setTransformationActive(true);
            setTransformationTurnsLeft(identityData.ultimateDuration || 8);
            addLog(`⚔️ ${identityData.name} transformed! Skills replaced for ${identityData.ultimateDuration || 8} turns.`);
            return 0;
          }
        }
        return newCount;
      });
    }

    // ─── Decrement transformation turns ──────────────────────────────
    if (transformationActive) {
      setTransformationTurnsLeft((prev) => {
        if (prev <= 1) {
          setTransformationActive(false);
          setTransformedSkills([]);
          addLog('⏳ Transformation ended. Returning to normal skills.');
          return 0;
        }
        return prev - 1;
      });
    }

    // ─── Apply transformation passive effects (if active) ─────────────
    if (transformationActive && identityData?.transformationPassive) {
      const passiveCtx = {
        identity: identityData,
        transformationActive: true,
        turnCount: currentTurnIndex,
        playerHp,
        playerMaxHp,
        playerAtk,
        playerDef,
        stacks: {},
        enemyStacks: {},
        addLog,
        applyDebuff: (name: string, value: number, turns: number) => {
          addLog(`⚔️ Applied ${name} (${value}) for ${turns} turns`);
        },
        healAllies: (amount: number) => {
          setMemberHp((prev) =>
            prev.map((hp, i) => {
              if (i >= teamMembers.length) return hp;
              const maxHp = memberMaxHp[i] ?? 100;
              return Math.min(maxHp, hp + amount);
            })
          );
          addLog(`💚 Transformation passive healed allies for ${Math.floor(amount)} HP`);
        },
        applyBuff: (name: string, value: number, turns: number) => {},
        dealDamage: (amount: number) => {
          setEnemies((prev) => {
            const u = [...prev];
            if (u.length > 0) u[0] = { ...u[0], hp: Math.max(0, u[0].hp - amount) };
            return u;
          });
          addLog(`⚔️ Transformation passive dealt ${amount} damage`);
        },
        cleanseDebuffs: (count: number) => {
          addLog(`🧹 Cleansed ${count} debuffs`);
        },
      };
      const passiveResult = applyTransformationPassive(passiveCtx);
      if (passiveResult.applied) {
        passiveResult.extraEffects.forEach((effect) => addLog(`✨ ${effect}`));
      }
    }
  };

  const startBattle = () => {
    const hps = teamMembers.map((tm) => {
      const ms = scaledStats(tm.data, tm.owned.level, tm.owned.classSkillLevel ?? 1);
      const totalHp = ms.hp + giftStats.hp;
      const stat = Math.floor(totalHp / 32);
      return Math.max(50, Math.min(200, stat));
    });
    while (hps.length < 3) hps.push(100);
    setMemberHp([...hps]);
    setMemberMaxHp([...hps]);
    setMemberShield([0, 0, 0]);
    setMemberSp([50, 50, 50]);
    setMemberUltimate([0, 0, 0]);
    setTransformationActive(false);
    setTransformationTurnsLeft(0);
    setTransformedSkills([]);
    const activeIdentityData = teamMembers[0]?.data;
    if (activeIdentityData && activeIdentityData.transformationTrigger === 'timer') {
      setTransformationCountdown(activeIdentityData.triggerTurns || 10);
    } else {
      setTransformationCountdown(0);
    }
    setPassiveActivating(false);
    setSelectedSkill(0);
    setPhase('fighting');
    setTurn('player');
    setCurrentTurnIndex(0);
    const leaderHp = hps[0] || 100;
    setEnemies(generateStoryEnemy(chapterIndex, playerAtk, playerDef, leaderHp));
  };

  // ─── Clash logic ────────────────────────────────────────────────────
  const applyCorrosion = () => {
    setCorrosionTurns(2);
    addLog('🛡️ Corrosion applied! Enemy All Resistances -8% for 2 turns');
  };
  const applyAttackerBuff = () => {
    setAttackerBuffTurns(2);
    addLog('⚔️ Attacker buff active! +30% ATK for 2 turns');
  };

  const playerAct = () => {
    if (turn !== 'player' || enemies.length === 0) return;
    const skill = playerSkills[selectedSkill];
    if (!skill) return;
    const isEgo = skill.type === 'ego';
    if (isEgo && ultimateBar < 100) {
      addLog('⚠️ Ultimate not full! Ego needs 100% Ultimate.');
      return;
    }

    const enemy = enemies[0];
    const eSkill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
    const result = clash(skill.power, eSkill.power, skill.coins, eSkill.coins);
    const dmgMult = damageTypeMult(skill.damageType || playerDamageType, enemy.resistDamageType);
    const infMult = infusionMult(skill.infusion || playerInfusion, enemy.resistInfusion);
    let mult = dmgMult * infMult;

    let classMult = 1.0;
    if (playerClassCat === 'Attacker') {
      classMult += playerClassEffect;
      if (attackerBuffTurns > 0) classMult += 0.3;
    }
    if (playerClassCat === 'Amplifier' && isEgo) classMult += playerClassEffect;
    if (isEgo && allyEgoAmpBuff.turnsLeft > 0 && allyEgoAmpBuff.casterId !== identityData?.id) {
      classMult += allyEgoAmpBuff.pct;
    }
    if (ampDamageBoost > 0) classMult += ampDamageBoost;
    let tankBonus = 1.0;
    if (tankShredPct > 0) tankBonus += tankShredPct;
    if (corrosionTurns > 0) tankBonus += 0.08;

    let won = result.playerTotal >= result.enemyTotal;
    let dmg = 0,
      enemyDmg = 0;

    if (won) {
      const clashDiff = Math.max(1, result.playerTotal - result.enemyTotal + result.playerTotal / 4);
      dmg = Math.max(
        1,
        Math.floor(
          Math.max(1, ((playerAtk * (clashDiff / 6)) - enemy.def * 0.5) / 16) *
            mult *
            skill.dmgMult *
            classMult *
            tankBonus *
            (0.85 + Math.random() * 0.3)
        )
      );
      if (isEgo) dmg = Math.min(dmg, 100);
      else dmg = Math.min(dmg, 75);
      setEnemies((prev) => {
        const u = [...prev];
        u[0] = { ...u[0], hp: Math.max(0, u[0].hp - dmg) };
        return u;
      });
      setClashInfo({
        p: result.playerTotal,
        e: result.enemyTotal,
        pName: skill.name,
        eName: eSkill.name,
        won: true,
        dmg,
        mult,
        actorName: identityData?.name || '???',
      });
      addLog(`[${identityData?.name}] ✅ Won clash! ${skill.name} → ${dmg} dmg (×${mult.toFixed(2)}).`);

      applyDebuff(identityData?.name || 'Player', skill.damageType || playerDamageType, skill.infusion || playerInfusion, addLog);

      const gain = ULTIMATE_GAIN_MIN + Math.random() * (ULTIMATE_GAIN_MAX - ULTIMATE_GAIN_MIN);
      setMemberUltimate((prev) =>
        prev.map((v, i) => (i === activeIdx ? Math.min(100, v + gain * 100) : v))
      );

      if (playerClassCat === 'Attacker' && isEgo) {
        applyAttackerBuff();
      }
      if (playerClassCat === 'Tank' && isEgo) {
        setTankShredPct(Math.min(0.5, tankShredPct + playerClassEffect));
        addLog(`🛡️ TANK SHRED: Enemy damage reduction -${(playerClassEffect * 100).toFixed(0)}%`);
        applyCorrosion();
        const shieldAmt = Math.floor(dmg * 0.15);
        setMemberShield((prev) =>
          prev.map((s, i) => (i >= teamMembers.length ? s : s + shieldAmt))
        );
        addLog(`🛡️ All allies gained ${shieldAmt} shield!`);
      }
      if (playerClassCat === 'Amplifier' && isEgo) {
        setAllyEgoAmpBuff({ pct: 0.25 + playerClassEffect, turnsLeft: 2, casterId: identityData?.id || '' });
        addLog(`✨ AMPLIFIER: Allies gain +${((0.25 + playerClassEffect) * 100).toFixed(0)}% ego damage for 2 turns`);
        const healPct = 0.15 + playerClassEffect * 0.5;
        const healAmt = Math.max(3, Math.floor(dmg * healPct));
        setMemberHp((prev) =>
          prev.map((hp, i) => {
            if (i >= teamMembers.length) return hp;
            const maxHp = memberMaxHp[i] ?? 100;
            return Math.min(maxHp, hp + healAmt);
          })
        );
        addLog(`💚 AMPLIFIER Ego: all party members healed for ${healAmt} HP`);
        if (amplifierAtkBuffCooldown === 0) {
          setAmplifierAtkBuffCooldown(3);
          addLog(`✨ Amplifier buff: healed targets gain +10% ATK for 2 turns`);
        }
      }
      if (playerClassCat === 'Support' && isEgo) {
        const healPct = 0.2 + playerClassEffect;
        const healAmt = Math.floor(dmg * healPct);
        setMemberHp((prev) =>
          prev.map((hp, i) => {
            if (i >= teamMembers.length) return hp;
            const maxHp = memberMaxHp[i] ?? 100;
            return Math.min(maxHp, hp + healAmt);
          })
        );
        addLog(`💚 SUPPORT: Ego healed team for ${healAmt} HP`);
      }
      if (playerClassCat === 'Tank') applyCorrosion();

      // ─── Ultimate-based transformation (data-driven) ────────────────
      // We use the checkTransformationTrigger for ultimate trigger.
      if (isEgo && identityData) {
        const triggerCtx = {
          ultimateBar,
          isEgo: true,
          stacks: { ...memberUltimate },
          enemyStacks: {},
          allyCount: teamMembers.length,
          deadAllyCount: teamMembers.filter((_, i) => memberHp[i] <= 0).length,
          totalEnemiesDefeated: 0,
        };
        const shouldTrigger = checkTransformationTrigger(identityData, triggerCtx);
        if (shouldTrigger.shouldTrigger) {
          setMemberUltimate((prev) => prev.map((v, i) => (i === activeIdx ? 0 : v)));
          const newSkills = buildTransformedSkills(identityData, playerDamageType, playerInfusion);
          setTransformedSkills(newSkills);
          setTransformationActive(true);
          setTransformationTurnsLeft(identityData.ultimateDuration || 8);
          addLog(`🌹 ${identityData.name} transformed! Skills replaced for ${identityData.ultimateDuration || 8} turns.`);
        }
      }
    } else {
      const lossDiff = Math.max(1, result.enemyTotal - result.playerTotal + result.enemyTotal / 4);
      enemyDmg = Math.max(
        1,
        Math.floor(
          Math.max(1, ((enemy.atk * (lossDiff / 6)) - playerDef * 0.5) / 80) *
            (0.85 + Math.random() * 0.3)
        )
      );
      enemyDmg = Math.min(enemyDmg, Math.floor(playerMaxHp * 0.12));
      const afterShield = Math.max(0, enemyDmg - playerShield);
      setPlayerShield((prev) => Math.max(0, prev - enemyDmg));
      setPlayerHp((prev) => Math.max(0, prev - afterShield));
      setClashInfo({
        p: result.playerTotal,
        e: result.enemyTotal,
        pName: skill.name,
        eName: eSkill.name,
        won: false,
        dmg: enemyDmg,
        mult,
        actorName: identityData?.name || '???',
      });
      addLog(`❌ Lost clash! ${enemy.name} deals ${enemyDmg} dmg.`);
      if (playerClassCat === 'Amplifier' && afterShield > 0) {
        const healAmt = afterShield;
        setMemberHp((prev) =>
          prev.map((hp, i) => {
            if (i >= teamMembers.length) return hp;
            const maxHp = memberMaxHp[i] ?? 100;
            return Math.min(maxHp, hp + healAmt);
          })
        );
        addLog(`💚 AMPLIFIER resonance: all party members healed for ${healAmt} HP`);
      }
    }
    setTurn('clashResult');
  };

  const afterClash = () => {
    const alive = enemies.filter((e) => e.hp > 0);
    const deadCount = enemies.length - alive.length;
    setEnemies(alive);
    if (deadCount > 0) recordEnemyDefeats(deadCount);
    if (alive.length === 0) {
      setPhase('victory');
      addLog('🏆 All enemies defeated!');
      return;
    }

    const enemy = alive[0];
    const eSkill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
    let dmg = Math.max(
      1,
      Math.floor(
        Math.max(1, ((enemy.atk * (rollCoin(eSkill.power) / 10)) - playerDef) / 80) *
          (0.8 + Math.random() * 0.3)
      )
    );
    dmg = Math.min(dmg, Math.floor(playerMaxHp * 0.08));
    const afterShield = Math.max(0, dmg - playerShield);
    setPlayerShield((prev) => Math.max(0, prev - dmg));
    setPlayerHp((prev) => Math.max(0, prev - afterShield));
    addLog(`👊 ${enemy.name} ${eSkill.name}: ${dmg} dmg.`);

    if (playerClassCat === 'Tank') applyCorrosion();

    const currentHp = memberHp[activeIdx] ?? 0;
    const newHp = Math.max(0, currentHp - Math.max(0, dmg - (memberShield[activeIdx] ?? 0)));
    setMemberHp((prev) => prev.map((v, i) => (i === activeIdx ? newHp : v)));

    const aliveCount = memberHp.filter((hp, i) => hp > 0 && i < teamMembers.length).length;
    if (aliveCount <= 0) {
      setPhase('defeat');
      addLog('💀 All members have fallen. Defeat!');
      return;
    }

    setSpBar((prev) => Math.min(100, prev + 10));
    setAllyEgoAmpBuff((prev) =>
      prev.turnsLeft > 0 ? { ...prev, turnsLeft: prev.turnsLeft - 1 } : prev
    );
    setCurrentTurnIndex((prev) => prev + 1);
    setTurn('player');
    setClashInfo(null);
    setSelectedSkill(0);
    advanceTurn();
  };

  // ─── Passive auto‑select ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'fighting' || turn !== 'player') return;
    if (passiveActivating) return;
    if (!identityData) return;

    const autoPassive = identityData.autoSelectPassive;
    if (!autoPassive) return;
    if (Math.random() > autoPassive.probability) return;
    if (enemies.length === 0 || playerSkills.length === 0) return;

    setPassiveActivating(true);
    addLog(`⚔️ ${identityData.name} passive awakening!`);
    const randomIdx = Math.floor(Math.random() * playerSkills.length);
    setSelectedSkill(randomIdx);
    setTimeout(() => {
      if (phase === 'fighting' && turn === 'player') {
        setSelectedSkill(randomIdx);
        setTimeout(() => {
          setPassiveActivating(false);
          playerAct();
        }, 300);
      } else {
        setPassiveActivating(false);
      }
    }, 600);
  }, [phase, turn, enemies, passiveActivating, identityData, playerSkills]);

  // ─── Victory & auto‑start ──────────────────────────────────────────
  const handleVictory = () => {
    addThreads(50);
    onComplete();
  };

  const [autoStarted, setAutoStarted] = useState(false);
  useEffect(() => {
    if (forcedIdentity && phase === 'teamSelect' && teamMembers.length > 0 && !autoStarted) {
      setAutoStarted(true);
      setTimeout(startBattle, 100);
    }
  }, [forcedIdentity, phase, teamMembers.length, autoStarted]);

  const filteredAvailableIds = availableIdentities.filter((id) => !trialIdentities.includes(id));

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <div className="rounded border border-rose-500/20 bg-pgr-card/50 p-4">
        <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
          <div>
            <p className="text-xs text-rose-400 font-mono uppercase tracking-wider">
              {forcedIdentity ? '⬇️ PERSONAL CONFRONTATION' : '⬇️ SEFIROTH DESCENT'}
            </p>
            <p className="text-base sm:text-lg font-mono font-bold text-white">{chapterTitle}</p>
            {forcedIdentity && (
              <p className="text-xs text-amber-400 font-mono mt-1">
                ⚡ Forced Identity: {identityData?.name || '???'} – This is their battle alone.
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-pgr-dim">Active: {identityData?.name || '—'}</p>
            <div className="flex items-center gap-2 justify-end flex-wrap">
              <p
                className={`text-lg sm:text-xl font-mono font-bold ${
                  playerHp < 30 ? 'text-rose-400' : 'text-green-400'
                }`}
              >
                HP {playerHp}/{playerMaxHp}
              </p>
              {playerShield > 0 && (
                <span className="text-cyan-400 font-mono text-sm bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/30">
                  🛡 {playerShield}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 justify-end text-xs">
              <p className="text-pgr-dim">SP {spBar}/100</p>
              <p className="text-cyan-400 font-mono">ULT {Math.round(ultimateBar)}%</p>
            </div>
            {transformationActive && (
              <p className="text-amber-400 text-xs font-bold mt-1">
                ⭐ TRANSFORMED ({transformationTurnsLeft}t)
              </p>
            )}
            {!transformationActive &&
              identityData?.transformationTrigger === 'timer' &&
              transformationCountdown > 0 && (
                <p className="text-amber-400 text-xs mt-1">
                  Transformation in: {transformationCountdown} turns
                </p>
              )}
          </div>
        </div>
        <div className="space-y-1.5">
          {teamMembers.map((tm, i) => {
            const hp = memberHp[i] ?? 0,
              maxHp = memberMaxHp[i] ?? 100,
              sp = memberSp[i] ?? 0,
              ult = memberUltimate[i] ?? 0;
            const shield = memberShield[i] ?? 0,
              isActive = i === activeIdx,
              isDead = hp <= 0;
            return (
              <div
                key={i}
                className={`rounded border p-2 text-xs sm:text-sm ${
                  isActive ? 'border-cyan-400 bg-cyan-400/10' : 'border-pgr-border bg-pgr-darker/30'
                } ${isDead ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span>{tm.data.portrait}</span>
                  <span className="text-white font-medium truncate">{tm.data.name}</span>
                  {isActive && <span className="text-cyan-400">⭐</span>}
                  {isDead && <span className="text-rose-500 font-bold">💀 DOWN</span>}
                  <span className="ml-auto text-pgr-dim">
                    HP {hp}/{maxHp}
                  </span>
                  {shield > 0 && <span className="text-cyan-400">🛡 {shield}</span>}
                  <span className="text-cyan-400">SP {sp}</span>
                  <span className="text-amber-400">ULT {Math.round(ult)}%</span>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 h-1.5 bg-pgr-darker border border-pgr-border">
                    <div
                      className="h-full bg-rose-500 transition-all"
                      style={{ width: `${maxHp > 0 ? (hp / maxHp) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex-1 h-1.5 bg-pgr-darker border border-pgr-border">
                    <div className="h-full bg-cyan-500 transition-all" style={{ width: `${sp}%` }} />
                  </div>
                  <div className="flex-1 h-1.5 bg-pgr-darker border border-pgr-border">
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${ult}%` }} />
                  </div>
                </div>
                {shield > 0 && (
                  <div className="mt-0.5 h-1 bg-pgr-darker border border-pgr-border">
                    <div
                      className="h-full bg-cyan-400 transition-all"
                      style={{ width: `${Math.min(100, (shield / maxHp) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {phase === 'teamSelect' && !forcedIdentity && (
        <TeamSelector onReady={startBattle} availableIds={filteredAvailableIds} includeTrials={true} />
      )}

      {phase === 'teamSelect' && forcedIdentity && (
        <div className="rounded border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <p className="text-sm text-amber-300 font-mono">
            ⚡ This is {identityData?.name || 'the chosen identity'}'s personal trial.
          </p>
          <p className="text-xs text-pgr-dim mt-1">The battle will begin automatically.</p>
        </div>
      )}

      {phase === 'victory' && (
        <div className="rounded border border-green-500/20 bg-green-500/5 p-6 text-center">
          <span className="text-5xl">🏆</span>
          <h2 className="mt-3 text-2xl font-mono font-bold text-green-400">VICTORY!</h2>
          <p className="mt-2 text-pgr-dim">All enemies suppressed. +50 Threads earned!</p>
          <button
            onClick={handleVictory}
            className="mt-6 rounded border border-cyan-400 bg-cyan-400/10 px-8 py-3 font-mono font-semibold text-cyan-400 hover:bg-cyan-400 hover:text-pgr-dark transition-all"
          >
            CONTINUE STORY ▶
          </button>
        </div>
      )}
      {phase === 'defeat' && (
        <div className="rounded border border-rose-500/20 bg-rose-500/5 p-6 text-center">
          <span className="text-5xl">💔</span>
          <h2 className="mt-3 text-2xl font-mono font-bold text-rose-400">IDENTITY LOST</h2>
          <p className="mt-2 text-pgr-dim">Level up and try again!</p>
          <button
            onClick={onComplete}
            className="mt-6 rounded border border-pgr-border bg-pgr-darker/50 px-8 py-3 font-mono font-semibold text-pgr-dim hover:border-cyan-400 hover:text-cyan-400 transition-all"
          >
            RETREAT & CONTINUE ▶
          </button>
        </div>
      )}

      {phase === 'fighting' && (
        <>
          <div className="rounded border border-pgr-border bg-pgr-darker/30 p-2">
            <p className="text-xs text-pgr-dim mb-1">DEPLOYED TEAM</p>
            <div className="flex flex-wrap gap-2">
              {teamMembers.map((tm, i) => {
                const isActive = tm.data.id === identityData?.id;
                const ls = leaderSkills[tm.data.id];
                return (
                  <div
                    key={i}
                    className={`rounded border px-2 py-1 text-xs flex items-center gap-1 ${
                      isActive
                        ? 'border-cyan-400 bg-cyan-400/10'
                        : 'border-pgr-border bg-pgr-darker/30'
                    }`}
                  >
                    <span>{tm.data.portrait}</span>
                    <span className="text-white truncate">{tm.data.name}</span>
                    <span className="text-pgr-dim">Lv.{tm.owned.level}</span>
                    {isActive && <span className="text-cyan-400">⭐</span>}
                    {ls && (
                      <span
                        className="text-amber-400 text-[10px] cursor-help"
                        title={ls.buffEffect}
                      >
                        👑
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {identityData && leaderSkills[identityData.id] && (
              <div className="mt-2 rounded border border-amber-500/20 bg-amber-500/5 p-1.5 text-xs">
                <span className="text-amber-400 font-medium">
                  👑 {leaderSkills[identityData.id].name}:
                </span>
                <span className="text-pgr-dim ml-1">
                  {leaderSkills[identityData.id].buffEffect}
                </span>
              </div>
            )}
          </div>

          {identityData && (
            <div className="rounded border border-cyan-500/20 bg-cyan-500/5 p-2 flex flex-wrap items-center gap-2 text-xs">
              <span>{identityData.portrait}</span>
              <span className="text-white font-medium truncate">
                {identityData.name} - {identityData.title}
              </span>
              <span className="text-pgr-dim">
                ({DAMAGE_TYPE_INFO[playerDamageType]?.icon || '⚔️'} {playerDamageType})
                ATK {playerAtk} DEF {playerDef}
              </span>
              {weaponData && (
                <span className="text-emerald-400">
                  {weaponData.icon} {weaponData.name} (Lv.{weaponLevel})
                </span>
              )}
              {transformationActive && (
                <span className="text-amber-400 font-bold">⭐ TRANSFORMED</span>
              )}
            </div>
          )}
          {enemies.map((enemy, i) => (
            <div key={i} className="rounded border border-pgr-border bg-pgr-darker/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{enemy.portrait}</span>
                  <div>
                    <p className="font-mono font-semibold text-white truncate">{enemy.name}</p>
                    <p className="text-xs text-pgr-dim">
                      {DAMAGE_TYPE_INFO[enemy.damageType]?.icon || '⚔️'} {enemy.damageType} ·{' '}
                      {INFUSION_INFO[enemy.infusion]?.icon || '🗡️'} {enemy.infusion}
                      · Resists: {enemy.resistDamageType} / {enemy.resistInfusion}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-rose-400">
                    {enemy.hp}/{enemy.maxHp}
                  </p>
                  <div className="mt-1 h-1.5 w-24 bg-pgr-darker border border-pgr-border">
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {clashInfo && (
            <div
              className={`rounded border p-4 ${
                clashInfo.won
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-rose-500/20 bg-rose-500/5'
              }`}
            >
              <p className="text-center text-sm font-mono font-bold mb-2">
                {clashInfo.won ? '✅ CLASH WON!' : '❌ CLASH LOST!'} — {clashInfo.actorName}'s Turn
              </p>
              <div className="flex flex-wrap justify-between text-center gap-2">
                <div className="flex-1 min-w-[80px]">
                  <p className="text-xs text-green-400">{clashInfo.pName}</p>
                  <p className="text-xl font-mono font-bold text-white">{clashInfo.p}</p>
                </div>
                <span className="text-pgr-dim font-bold">VS</span>
                <div className="flex-1 min-w-[80px]">
                  <p className="text-xs text-rose-400">{clashInfo.eName}</p>
                  <p className="text-xl font-mono font-bold text-white">{clashInfo.e}</p>
                </div>
              </div>
              <p className="mt-1 text-center text-sm text-pgr-dim">
                {clashInfo.won
                  ? `You deal ${clashInfo.dmg} dmg (×${clashInfo.mult.toFixed(2)})`
                  : `Enemy deals ${clashInfo.dmg} dmg`}
              </p>
            </div>
          )}

          {turn === 'player' && (
            <div>
              <p className="text-sm font-mono font-semibold text-white mb-2">
                SELECT SKILL: <span className="text-xs text-pgr-dim">(EGO costs 100% Ultimate)</span>
                {ultimateBar < 100 && (
                  <span className="text-xs text-amber-400 ml-2">ULT {Math.round(ultimateBar)}%</span>
                )}
                {!transformationActive &&
                  identityData?.transformationTrigger === 'timer' &&
                  transformationCountdown > 0 && (
                    <span className="text-xs text-amber-400 ml-2">⏱ {transformationCountdown}t</span>
                  )}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {playerSkills.map((skill, i) => {
                  const isEgo = skill.type === 'ego';
                  const canUse = !isEgo || ultimateBar >= 100;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedSkill(i)}
                      disabled={!canUse}
                      className={`rounded border p-2 text-left text-xs transition-all ${
                        selectedSkill === i
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-pgr-border bg-pgr-darker/50'
                      } ${!canUse ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`text-xs px-1 py-0.5 rounded ${
                          isEgo
                            ? 'border border-amber-500/30 text-amber-400'
                            : 'border border-pgr-border text-pgr-dim'
                        }`}
                      >
                        {isEgo ? 'EGO (ULT)' : 'NORM'}
                      </span>
                      <p className="font-mono font-semibold text-white mt-1 truncate">
                        {skill.name}
                      </p>
                      <p className="text-pgr-dim text-[10px] sm:text-xs">
                        P:{skill.power} C:{skill.coins} · Lv.{skill.skillLevel} (+
                        {((skill.dmgMult - 1) * 100).toFixed(3)}%)
                      </p>
                      {skill.damageType && (
                        <span className="text-[10px] text-pgr-dim">
                          {DAMAGE_TYPE_INFO[skill.damageType]?.icon || ''} {skill.damageType}
                          {skill.infusion &&
                            ` · ${INFUSION_INFO[skill.infusion]?.icon || ''} ${skill.infusion}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={playerAct}
                className="w-full rounded border border-cyan-400 bg-cyan-400/10 py-3 font-mono font-bold text-cyan-400 hover:bg-cyan-400 hover:text-pgr-dark transition-all"
              >
                ⚡ CLASH!
              </button>
            </div>
          )}
          {turn === 'clashResult' && (
            <button
              onClick={afterClash}
              className="w-full rounded border border-amber-400 bg-amber-400/10 py-3 font-mono font-bold text-amber-400 hover:bg-amber-400 hover:text-pgr-dark transition-all"
            >
              CONTINUE ▶ (+10 SP)
            </button>
          )}
        </>
      )}

      <div className="rounded border border-pgr-border bg-pgr-card/60 p-4">
        <h3 className="text-xs font-mono font-semibold text-pgr-dim mb-2">COMBAT LOG</h3>
        <div className="max-h-32 overflow-y-auto rounded border border-pgr-border bg-pgr-darker/50 p-3 font-mono text-xs space-y-0.5">
          {log.map((l, i) => (
            <p key={i} className="text-pgr-dim/70 break-words">
              {l}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

import { identities, scaledStats, skillDmgMult, leaderSkills, type Identity, type OwnedIdentity } from '../data/identities';
import { weapons, type Weapon } from '../data/weapons';

/* ── Types ── */

export interface Enemy {
  name: string; hp: number; maxHp: number; atk: number; def: number; spd: number;
  element: string; resist: string;
  skills: { name: string; power: number; coins: number }[];
  portrait: string;
}

export interface ResolvedSkill {
  name: string; power: number; coins: number; type: string; dmgMult: number; skillLevel: number;
}

export interface TeamMember {
  owned: OwnedIdentity;
  data: Identity;
}

export interface LeaderBuff {
  atkMult: number;  // e.g. 1.18 means +18% ATK
  defMult: number;  // e.g. 1.15 means +15% DEF
  dmgMult: number;  // e.g. 1.20 means +20% outgoing damage
  healMult: number;  // e.g. 1.25 means +25% healing received
  shieldMult: number; // e.g. 1.25 means +25% shield strength
  spdFlat: number;   // e.g. 5 means +5 SPD
  active: boolean;   // true if any leader skill is active
  name: string;
  description: string;
}

export interface ActiveLoadout {
  member: TeamMember;
  weapon: { data: Weapon; level: number } | null;
  stats: { hp: number; atk: number; def: number; spd: number };
  baseAtk: number;
  totalAtk: number;  // baseAtk * leaderBuff.atkMult
  totalDef: number;  // stats.def * leaderBuff.defMult
  skills: ResolvedSkill[];
  element: string;
  leaderBuffs: LeaderBuff;
}

/* ── Element System ── */

export const ELEMENT_EMOJI: Record<string, string> = {
  Void: '🌑', Light: '☀️', Dark: '🌘', Chaos: '🪷',
  Fire: '🔥', Water: '🌊', Physical: '🔒', Spectro: '🪦',
};

const ELEMENT_ORDER = ['Void', 'Dark', 'Light', 'Chaos', 'Fire', 'Water', 'Physical', 'Spectro'];

export function calcElementMult(attackerEl: string, defenderResist: string, defenderEl: string): number {
  if (attackerEl === defenderResist) return 0.5;
  const ai = ELEMENT_ORDER.indexOf(attackerEl);
  const di = ELEMENT_ORDER.indexOf(defenderEl);
  if (ai >= 0 && di >= 0 && (ai + 1) % ELEMENT_ORDER.length === di) return 1.5;
  return 1.0;
}

/* ── Clash & Damage ── */

export function rollCoin(power: number): number {
  return Math.random() < 0.5 ? power : 1;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function resolveClash(pPower: number, ePower: number, pCoins: number, eCoins: number) {
  let pt = rollCoin(pPower), et = rollCoin(ePower);
  for (let i = 1; i < Math.max(pCoins, eCoins); i++) {
    if (i < pCoins) pt += rollCoin(pPower);
    if (i < eCoins) et += rollCoin(ePower);
  }
  return { playerTotal: pt, enemyTotal: et };
}

export function calcPlayerDmg(atk: number, def: number, roll: number, elMult: number, skillMult: number, leaderDmgMult: number = 1): number {
  return Math.floor(Math.max(1, (atk * (roll / 10)) - def) * elMult * skillMult * leaderDmgMult * (0.85 + Math.random() * 0.3));
}

export function calcEnemyDmg(atk: number, def: number, roll: number): number {
  return Math.floor(Math.max(1, (atk * (roll / 10)) - def) * (0.85 + Math.random() * 0.3));
}

export function applyDamage(hp: number, shield: number, dmg: number): { hp: number; shield: number } {
  const absorbed = Math.min(shield, dmg);
  return { hp: Math.max(0, hp - (dmg - absorbed)), shield: Math.max(0, shield - absorbed) };
}

/* ── Leader Skill Resolution ── */

const NO_LEADER_BUFF: LeaderBuff = { atkMult: 1, defMult: 1, dmgMult: 1, healMult: 1, shieldMult: 1, spdFlat: 0, active: false, name: '', description: '' };

/**
 * Compute the stat buffs granted by the team leader.
 * leaderIdentity — the Identity data for the leader
 * activeIdentity — the Identity data for the currently-acting member (may be the leader themselves)
 */
export function resolveLeaderBuffs(
  leaderIdentity: Identity | undefined,
  activeIdentity: Identity | undefined,
): LeaderBuff {
  if (!leaderIdentity || !activeIdentity) return NO_LEADER_BUFF;
  const ls = leaderSkills[leaderIdentity.id];
  if (!ls) return NO_LEADER_BUFF;

  const b: LeaderBuff = { atkMult: 1, defMult: 1, dmgMult: 1, healMult: 1, shieldMult: 1, spdFlat: 0, active: true, name: ls.name, description: ls.buffEffect };
  const leaderEl = leaderIdentity.element;
  const activeEl = activeIdentity.element;
  const activeFaction = activeIdentity.faction;
  const id = leaderIdentity.id;

  // ── Rover Eclipse: +18% ATK for Void/Dark allies, leader always gets it ──
  if (id === 'rover_eclipse') {
    if (activeEl === 'Void' || activeEl === 'Dark' || id === activeIdentity.id) b.atkMult = 1.18;
  }
  // ── Rover Dawnbreaker: +20% ATK for Light allies ──
  else if (id === 'rover_dawnbreaker') {
    if (activeEl === 'Light' || id === activeIdentity.id) b.atkMult = 1.20;
  }
  // ── Apollyon: +20% DMG to debuffed enemies for Dark allies ──
  else if (id === 'apollyon_abyss') {
    if (activeEl === 'Dark' || id === activeIdentity.id) { b.atkMult = 1.12; b.dmgMult = 1.10; }
  }
  // ── Lotus Qliphoth: +15% ATK for Chaos allies ──
  else if (id === 'lotus_qlippoth') {
    if (activeEl === 'Chaos' || id === activeIdentity.id) b.atkMult = 1.15;
  }
  // ── Lotus White Night: +15% ATK for Light, +25% healing ──
  else if (id === 'lotus_white_night') {
    if (activeEl === 'Light' || id === activeIdentity.id) { b.atkMult = 1.15; b.healMult = 1.25; }
  }
  // ── Verg: +12% ATK all, +15% extra above 75% HP (simplified as flat +27%) ──
  else if (id === 'verg_dark_slayer') {
    b.atkMult = 1.12;
    if (id === activeIdentity.id) b.atkMult = 1.27; // leader benefits more
  }
  // ── Sparda: +15% DEF & +10% ATK all, ×2 for Dark ──
  else if (id === 'sparda_legendary') {
    if (activeEl === 'Dark') { b.atkMult = 1.20; b.defMult = 1.30; }
    else { b.atkMult = 1.10; b.defMult = 1.15; }
  }
  // ── Rin: +18% ATK for Fire allies ──
  else if (id === 'rin_devil_hunter') {
    if (activeEl === 'Fire' || id === activeIdentity.id) b.atkMult = 1.18;
  }
  // ── Butterfly: +20% ATK for Void allies ──
  else if (id === 'butterfly_funeral') {
    if (activeEl === 'Void' || id === activeIdentity.id) b.atkMult = 1.20;
  }
  // ── Miastro: +15% ATK for Light, +15% skill effect ──
  else if (id === 'miastro_conductor') {
    if (activeEl === 'Light' || id === activeIdentity.id) { b.atkMult = 1.15; b.dmgMult = 1.15; }
  }
  // ── Don Papa: +20% ATK for Fire allies ──
  else if (id === 'don_papa') {
    if (activeEl === 'Fire' || id === activeIdentity.id) b.atkMult = 1.20;
  }
  // ── Aemeath: +22% ATK for Spectro allies ──
  else if (id === 'aemeath_sentinel') {
    if (activeEl === 'Spectro' || id === activeIdentity.id) b.atkMult = 1.22;
  }
  // ── Shorekeeper: +15% ATK for Water, +25% heal/shield ──
  else if (id === 'shorekeeper_tide') {
    if (activeEl === 'Water' || id === activeIdentity.id) { b.atkMult = 1.15; b.healMult = 1.25; b.shieldMult = 1.25; }
  }
  // ── SR Identities ──
  else if (id === 'q_security_alpha') {
    if (activeEl === 'Physical' || id === activeIdentity.id) { b.atkMult = 1.10; b.defMult = 1.08; }
  }
  else if (id === 'q_operative_beta') {
    if (activeEl === 'Fire' || id === activeIdentity.id) { b.atkMult = 1.12; b.spdFlat = 5; }
  }
  else if (id === 'rover_initiate') {
    if (activeEl === 'Void' || id === activeIdentity.id) b.atkMult = 1.10;
  }
  else if (id === 'apollyon_warden') {
    if (activeEl === 'Dark' || id === activeIdentity.id) b.atkMult = 1.10;
  }
  else if (id === 'lotus_acolyte') {
    if (activeEl === 'Chaos' || id === activeIdentity.id) b.atkMult = 1.10;
  }
  else if (id === 'cyan_analyst') {
    if (activeEl === 'Light' || id === activeIdentity.id) b.atkMult = 1.10;
  }

  return b;
}

/* ── Resolution Helpers ── */

export function resolveTeam(team: string[], ownedIdentities: OwnedIdentity[]): TeamMember[] {
  return team
    .map(id => {
      const owned = ownedIdentities.find(o => o.identityId === id);
      const data = identities.find(i => i.id === id);
      return owned && data ? { owned, data } : null;
    })
    .filter((t): t is TeamMember => t !== null);
}

export function resolveWeapon(identityId: string, ownedWeapons: { weaponId: string; level: number }[]): { data: Weapon; level: number } | null {
  const sig = weapons.find(w => w.signatureFor === identityId);
  if (sig) { const ow = ownedWeapons.find(o => o.weaponId === sig.id); if (ow) return { data: sig, level: ow.level }; }
  const fallback = weapons.find(w => w.fallbackFor === identityId);
  if (fallback) { const ow = ownedWeapons.find(o => o.weaponId === fallback.id); if (ow) return { data: fallback, level: ow.level }; }
  if (sig) {
    const ow = ownedWeapons.find(o => { const w = weapons.find(x => x.id === o.weaponId); return !!w && w.rarity === 'SR' && w.type === sig.type; });
    if (ow) return { data: weapons.find(w => w.id === ow.weaponId)!, level: ow.level };
  }
  return null;
}

export function resolveSkills(identity: Identity, owned: OwnedIdentity | undefined): ResolvedSkill[] {
  return identity.skills.filter(s => s.type !== 'class').map(skill => {
    const idx = identity.skills.indexOf(skill);
    const sl = owned?.skillLevels?.[idx] ?? 1;
    return {
      name: skill.name,
      power: skill.basePower + skill.powerGrowth * (sl - 1),
      coins: skill.coinGrowth > 0 ? skill.baseCoins + Math.floor((sl - 1) / skill.coinGrowth) : skill.baseCoins,
      type: skill.type,
      dmgMult: skillDmgMult(skill.type, sl),
      skillLevel: sl,
    };
  });
}

export function getActiveLoadout(
  teamMembers: TeamMember[],
  turnIndex: number,
  ownedWeapons: { weaponId: string; level: number }[],
  leaderIndex: number = 0,
): ActiveLoadout | null {
  const idx = turnIndex % Math.max(1, teamMembers.length);
  const member = teamMembers[idx];
  if (!member) return null;

  const weapon = resolveWeapon(member.data.id, ownedWeapons);
  const rawStats = scaledStats(member.data, member.owned.level, member.owned.classSkillLevel ?? 1);
  const baseAtk = rawStats.atk + (weapon?.data.baseStats.atk || 0);

  // Leader buff from team leader (may be the same member)
  const leaderMember = teamMembers[leaderIndex];
  const leaderBuffs = resolveLeaderBuffs(leaderMember?.data, member.data);

  const buffedAtk = Math.floor(baseAtk * leaderBuffs.atkMult);
  const buffedDef = Math.floor(rawStats.def * leaderBuffs.defMult);
  const buffedHp = Math.floor(rawStats.hp * (leaderBuffs.shieldMult > 1 ? 1 : 1)); // HP unchanged, shield mult is separate
  const buffedSpd = rawStats.spd + leaderBuffs.spdFlat;

  return {
    member,
    weapon,
    stats: { hp: rawStats.hp, atk: buffedAtk, def: buffedDef, spd: buffedSpd },
    baseAtk,
    totalAtk: buffedAtk,
    totalDef: buffedDef,
    skills: resolveSkills(member.data, member.owned),
    element: member.data.element,
    leaderBuffs,
  };
}

export function calcMaxHp(hpStat: number): number {
  return Math.max(50, Math.min(200, Math.floor(hpStat / 32)));
}
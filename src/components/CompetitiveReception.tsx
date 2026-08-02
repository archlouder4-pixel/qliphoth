// CompetitiveReception.tsx – Data-driven, uses damage types & infusions, no hardcoded identity checks
// WebSocket version: connects to VITE_SERVER_URL/room/reception/match
import { useState, useEffect, useRef } from 'react';
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
  type ClassCategory,
  DAMAGE_TYPE_INFO,
  INFUSION_INFO,
  DAMAGE_DEBUFFS,
  INFUSION_DEBUFFS,
  damageTypeMult,
  infusionMult,
  convertElement,
  getElementInfo,
  getInfusionInfo,
} from '../data/identities';
import {
  buildTransformedSkills,
  checkTransformationTrigger,
  applyTransformationPassive,
  getTransformationInfo,
  type TransformedSkill,
} from '../data/identitiesPassives';
import { CR_REGIONS, SQUAD_INFO, getCurrentWeek, getWeekRange, getWeeklyZones, getSquadByPoints, type ZoneElement, type Squad, generateBracket, generatePointsRanking } from '../data/competitive';
import { useAuth } from '../auth/AuthContext';
import { weapons, canEquipWeapon } from '../data/weapons';
import { egoGifts } from '../data/egoGifts';
import { getDisplayName } from '../auth/discord';
import TeamSelector from './TeamSelector';
import { setPlayerRegion, submitScore, fetchBracket, fetchRanking, type RemotePlayerEntry, type RemoteRankingEntry } from '../api/competitiveApi';

// ─── Constants ──────────────────────────────────────────────────────────
const MAX_CLASH_POWER = 50;
const ULTIMATE_GAIN_MIN = 0.003;
const ULTIMATE_GAIN_MAX = 0.03;
const BOSS_BONUS_TIME = 3;
const BOSS_SCORE_BONUS = 5000;
const WS_RECONNECT_DELAY = 3000; // ms

// ─── Types ──────────────────────────────────────────────────────────────
interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  damageType: string;   // 'Red' | 'Pale' | 'Black' | 'White'
  infusion: string;     // 'Slash' | 'Pierce' | 'Blunt'
  resistDamageType: string;
  resistInfusion: string;
  skills: { name: string; power: number; coins: number; damageType?: string; infusion?: string }[];
  portrait: string;
  dullStacks: number;
  isBoss?: boolean;
  bossMechanic?: BossMechanic;
  bossMechanicState?: Record<string, any>;
}

interface BossMechanic {
  id: string; name: string; icon: string; description: string; wave: number;
  onPlayerClashWin?: (enemy: Enemy, player: any, dmg: number) => number;
  onPlayerClashLose?: (enemy: Enemy, player: any, dmg: number) => number;
  onEnemyTurnStart?: (enemy: Enemy) => void;
  onPlayerTurnStart?: (enemy: Enemy, player: any) => void;
  onHit?: (enemy: Enemy, dmg: number, isEgo: boolean) => number;
  getDisplayStatus?: (enemy: Enemy) => string;
}

// ─── Boss mechanics ──────────────────────────────────────────────────
const BOSS_MECHANICS: Record<string, BossMechanic> = {
  'verg_dark_slayer': {
    id: 'motivation_surge',
    name: 'Motivation Surge',
    icon: '🔥',
    description: 'Deals +10% damage per 20% HP missing (max +40%).',
    wave: 5,
    onPlayerClashLose: (enemy, player, dmg) => {
      const hpPct = enemy.hp / enemy.maxHp;
      const bonus = Math.floor((1 - hpPct) / 0.2) * 0.10;
      return Math.floor(dmg * (1 + Math.min(bonus, 0.40)));
    },
    getDisplayStatus: (enemy) => {
      const hpPct = enemy.hp / enemy.maxHp;
      const bonus = Math.floor((1 - hpPct) / 0.2) * 10;
      return `+${Math.min(bonus, 40)}% DMG`;
    }
  },
  'rin_devil_hunter': {
    id: 'stylish_combo',
    name: 'Stylish Combo',
    icon: '🍕',
    description: 'Gains +8% ATK per consecutive hit on same target (max 40%). Resets when target changes.',
    wave: 10,
    onPlayerClashLose: (enemy, player, dmg) => {
      const state = enemy.bossMechanicState || { combo: 0 };
      state.combo = Math.min(5, (state.combo || 0) + 1);
      enemy.bossMechanicState = state;
      const bonus = (state.combo || 0) * 0.08;
      return Math.floor(dmg * (1 + Math.min(bonus, 0.40)));
    },
    getDisplayStatus: (enemy) => {
      const state = enemy.bossMechanicState || { combo: 0 };
      const bonus = Math.min((state.combo || 0) * 8, 40);
      return `🔥 Combo: +${bonus}% DMG`;
    }
  },
  'sparda_legendary': {
    id: 'legendary_aegis',
    name: 'Legendary Aegis',
    icon: '👹',
    description: 'Gains 1 Legend stack per turn (max 5). Each stack grants +5% DEF and +3% ATK.',
    wave: 15,
    onEnemyTurnStart: (enemy) => {
      const state = enemy.bossMechanicState || { legendStacks: 0 };
      state.legendStacks = Math.min(5, (state.legendStacks || 0) + 1);
      enemy.bossMechanicState = state;
    },
    onPlayerClashWin: (enemy, player, dmg) => {
      const state = enemy.bossMechanicState || { legendStacks: 0 };
      const defBonus = (state.legendStacks || 0) * 0.05;
      return Math.floor(dmg * (1 - Math.min(defBonus, 0.25)));
    },
    onPlayerClashLose: (enemy, player, dmg) => {
      const state = enemy.bossMechanicState || { legendStacks: 0 };
      const atkBonus = (state.legendStacks || 0) * 0.03;
      return Math.floor(dmg * (1 + Math.min(atkBonus, 0.15)));
    },
    getDisplayStatus: (enemy) => {
      const state = enemy.bossMechanicState || { legendStacks: 0 };
      const stacks = state.legendStacks || 0;
      return `👑 Legend: ${stacks}/5 (+${stacks * 3}% ATK, +${stacks * 5}% DEF)`;
    }
  },
  'xenon_chaos': {
    id: 'primordial_entropy',
    name: 'Primordial Entropy',
    icon: '🌀',
    description: 'At start of turn, applies random debuff (ATK-15%, DEF-15%, or SPD-20%). Stacks up to 3.',
    wave: 20,
    onEnemyTurnStart: (enemy) => {
      const state = enemy.bossMechanicState || { debuffs: [] };
      const debuffs = ['ATK-15%', 'DEF-15%', 'SPD-20%'];
      const debuff = debuffs[Math.floor(Math.random() * debuffs.length)];
      state.debuffs.push(debuff);
      if (state.debuffs.length > 3) state.debuffs.shift();
      enemy.bossMechanicState = state;
    },
    getDisplayStatus: (enemy) => {
      const state = enemy.bossMechanicState || { debuffs: [] };
      return `🌀 ${state.debuffs.join(', ') || 'No debuffs'}`;
    }
  },
};

function isBossWave(wave: number): boolean {
  return [5, 10, 15, 20].includes(wave);
}

// ─── Enemy generation ─────────────────────────────────────────────────────
function createEnemyFromIdentity(
  identityId: string,
  playerAtk: number,
  playerDef: number,
  playerMaxHp: number,
  hpMultiplier: number = 1.5,
  atkMultiplier: number = 0.85,
  defMultiplier: number = 1.4,
  spdMultiplier: number = 1.0,
  additionalSkills: { name: string; power: number; coins: number; damageType?: string; infusion?: string }[] = []
): Enemy | null {
  const identity = identities.find(i => i.id === identityId);
  if (!identity) return null;
  const s = 0.85 + (identity.levelCap || 65) * 0.12;
  const hpS = Math.floor(playerMaxHp * s * hpMultiplier);
  const atkS = Math.floor(playerAtk * s * atkMultiplier);
  const defS = Math.floor(playerDef * s * defMultiplier);
  const spdS = Math.floor(60 + (identity.levelCap || 65) * 0.5 * spdMultiplier);

  const skills = identity.skills
    .filter(s => s.type !== 'class')
    .map(s => ({
      name: s.name,
      power: s.basePower + s.powerGrowth * 14,
      coins: s.coinGrowth > 0 ? s.baseCoins + Math.floor(14 / s.coinGrowth) : s.baseCoins,
      damageType: s.damageType || identity.element,
      infusion: s.infusion || identity.baseInfusion || 'Slash',
    }));

  for (const extra of additionalSkills) {
    skills.push(extra);
  }

  return {
    name: identity.name,
    hp: hpS,
    maxHp: hpS,
    atk: atkS,
    def: defS,
    spd: spdS,
    damageType: identity.element,
    infusion: identity.baseInfusion || 'Slash',
    resistDamageType: identity.element,
    resistInfusion: identity.baseInfusion || 'Slash',
    skills: skills.slice(0, 4),
    portrait: identity.portrait,
    dullStacks: 0,
    isBoss: true,
  };
}

function generateBossEnemy(
  wave: number,
  playerAtk: number,
  playerDef: number,
  playerMaxHp: number,
  zoneDamageType?: string,
  zoneInfusion?: string,
  useShadow: boolean = false
): Enemy | null {
  const bossMap: Record<number, string> = {
    5: 'verg_dark_slayer',
    10: 'rin_devil_hunter',
    15: 'sparda_legendary',
    20: 'xenon_chaos',
  };
  const identityId = bossMap[wave] || 'verg_dark_slayer';

  const enemy = createEnemyFromIdentity(
    identityId,
    playerAtk,
    playerDef,
    playerMaxHp,
    2.5,
    1.6,
    1.8,
    1.2,
    []
  );
  if (!enemy) return null;

  const mechanic = BOSS_MECHANICS[identityId];
  if (mechanic) {
    enemy.bossMechanic = mechanic;
    enemy.bossMechanicState = {};
  }

  if (useShadow) {
    enemy.atk = Math.floor(enemy.atk * 1.15);
    enemy.spd = Math.floor(enemy.spd * 1.15);
    enemy.name = `Shadow ${enemy.name}`;
    enemy.portrait = '🌑';
    if (enemy.bossMechanic) {
      enemy.bossMechanic.description += ' (Shadow Clone)';
    }
  }

  if (zoneDamageType) {
    enemy.resistDamageType = zoneDamageType;
  }
  if (zoneInfusion) {
    enemy.resistInfusion = zoneInfusion;
  }

  return enemy;
}

function generateEnemy(
  wave: number,
  playerAtk: number,
  playerDef: number,
  playerMaxHp: number,
  zoneDamageType?: string,
  zoneInfusion?: string
): Enemy {
  const safeMaxHp = (typeof playerMaxHp === 'number' && playerMaxHp > 0) ? playerMaxHp : 1000;
  const safeAtk = (typeof playerAtk === 'number' && playerAtk > 0) ? playerAtk : 50;
  const safeDef = (typeof playerDef === 'number' && playerDef > 0) ? playerDef : 30;

  const scale = 0.85 + wave * 0.12;
  const baseHp = Math.floor(safeMaxHp * scale * 1.5);
  const baseAtk = Math.floor(safeAtk * scale * 0.85);
  const baseDef = Math.floor(safeDef * scale * 1.4);
  const baseSpd = 60 + wave * 10;

  const allDmgTypes = ['Red', 'Pale', 'Black', 'White'];
  const allInfusions = ['Slash', 'Pierce', 'Blunt'];
  const dmgType = zoneDamageType || allDmgTypes[wave % allDmgTypes.length];
  const infusion = zoneInfusion || allInfusions[(wave + 1) % allInfusions.length];

  const resistDamageType = allDmgTypes[(allDmgTypes.indexOf(dmgType) + 2) % allDmgTypes.length];
  const resistInfusion = allInfusions[(allInfusions.indexOf(infusion) + 2) % allInfusions.length];

  const types = ['Q-Security', 'Qliphoth Spawn', 'Corrupted Unit', 'Abyssal Shade', 'Tree Warden'];
  const name = types[Math.floor(Math.random() * types.length)];
  const porta = ['🔒', '👾', '💀', '🌑', '🌿'];

  return {
    name: `${name} W${wave}`,
    hp: baseHp,
    maxHp: baseHp,
    atk: baseAtk,
    def: baseDef,
    spd: baseSpd,
    damageType: dmgType,
    infusion: infusion,
    resistDamageType,
    resistInfusion,
    skills: [
      { name: 'Strike', power: 3 + wave * 2, coins: 1, damageType: dmgType, infusion: infusion },
      { name: 'Heavy Blow', power: 5 + wave * 2, coins: 2, damageType: dmgType, infusion: infusion },
      { name: 'Desperation', power: 8 + wave * 3, coins: 1, damageType: dmgType, infusion: infusion },
    ],
    portrait: porta[Math.floor(Math.random() * porta.length)],
    dullStacks: 0,
    isBoss: false,
  };
}

// ─── Combat helpers ──────────────────────────────────────────────────
function rollCoin(power: number): number { return Math.random() < 0.5 ? power : 1; }

function clash(pP: number, eP: number, pC: number, eC: number) {
  let pt = rollCoin(pP), et = rollCoin(eP);
  for (let i = 1; i < Math.max(pC, eC); i++) {
    if (i < pC) pt += rollCoin(pP);
    if (i < eC) et += rollCoin(eP);
  }
  return { playerTotal: pt, enemyTotal: et };
}

function calculatePlayerPercentDamage(
  playerTotal: number,
  enemyTotal: number,
  enemyMaxHp: number,
  mult: number,
  skillDmgMult: number,
  classMult: number,
  tankBonus: number
): number {
  const diff = playerTotal - enemyTotal;
  const basePercent = 0.005 + 0.0015 * diff;
  let finalPercent = basePercent * mult * skillDmgMult * classMult * tankBonus;
  finalPercent *= (0.85 + Math.random() * 0.3);
  const damage = Math.floor(finalPercent * enemyMaxHp);
  return Math.max(1, damage);
}

function calculateEnemyPercentDamage(
  enemyTotal: number,
  playerTotal: number,
  playerMaxHp: number,
  mult: number = 1.0
): number {
  const diff = enemyTotal - playerTotal;
  if (diff <= 0) return 0;
  const basePercent = 0.005 + 0.0015 * diff;
  let finalPercent = basePercent * mult;
  finalPercent *= (0.85 + Math.random() * 0.3);
  finalPercent = Math.min(finalPercent, 0.15);
  return Math.floor(finalPercent * playerMaxHp);
}

// ─── Debuff application ──────────────────────────────────────────────
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

// ─── PGR WARZONE STYLE CONSTANTS ─────────────────────────────────────
const PGR_STYLES = {
  bgPrimary: 'bg-[#070a14]',
  bgSecondary: 'bg-[#0c1020]',
  bgPanel: 'bg-[#0f1525]/90',
  bgPanelHover: 'bg-[#131a2e]/90',
  bgAccent: 'bg-[#00d4ff]/10',
  bgDanger: 'bg-[#ff2a6d]/10',
  bgSuccess: 'bg-[#05ffa1]/10',
  bgWarning: 'bg-[#ff9e00]/10',
  borderPrimary: 'border-[#1a2332]',
  borderAccent: 'border-[#00d4ff]/40',
  borderAccentGlow: 'border-[#00d4ff]/60',
  borderDanger: 'border-[#ff2a6d]/40',
  borderSuccess: 'border-[#05ffa1]/40',
  borderWarning: 'border-[#ff9e00]/40',
  textPrimary: 'text-white',
  textSecondary: 'text-[#8b9bb4]',
  textAccent: 'text-[#00d4ff]',
  textDanger: 'text-[#ff2a6d]',
  textSuccess: 'text-[#05ffa1]',
  textWarning: 'text-[#ff9e00]',
  textMuted: 'text-[#4a5568]',
  glowAccent: 'shadow-[0_0_15px_rgba(0,212,255,0.3)]',
  glowDanger: 'shadow-[0_0_15px_rgba(255,42,109,0.3)]',
  glowSuccess: 'shadow-[0_0_15px_rgba(5,255,161,0.3)]',
  btnPrimary: 'bg-[#00d4ff]/20 border border-[#00d4ff]/50 text-[#00d4ff] hover:bg-[#00d4ff]/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-200',
  btnDanger: 'bg-[#ff2a6d]/20 border border-[#ff2a6d]/50 text-[#ff2a6d] hover:bg-[#ff2a6d]/30 hover:shadow-[0_0_20px_rgba(255,42,109,0.4)] transition-all duration-200',
  btnSuccess: 'bg-[#05ffa1]/20 border border-[#05ffa1]/50 text-[#05ffa1] hover:bg-[#05ffa1]/30 hover:shadow-[0_0_20px_rgba(5,255,161,0.4)] transition-all duration-200',
  btnWarning: 'bg-[#ff9e00]/20 border border-[#ff9e00]/50 text-[#ff9e00] hover:bg-[#ff9e00]/30 hover:shadow-[0_0_20px_rgba(255,158,0,0.4)] transition-all duration-200',
  btnNeutral: 'bg-[#1a2332] border border-[#2a3a4a] text-[#8b9bb4] hover:bg-[#1e2a3a] hover:border-[#3a4a5a] transition-all duration-200',
  panel: 'bg-[#0c1020]/95 border border-[#1a2332] backdrop-blur-sm',
  panelAccent: 'bg-[#0c1020]/95 border border-[#00d4ff]/30 backdrop-blur-sm',
  panelDanger: 'bg-[#0c1020]/95 border border-[#ff2a6d]/30 backdrop-blur-sm',
  progressBg: 'bg-[#1a2332]',
  progressFill: 'bg-[#00d4ff]',
  progressFillDanger: 'bg-[#ff2a6d]',
  progressFillSuccess: 'bg-[#05ffa1]',
  progressFillWarning: 'bg-[#ff9e00]',
};

// ─── Tactical UI Components ─────────────────────────────────────────
function TacticalPanel({ children, className = '', variant = 'default', header, headerRight, glow = false }: any) {
  const variantStyles = {
    default: PGR_STYLES.panel,
    accent: PGR_STYLES.panelAccent,
    danger: PGR_STYLES.panelDanger,
    success: `${PGR_STYLES.panel} border-[#05ffa1]/30`,
    warning: `${PGR_STYLES.panel} border-[#ff9e00]/30`,
  };
  return (
    <div className={`${variantStyles[variant]} ${glow ? PGR_STYLES.glowAccent : ''} ${className}`}
         style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}>
      {(header || headerRight) && (
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[#1a2332]/60">
          {header && <div className="text-xs font-bold tracking-widest uppercase text-[#8b9bb4]">{header}</div>}
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

function TacticalButton({ children, onClick, variant = 'primary', disabled = false, className = '', size = 'md' }: any) {
  const variantMap = {
    primary: PGR_STYLES.btnPrimary,
    danger: PGR_STYLES.btnDanger,
    success: PGR_STYLES.btnSuccess,
    warning: PGR_STYLES.btnWarning,
    neutral: PGR_STYLES.btnNeutral,
  };
  const sizeMap = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base font-bold' };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${variantMap[variant]} ${sizeMap[size]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
      {children}
    </button>
  );
}

function TacticalStat({ label, value, unit = '', color = 'accent', size = 'md' }: any) {
  const colorMap = { accent: 'text-[#00d4ff]', danger: 'text-[#ff2a6d]', success: 'text-[#05ffa1]', warning: 'text-[#ff9e00]', neutral: 'text-[#8b9bb4]' };
  const sizeMap = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-widest text-[#4a5568] mb-1">{label}</p>
      <p className={`${colorMap[color]} ${sizeMap[size]} font-bold font-mono`}>{value}<span className="text-sm ml-0.5">{unit}</span></p>
    </div>
  );
}

function TacticalProgress({ value, max, color = 'accent', label, showPercent = true, height = 'h-2' }: any) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const colorMap = { accent: 'bg-[#00d4ff]', danger: 'bg-[#ff2a6d]', success: 'bg-[#05ffa1]', warning: 'bg-[#ff9e00]' };
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-[10px] uppercase tracking-wider text-[#4a5568] mb-1">
        <span>{label}</span>{showPercent && <span className="font-mono">{Math.round(pct)}%</span>}
      </div>}
      <div className={`w-full ${PGR_STYLES.progressBg} ${height} relative overflow-hidden`}
           style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
        <div className={`${colorMap[color]} ${height} transition-all duration-500`}
             style={{ width: `${pct}%`, boxShadow: `0 0 10px ${color === 'accent' ? 'rgba(0,212,255,0.5)' : color === 'danger' ? 'rgba(255,42,109,0.5)' : color === 'success' ? 'rgba(5,255,161,0.5)' : 'rgba(255,158,0,0.5)'}` }} />
      </div>
    </div>
  );
}

function TacticalDivider() {
  return <div className="flex items-center gap-2 my-3"><div className="flex-1 h-px bg-[#1a2332]" /><div className="w-1.5 h-1.5 bg-[#00d4ff]/50 rotate-45" /><div className="flex-1 h-px bg-[#1a2332]" /></div>;
}

// ─── Main Component ──────────────────────────────────────────────────
export default function CompetitiveReception() {
  const { competitiveScore, addManagerExp, ownedIdentities, ownedWeapons, team, setTeam, recordEnemyDefeats,
          crRegion, crRegionLocked, crZoneScores, crCompletedZones, crMerit, crReputation, crSquad,
          setCRRegion, submitZoneScore, ensureWeeklyReset, promoteSquad, consumeReputation, addThreads,
          specialDebuffActive, toggleSpecialDebuff, getTotalGiftStats, trialIdentities, completedChapters,
          addHarmonizationSigils, addEclipseResonanceMaterials, setEquippedWeapon } = useGameStore();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || false;
  const currentWeek = getCurrentWeek();
  const weekRange = getWeekRange();
  const weeklyZones = getWeeklyZones(currentWeek);
  useEffect(() => { ensureWeeklyReset(currentWeek); }, [currentWeek]);

  const weeklyTotal = weeklyZones.reduce((sum, z) => sum + (crZoneScores[z] || 0), 0);
  const squadInfo = SQUAD_INFO[crSquad];
  const recommendedSquad = getSquadByPoints(weeklyTotal);
  const [crView, setCrView] = useState<'menu' | 'bracket' | 'pointsRanking' | 'gradeReward'>('menu');
  const [activeZone, setActiveZone] = useState<ZoneElement | null>(null);

  const [bracketEntries, setBracketEntries] = useState<RemotePlayerEntry[] | null>(null);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [bracketError, setBracketError] = useState<string | null>(null);
  const [rankingTop, setRankingTop] = useState<RemoteRankingEntry[] | null>(null);
  const [rankingPlayerEntry, setRankingPlayerEntry] = useState<RemoteRankingEntry | null>(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [regionSyncing, setRegionSyncing] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  const playerName = user ? getDisplayName(user) : 'Player';
  const playerScore = Math.max(competitiveScore, weeklyTotal);

  // ─── WebSocket refs ──────────────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);

  // ─── Bracket/Ranking fetch effects ─────────────────────────────────────
  useEffect(() => {
    if (crView !== 'bracket' || !crRegion || !user) return;
    let cancelled = false;
    setBracketLoading(true);
    setBracketError(null);
    setUsingMockData(false);
    fetchBracket(crRegion, currentWeek, crSquad)
      .then(res => { if (!cancelled) setBracketEntries(res.entries); })
      .catch(err => {
        if (cancelled) return;
        console.warn('Bracket fetch failed, using mock data:', err);
        setBracketError(null);
        setUsingMockData(true);
        const mock = generateBracket(crRegion, currentWeek, crSquad, playerScore, playerName);
        setBracketEntries(mock.map(e => ({
          rank: e.rank,
          userId: e.isPlayer ? user.id : `mock_${e.name}`,
          name: e.name,
          score: e.score,
          isGuest: true,
        })));
      })
      .finally(() => { if (!cancelled) setBracketLoading(false); });
    return () => { cancelled = true; };
  }, [crView, crRegion, crSquad, currentWeek, user, playerScore, playerName]);

  useEffect(() => {
    if (crView !== 'pointsRanking' || !crRegion || !user) return;
    let cancelled = false;
    setRankingLoading(true);
    setRankingError(null);
    setUsingMockData(false);
    fetchRanking(crRegion, currentWeek, user.id)
      .then(res => { if (!cancelled) { setRankingTop(res.top); setRankingPlayerEntry(res.playerEntry); } })
      .catch(err => {
        if (cancelled) return;
        console.warn('Ranking fetch failed, using mock data:', err);
        setRankingError(null);
        setUsingMockData(true);
        const { top, playerEntry } = generatePointsRanking(crRegion, currentWeek, playerScore, playerName);
        setRankingTop(top.map(e => ({
          rank: e.rank,
          userId: e.isPlayer ? user.id : `mock_${e.name}`,
          name: e.name,
          score: e.score,
          isGuest: true,
          percentile: e.percentile,
        })));
        setRankingPlayerEntry({
          rank: playerEntry.rank,
          userId: user.id,
          name: playerEntry.name,
          score: playerEntry.score,
          isGuest: !!user.isGuest,
          percentile: playerEntry.percentile,
        });
      })
      .finally(() => { if (!cancelled) setRankingLoading(false); });
    return () => { cancelled = true; };
  }, [crView, crRegion, currentWeek, user, playerScore, playerName]);

  // ─── WebSocket connection ────────────────────────────────────────────
  const connectWebSocket = () => {
    if (!user) return;
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'ws://localhost:3001';
    // Ensure the URL starts with ws:// or wss://
    let wsUrl = serverUrl;
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      // If it's just a hostname, assume wss:// with path
      wsUrl = `wss://${wsUrl}`;
    }
    // Append the path if not already present
    if (!wsUrl.includes('/room/reception/match')) {
      wsUrl = `${wsUrl}/room/reception/match`;
    }
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for Competitive Reception');
      // Send initial state if needed? The server will request it.
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (e) {
        console.warn('Invalid WebSocket message:', event.data);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket closed for Competitive Reception');
      // Reconnect
      if (shouldReconnectRef.current) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket();
        }, WS_RECONNECT_DELAY);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  };

  const disconnectWebSocket = () => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // ─── WebSocket message handler ──────────────────────────────────────
  const handleWebSocketMessage = (data: any) => {
    const { type, payload } = data;
    switch (type) {
      case 'roomJoined':
        // { roomId, playerIndex }
        setMyPlayerIndex(payload.playerIndex);
        setPhase('combat');
        setQueued(false);
        addLog('[SYSTEM] Matched! Battle begins.');
        break;
      case 'queued':
        setQueued(true);
        addLog('[SYSTEM] Searching for opponent...');
        break;
      case 'matchCancelled':
        setQueued(false);
        addLog('[SYSTEM] Match search cancelled.');
        break;
      case 'gameState':
        setRoomState(payload);
        // update ultimate bar
        const myKey = myPlayerIndexRef.current === 0 ? 'p1' : 'p2';
        const me = payload[myKey];
        if (me) setUltBarValue(me.ultimateBar || 0);
        // handle clash result dedup (same as before)
        if (payload.clashResult) {
          const clashSig = JSON.stringify(payload.clashResult);
          if (clashSig !== clashSigRef.current) {
            clashSigRef.current = clashSig;
            const { actorName, pName, eName, won, dmg, ultimateGain } = payload.clashResult;
            const result = won ? '✅ Won' : '❌ Lost';
            addLog(`[${actorName}] ${result} clash! ${pName} vs ${eName} → ${dmg} dmg`);
            if (won && ultimateGain !== undefined) {
              addLog(`[ULTIMATE] Bar +${(ultimateGain * 100).toFixed(1)}%`);
            }
            setSelectedSkill(null);
            setIsSubmitting(false);
            setPassiveActivating(false);
            setShowClashResult(true);
          }
        } else {
          clashSigRef.current = null;
          setShowClashResult(false);
          if (payload.p1SkillIdx === null && payload.p2SkillIdx === null) {
            setPassiveActivating(false);
          }
        }
        if (payload.winner) {
          const winnerName = payload.winner === 'p1' ? payload.p1.playerName : payload.p2.playerName;
          addLog(`🏆 ${winnerName} wins the match!`);
        }
        break;
      case 'matchResult':
        setMatchResult(payload);
        setPhase('result');
        const isP1 = myPlayerIndexRef.current === 0;
        const won = (isP1 && payload.winner === 'p1') || (!isP1 && payload.winner === 'p2');
        const score = isP1 ? payload.scoreChanges?.p1 || 0 : payload.scoreChanges?.p2 || 0;
        addLog(`[RESULT] ${won ? 'Victory!' : 'Defeat!'} Score: ${score}`);
        break;
      case 'leaderboard':
        setLeaderboard(payload);
        break;
      case 'error':
        // payload is error message
        console.warn('WebSocket error:', payload);
        // maybe show a toast or alert
        break;
      default:
        console.warn('Unknown WebSocket message type:', type);
    }
  };

  const sendAction = (action: string, payload: any = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, payload }));
    } else {
      console.warn('WebSocket not open, cannot send action:', action);
    }
  };

  // ─── Connect on mount, disconnect on unmount ────────────────────────
  useEffect(() => {
    if (user) {
      connectWebSocket();
    }
    return () => {
      disconnectWebSocket();
    };
  }, [user]);

  // ─── Combat state ──────────────────────────────────────────────────
  const [phase, setPhase] = useState<'teamSelect' | 'preparing' | 'idle' | 'fighting' | 'waveClear' | 'defeat' | 'finished'>('idle');
  const [wave, setWave] = useState(1);
  const [timeLeft, setTimeLeft] = useState(300);
  const [waveElapsed, setWaveElapsed] = useState(0);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [memberHp, setMemberHp] = useState<number[]>([100, 100, 100]);
  const [memberMaxHp, setMemberMaxHp] = useState<number[]>([100, 100, 100]);
  const [memberShield, setMemberShield] = useState<number[]>([0, 0, 0]);
  const [memberSp, setMemberSp] = useState<number[]>([50, 50, 50]);
  const [memberUltimate, setMemberUltimate] = useState<number[]>([0, 0, 0]);
  const [log, setLog] = useState<string[]>([]);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [totalEnemiesDefeated, setTotalEnemiesDefeated] = useState(0);
  const [bossesDefeated, setBossesDefeated] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState(0);
  const [turn, setTurn] = useState<'player' | 'resolve'>('player');
  const [clashData, setClashData] = useState<{ p: number; e: number; ps: number; es: number; pp: number; ep: number; mult: number; actorName: string } | null>(null);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [ampDamageBoost, setAmpDamageBoost] = useState(0);
  const [allyEgoAmpBuff, setAllyEgoAmpBuff] = useState({ pct: 0, turnsLeft: 0, casterId: '' });
  const [tankShredPct, setTankShredPct] = useState(0);
  const [waveStartTime, setWaveStartTime] = useState<number | null>(null);
  const [waveTimings, setWaveTimings] = useState<{ wave: number; seconds: number; target: number; delta: number }[]>([]);
  const [amplifierHealCooldown, setAmplifierHealCooldown] = useState(0);
  const [attackerBuffTurns, setAttackerBuffTurns] = useState(0);
  const [corrosionTurns, setCorrosionTurns] = useState(0);
  const [amplifierAtkBuffCooldown, setAmplifierAtkBuffCooldown] = useState(0);
  const [selectedEnemyIndex, setSelectedEnemyIndex] = useState(0);
  const [useShadowBoss, setUseShadowBoss] = useState(false);

  // ─── Transformation state ──────────────────────────────────────────
  const [transformationActive, setTransformationActive] = useState(false);
  const [transformationTurnsLeft, setTransformationTurnsLeft] = useState(0);
  const [transformedSkills, setTransformedSkills] = useState<TransformedSkill[]>([]);
  const [transformationCountdown, setTransformationCountdown] = useState(0);

  // ─── Passive auto‑select state ────────────────────────────────────
  const [passiveActivating, setPassiveActivating] = useState(false);

  // ─── Refs ──────────────────────────────────────────────────────────
  const myPlayerIndexRef = useRef<0 | 1>(0);
  const roomStateRef = useRef<any>(null);
  const clashSigRef = useRef<string | null>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState<0 | 1>(0);
  const [roomState, setRoomState] = useState<any>(null);
  const [queued, setQueued] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showClashResult, setShowClashResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ultBarValue, setUltBarValue] = useState(0);

  useEffect(() => {
    const hasShadowUnlock = completedChapters.includes('ch29');
    setUseShadowBoss(hasShadowUnlock && Math.random() < 0.3);
  }, [completedChapters]);

  useEffect(() => {
    const aliveIndices = enemies.map((_, i) => i).filter(i => enemies[i].hp > 0);
    if (aliveIndices.length === 0) return;
    if (!aliveIndices.includes(selectedEnemyIndex) || enemies[selectedEnemyIndex]?.hp <= 0) {
      setSelectedEnemyIndex(aliveIndices[0]);
    }
  }, [enemies, selectedEnemyIndex]);

  const [synergyType, setSynergyType] = useState<'amplifier' | 'support' | null>(null);
  const [synergyAtkBuff, setSynergyAtkBuff] = useState(0);
  const [synergyDefBuff, setSynergyDefBuff] = useState(0);
  const [synergyHealBonus, setSynergyHealBonus] = useState(0);
  const [synergyDmgAmp, setSynergyDmgAmp] = useState(0);

  const getWaveTarget = (w: number) => 15 + w * 2;

  useEffect(() => {
    if (phase === 'preparing' && !activeZone) {
      setPhase('idle');
    }
  }, [phase, activeZone]);

  const competitiveAvailableIds = ownedIdentities
    .map(o => o.identityId)
    .filter(id => !trialIdentities.includes(id));

  const filteredTeamForDisplay = team.filter(id => !trialIdentities.includes(id));

  const teamMembers = filteredTeamForDisplay
    .map(id => {
      const owned = ownedIdentities.find(o => o.identityId === id);
      if (!owned) return null;
      const data = identities.find(i => i.id === owned.identityId);
      if (!data) return null;
      return { owned, data };
    })
    .filter(Boolean) as { owned: any; data: Identity }[];

  const aliveIndices = teamMembers.map((_, i) => i).filter(i => (memberHp[i] ?? 0) > 0);
  const activeIdx = aliveIndices.length > 0 ? aliveIndices[currentTurnIndex % aliveIndices.length] : 0;
  const activeMember = teamMembers[activeIdx];
  const playerHp = memberHp[activeIdx] ?? 0;
  const playerMaxHp = memberMaxHp[activeIdx] ?? 100;
  const playerShield = memberShield[activeIdx] ?? 0;
  const spBar = memberSp[activeIdx] ?? 0;
  const ultimateBar = memberUltimate[activeIdx] ?? 0;

  const setPlayerHp = (updater: number | ((p: number) => number)) => {
    setMemberHp(prev => prev.map((v, i) => i === activeIdx ? (typeof updater === 'function' ? updater(v) : updater) : v));
  };
  const setPlayerShield = (updater: number | ((p: number) => number)) => {
    setMemberShield(prev => prev.map((v, i) => i === activeIdx ? (typeof updater === 'function' ? updater(v) : updater) : v));
  };
  const setSpBar = (updater: number | ((p: number) => number)) => {
    setMemberSp(prev => prev.map((v, i) => i === activeIdx ? (typeof updater === 'function' ? updater(v) : updater) : v));
  };
  const identityData = activeMember?.data ?? null;
  const activeIdentity = activeMember?.owned ?? null;

  // ─── Auto-equip weapon logic ──────────────────────────────────────
  useEffect(() => {
    if (!identityData || !activeIdentity) return;
    const owned = activeIdentity;
    let weaponId = owned.equippedWeaponId || null;
    // Force equip Arthur (starter unit)
    if (identityData.id === 'arthur_excalibur') {
      const targetWeaponId = identityData.signatureWeaponId || 'eclipse_blade';
      if (canEquipWeapon(identityData.id, targetWeaponId)) {
        const ownedWeapon = ownedWeapons.find(ow => ow.weaponId === targetWeaponId);
        if (ownedWeapon) {
          if (owned.equippedWeaponId !== targetWeaponId) {
            setEquippedWeapon(identityData.id, targetWeaponId);
          }
        }
      }
    } else {
      // Gentle auto-equip if no weapon and signature exists
      if (!weaponId && identityData.signatureWeaponId) {
        const sigWeaponId = identityData.signatureWeaponId;
        if (canEquipWeapon(identityData.id, sigWeaponId)) {
          const ownedWeapon = ownedWeapons.find(ow => ow.weaponId === sigWeaponId);
          if (ownedWeapon) {
            if (!owned.equippedWeaponId) {
              setEquippedWeapon(identityData.id, sigWeaponId);
            }
          }
        }
      }
    }
  }, [identityData, activeIdentity, ownedWeapons, setEquippedWeapon]);

  const giftStats = identityData ? getTotalGiftStats(identityData.id) : { hp: 0, atk: 0, def: 0, spd: 0 };

  // Build weapon data (for stats)
  const buildWeaponData = () => {
    if (!activeIdentity) return { weaponData: null, weaponLevel: 1 };
    let weaponId = activeIdentity.equippedWeaponId || null;
    // Force equip Arthur if needed
    if (identityData?.id === 'arthur_excalibur') {
      const targetWeaponId = identityData.signatureWeaponId || 'eclipse_blade';
      if (canEquipWeapon(identityData.id, targetWeaponId)) {
        const ownedWeapon = ownedWeapons.find(ow => ow.weaponId === targetWeaponId);
        if (ownedWeapon) {
          weaponId = targetWeaponId;
        }
      }
    } else {
      if (!weaponId && identityData?.signatureWeaponId) {
        const sigWeaponId = identityData.signatureWeaponId;
        if (canEquipWeapon(identityData.id, sigWeaponId)) {
          const ownedWeapon = ownedWeapons.find(ow => ow.weaponId === sigWeaponId);
          if (ownedWeapon) {
            weaponId = sigWeaponId;
          }
        }
      }
    }
    const weapon = weaponId ? weapons.find(w => w.id === weaponId) : null;
    const level = weapon ? (ownedWeapons.find(ow => ow.weaponId === weapon.id)?.level || 1) : 1;
    return { weaponData: weapon, weaponLevel: level };
  };

  const { weaponData } = buildWeaponData();

  const stats = identityData
    ? scaledStats(identityData, activeIdentity?.level || 1, activeIdentity?.classSkillLevel ?? 1)
    : { hp: 3200, atk: 100, def: 60, spd: 80 };
  const totalStats = {
    hp: stats.hp + giftStats.hp,
    atk: (stats.atk + giftStats.atk) * (1 + synergyAtkBuff),
    def: (stats.def + giftStats.def) * (1 + synergyDefBuff),
    spd: stats.spd + giftStats.spd,
  };
  const playerAtk = totalStats.atk + (weaponData?.baseStats.atk || 0);
  const playerDef = totalStats.def;
  const playerDamageType = identityData?.element || 'Red';
  const playerInfusion = weaponData?.type === 'Blunt' ? 'Blunt' : weaponData?.type === 'Pierce' ? 'Pierce' : 'Slash';
  const playerClassCat: CombatCategory = identityData ? getClassCategory(identityData.id) : 'Attacker';
  const playerClassEffect = classCategoryEffect(activeIdentity?.classSkillLevel ?? 1);

  // ─── Skills (normal or transformed) ──────────────────────────────
  let baseSkills = identityData
    ? identityData.skills.filter(s => s.type !== 'class').map(skill => {
        const idx = identityData.skills.indexOf(skill);
        const sl = activeIdentity?.skillLevels?.[idx] ?? 1;
        const power = skill.basePower + skill.powerGrowth * (sl - 1);
        const coins = skill.coinGrowth > 0 ? skill.baseCoins + Math.floor((sl - 1) / skill.coinGrowth) : skill.baseCoins;
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
        { name: 'Basic Strike', power: 4, coins: 1, type: 'normal1' as const, dmgMult: 1, skillLevel: 1, isEgo: false, damageType: playerDamageType, infusion: playerInfusion },
        { name: 'Heavy Blow', power: 6, coins: 1, type: 'normal2' as const, dmgMult: 1, skillLevel: 1, isEgo: false, damageType: playerDamageType, infusion: playerInfusion },
        { name: 'Quick Slash', power: 3, coins: 2, type: 'normal3' as const, dmgMult: 1, skillLevel: 1, isEgo: false, damageType: playerDamageType, infusion: playerInfusion },
        { name: 'Ego Burst', power: 8, coins: 2, type: 'ego' as const, dmgMult: 1, skillLevel: 1, isEgo: true, damageType: playerDamageType, infusion: playerInfusion },
      ];

  const playerSkills = transformationActive && transformedSkills.length > 0 ? transformedSkills : baseSkills;

  // ─── Timer effects ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'fighting') return;
    const t = setInterval(() => setTimeLeft(prev => prev <= 1 ? 0 : prev - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fighting') return;
    const t = setInterval(() => setWaveElapsed(prev => prev + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (timeLeft === 0 && phase === 'fighting') endReception();
  }, [timeLeft, phase]);

  // ─── Wave generation ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'fighting') return;
    const safeAtk = (typeof playerAtk === 'number' && playerAtk > 0) ? playerAtk : 50;
    const safeDef = (typeof playerDef === 'number' && playerDef > 0) ? playerDef : 30;
    const safeMaxHp = (typeof playerMaxHp === 'number' && playerMaxHp > 0) ? playerMaxHp : 1000;

    const isBoss = isBossWave(wave);
    let enemiesGenerated: Enemy[];
    if (isBoss) {
      const boss = generateBossEnemy(wave, safeAtk, safeDef, safeMaxHp, activeZone || undefined, undefined, useShadowBoss);
      if (boss) {
        const minion = generateEnemy(wave, safeAtk, safeDef, safeMaxHp, activeZone || undefined);
        enemiesGenerated = [boss, minion];
        addLog(`⭐ BOSS WAVE! ${boss.name} appears!`);
      } else {
        enemiesGenerated = [generateEnemy(wave, safeAtk, safeDef, safeMaxHp, activeZone || undefined)];
        addLog(`⚠️ Boss generation fallback – spawning regular enemy.`);
      }
    } else {
      enemiesGenerated = [
        generateEnemy(wave, safeAtk, safeDef, safeMaxHp, activeZone || undefined),
        generateEnemy(wave, safeAtk, safeDef, safeMaxHp, activeZone || undefined)
      ];
    }
    if (enemiesGenerated.length === 0 || enemiesGenerated.every(e => e === undefined)) {
      enemiesGenerated = [generateEnemy(wave, safeAtk, safeDef, safeMaxHp, activeZone || undefined)];
      addLog(`⚠️ Enemy generation fallback – spawning one enemy.`);
    }
    setEnemies(enemiesGenerated.filter(e => e !== undefined) as Enemy[]);
    setSelectedEnemyIndex(0);
    setTurn('player');
    setSelectedSkill(0);
    setWaveStartTime(Date.now());
    setWaveElapsed(0);
    setAmplifierHealCooldown(0);
    setAttackerBuffTurns(0);
    setCorrosionTurns(0);
    setAmplifierAtkBuffCooldown(0);
  }, [wave, phase]);

  const addLog = (msg: string) => setLog(prev => [...prev.slice(-30), msg]);

  const advanceTurn = () => {
    if (amplifierHealCooldown > 0) setAmplifierHealCooldown(prev => prev - 1);
    if (attackerBuffTurns > 0) setAttackerBuffTurns(prev => prev - 1);
    if (corrosionTurns > 0) setCorrosionTurns(prev => prev - 1);
    if (amplifierAtkBuffCooldown > 0) setAmplifierAtkBuffCooldown(prev => prev - 1);

    // ─── Timer‑based transformation (data‑driven) ──────────────────────
    if (!transformationActive && identityData && identityData.transformationTrigger === 'timer') {
      setTransformationCountdown((prev) => {
        const newCount = prev - 1;
        if (newCount <= 0) {
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
      setTransformationTurnsLeft(prev => {
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
          setMemberHp(prev => prev.map((hp, i) => {
            if (i >= teamMembers.length) return hp;
            const maxHp = memberMaxHp[i] ?? 100;
            return Math.min(maxHp, hp + amount);
          }));
          addLog(`💚 Transformation passive healed allies for ${Math.floor(amount)} HP`);
        },
        applyBuff: (name: string, value: number, turns: number) => {},
        dealDamage: (amount: number) => {
          setEnemies(prev => {
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

  const detectSynergy = () => {
    const classes = teamMembers.map(tm => getClassCategory(tm.data.id));
    const hasAttacker = classes.includes('Attacker');
    const hasTank = classes.includes('Tank');
    const hasAmplifier = classes.includes('Amplifier');
    const hasSupport = classes.includes('Support');
    let atkBuff = 0, defBuff = 0, healBonus = 0, dmgAmp = 0, type: 'amplifier' | 'support' | null = null;
    if (hasAttacker && hasTank && hasAmplifier && !hasSupport) {
      atkBuff = 0.20; defBuff = 0.20; healBonus = 0.15; dmgAmp = 0.10; type = 'amplifier';
      addLog('⚡ SYNERGY: Offensive Trinity (Attacker + Tank + Amplifier) – +20% ATK/DEF, Amplifier +15% heal, +10% damage amp! +20 bonus SP!');
    } else if (hasAttacker && hasTank && hasSupport && !hasAmplifier) {
      atkBuff = 0.20; defBuff = 0.20; healBonus = 0.50; dmgAmp = 0; type = 'support';
      addLog('💚 SYNERGY: Defensive Trinity (Attacker + Tank + Support) – +20% ATK/DEF, Support Ego +50% heal! +20 bonus SP!');
    }
    return { atkBuff, defBuff, healBonus, dmgAmp, type };
  };

  const confirmRegion = async (regionId: 'NA' | 'SEA' | 'Asia' | 'AP') => {
    if (!user) return;
    if (!confirm(`Lock your account to ${CR_REGIONS.find(r => r.id === regionId)?.label}? This cannot be changed.`)) return;
    setRegionSyncing(true);
    try {
      await setPlayerRegion(user.id, regionId);
      setCRRegion(regionId);
    } catch (err: any) {
      console.warn('Region sync to backend failed (saved locally):', err);
      setCRRegion(regionId);
    } finally {
      setRegionSyncing(false);
    }
  };

  const startReception = () => {
    const synergy = detectSynergy();
    setSynergyType(synergy.type);
    setSynergyAtkBuff(synergy.atkBuff);
    setSynergyDefBuff(synergy.defBuff);
    setSynergyHealBonus(synergy.healBonus);
    setSynergyDmgAmp(synergy.dmgAmp);

    let initialSP = 50;
    if (synergy.type !== null) initialSP += 20;
    setMemberSp(prev => prev.map(() => initialSP));
    setMemberUltimate(prev => prev.map(() => 0));

    const hps = teamMembers.map(tm => {
      const ms = scaledStats(tm.data, tm.owned.level, tm.owned.classSkillLevel ?? 1);
      const giftStatsForMember = getTotalGiftStats(tm.data.id);
      const totalHp = ms.hp + giftStatsForMember.hp;
      const stat = Math.floor(totalHp / 32);
      return Math.max(50, Math.min(200, stat));
    });
    while (hps.length < 3) hps.push(100);
    setMemberHp([...hps]);
    setMemberMaxHp([...hps]);
    setMemberShield([0, 0, 0]);

    setPhase('fighting'); setWave(1); setTimeLeft(300);
    setTotalEnemiesDefeated(0); setBossesDefeated(0);
    setWaveTimings([]); setWaveStartTime(null);
    setFinalScore(null); setLog(['[SYSTEM] Competitive Reception initiated...']); setTurn('player'); setCurrentTurnIndex(0);
    setAmplifierHealCooldown(0); setAttackerBuffTurns(0); setCorrosionTurns(0); setAmplifierAtkBuffCooldown(0);
    setTransformationActive(false); setTransformationTurnsLeft(0); setTransformedSkills([]);
    const activeIdentityData = teamMembers[0]?.data;
    if (activeIdentityData && activeIdentityData.transformationTrigger === 'timer') {
      setTransformationCountdown(activeIdentityData.triggerTurns || 10);
    } else {
      setTransformationCountdown(0);
    }

    // Send findMatch via WebSocket
    const playerData = buildPlayerData();
    if (playerData) {
      sendAction('findMatch', playerData);
    }
  };

  // ─── Helper to build player data for matchmaking ──────────────────
  const buildPlayerData = () => {
    // This replicates the logic from the original buildPlayerData function,
    // adapted to return the payload for the WebSocket.
    // For brevity, we assume the identity and stats are already computed.
    // We'll reconstruct based on the existing data.
    const identity = identityData;
    if (!identity) return null;
    const weaponId = activeIdentity?.equippedWeaponId || null;
    const giftIds = activeIdentity ? (equippedGifts?.[identity.id] || []) : [];
    const stats = scaledStats(identity, activeIdentity?.level || 1, activeIdentity?.classSkillLevel ?? 1);
    const totalHp = stats.hp + giftStats.hp;
    const totalAtk = stats.atk + giftStats.atk + (weaponData?.baseStats.atk || 0);
    const totalDef = stats.def + giftStats.def;
    const totalSpd = stats.spd + giftStats.spd;
    const classCategory = getClassCategory(identity.id);
    const classEffect = classCategoryEffect(activeIdentity?.classSkillLevel ?? 1);

    const baseSkills = identity.skills.filter(s => s.type !== 'class').map((skill, idx) => {
      const sl = activeIdentity?.skillLevels?.[idx] ?? 1;
      const power = skill.basePower + skill.powerGrowth * (sl - 1);
      const coins = skill.coinGrowth > 0 ? skill.baseCoins + Math.floor((sl - 1) / skill.coinGrowth) : skill.baseCoins;
      return {
        ...skill,
        power: Math.min(power, MAX_CLASH_POWER),
        coins,
        level: sl,
        isEgo: skill.type === 'ego',
        isTransformed: false,
        isUltimate: skill.isUltimate || skill.type === 'ego',
        damageType: skill.damageType || identity.element,
        infusion: skill.infusion || identity.baseInfusion || 'Slash',
      };
    });

    let transformedSkills = [];
    if (identity.transformedSkills && identity.transformedSkills.length > 0) {
      transformedSkills = identity.transformedSkills.map((s) => {
        const lvl = 1;
        const power = s.basePower + s.powerGrowth * (lvl - 1);
        const coins = s.coinGrowth > 0 ? s.baseCoins + Math.floor((lvl - 1) / s.coinGrowth) : s.baseCoins;
        return {
          ...s,
          power: Math.min(power, MAX_CLASH_POWER),
          coins,
          level: lvl,
          isEgo: s.type === 'ego',
          isTransformed: true,
          isUltimate: s.isUltimate || false,
          damageType: s.damageType || identity.element,
          infusion: s.infusion || identity.baseInfusion || 'Slash',
        };
      });
    }

    return {
      identityId: identity.id,
      weaponId: weaponId,
      giftIds: giftIds.map(g => g.giftId).filter(Boolean),
      playerName: getDisplayName(user) || 'Player',
      stats: {
        score: competitiveScore,
        lives: 5,
        hp: totalHp,
        maxHp: totalHp,
        atk: totalAtk,
        def: totalDef,
        spd: totalSpd,
        sp: 50,
        shield: 0,
        resolveStacks: 0,
        witherStacks: 0,
        bleedStacks: 0,
        ultimateBar: 0,
        transformationActive: false,
        transformationTurnsLeft: 0,
      },
      baseSkills,
      transformedSkills,
      ultimateDuration: identity.ultimateDuration || 0,
      transformationTrigger: identity.transformationTrigger || 'none',
      hasUltimate: identity.skills.some(s => s.type === 'ego' || s.isUltimate),
      transformationPassive: identity.transformationPassive || null,
      classCategory,
      classEffect,
      weaponPassive: weaponData?.passive || '',
    };
  };

  // ─── Clash helpers ──────────────────────────────────────────────────
  const applyCorrosion = () => { setCorrosionTurns(2); addLog('🛡️ Corrosion applied! Enemy All Resistances -8% for 2 turns'); };
  const applyAttackerBuff = () => { setAttackerBuffTurns(2); addLog('⚔️ Attacker buff active! +30% ATK for 2 turns'); };
  const applyBleedAndDull = (targetIndex: number, baseChance: number) => {
    const enemy = enemies[targetIndex];
    if (!enemy) return;
    const chance = specialDebuffActive ? 0.20 : baseChance;
    if (Math.random() < chance) {
      addLog(`💉 Bleed applied to ${enemy.name}${specialDebuffActive ? ' (Crushing Weight active)' : ''}`);
      if (specialDebuffActive) {
        const newStacks = Math.min(3, (enemy.dullStacks || 0) + 1);
        setEnemies(prev => prev.map((e, i) => i === targetIndex ? { ...e, dullStacks: newStacks } : e));
        addLog(`🔨 Dull stack applied (${newStacks}/3)`);
      }
    }
  };

  function resolveClash(skillPower: number, enemyPower: number, skillCoins: number, enemyCoins: number) {
    let ties = 0; let result; let attempts = 0;
    do {
      result = clash(skillPower, enemyPower, skillCoins, enemyCoins);
      attempts++;
      if (attempts > 100) break;
      if (result.playerTotal === result.enemyTotal) {
        ties++;
        if (ties === 1) addLog(`⚔️ Tie detected! Re‑clashing...`);
        else if (ties % 5 === 0) addLog(`⚔️ Still tied after ${ties} re‑clashes...`);
      }
    } while (result.playerTotal === result.enemyTotal);
    if (result.playerTotal === result.enemyTotal) {
      result.playerTotal += 1;
      addLog(`⚔️ Forced win after ${attempts} attempts.`);
    }
    return { playerTotal: result.playerTotal, enemyTotal: result.enemyTotal, ties };
  }

  // ─── Player action ──────────────────────────────────────────────────
  const playerAct = () => {
    if (turn !== 'player' || enemies.length === 0) return;
    const skill = playerSkills[selectedSkill];
    if (!skill) return;
    const isEgo = skill.type === 'ego';
    if (isEgo && ultimateBar < 100) {
      addLog('⚠️ Ultimate not full! Ego needs 100% Ultimate.');
      return;
    }

    const aliveEnemyIndices = enemies.map((_, i) => i).filter(i => enemies[i].hp > 0);
    let targetIdx = selectedEnemyIndex;
    if (!aliveEnemyIndices.includes(targetIdx) || enemies[targetIdx]?.hp <= 0) {
      targetIdx = aliveEnemyIndices[0] ?? 0;
    }
    const enemy = enemies[targetIdx];
    if (!enemy) return;

    const eSkill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
    const { playerTotal, enemyTotal, ties } = resolveClash(skill.power, eSkill.power, skill.coins, eSkill.coins);
    if (ties > 0) addLog(`⚔️ Resolved after ${ties} tie(s).`);

    // Compute multipliers using damage type and infusion
    const dmgMult = damageTypeMult(skill.damageType || playerDamageType, enemy.resistDamageType);
    const infMult = infusionMult(skill.infusion || playerInfusion, enemy.resistInfusion);
    const mult = dmgMult * infMult;

    let classMult = 1.0;
    if (playerClassCat === 'Attacker') {
      classMult += playerClassEffect;
      if (attackerBuffTurns > 0) classMult += 0.30;
    }
    if (playerClassCat === 'Amplifier' && isEgo) classMult += playerClassEffect;
    if (isEgo && allyEgoAmpBuff.turnsLeft > 0 && allyEgoAmpBuff.casterId !== identityData?.id) {
      classMult += allyEgoAmpBuff.pct;
    }
    if (synergyDmgAmp > 0) classMult += synergyDmgAmp;

    let tankBonus = 1.0;
    if (tankShredPct > 0) tankBonus += tankShredPct;
    if (corrosionTurns > 0) tankBonus += 0.08;

    let won = playerTotal >= enemyTotal;
    let dmg = 0;
    let enemyDmg = 0;
    let modifiedDmg = 0;

    if (won) {
      dmg = calculatePlayerPercentDamage(playerTotal, enemyTotal, enemy.maxHp, mult, skill.dmgMult, classMult, tankBonus);
      if (enemy.bossMechanic?.onPlayerClashWin) {
        modifiedDmg = enemy.bossMechanic.onPlayerClashWin(enemy, { playerHp, playerMaxHp, playerShield, spBar }, dmg);
        if (modifiedDmg !== dmg) { dmg = modifiedDmg; addLog(`🛡️ ${enemy.bossMechanic.name}: damage adjusted!`); }
      }
      setEnemies(prev => { const u = [...prev]; u[targetIdx] = { ...u[targetIdx], hp: Math.max(0, u[targetIdx].hp - dmg) }; return u; });
      addLog(`[${identityData?.name}] ✅ Clash won! ${skill.name} → ${dmg} dmg (${((dmg/enemy.maxHp)*100).toFixed(1)}% of enemy HP) ×${mult.toFixed(2)}.`);

      // Ultimate gain
      const gain = ULTIMATE_GAIN_MIN + Math.random() * (ULTIMATE_GAIN_MAX - ULTIMATE_GAIN_MIN);
      setMemberUltimate(prev => prev.map((v, i) => i === activeIdx ? Math.min(100, v + gain * 100) : v));

      // Apply damage type and infusion debuffs
      applyDebuff(identityData?.name || 'Player', skill.damageType || playerDamageType, skill.infusion || playerInfusion, addLog);

      applyBleedAndDull(targetIdx, 0.03);

      // Class effects
      if (playerClassCat === 'Attacker' && isEgo) {
        applyAttackerBuff();
      }
      if (playerClassCat === 'Tank' && isEgo) {
        setTankShredPct(Math.min(0.5, tankShredPct + playerClassEffect));
        addLog(`🛡️ TANK SHRED: Enemy damage reduction -${(playerClassEffect * 100).toFixed(0)}%`);
        applyCorrosion();
        const shieldAmt = Math.floor(dmg * 0.15);
        setMemberShield(prev => prev.map((s, i) => (i >= teamMembers.length) ? s : s + shieldAmt));
        addLog(`🛡️ All allies gained ${shieldAmt} shield!`);
      }
      if (playerClassCat === 'Amplifier' && isEgo) {
        setAllyEgoAmpBuff({ pct: 0.25 + playerClassEffect, turnsLeft: 2, casterId: identityData?.id || '' });
        addLog(`✨ AMPLIFIER: Allies gain +${((0.25 + playerClassEffect) * 100).toFixed(0)}% ego damage for 2 turns`);
        const healPct = 0.15 + playerClassEffect * 0.5 + synergyHealBonus;
        const healAmt = Math.max(3, Math.floor(dmg * healPct));
        setMemberHp(prev => prev.map((hp, i) => {
          if (i >= teamMembers.length) return hp;
          const maxHp = memberMaxHp[i] ?? 100;
          if (amplifierAtkBuffCooldown === 0) {
            setAmplifierAtkBuffCooldown(3);
            addLog(`✨ Amplifier buff: healed targets gain +10% ATK for 2 turns`);
          }
          return Math.min(maxHp, hp + healAmt);
        }));
        addLog(`💚 AMPLIFIER Ego: all party members healed for ${healAmt} HP (${(healPct * 100).toFixed(0)}% of damage dealt)`);
      }
      if (playerClassCat === 'Support' && isEgo) {
        const healPct = 0.20 + playerClassEffect + synergyHealBonus;
        const healAmt = Math.floor(dmg * healPct);
        setMemberHp(prev => prev.map((hp, i) => {
          if (i >= teamMembers.length) return hp;
          const maxHp = memberMaxHp[i] ?? 100;
          return Math.min(maxHp, hp + healAmt);
        }));
        addLog(`💚 SUPPORT: Ego healed team for ${healAmt} HP (${(healPct * 100).toFixed(0)}% of damage) [Synergy bonus applied]`);
      }
      if (playerClassCat === 'Tank') applyCorrosion();

      // ─── Ultimate‑based transformation ──────────────────────────────
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
          setMemberUltimate(prev => prev.map((v, i) => i === activeIdx ? 0 : v));
          const newSkills = buildTransformedSkills(identityData, playerDamageType, playerInfusion);
          setTransformedSkills(newSkills);
          setTransformationActive(true);
          setTransformationTurnsLeft(identityData.ultimateDuration || 8);
          addLog(`🌹 ${identityData.name} transformed! Skills replaced for ${identityData.ultimateDuration || 8} turns.`);
        }
      }
    } else {
      enemyDmg = calculateEnemyPercentDamage(enemyTotal, playerTotal, playerMaxHp);
      if (enemy.bossMechanic?.onPlayerClashLose) {
        modifiedDmg = enemy.bossMechanic.onPlayerClashLose(enemy, { playerHp, playerMaxHp, playerShield, spBar }, enemyDmg);
        if (modifiedDmg !== enemyDmg) { enemyDmg = modifiedDmg; addLog(`🔥 ${enemy.bossMechanic.name}: damage increased!`); }
      }
      const afterShield = Math.max(0, enemyDmg - playerShield);
      setPlayerShield(prev => Math.max(0, prev - enemyDmg));
      setPlayerHp(prev => Math.max(0, prev - afterShield));
      addLog(`❌ Clash lost! ${enemy.name} deals ${enemyDmg} dmg (${((enemyDmg/playerMaxHp)*100).toFixed(1)}% of your HP)`);
      if (playerClassCat === 'Amplifier' && afterShield > 0) {
        const healAmt = afterShield;
        setMemberHp(prev => prev.map((hp, i) => {
          if (i >= teamMembers.length) return hp;
          const maxHp = memberMaxHp[i] ?? 100;
          return Math.min(maxHp, hp + healAmt);
        }));
        addLog(`💚 AMPLIFIER resonance: all party members healed for ${healAmt} HP (exact damage taken)`);
      }
    }

    setClashData({
      p: playerTotal,
      e: enemyTotal,
      ps: skill.power,
      es: eSkill.power,
      pp: playerAtk,
      ep: enemy.atk,
      mult,
      actorName: identityData?.name || '???'
    });
    setTurn('resolve');

    // Send skill selection via WebSocket
    const myKey = myPlayerIndexRef.current === 0 ? 'p1' : 'p2';
    // We'll send the selected skill index to the server for the opponent.
    // But we already sent it when we selected the skill initially? Actually the flow:
    // In the original code, selecting skill is sent separately via selectSkill.
    // We'll handle skill selection via sendAction('selectSkill', { skillIndex: idx }).
    // That is already called in the selectSkill function.
  };

  // ─── selectSkill function (called from UI) ──────────────────────────
  const selectSkill = (idx: number) => {
    if (isSubmitting || passiveActivating) return;
    const myKey = myPlayerIndexRef.current === 0 ? 'p1' : 'p2';
    if (roomStateRef.current?.[myKey + 'SkillIdx'] !== null) return;

    setIsSubmitting(true);
    setSelectedSkill(idx);
    sendAction('selectSkill', { skillIndex: idx });
    const me = roomStateRef.current?.[myKey];
    if (me) {
      const skill = me.skills?.[idx];
      if (skill) addLog(`[${me.playerName}] Selected ${skill.name}`);
    }
    addLog('[SYSTEM] Skill submitted – waiting for opponent.');
  };

  // ─── Resolve phase ──────────────────────────────────────────────────
  const resolve = () => {
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      if (enemy.bossMechanic?.onEnemyTurnStart) {
        enemy.bossMechanic.onEnemyTurnStart(enemy);
      }
    }

    const aliveEnemyIndices = enemies.map((_, i) => i).filter(i => enemies[i].hp > 0);
    const targetIdx = selectedEnemyIndex;
    const otherEnemyIndices = aliveEnemyIndices.filter(i => i !== targetIdx);

    const playerDefense = playerDef > 0 ? playerDef : 30;

    if (otherEnemyIndices.length > 0) addLog(`⚔️ Other enemies attack!`);

    for (const idx of otherEnemyIndices) {
      const enemy = enemies[idx];
      if (!enemy) continue;
      const skill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
      let enemyTotal = 0;
      for (let c = 0; c < skill.coins; c++) {
        enemyTotal += rollCoin(skill.power);
      }
      const playerTotal = 5 + Math.floor(playerDefense / 10);
      let dmg = calculateEnemyPercentDamage(enemyTotal, playerTotal, playerMaxHp, 1.0);
      if (enemy.bossMechanic?.onPlayerClashLose) {
        const modified = enemy.bossMechanic.onPlayerClashLose(enemy, { playerHp, playerMaxHp, playerShield, spBar }, dmg);
        if (modified !== dmg) { dmg = modified; addLog(`🔥 ${enemy.bossMechanic.name}: damage increased!`); }
      }
      const afterShield = Math.max(0, dmg - playerShield);
      setPlayerShield(prev => Math.max(0, prev - dmg));
      setPlayerHp(prev => Math.max(0, prev - afterShield));
      addLog(`👊 ${enemy.name} uses ${skill.name}: ${dmg} dmg (${((dmg/playerMaxHp)*100).toFixed(1)}% of your HP)`);
      if (playerClassCat === 'Amplifier' && afterShield > 0) {
        const healAmt = afterShield;
        setMemberHp(prev => prev.map((hp, i) => {
          if (i >= teamMembers.length) return hp;
          const maxHp = memberMaxHp[i] ?? 100;
          return Math.min(maxHp, hp + healAmt);
        }));
        addLog(`💚 AMPLIFIER resonance: all party members healed for ${healAmt} HP (exact damage taken)`);
      }
      if (playerClassCat === 'Tank') applyCorrosion();
      if (memberHp[activeIdx] <= 0) break;
    }

    if (memberHp[activeIdx] <= 0) {
      addLog(`💀 ${identityData?.name || 'Member'} has fallen!`);
      setPhase('defeat');
      return;
    }

    const defeatedEnemies = enemies.filter(e => e.hp <= 0);
    for (const enemy of defeatedEnemies) {
      if (Math.random() < 0.01) { addHarmonizationSigils(1); addLog(`💎 Harmonization Sigil dropped from ${enemy.name}!`); }
      if (Math.random() < 0.005) { addEclipseResonanceMaterials(1); addLog(`✨ Eclipse Resonance Material dropped from ${enemy.name}!`); }
    }

    const alive = enemies.filter(e => e.hp > 0);
    const deadCount = enemies.length - alive.length;
    const killedBoss = enemies.some(e => e.isBoss && e.hp <= 0);
    setEnemies(alive);
    setTotalEnemiesDefeated(prev => prev + deadCount);
    if (deadCount > 0) recordEnemyDefeats(deadCount);
    if (deadCount > 0) addLog(`💀 ${deadCount} enemy defeated!`);

    if (killedBoss) {
      setBossesDefeated(prev => prev + 1);
      const newTime = Math.min(300, timeLeft + BOSS_BONUS_TIME);
      setTimeLeft(newTime);
      addLog(`⭐ BOSS DEFEATED! +${BOSS_BONUS_TIME}s added! (+${BOSS_SCORE_BONUS} score bonus)`);
    }

    if (alive.length === 0) {
      const elapsed = waveElapsed;
      const target = getWaveTarget(wave);
      const delta = target - elapsed;
      setWaveTimings(prev => [...prev, { wave, seconds: elapsed, target, delta }]);
      addLog(`⏱️ Wave ${wave} cleared in ${elapsed}s (target ${target}s, ${delta >= 0 ? '✅' : '⚠️'})`);
      setPhase('waveClear');
      return;
    }

    setSpBar(prev => Math.min(100, prev + 10));
    setAllyEgoAmpBuff(prev => prev.turnsLeft > 0 ? { ...prev, turnsLeft: prev.turnsLeft - 1 } : prev);
    setCurrentTurnIndex(prev => prev + 1);
    setTurn('player');
    setClashData(null);
    setSelectedSkill(0);
    advanceTurn();
  };

  const nextWave = () => {
    setWave(prev => prev + 1); setPhase('fighting');
    setTankShredPct(0);
    setAllyEgoAmpBuff({ pct: 0, turnsLeft: 0, casterId: '' });
    setMemberHp(prev => prev.map((hp, i) => {
      const max = memberMaxHp[i] ?? 100;
      if (hp <= 0) return Math.floor(max * 0.5);
      return Math.min(max, hp + 15);
    }));
    setMemberShield(prev => prev.map(s => s + 5));
    setMemberSp(prev => prev.map(sp => Math.min(100, sp + 20)));
    // Keep ultimate across waves
    setAmplifierHealCooldown(0);
    setAttackerBuffTurns(0);
    setCorrosionTurns(0);
    setAmplifierAtkBuffCooldown(0);
  };

  const endReception = () => {
    if (finalScore !== null) return;
    const totalCur = memberHp.slice(0, teamMembers.length).reduce((a, b) => a + b, 0);
    const totalMax = memberMaxHp.slice(0, teamMembers.length).reduce((a, b) => a + b, 0);
    const hpPct = totalMax > 0 ? totalCur / totalMax : 0;
    const speedBonus = waveTimings.reduce((sum, wt) => sum + (-wt.delta) * 150, 0);
    const score = Math.max(0, (wave - 1) * 5000 + totalEnemiesDefeated * 2000 + Math.floor(hpPct * 100000) + speedBonus + bossesDefeated * BOSS_SCORE_BONUS);
    setFinalScore(score);
    setPhase('finished');

    if (activeZone && !isAdmin) {
      submitZoneScore(activeZone, score, currentWeek);
      if (user && crRegion) {
        submitScore({
          userId: user.id,
          region: crRegion,
          week: currentWeek,
          zone: activeZone,
          score,
          squad: crSquad,
          merit: crMerit,
          reputation: crReputation,
        }).catch(err => console.warn('Score submit to backend failed (saved locally only):', err));
      }
    } else if (isAdmin) {
      addLog(`[ADMIN] Score ${score} would have been submitted but was not recorded (admin mode).`);
    }

    addManagerExp(25 + wave * 5);
    addThreads(50);
  };

  const handleZoneSelect = (zone: ZoneElement) => {
    setActiveZone(zone);
    setPhase('teamSelect');
  };

  // ─── Passive auto-select (data-driven) ────────────────────────────
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
          // Trigger playerAct automatically?
          // The original code used playerAct(); but we need to ensure we send the action.
          // We'll call selectSkill which will send the skill selection.
          selectSkill(randomIdx);
        }, 300);
      } else {
        setPassiveActivating(false);
      }
    }, 600);
  }, [phase, turn, enemies, passiveActivating, identityData, playerSkills]);

  // ─── findMatch button handler ──────────────────────────────────────
  const findMatch = () => {
    if (!user) return;
    const playerData = buildPlayerData();
    if (!playerData) return;
    sendAction('findMatch', playerData);
    addLog('[SYSTEM] Finding match...');
  };

  const cancelMatch = () => {
    sendAction('cancelMatch', {});
    setQueued(false);
    addLog('[SYSTEM] Match search cancelled.');
  };

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070a14] text-white font-sans">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      <div className="relative z-10 max-w-6xl mx-auto p-4 space-y-4">

        {/* ─── HEADER ─── */}
        <TacticalPanel variant="accent" glow header="OPERATION: COMPETITIVE RECEPTION"
          headerRight={
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-[#4a5568]">Best Score</p>
              <p className="text-2xl font-bold font-mono text-[#00d4ff]" style={{ textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>
                {competitiveScore.toLocaleString()}
              </p>
            </div>
          }
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#00d4ff] animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
            <p className="text-xs text-[#8b9bb4] tracking-wider">TURN-BASED CLASH COMBAT · WEEKLY DUNGEON PROTOCOL</p>
          </div>
        </TacticalPanel>

        {/* ─── TEAM SELECT ─── */}
        {phase === 'teamSelect' && (
          <div className="space-y-4">
            <TacticalPanel variant="accent" header="SQUAD COMPOSITION">
              <TeamSelector
                onReady={() => setPhase('preparing')}
                availableIds={competitiveAvailableIds}
                competitive={true}
              />
            </TacticalPanel>
          </div>
        )}

        {/* ─── PREPARING ─── */}
        {phase === 'preparing' && activeZone && (
          <div className="space-y-4">
            <TacticalPanel variant="accent" glow header="MISSION BRIEFING">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-2 border-[#00d4ff]/40 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                    <div className="absolute -inset-1 border border-[#00d4ff]/20 animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                    <span className="text-3xl">{DAMAGE_TYPE_INFO[activeZone]?.icon || '⚔️'}</span>
                  </div>
                </div>
                <div>
                  <h2 className={`text-3xl font-bold tracking-wider text-[#00d4ff]`} style={{ textShadow: '0 0 15px rgba(0,212,255,0.4)' }}>
                    {activeZone.toUpperCase()} ZONE
                  </h2>
                  <p className="text-sm text-[#8b9bb4] mt-1">ENEMIES RESIST <span className="text-[#ff9e00] font-bold">{activeZone.toUpperCase()}</span> — DEPLOY COUNTER-ELEMENT UNITS</p>
                  <p className="text-xs text-[#4a5568] mt-1">
                    {DAMAGE_TYPE_INFO[activeZone]?.icon || ''} {activeZone} damage type
                  </p>
                </div>
              </div>
            </TacticalPanel>

            {/* Crushing Weight Toggle */}
            <TacticalPanel variant="warning" header="TACTICAL MODIFIER">
              <div className="flex items-start gap-4">
                <div className="relative mt-1">
                  <input type="checkbox" checked={specialDebuffActive} onChange={toggleSpecialDebuff} className="w-5 h-5 accent-[#ff9e00] cursor-pointer" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-bold text-[#ff9e00] tracking-wider cursor-pointer uppercase">⚖️ CRUSHING WEIGHT PROTOCOL</label>
                  <p className="text-xs text-[#8b9bb4] mt-1 leading-relaxed">
                    Increase Bleed chance to <span className="text-[#ff9e00] font-bold">20%</span> (from 3%). Enable <span className="text-[#ff9e00] font-bold">Dull stacks</span>.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`w-2 h-2 ${specialDebuffActive ? 'bg-[#05ffa1]' : 'bg-[#ff2a6d]'}`} style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                    <span className={`text-xs font-mono ${specialDebuffActive ? 'text-[#05ffa1]' : 'text-[#ff2a6d]'}`}>STATUS: {specialDebuffActive ? 'ACTIVE' : 'INACTIVE'}</span>
                  </div>
                </div>
              </div>
            </TacticalPanel>

            {/* Deployed Team */}
            <TacticalPanel header="DEPLOYED SQUAD">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {teamMembers.length === 0 && <div className="col-span-3 text-center py-8 text-[#4a5568]"><p className="text-sm">NO UNITS DEPLOYED</p></div>}
                {teamMembers.map((tm, i) => {
                  const ms = scaledStats(tm.data, tm.owned.level, tm.owned.classSkillLevel ?? 1);
                  const giftStatsForMember = getTotalGiftStats(tm.data.id);
                  const totalHp = ms.hp + giftStatsForMember.hp;
                  const totalAtk = ms.atk + giftStatsForMember.atk;
                  const totalDef = ms.def + giftStatsForMember.def;
                  const classCat = getClassCategory(tm.data.id);
                  const dmgType = tm.data.element;
                  const infusion = tm.data.baseInfusion || 'Slash';
                  return (
                    <div key={i} className="bg-[#0f1525] border border-[#1a2332] p-3 relative group hover:border-[#00d4ff]/30 transition-all" style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                      <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-[#00d4ff]/20 border-l-[20px] border-l-transparent" />
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#1a2332] flex items-center justify-center text-2xl" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>{tm.data.portrait}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{tm.data.name}</p>
                          <p className="text-[10px] text-[#8b9bb4] flex items-center gap-1">Lv.{tm.owned.level} · {classCat.toUpperCase()}</p>
                          <div className="flex gap-2 mt-1 text-[10px] font-mono">
                            <span className="text-[#ff2a6d]">HP {totalHp}</span>
                            <span className="text-[#00d4ff]">ATK {totalAtk}</span>
                            <span className="text-[#05ffa1]">DEF {totalDef}</span>
                          </div>
                          <div className="flex gap-1 mt-0.5 text-[8px] text-[#4a5568]">
                            <span>{DAMAGE_TYPE_INFO[dmgType]?.icon || ''} {dmgType}</span>
                            <span>·</span>
                            <span>{INFUSION_INFO[infusion]?.icon || ''} {infusion}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TacticalPanel>

            <div className="grid grid-cols-2 gap-3">
              <TacticalPanel className="text-center"><TacticalStat label="Best Score (This Zone)" value={(crZoneScores[activeZone] || 0).toLocaleString()} color="warning" /></TacticalPanel>
              <TacticalPanel className="text-center"><TacticalStat label="Time Limit" value="05:00" color="accent" /></TacticalPanel>
            </div>

            <div className="flex gap-3">
              <TacticalButton onClick={() => setPhase('teamSelect')} variant="neutral" className="flex-none">← CHANGE SQUAD</TacticalButton>
              <TacticalButton onClick={startReception} disabled={teamMembers.length === 0} variant="primary" size="lg" className="flex-1">⚔️ INITIATE BATTLE</TacticalButton>
            </div>
          </div>
        )}

        {/* ─── IDLE PHASE — MAIN MENU ─── */}
        {phase === 'idle' && (
          <>
            {!crRegion ? (
              <div className="space-y-4">
                <TacticalPanel variant="warning" glow className="text-center py-8">
                  <div className="text-5xl mb-4">🌍</div>
                  <h2 className="text-2xl font-bold text-white tracking-wider">SELECT SERVER REGION</h2>
                  <p className="text-sm text-[#ff9e00] font-bold mt-2 tracking-wider uppercase">⚠ This choice is permanent</p>
                  <p className="text-xs text-[#8b9bb4] mt-2 max-w-md mx-auto">
                    Your region is locked to your Discord account. Bracket, leaderboard standings, and weekly progress are all tied to this region.
                  </p>
                </TacticalPanel>

                <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {CR_REGIONS.map(r => (
                    <button key={r.id} onClick={() => confirmRegion(r.id)} disabled={regionSyncing}
                      className="group relative p-4 border border-[#1a2332] bg-[#0f1525] hover:border-[#00d4ff]/50 hover:bg-[#00d4ff]/5 transition-all text-left disabled:opacity-50"
                      style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
                      <div className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-t-[#00d4ff]/0 group-hover:border-t-[#00d4ff]/20 border-l-[24px] border-l-transparent transition-all" />
                      <p className="text-3xl">{r.flag}</p>
                      <p className="mt-2 text-lg font-bold text-white">{r.label}</p>
                      <p className="text-[10px] text-[#4a5568] font-mono">SERVER: {r.id}</p>
                      <p className="mt-2 text-[10px] text-[#00d4ff] font-bold tracking-wider">
                        {regionSyncing ? 'LOCKING...' : 'CLICK TO SELECT →'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // ─── Main menu when region is set ──────────────────────
              <div className="space-y-4">
                <TacticalPanel variant="accent" glow header="WEEKLY RECEPTION STATUS"
                  headerRight={<div className="text-right"><p className="text-[10px] text-[#4a5568] uppercase tracking-wider">{weekRange}</p></div>}
                >
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className={`bg-[#1a2332] border border-[#2a3a4a] p-3 text-center min-w-[100px]`}
                         style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                      <p className="text-3xl">{squadInfo.badgeIcon}</p>
                      <p className={`text-sm font-bold mt-1 ${squadInfo.textClass || 'text-[#00d4ff]'}`}>{crSquad.toUpperCase()}</p>
                      <p className="text-[10px] text-[#4a5568] tracking-wider">SQUAD</p>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-xs text-[#00d4ff] uppercase tracking-wider">Weekly Total Score</p>
                      <p className="text-3xl font-bold font-mono text-[#00d4ff]" style={{ textShadow: '0 0 15px rgba(0,212,255,0.4)' }}>
                        {weeklyTotal.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="text-[#4a5568]">Region:</span>
                        <span className="text-white font-bold">{CR_REGIONS.find(r => r.id === crRegion)?.flag} {CR_REGIONS.find(r => r.id === crRegion)?.label}</span>
                        {crRegionLocked && <span className="text-[10px] text-[#ff9e00]" title="Region permanently locked">🔒 LOCKED</span>}
                      </div>
                      <div className="mt-2 flex gap-4 text-xs">
                        <div><span className="text-[#4a5568]">Merit:</span><span className="ml-1 text-[#00d4ff] font-mono font-bold">{crMerit}/100</span></div>
                        <div><span className="text-[#4a5568]">Reputation:</span><span className="ml-1 text-[#05ffa1] font-mono font-bold">{crReputation}/2</span></div>
                      </div>
                      {recommendedSquad !== crSquad && <p className="mt-1 text-[10px] text-[#ff9e00]">💡 Recommended: {recommendedSquad.toUpperCase()}</p>}
                    </div>
                  </div>

                  {/* Navigation Tabs */}
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {[
                      { key: 'menu' as const, label: '⚔ ZONES', color: 'rose' },
                      { key: 'bracket' as const, label: '🛡 BRACKET', color: 'violet' },
                      { key: 'pointsRanking' as const, label: '🏆 POINTS', color: 'amber' },
                      { key: 'gradeReward' as const, label: '🎁 REWARD', color: 'emerald' },
                    ].map(tab => (
                      <button key={tab.key} onClick={() => setCrView(tab.key)}
                        className={`py-2.5 text-xs font-bold tracking-wider transition-all border ${
                          crView === tab.key ? 'bg-[#00d4ff]/20 border-[#00d4ff]/60 text-[#00d4ff]' : 'bg-[#0f1525] border-[#1a2332] text-[#4a5568] hover:border-[#00d4ff]/30 hover:text-[#8b9bb4]'
                        }`}
                        style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </TacticalPanel>

                {/* BRACKET VIEW */}
                {crView === 'bracket' && (
                  <TacticalPanel variant="accent" header={`${squadInfo.badgeIcon} ${crSquad.toUpperCase()} SQUAD — BRACKET`}>
                    <div className="flex gap-2 text-[10px] mb-3 flex-wrap">
                      {squadInfo.promotionRange && (
                        <span className="px-2 py-1 border border-[#05ffa1]/30 bg-[#05ffa1]/10 text-[#05ffa1] font-bold tracking-wider"
                              style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                          🚀 PROMOTION #{squadInfo.promotionRange[0]}–{squadInfo.promotionRange[1]} (+{squadInfo.promoteReward} MERIT)
                        </span>
                      )}
                      <span className="px-2 py-1 border border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff] font-bold tracking-wider"
                            style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                        🛡 DEFENDING #{squadInfo.defendingRange[0]}–{squadInfo.defendingRange[1]} (+{squadInfo.defendReward} MERIT)
                      </span>
                      {squadInfo.demotionRange && (
                        <span className="px-2 py-1 border border-[#ff2a6d]/30 bg-[#ff2a6d]/10 text-[#ff2a6d] font-bold tracking-wider"
                              style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                          ⬇ DEMOTION #{squadInfo.demotionRange[0]}–{squadInfo.demotionRange[1]} (+{squadInfo.demoteReward} MERIT)
                        </span>
                      )}
                    </div>

                    {usingMockData && (
                      <div className="mb-2 px-2 py-1 border border-[#ff9e00]/30 bg-[#ff9e00]/10 text-[#ff9e00] text-[10px] font-bold tracking-wider inline-block"
                           style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                        ⚠ OFFLINE MODE — SIMULATED DATA
                      </div>
                    )}

                    {bracketLoading && (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] animate-spin mx-auto mb-2"
                             style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                        <p className="text-xs text-[#4a5568]">LOADING BRACKET DATA...</p>
                      </div>
                    )}
                    {bracketError && !usingMockData && (
                      <div className="text-center py-8 text-[#ff2a6d]"><p className="text-sm">⚠ CONNECTION ERROR: {bracketError}</p></div>
                    )}
                    {!bracketLoading && bracketEntries && bracketEntries.length === 0 && (
                      <div className="text-center py-8 text-[#4a5568]"><p className="text-sm">NO COMBATANTS IN BRACKET</p><p className="text-[10px] mt-1">Submit a score to appear here</p></div>
                    )}
                    {!bracketLoading && bracketEntries && bracketEntries.length > 0 && (
                      <div className="space-y-1 max-h-96 overflow-y-auto">
                        {bracketEntries.map(e => {
                          const isPlayer = !!user && e.userId === user.id;
                          const isPromote = squadInfo.promotionRange && e.rank >= squadInfo.promotionRange[0] && e.rank <= squadInfo.promotionRange[1];
                          const isDefend = e.rank >= squadInfo.defendingRange[0] && e.rank <= squadInfo.defendingRange[1];
                          const isDemote = squadInfo.demotionRange && e.rank >= squadInfo.demotionRange[0] && e.rank <= squadInfo.demotionRange[1];
                          const indicator = isPromote ? '🚀' : isDefend ? '🛡' : isDemote ? '⬇' : '·';
                          const bg = isPlayer ? 'bg-[#00d4ff]/10 border-[#00d4ff]/40' : isPromote ? 'bg-[#05ffa1]/5' : isDefend ? 'bg-[#00d4ff]/5' : 'bg-[#0f1525]';
                          return (
                            <div key={e.userId} className={`p-2 flex items-center gap-2 text-xs border ${bg}`}
                                 style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                              <span className={`font-bold font-mono w-8 text-right ${e.rank <= 3 ? 'text-[#ff9e00]' : 'text-[#4a5568]'}`}>#{e.rank}</span>
                              <span className="text-[#8b9bb4]">{indicator}</span>
                              <span className="text-lg">{e.isGuest ? '👤' : '🌗'}</span>
                              <div className="flex-1 min-w-0"><p className="text-white truncate font-medium">{e.name}{isPlayer && <span className="text-[#00d4ff] ml-1">[YOU]</span>}</p></div>
                              <span className="text-[#ff9e00] font-mono font-bold text-right">{e.score.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TacticalPanel>
                )}

                {/* POINTS RANKING VIEW */}
                {crView === 'pointsRanking' && (
                  <TacticalPanel variant="warning" header={`🏆 POINTS RANKING — ${crRegion}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-[#4a5568]">{weekRange} · Personal points across region</p>
                      {usingMockData && (
                        <span className="px-2 py-1 border border-[#ff9e00]/30 bg-[#ff9e00]/10 text-[#ff9e00] text-[10px] font-bold tracking-wider"
                              style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                          ⚠ OFFLINE MODE
                        </span>
                      )}
                    </div>

                    {rankingLoading && (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-[#ff9e00]/30 border-t-[#ff9e00] animate-spin mx-auto mb-2"
                             style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                        <p className="text-xs text-[#4a5568]">LOADING RANKING DATA...</p>
                      </div>
                    )}
                    {rankingError && !usingMockData && (
                      <div className="text-center py-8 text-[#ff2a6d]"><p className="text-sm">⚠ CONNECTION ERROR: {rankingError}</p></div>
                    )}
                    {!rankingLoading && rankingTop && rankingTop.length === 0 && (
                      <div className="text-center py-8 text-[#4a5568]"><p className="text-sm">NO SCORES SUBMITTED THIS WEEK</p></div>
                    )}
                    {!rankingLoading && rankingTop && rankingTop.length > 0 && (
                      <div className="space-y-1 max-h-80 overflow-y-auto">
                        {rankingTop.map(e => {
                          const rankColor = e.rank === 1 ? 'text-[#ff2a6d]' : e.rank === 2 ? 'text-[#00d4ff]' : e.rank === 3 ? 'text-[#05ffa1]' : 'text-[#4a5568]';
                          const isPlayer = !!user && e.userId === user.id;
                          return (
                            <div key={e.userId} className={`p-2 flex items-center gap-2 text-xs border ${isPlayer ? 'bg-[#00d4ff]/10 border-[#00d4ff]/40' : 'bg-[#0f1525] border-[#1a2332]'}`}
                                 style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                              <span className={`font-bold font-mono w-10 text-right ${rankColor}`}>{e.rank}</span>
                              <span className="text-lg">{e.isGuest ? '👤' : '🌗'}</span>
                              <div className="flex-1 min-w-0"><p className="text-white truncate font-medium">{e.name}{isPlayer && <span className="text-[#00d4ff] ml-1">[YOU]</span>}</p></div>
                              <div className="text-right"><p className="text-[10px] text-[#4a5568]">Personal Points</p><p className="text-[#ff9e00] font-mono font-bold">{e.score.toLocaleString()}</p></div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {!rankingLoading && rankingPlayerEntry && (
                      <div className="mt-2 pt-2 border-t border-[#1a2332]">
                        <div className="p-2 flex items-center gap-2 text-xs border bg-[#00d4ff]/10 border-[#00d4ff]/40"
                             style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                          <span className="font-bold text-[#00d4ff] font-mono w-10 text-right text-xs">
                            {rankingPlayerEntry.rank <= 100 ? `#${rankingPlayerEntry.rank}` : rankingPlayerEntry.percentile}
                          </span>
                          <span className="text-lg">🌗</span>
                          <div className="flex-1 min-w-0"><p className="text-white truncate font-medium">{rankingPlayerEntry.name} [YOU]</p><p className="text-[10px] text-[#4a5568]">Rank #{rankingPlayerEntry.rank}</p></div>
                          <div className="text-right"><p className="text-[10px] text-[#4a5568]">Personal Points</p><p className="text-[#00d4ff] font-mono font-bold">{rankingPlayerEntry.score.toLocaleString()}</p></div>
                        </div>
                      </div>
                    )}
                    {!rankingLoading && !rankingError && !rankingPlayerEntry && (
                      <p className="mt-2 text-[10px] text-[#4a5568] text-center">Submit a score to appear on the leaderboard</p>
                    )}
                  </TacticalPanel>
                )}

                {/* GRADE REWARD VIEW */}
                {crView === 'gradeReward' && (
                  <TacticalPanel variant="success" header="🎁 GRADE REWARD">
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {(['Beginner', 'Amateur', 'Expert', 'Professional'] as Squad[]).map(s => {
                        const info = SQUAD_INFO[s];
                        const isCurrent = s === crSquad;
                        return (
                          <div key={s} className={`p-2 text-center border transition-all ${isCurrent ? `${info.borderClass || 'border-[#00d4ff]/40'} ${info.bgClass || 'bg-[#00d4ff]/10'} ring-1 ring-white/20` : 'border-[#1a2332] bg-[#0f1525]'}`}
                               style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}>
                            <p className="text-2xl">{info.badgeIcon}</p>
                            <p className={`text-xs font-bold ${info.textClass || 'text-[#8b9bb4]'} mt-1`}>{s.toUpperCase()}</p>
                            <p className="text-[10px] text-[#4a5568]">{info.members} members</p>
                            {isCurrent && <p className="text-[10px] text-[#00d4ff] font-bold mt-0.5 tracking-wider">CURRENT</p>}
                          </div>
                        );
                      })}
                    </div>

                    <TacticalPanel header="REWARD BREAKDOWN">
                      {squadInfo.promotionRange && (
                        <div className="flex items-center justify-between text-xs mb-2 py-1 border-b border-[#1a2332]">
                          <span className="text-[#05ffa1] font-bold">🚀 PROMOTION (#{squadInfo.promotionRange[0]}–{squadInfo.promotionRange[1]})</span>
                          <span className="text-[#ff9e00] font-mono font-bold">+{squadInfo.promoteReward} MERIT · 🧵 1500 · 💉 200</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs mb-2 py-1 border-b border-[#1a2332]">
                        <span className="text-[#00d4ff] font-bold">🛡 DEFENDING (#{squadInfo.defendingRange[0]}–{squadInfo.defendingRange[1]})</span>
                        <span className="text-[#ff9e00] font-mono font-bold">+{squadInfo.defendReward} MERIT · 🧵 1000 · 💉 100</span>
                      </div>
                      {squadInfo.demotionRange && (
                        <div className="flex items-center justify-between text-xs py-1">
                          <span className="text-[#ff2a6d] font-bold">⬇ DEMOTION (#{squadInfo.demotionRange[0]}–{squadInfo.demotionRange[1]})</span>
                          <span className="text-[#8b9bb4] font-mono font-bold">+{squadInfo.demoteReward} MERIT · 🧵 200</span>
                        </div>
                      )}
                    </TacticalPanel>

                    <div className="mt-3 space-y-1 text-[10px] text-[#4a5568]">
                      <p><span className="text-[#00d4ff] font-bold">Auto Promotion:</span> Top 3 in bracket promotes automatically (free).</p>
                      <p><span className="text-[#ff9e00] font-bold">Exception:</span> Expert → Professional requires 100 Merit.</p>
                      <p><span className="text-[#00d4ff] font-bold">Merit:</span> Earned per zone clear. Cap 100. Used for Expert→Pro.</p>
                      <p><span className="text-[#05ffa1] font-bold">Reputation:</span> Clear all 3 zones weekly (cap 2). Spend 1 to avoid demotion.</p>
                    </div>

                    {crSquad === 'Expert' && (
                      <TacticalButton onClick={promoteSquad} disabled={crMerit < 100} variant="primary" className="w-full mt-3">
                        🚀 ADVANCE TO PROFESSIONAL (100 MERIT) {crMerit < 100 && `— NEED ${100 - crMerit} MORE`}
                      </TacticalButton>
                    )}
                    {crReputation > 0 && (
                      <TacticalButton onClick={consumeReputation} variant="success" className="w-full mt-2">
                        💚 SPEND 1 REPUTATION TO LOCK SQUAD ({crReputation} AVAILABLE)
                      </TacticalButton>
                    )}
                  </TacticalPanel>
                )}

                {/* ZONE MENU VIEW */}
                {crView === 'menu' && (
                  <TacticalPanel header="⚔ WEEKLY RECEPTION ZONES">
                    <p className="text-xs text-[#8b9bb4] mb-4">
                      SELECT A ZONE TO CHALLENGE. ENEMIES <span className="text-[#ff9e00] font-bold">RESIST THEIR ZONE'S DAMAGE TYPE</span> — BRING COUNTER-ELEMENT UNITS.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {weeklyZones.map(z => {
                        const dmgInfo = DAMAGE_TYPE_INFO[z] || { icon: '⚔️' };
                        const score = crZoneScores[z] || 0;
                        const completed = crCompletedZones.includes(z);
                        const infusionInfo = INFUSION_INFO[z === 'Red' ? 'Slash' : z === 'Pale' ? 'Pierce' : 'Blunt'] || { icon: '🗡️' };
                        return (
                          <button key={z} onClick={() => handleZoneSelect(z)}
                            className={`group relative p-4 border text-left transition-all ${completed ? 'border-[#05ffa1]/40 bg-[#05ffa1]/5 hover:border-[#05ffa1]/60' : 'border-[#1a2332] bg-[#0f1525] hover:border-[#00d4ff]/40 hover:bg-[#00d4ff]/5'}`}
                            style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}>
                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[30px] border-t-[#00d4ff]/0 group-hover:border-t-[#00d4ff]/20 border-l-[30px] border-l-transparent transition-all" />
                            <div className="text-center">
                              <div className="w-16 h-16 mx-auto border border-[#1a2332] flex items-center justify-center bg-[#0a0e14] text-3xl"
                                   style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                                {dmgInfo.icon}
                              </div>
                              <h3 className={`mt-3 font-bold tracking-wider text-[#00d4ff]`}>{z.toUpperCase()} ZONE</h3>
                              <p className="text-[10px] text-[#4a5568] mt-1">RESISTS {z.toUpperCase()}</p>
                              <p className="text-[9px] text-[#4a5568]">{infusionInfo.icon} {Object.keys(INFUSION_INFO).find(k => INFUSION_INFO[k].icon === infusionInfo.icon) || 'Slash'} infusion</p>
                            </div>
                            <div className="mt-3 pt-3 border-t border-[#1a2332]">
                              <p className="text-[10px] uppercase tracking-wider text-[#4a5568]">Best Score</p>
                              <p className={`text-xl font-bold font-mono ${score > 0 ? 'text-[#ff9e00]' : 'text-[#4a5568]'}`}>{score.toLocaleString()}</p>
                              {completed && <p className="text-[10px] text-[#05ffa1] mt-1 font-bold tracking-wider">✓ ATTEMPTED — RETRY TO IMPROVE</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-[10px] text-[#4a5568]">
                      <span>🪙 NORMAL: FREE, +10 SP ON WIN</span>
                      <span>⚡ EGO: 40 SP</span>
                      <span>🔥 1.5× WEAK / 0.5× RESIST (Damage Type & Infusion)</span>
                    </div>
                  </TacticalPanel>
                )}
              </div>
            )}
          </>
        )}

        {/* ─── FIGHTING / WAVE CLEAR PHASE ─── */}
        {(phase === 'fighting' || phase === 'waveClear') && (
          <div className="space-y-3">
            {/* Top HUD Bar */}
            <div className="grid grid-cols-6 gap-2">
              <TacticalPanel className="text-center py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#4a5568]">⏱ Time</p>
                <p className={`font-mono font-bold text-lg ${timeLeft < 60 ? 'text-[#ff2a6d] animate-pulse' : 'text-[#00d4ff]'}`}
                   style={timeLeft < 60 ? { textShadow: '0 0 10px rgba(255,42,109,0.5)' } : {}}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</p>
              </TacticalPanel>
              <TacticalPanel className="text-center py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#4a5568]">🌊 Wave</p>
                <p className="font-mono font-bold text-lg text-[#00d4ff]">{wave}</p>
                {isBossWave(wave) && <span className="text-[9px] text-[#ff9e00] font-bold tracking-wider">⚠ BOSS</span>}
              </TacticalPanel>
              <TacticalPanel className="text-center py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#4a5568]">💀 Kills</p>
                <p className="font-mono font-bold text-lg text-[#ff9e00]">{totalEnemiesDefeated}</p>
              </TacticalPanel>
              <TacticalPanel className="text-center py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#4a5568]">❤️ HP</p>
                <p className={`font-mono font-bold text-lg ${playerHp < 25 ? 'text-[#ff2a6d]' : 'text-[#05ffa1]'}`}>{Math.round((playerHp/playerMaxHp)*100)}%</p>
              </TacticalPanel>
              <TacticalPanel className="text-center py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#4a5568]">⚡ SP</p>
                <p className={`font-mono font-bold text-lg ${spBar >= 40 ? 'text-[#00d4ff]' : 'text-[#4a5568]'}`}>{spBar}</p>
              </TacticalPanel>
              <TacticalPanel className="text-center py-2">
                <p className="text-[9px] uppercase tracking-widest text-[#4a5568]">🔮 ULT</p>
                <p className="font-mono font-bold text-lg text-amber-400">{Math.round(ultimateBar)}%</p>
              </TacticalPanel>
            </div>

            {/* Team Status Panel */}
            <TacticalPanel header="SQUAD STATUS">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {teamMembers.map((tm, i) => {
                  const hp = memberHp[i] ?? 0; const maxHp = memberMaxHp[i] ?? 100; const sp = memberSp[i] ?? 0; const ult = memberUltimate[i] ?? 0;
                  const shield = memberShield[i] ?? 0; const isActive = i === activeIdx; const isDead = hp <= 0;
                  const hpPct = maxHp > 0 ? (hp / maxHp) * 100 : 0;
                  return (
                    <div key={i} className={`relative p-2 border transition-all ${isActive ? 'border-[#00d4ff]/50 bg-[#00d4ff]/5' : isDead ? 'border-[#ff2a6d]/30 bg-[#ff2a6d]/5 opacity-50' : 'border-[#1a2332] bg-[#0f1525]'}`}
                         style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}>
                      {isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00d4ff] animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />}
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 flex items-center justify-center text-lg ${isDead ? 'grayscale' : ''}`} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>{tm.data.portrait}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-bold truncate">{tm.data.name}</p>
                          <div className="flex items-center gap-1 text-[9px]">
                            <span className={hpPct < 25 ? 'text-[#ff2a6d]' : 'text-[#8b9bb4]'}>HP {Math.round(hpPct)}%</span>
                            {shield > 0 && <span className="text-[#00d4ff]">🛡{shield}</span>}
                            <span className="text-[#8b9bb4]">SP {sp}</span>
                            <span className="text-amber-400">ULT {Math.round(ult)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-1.5 h-1 bg-[#1a2332] relative overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 2px) 0, 100% 2px, 100% 100%, 2px 100%, 0 calc(100% - 2px))' }}>
                        <div className={`h-full transition-all duration-500 ${hpPct < 25 ? 'bg-[#ff2a6d]' : hpPct < 50 ? 'bg-[#ff9e00]' : 'bg-[#05ffa1]'}`} style={{ width: `${hpPct}%`, boxShadow: `0 0 8px ${hpPct < 25 ? 'rgba(255,42,109,0.5)' : hpPct < 50 ? 'rgba(255,158,0,0.5)' : 'rgba(5,255,161,0.5)'}` }} />
                      </div>
                      <div className="mt-0.5 h-0.5 bg-[#1a2332]"><div className="h-full bg-[#00d4ff] transition-all" style={{ width: `${sp}%` }} /></div>
                      <div className="mt-0.5 h-0.5 bg-[#1a2332]"><div className="h-full bg-amber-400 transition-all" style={{ width: `${ult}%` }} /></div>
                      {shield > 0 && <div className="mt-0.5 h-0.5 bg-[#1a2332]"><div className="h-full bg-[#00d4ff]/60" style={{ width: `${Math.min(100, (shield / maxHp) * 100)}%` }} /></div>}
                    </div>
                  );
                })}
              </div>
            </TacticalPanel>

            {/* Active Construct Debuff Profile - Updated for damage type/infusion */}
            {activeMember && identityData && (
              <TacticalPanel variant="accent" header="ACTIVE CONSTRUCT — DEBUFF PROTOCOL">
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-[#1a2332] p-3 bg-[#0f1525]" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#00d4ff]">{identityData.element}</span>
                      <span>{DAMAGE_TYPE_INFO[identityData.element]?.icon || ''}</span>
                    </div>
                    <p className="text-[10px] text-[#8b9bb4] mt-1">{DAMAGE_DEBUFFS[identityData.element]?.name}</p>
                    <p className="text-[10px] text-[#8b9bb4]">{DAMAGE_DEBUFFS[identityData.element]?.effect}</p>
                  </div>
                  <div className="border border-[#1a2332] p-3 bg-[#0f1525]" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#ff9e00]">{getClassCategory(identityData.id)}</span>
                    </div>
                    <p className="text-[10px] text-[#8b9bb4] mt-1">{identityData.baseInfusion || 'Slash'}</p>
                    <p className="text-[10px] text-[#8b9bb4]">{INFUSION_DEBUFFS[identityData.baseInfusion || 'Slash']?.effect || 'No infusion debuff'}</p>
                  </div>
                </div>
              </TacticalPanel>
            )}

            {/* Enemy Targeting - Updated for damage type/infusion */}
            <TacticalPanel header="HOSTILE TARGETS">
              <p className="text-[10px] uppercase tracking-wider text-[#4a5568] mb-2">🎯 Click to target</p>
              <div className="space-y-2">
                {enemies.map((enemy, i) => {
                  const isSelected = i === selectedEnemyIndex && enemy.hp > 0;
                  const hpPct = enemy.maxHp > 0 ? (enemy.hp / enemy.maxHp) * 100 : 0;
                  const status = enemy.bossMechanic?.getDisplayStatus ? enemy.bossMechanic.getDisplayStatus(enemy) : null;
                  return (
                    <div key={i} onClick={() => enemy.hp > 0 && setSelectedEnemyIndex(i)}
                         className={`relative p-3 border cursor-pointer transition-all ${isSelected ? 'border-[#00d4ff]/60 bg-[#00d4ff]/5' : enemy.hp > 0 ? 'border-[#1a2332] bg-[#0f1525] hover:border-[#00d4ff]/30' : 'border-[#1a2332]/50 bg-[#0a0e14] opacity-40'}`}
                         style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00d4ff]" style={{ boxShadow: '0 0 10px rgba(0,212,255,0.5)' }} />}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 flex items-center justify-center text-xl ${enemy.isBoss ? 'bg-[#ff9e00]/20' : 'bg-[#1a2332]'}`} style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>{enemy.portrait}</div>
                          <div>
                            <p className="text-sm font-bold text-white flex items-center gap-2">
                              {enemy.name}
                              {enemy.isBoss && <span className="text-[9px] text-[#ff9e00] font-bold tracking-wider border border-[#ff9e00]/40 px-1.5 py-0.5" style={{ clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))' }}>BOSS</span>}
                            </p>
                            <p className="text-[10px] text-[#8b9bb4]">
                              {DAMAGE_TYPE_INFO[enemy.damageType]?.icon || ''} {enemy.damageType} · 
                              {INFUSION_INFO[enemy.infusion]?.icon || ''} {enemy.infusion}
                              · Resists: {enemy.resistDamageType} / {enemy.resistInfusion}
                            </p>
                            {enemy.isBoss && enemy.bossMechanic && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-sm">{enemy.bossMechanic.icon}</span>
                                <span className="text-[10px] text-[#ff9e00] font-bold">{enemy.bossMechanic.name}</span>
                                <span className="text-[10px] text-[#8b9bb4]">{enemy.bossMechanic.description}</span>
                                {status && <span className="text-[10px] text-[#00d4ff] font-mono ml-1">[{status}]</span>}
                              </div>
                            )}
                            {specialDebuffActive && enemy.dullStacks > 0 && <p className="text-[10px] text-[#ff9e00] mt-0.5">🔨 DULL: {enemy.dullStacks}/3</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-mono font-bold ${hpPct < 25 ? 'text-[#ff2a6d]' : 'text-[#ff9e00]'}`}>{Math.round(hpPct)}%</p>
                          {isSelected && <span className="text-[9px] text-[#00d4ff]">⬅ TARGET</span>}
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 bg-[#1a2332] relative overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))' }}>
                        <div className={`h-full transition-all duration-500 ${enemy.isBoss ? 'bg-[#ff9e00]' : 'bg-[#ff2a6d]'}`} style={{ width: `${hpPct}%`, boxShadow: `0 0 10px ${enemy.isBoss ? 'rgba(255,158,0,0.5)' : 'rgba(255,42,109,0.5)'}` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </TacticalPanel>

            {/* Clash Display - Updated multiplier display */}
            {clashData && (
              <TacticalPanel variant="accent" glow className="text-center">
                <p className="text-sm font-bold text-[#00d4ff] tracking-wider uppercase mb-2">⚡ CLASH RESOLVED — {clashData.actorName.toUpperCase()}</p>
                <div className="flex justify-center items-center gap-8">
                  <div className="text-center">
                    <p className="text-[10px] text-[#05ffa1] uppercase tracking-wider">Player</p>
                    <p className="text-3xl font-bold font-mono text-[#05ffa1]" style={{ textShadow: '0 0 15px rgba(5,255,161,0.5)' }}>{clashData.p}</p>
                    <p className="text-[10px] text-[#4a5568]">P:{clashData.ps} C:{playerSkills[selectedSkill]?.coins}</p>
                  </div>
                  <div className="text-[#4a5568] text-xl font-bold">VS</div>
                  <div className="text-center">
                    <p className="text-[10px] text-[#ff2a6d] uppercase tracking-wider">Enemy</p>
                    <p className="text-3xl font-bold font-mono text-[#ff2a6d]" style={{ textShadow: '0 0 15px rgba(255,42,109,0.5)' }}>{clashData.e}</p>
                    <p className="text-[10px] text-[#4a5568]">P:{clashData.es}</p>
                  </div>
                </div>
                <p className="text-[10px] text-[#8b9bb4] mt-2">Multiplier: ×{clashData.mult.toFixed(2)}</p>
              </TacticalPanel>
            )}

            {/* Skill Selection - Updated skill display */}
            {turn === 'player' && phase === 'fighting' && (
              <TacticalPanel header="COMBAT PROTOCOLS">
                <p className="text-xs text-[#8b9bb4] mb-3">
                  SELECT SKILL: <span className="text-[#ff9e00]">EGO</span> COSTS 100% ULTIMATE
                  {ultimateBar < 100 && <span className="text-xs text-amber-400 ml-2">ULT {Math.round(ultimateBar)}%</span>}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {playerSkills.map((skill, i) => {
                    const isEgo = skill.type === 'ego';
                    const canUse = !isEgo || ultimateBar >= 100;
                    return (
                      <button key={i} onClick={() => setSelectedSkill(i)} disabled={!canUse}
                        className={`relative p-3 border text-left transition-all ${selectedSkill === i ? 'border-[#00d4ff]/60 bg-[#00d4ff]/10' : 'border-[#1a2332] bg-[#0f1525] hover:border-[#00d4ff]/30'} ${!canUse ? 'opacity-40 cursor-not-allowed' : ''}`}
                        style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}>
                        {selectedSkill === i && <div className="absolute top-0 right-0 w-0 h-0 border-t-[16px] border-t-[#00d4ff]/40 border-l-[16px] border-l-transparent" />}
                        <span className={`text-[10px] px-1.5 py-0.5 font-bold tracking-wider ${isEgo ? 'bg-[#ff9e00]/20 text-[#ff9e00]' : 'bg-[#1a2332] text-[#8b9bb4]'}`}
                              style={{ clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))' }}>
                          {isEgo ? 'EGO (ULT)' : 'NORM'}
                        </span>
                        <p className="font-bold text-white text-sm mt-1.5">{skill.name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {skill.damageType && <span className="text-[8px] text-[#4a5568]">{DAMAGE_TYPE_INFO[skill.damageType]?.icon || ''} {skill.damageType}</span>}
                          {skill.infusion && <span className="text-[8px] text-[#4a5568]">{INFUSION_INFO[skill.infusion]?.icon || ''} {skill.infusion}</span>}
                        </div>
                        <p className="text-[10px] text-[#4a5568] font-mono mt-0.5">P:{skill.power} C:{skill.coins} · Lv.{skill.skillLevel}</p>
                      </button>
                    );
                  })}
                </div>
                <TacticalButton onClick={playerAct} variant="primary" size="lg" className="w-full">⚔️ EXECUTE CLASH</TacticalButton>
              </TacticalPanel>
            )}

            {turn === 'resolve' && (
              <TacticalButton onClick={resolve} variant="warning" size="lg" className="w-full">▶ CONTINUE (+10 SP)</TacticalButton>
            )}

            {phase === 'waveClear' && (
              <TacticalPanel variant="success" glow className="text-center py-6">
                <p className="text-2xl font-bold text-[#05ffa1] tracking-wider" style={{ textShadow: '0 0 20px rgba(5,255,161,0.5)' }}>✅ WAVE {wave} CLEARED</p>
                <p className="text-sm text-[#8b9bb4] mt-2 font-mono">TIME: {waveElapsed}s / TARGET: {getWaveTarget(wave)}s</p>
                <div className="flex gap-3 mt-4 justify-center">
                  <TacticalButton onClick={nextWave} variant="success" size="lg">NEXT WAVE →</TacticalButton>
                  <TacticalButton onClick={endReception} variant="neutral">END RECEPTION</TacticalButton>
                </div>
              </TacticalPanel>
            )}
          </div>
        )}

        {/* ─── DEFEAT PHASE ─── */}
        {phase === 'defeat' && (
          <TacticalPanel variant="danger" glow className="text-center py-12">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-3xl font-bold text-[#ff2a6d] tracking-wider" style={{ textShadow: '0 0 20px rgba(255,42,109,0.5)' }}>IDENTITY LOST</h2>
            <p className="text-[#8b9bb4] mt-3 font-mono">WAVE {wave} · DEFEATED: {totalEnemiesDefeated}</p>
            <TacticalButton onClick={endReception} variant="danger" size="lg" className="mt-6">END & CALCULATE SCORE</TacticalButton>
          </TacticalPanel>
        )}

        {/* ─── FINISHED PHASE ─── */}
        {phase === 'finished' && finalScore !== null && (
          <TacticalPanel variant="accent" glow className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-white tracking-wider" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>RECEPTION COMPLETE</h2>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-[#4a5568]">Final Score</p>
              <p className="text-5xl font-bold font-mono text-[#00d4ff] mt-1" style={{ textShadow: '0 0 30px rgba(0,212,255,0.5)' }}>{finalScore.toLocaleString()}</p>
              {finalScore > competitiveScore && <p className="text-sm text-[#05ffa1] mt-2 font-bold tracking-wider">🎉 NEW PERSONAL BEST!</p>}
            </div>
            <TacticalButton onClick={startReception} variant="primary" size="lg" className="mt-6">RETRY MISSION</TacticalButton>
          </TacticalPanel>
        )}

        {/* ─── BATTLE LOG ─── */}
        {phase !== 'teamSelect' && phase !== 'preparing' && phase !== 'idle' && (
          <TacticalPanel header="TACTICAL LOG">
            <div className="max-h-40 overflow-y-auto bg-[#0a0e14] p-3 font-mono text-xs space-y-0.5"
                 style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}>
              {log.map((l, i) => (
                <p key={i} className="text-[#4a5568] break-words hover:text-[#8b9bb4] transition-colors">
                  <span className="text-[#00d4ff]/50">[{String(i).padStart(3, '0')}]</span> {l}
                </p>
              ))}
              {waveTimings.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#1a2332] text-[#4a5568]">
                  <p className="text-[10px] font-bold text-[#8b9bb4] uppercase tracking-wider">⏱ Wave Times:</p>
                  {waveTimings.map(wt => (
                    <p key={wt.wave} className="text-[10px] font-mono">W{wt.wave}: {wt.seconds}s / TGT {wt.target}s {wt.delta >= 0 ? '✅' : '⚠'}</p>
                  ))}
                </div>
              )}
            </div>
          </TacticalPanel>
        )}
      </div>
    </div>
  );
}
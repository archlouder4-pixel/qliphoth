// identitiesPassives.ts – Complete identity passives & transformation mechanics
import type { Identity, IdentityPassive, CorePassive, IdentitySkill } from './identities';
import { skillDmgMult } from './identities';

const MAX_CLASH_POWER = 50;

// ─── Context ───────────────────────────────────────────────────────────
export interface IdentityPassiveContext {
  playerHp: number;
  playerMaxHp: number;
  playerAtk: number;
  playerDef: number;
  playerSp: number;
  ultimateBar: number;
  isEgo: boolean;
  isTransformed: boolean;
  isGuarding: boolean;
  turnCount: number;
  waveCount: number;
  stacks: Record<string, number>;
  enemyStacks: Record<string, number>;
  allyCount: number;
  aliveAllyCount: number;
  alliesBelow50Percent: number;
  alliesBelow30Percent: number;
  deadAllyCount: number;
  totalEnemiesDefeated: number;
  totalBossesDefeated: number;
  totalDamageDealt: number;
  totalHealingDone: number;
  totalDamageTaken: number;
  criticalHits: number;
  totalClashWins: number;
  totalClashLosses: number;
  addLog: (msg: string) => void;
  setStack: (name: string, value: number) => void;
  addStack: (name: string, amount: number) => void;
  applyBuff: (name: string, value: number, turns: number) => void;
  applyDebuff: (name: string, value: number, turns: number) => void;
  healAllies: (amount: number) => void;
  dealBonusDamage: (amount: number) => void;
  applyShieldAll: (amount: number) => void;
  getStack: (name: string) => number;
}

export interface IdentityPassiveResult {
  damageBonus: number;
  defenseBonus: number;
  critBonus: number;
  critDamageBonus: number;
  healBonus: number;
  shieldBonus: number;
  speedBonus: number;
  extraStackGain: Record<string, number>;
  stackMultipliers: Record<string, number>;
  unbreakableAllAttacks: boolean;
  freeEgo: boolean;
  autoResolve: boolean;
  preventDeath: boolean;
  reviveOnDeath: boolean;
  onHit?: (ctx: IdentityPassiveContext) => void;
  onHeal?: (ctx: IdentityPassiveContext) => void;
  onAllyDeath?: (ctx: IdentityPassiveContext) => void;
  onGuard?: (ctx: IdentityPassiveContext) => void;
  onTurnStart?: (ctx: IdentityPassiveContext) => void;
  onTurnEnd?: (ctx: IdentityPassiveContext) => void;
  onEgoCast?: (ctx: IdentityPassiveContext) => void;
  onTransformation?: (ctx: IdentityPassiveContext) => void;
  onKill?: (ctx: IdentityPassiveContext) => void;
  onClashWin?: (ctx: IdentityPassiveContext) => void;
  onClashLose?: (ctx: IdentityPassiveContext) => void;
}

const DEFAULT_RESULT: IdentityPassiveResult = {
  damageBonus: 0,
  defenseBonus: 0,
  critBonus: 0,
  critDamageBonus: 0,
  healBonus: 0,
  shieldBonus: 0,
  speedBonus: 0,
  extraStackGain: {},
  stackMultipliers: {},
  unbreakableAllAttacks: false,
  freeEgo: false,
  autoResolve: false,
  preventDeath: false,
  reviveOnDeath: false,
};

// ─── Build transformed skills ────────────────────────────────────────
export interface TransformedSkill {
  name: string;
  description: string;
  type: string;
  basePower: number;
  baseCoins: number;
  powerGrowth: number;
  coinGrowth: number;
  damageType?: string;
  infusion?: string;
  coinType?: string;
  buffEffect?: string;
  isUltimate?: boolean;
  power: number;
  coins: number;
  level: number;
  dmgMult: number;
  skillLevel: number;
  isEgo: boolean;
  isTransformed: boolean;
}

export function buildTransformedSkills(
  identity: Identity,
  playerDamageType?: string,
  playerInfusion?: string
): TransformedSkill[] {
  if (!identity.transformedSkills?.length) return [];
  return identity.transformedSkills.map((s) => {
    const lvl = 1;
    const power = Math.min(s.basePower + s.powerGrowth * (lvl - 1), MAX_CLASH_POWER);
    const coins = s.coinGrowth > 0 ? s.baseCoins + Math.floor((lvl - 1) / s.coinGrowth) : s.baseCoins;
    const dmgMult = skillDmgMult(s.type, lvl);
    return {
      ...s,
      power,
      coins,
      level: lvl,
      dmgMult,
      skillLevel: lvl,
      isEgo: s.type === 'ego',
      isTransformed: true,
      damageType: s.damageType || playerDamageType || identity.element,
      infusion: s.infusion || playerInfusion || identity.baseInfusion || 'Slash',
    };
  });
}

// ─── Transformation trigger check ──────────────────────────────────
export function checkTransformationTrigger(
  identity: Identity,
  ctx: {
    ultimateBar: number;
    isEgo: boolean;
    stacks: Record<string, number>;
    enemyStacks: Record<string, number>;
    allyCount: number;
    deadAllyCount: number;
    totalEnemiesDefeated: number;
    totalDebuffStacks?: number;
    healCumulative?: number;
    damageCumulative?: number;
    criticalHits?: number;
    blockedDamageCumulative?: number;
  }
): { shouldTrigger: boolean; reason?: string } {
  const trigger = identity.transformationTrigger || 'none';
  if (ctx.stacks.isTransformed) return { shouldTrigger: false };

  switch (trigger) {
    case 'timer': {
      const countdown = ctx.stacks.transformationCountdown ?? identity.triggerTurns ?? 10;
      if (countdown <= 0) return { shouldTrigger: true, reason: 'Timer-based transformation triggered.' };
      return { shouldTrigger: false };
    }
    case 'ultimate': {
      if (ctx.isEgo && ctx.ultimateBar >= 100)
        return { shouldTrigger: true, reason: 'Ultimate-based transformation triggered.' };
      return { shouldTrigger: false };
    }
    case 'custom': {
      switch (identity.id) {
        case 'kaelen_dusk_reaper':
          if ((ctx.enemyStacks.shadowMarks || 0) >= 3 && ctx.totalEnemiesDefeated > 0)
            return { shouldTrigger: true, reason: "Twilight's Harvest: Killed enemy with 3+ Shadow Marks!" };
          break;
        case 'seraphina_radiant_martyr':
          if ((ctx.healCumulative || 0) >= 3600 * 2)
            return { shouldTrigger: true, reason: "Martyr's Resolve: Healed 200% of max HP!" };
          break;
        case 'valerius_crimson_reaver':
          if ((ctx.criticalHits || 0) >= 10)
            return { shouldTrigger: true, reason: 'Blood Rush: Landed 10 critical hits!' };
          break;
        case 'morwen_lamenting_tides':
          if ((ctx.blockedDamageCumulative || 0) >= 4800 * 3)
            return { shouldTrigger: true, reason: "Abyssal Endurance: Blocked 300% of max HP!" };
          break;
        case 'ragnar_unchained':
          if ((ctx.damageCumulative || 0) >= 5000 * 2)
            return { shouldTrigger: true, reason: "Berserker's Wrath: Taken 200% of max HP damage!" };
          break;
        case 'orin_echoing_void':
          if ((ctx.totalDebuffStacks || 0) >= 30)
            return { shouldTrigger: true, reason: "Echoing Silence: Applied 30 debuff stacks!" };
          break;
        case 'isolde_mournful':
          if (ctx.deadAllyCount >= 1)
            return { shouldTrigger: true, reason: "Vow of Vengeance: Ally has fallen!" };
          break;
        case 'theron_equilibrium': {
          const buffCount = ctx.allyCount * 2;
          const debuffCount = Object.values(ctx.enemyStacks).reduce((a, b) => a + b, 0);
          if (buffCount > 0 && buffCount === debuffCount)
            return { shouldTrigger: true, reason: 'Perfect Harmony: Buffs equal debuffs!' };
          break;
        }
        case 'siora_crimson_shepherd':
          // Handled separately in components (any ally <25% HP)
          break;
        default:
          break;
      }
      break;
    }
    default:
      break;
  }
  return { shouldTrigger: false };
}

// ─── Apply transformation ────────────────────────────────────────────
export function applyTransformation(
  identity: Identity,
  playerDamageType?: string,
  playerInfusion?: string
): { active: boolean; turnsLeft: number; transformedSkills: TransformedSkill[] } {
  return {
    active: true,
    turnsLeft: identity.ultimateDuration || 8,
    transformedSkills: buildTransformedSkills(identity, playerDamageType, playerInfusion),
  };
}

// ─── Apply transformation passive ──────────────────────────────────
export interface TransformationPassiveContext {
  identity: Identity;
  transformationActive: boolean;
  turnCount: number;
  playerHp: number;
  playerMaxHp: number;
  playerAtk: number;
  playerDef: number;
  stacks: Record<string, number>;
  enemyStacks: Record<string, number>;
  addLog: (msg: string) => void;
  applyDebuff: (name: string, value: number, turns: number) => void;
  healAllies: (amount: number) => void;
  applyBuff: (name: string, value: number, turns: number) => void;
  dealDamage: (amount: number) => void;
  cleanseDebuffs: (count: number) => void;
}

export interface TransformationPassiveResult {
  applied: boolean;
  damageBonus: number;
  healBonus: number;
  defenseBonus: number;
  extraEffects: string[];
}

export function applyTransformationPassive(
  ctx: TransformationPassiveContext
): TransformationPassiveResult {
  const { identity } = ctx;
  if (!identity.transformationPassive || !ctx.transformationActive) {
    return { applied: false, damageBonus: 0, healBonus: 0, defenseBonus: 0, extraEffects: [] };
  }
  const passive = identity.transformationPassive;
  const mech = passive.mechanics || {};
  const result: TransformationPassiveResult = {
    applied: true,
    damageBonus: 0,
    healBonus: 0,
    defenseBonus: 0,
    extraEffects: [],
  };

  switch (passive.name) {
    case "Excalibur's Shred": {
      const perTurn = mech.corrosionPerTurn || 1;
      const maxStacks = mech.maxStacks || 5;
      const current = ctx.enemyStacks.corrosion || 0;
      if (current < maxStacks) {
        const newStacks = Math.min(maxStacks, current + perTurn);
        ctx.applyDebuff('Corrosion', newStacks, 1);
        result.extraEffects.push(`Corrosion ${newStacks}/${maxStacks} (-${(mech.defReductionPerStack || 0.03) * newStacks * 100}% DEF)`);
        ctx.addLog(`⚔️ Excalibur's Shred: Corrosion ${newStacks}/${maxStacks}`);
      }
      break;
    }
    case "Garden's Blessing": {
      const healPct = mech.healPercent || 0.05;
      const dmgBoost = mech.damageBoostPerTurn || 0.03;
      const maxStacks = mech.maxStacks || 5;
      let current = ctx.stacks.gardenBlessing || 0;
      if (current < maxStacks) {
        current = Math.min(maxStacks, current + 1);
        ctx.stacks.gardenBlessing = current;
        result.extraEffects.push(`Garden's Blessing: Stack ${current}/${maxStacks}`);
      }
      result.healBonus += healPct;
      result.damageBonus += dmgBoost * current;
      ctx.healAllies(ctx.playerMaxHp * healPct);
      ctx.addLog(`🌹 Garden's Blessing: Healed ${(healPct*100).toFixed(0)}% HP, +${(dmgBoost*current*100).toFixed(0)}% damage`);
      break;
    }
    case "Eclipse Resonance": {
      const perTurn = mech.shadowMarkPerTurn || 1;
      const threshold = mech.eclipseThreshold || 5;
      const eclipse = ctx.stacks.eclipseStacks || 0;
      ctx.applyDebuff('Shadow Mark', perTurn, 1);
      if (eclipse >= threshold) {
        const dmg = (mech.damagePercent || 0.15) * ctx.playerAtk;
        ctx.dealDamage(dmg);
        result.extraEffects.push(`Dealt ${Math.floor(dmg)} damage to marked enemies`);
        ctx.addLog(`🌑 Eclipse Resonance: Dealt ${Math.floor(dmg)} damage`);
      }
      break;
    }
    case "Radiant Martyrdom": {
      const hpCost = mech.hpCost || 0.05;
      const healPct = mech.healPct || 0.08;
      const cleanse = mech.cleanseCount || 2;
      const graceMax = mech.graceMax || 3;
      const radiance = ctx.stacks.radianceStacks || 0;
      if (ctx.playerHp > ctx.playerMaxHp * 0.10) {
        const cost = ctx.playerMaxHp * hpCost;
        const healAmt = ctx.playerMaxHp * healPct;
        ctx.healAllies(healAmt);
        result.extraEffects.push(`Lost ${Math.floor(cost)} HP, healed allies ${Math.floor(healAmt)} HP`);
        ctx.addLog(`☀️ Radiant Martyrdom: Lost ${Math.floor(cost)} HP, healed allies ${Math.floor(healAmt)} HP`);
      }
      if (radiance >= 4) {
        ctx.cleanseDebuffs(cleanse);
        const grace = ctx.stacks.martyrGrace || 0;
        if (grace < graceMax) {
          ctx.stacks.martyrGrace = Math.min(graceMax, grace + 1);
          result.extraEffects.push(`Martyr's Grace ${Math.min(graceMax, grace + 1)}/${graceMax}`);
        }
        ctx.addLog(`☀️ Radiant Martyrdom: Cleansed ${cleanse} debuffs!`);
      }
      break;
    }
    case "Unquenchable Fury": {
      const perTurn = mech.furyPerTurn || 1;
      const maxFury = mech.maxFury || 10;
      let fury = ctx.stacks.furyStacks || 0;
      if (fury < maxFury) {
        fury = Math.min(maxFury, fury + perTurn);
        ctx.stacks.furyStacks = fury;
        result.extraEffects.push(`Fury ${fury}/${maxFury}`);
      }
      if (fury >= 10) {
        result.damageBonus += mech.critDmgBoost || 0.30;
        result.extraEffects.push(`+${((mech.critDmgBoost || 0.30)*100).toFixed(0)}% crit damage`);
      }
      break;
    }
    case "Depths of Grief": {
      const perTurn = mech.drowningPerTurn || 1;
      const threshold = mech.depthThreshold || 4;
      const depth = ctx.stacks.depthStacks || 0;
      ctx.applyDebuff('Drowning', perTurn, 1);
      if (depth >= threshold) {
        const heal = (mech.healPct || 0.10) * ctx.playerMaxHp;
        ctx.healAllies(heal);
        result.extraEffects.push(`Healed allies ${Math.floor(heal)} HP`);
        ctx.addLog(`🌊 Depths of Grief: Healed allies ${Math.floor(heal)} HP`);
      }
      break;
    }
    case "Unyielding Rage": {
      const gainOnLow = mech.rageOnLowHP || 1;
      const maxRage = mech.maxRage || 5;
      if (ctx.playerHp / ctx.playerMaxHp < 0.50) {
        let rage = ctx.stacks.rageStacks || 0;
        if (rage < maxRage) {
          rage = Math.min(maxRage, rage + gainOnLow);
          ctx.stacks.rageStacks = rage;
          result.extraEffects.push(`Rage ${rage}/${maxRage}`);
        }
      }
      const rage = ctx.stacks.rageStacks || 0;
      result.defenseBonus += (mech.dmgResistPerRage || 0.05) * rage;
      break;
    }
    case "Grief Unleashed": {
      if (ctx.stacks.deadAllies > 0) {
        const gain = mech.resolveGain || 2;
        const healBoost = mech.healBoost || 0.10;
        const resolve = (ctx.stacks.resolveStacks || 0) + gain;
        ctx.stacks.resolveStacks = resolve;
        result.healBonus += healBoost;
        result.extraEffects.push(`+${gain} Resolve, +${(healBoost*100).toFixed(0)}% healing`);
        ctx.addLog(`💀 Grief Unleashed: +${gain} Resolve, +${(healBoost*100).toFixed(0)}% healing`);
      }
      break;
    }
    case "Attuned Soul": {
      const gain = mech.balanceGain || 2;
      const cleanse = mech.cleanseCount || 1;
      const buffCount = ctx.stacks.allyCount || 0;
      const debuffCount = Object.values(ctx.enemyStacks).reduce((a, b) => a + b, 0);
      if (buffCount === debuffCount && buffCount > 0) {
        ctx.stacks.balanceStacks = (ctx.stacks.balanceStacks || 0) + gain;
        ctx.cleanseDebuffs(cleanse);
        result.extraEffects.push(`+${gain} Balance, cleansed ${cleanse}`);
        ctx.addLog(`⚖️ Attuned Soul: +${gain} Balance, cleansed!`);
      }
      break;
    }
    case "Lifeblood Covenant": {
      if (ctx.stacks.alliesBelow30Percent > 0) {
        const gain = mech.furyGain || 2;
        const healBoost = mech.healBoost || 0.15;
        ctx.stacks.furyStacks = (ctx.stacks.furyStacks || 0) + gain;
        result.healBonus += healBoost;
        result.extraEffects.push(`+${gain} Fury, +${(healBoost*100).toFixed(0)}% healing`);
        ctx.addLog(`🩸 Lifeblood Covenant: +${gain} Fury, +${(healBoost*100).toFixed(0)}% healing`);
      }
      break;
    }
    case "Void Resonance": {
      const threshold = mech.debuffThreshold || 6;
      const boost = mech.atkSpdBoost || 0.10;
      const total = Object.values(ctx.enemyStacks).reduce((a, b) => a + b, 0);
      if (total >= threshold) {
        result.damageBonus += boost;
        result.defenseBonus += boost;
        result.extraEffects.push(`+${(boost*100).toFixed(0)}% ATK/SPD`);
        ctx.addLog(`👁️ Void Resonance: +${(boost*100).toFixed(0)}% ATK/SPD`);
      }
      if ((ctx.enemyStacks.echo || 0) >= 4) {
        ctx.applyDebuff('Echo', 1, 1);
        result.extraEffects.push('Extra Echo applied');
      }
      break;
    }
    default: {
      // Generic fallback for any other transformation passives
      for (const [key, val] of Object.entries(mech)) {
        if (typeof val === 'number') {
          if (key.includes('heal')) result.healBonus += val;
          if (key.includes('damage') || key.includes('atk')) result.damageBonus += val;
          if (key.includes('def')) result.defenseBonus += val;
        }
      }
      break;
    }
  }
  return result;
}

// ─── Apply all identity passives ────────────────────────────────────
export function applyIdentityPassives(
  identity: Identity,
  rank: number,
  ctx: IdentityPassiveContext
): IdentityPassiveResult {
  let result = { ...DEFAULT_RESULT };

  // ─── Core passive ──────────────────────────────────────────────────
  if (identity.corePassive) {
    const core = identity.corePassive;
    const mech = core.mechanics || {};

    // Arthur: Pale Resonance 2
    if (core.name === 'Pale Resonance 2') {
      const resolve = ctx.getStack('resolveStacks') || 0;
      result.damageBonus = (mech.damagePerResolve || 1.2) * resolve;
      result.onHit = (c) => {
        c.setStack('sp', Math.min(100, (c.getStack('sp') || 0) + 5));
        c.addLog(`⚔️ Pale Resonance: +5 SP (Resolve: ${resolve})`);
      };
      if (resolve >= (mech.trueExecutionThreshold || 25)) {
        result.freeEgo = true;
        ctx.addLog('⚡ Pale Resonance: True Execution available!');
      }
    }
    // Genevieve: The Weeping Garden (Amplifier)
    else if (core.name === 'The Weeping Garden (Amplifier)') {
      const bleedEnemies = ctx.enemyStacks.bleed || 0;
      const atkBonus = Math.min(mech.maxBleedEnemyAtk || 0.25, bleedEnemies * (mech.atkPerBleedEnemy || 0.05));
      result.damageBonus += atkBonus;
      result.healBonus += 0.05 * Math.min(5, ctx.getStack('bleedStacks') || 0);
      result.onHit = (c) => {
        if (bleedEnemies > 0) {
          const resolve = c.getStack('resolveStacks') || 0;
          const maxExt = mech.maxResolveExtension || 5;
          if (resolve < maxExt) {
            c.setStack('resolveStacks', Math.min(maxExt, resolve + 1));
            c.addLog(`🌹 The Weeping Garden: Resolve extended (${Math.min(maxExt, resolve+1)}/${maxExt})`);
          }
        }
      };
      const selfBleed = ctx.getStack('bleedStacks') || 0;
      if (selfBleed >= (mech.selfBleedThreshold || 5)) {
        result.healBonus *= (mech.thresholdMultiplier || 2);
        result.damageBonus += 0.20;
        ctx.addLog('🌹 The Weeping Garden: Threshold reached! Double healing & +20% damage!');
      }
    }
    // All other core passives are leader skills (already handled via leaderBuffs)
    // and have no combat mechanics, so they are skipped here.
  }

  // ─── Rank passives ────────────────────────────────────────────────
  for (const p of identity.passives) {
    if (rank < p.rankRequired) continue;
    switch (p.name) {
      // ─── Arthur ──────────────────────────────────────────────────
      case 'Golden Heart Will': {
        const stacks = ctx.getStack('goldenHeartWill') || 0;
        result.damageBonus += 0.02 * stacks;
        break;
      }
      case 'Pale Resonance Mastery': {
        result.extraStackGain.resolveStacks = (result.extraStackGain.resolveStacks || 0) + 2;
        if ((ctx.enemyStacks.wither || 0) >= 10) result.damageBonus += 0.50;
        break;
      }
      // ─── Genevieve ──────────────────────────────────────────────
      case 'Shared Grief': {
        const allies = ctx.allyCount;
        result.damageBonus += Math.min(0.20, allies * 0.05);
        result.defenseBonus += Math.min(0.12, allies * 0.03);
        break;
      }
      case 'Persistent Grief': {
        const bleed = ctx.getStack('bleedStacks') || 0;
        result.healBonus += 0.02 * bleed;
        result.extraStackGain.bleedStacks = (result.extraStackGain.bleedStacks || 0) + 1;
        break;
      }
      // ─── Kaelen ──────────────────────────────────────────────────
      case 'Eclipse Resonance': {
        if ((ctx.getStack('eclipseStacks') || 0) >= 5) result.damageBonus += 0.10;
        break;
      }
      case 'Shadow Communion (Ally)': {
        const marks = ctx.enemyStacks.shadowMarks || 0;
        const count = ctx.allyCount;
        result.damageBonus += Math.min(0.24, (marks >= 2 ? 0.06 : 0) * count);
        result.speedBonus += Math.min(0.16, (marks >= 2 ? 0.04 : 0) * count);
        break;
      }
      case 'Void Stare': {
        // Panic effect – handled separately in panic logic
        break;
      }
      // ─── Seraphina ──────────────────────────────────────────────
      case 'Radiant Martyrdom': {
        const cost = 0.05 * ctx.playerMaxHp;
        const heal = 0.08 * ctx.playerMaxHp;
        result.onTurnStart = (c) => {
          c.setStack('hp', Math.max(1, c.getStack('hp') - cost));
          c.healAllies(heal);
          c.addLog(`☀️ Radiant Martyrdom: Lost ${Math.floor(cost)} HP, healed allies ${Math.floor(heal)} HP`);
        };
        break;
      }
      case 'Shared Radiance (Ally)': {
        const shielded = ctx.allyCount;
        result.defenseBonus += Math.min(0.24, shielded * 0.08);
        result.speedBonus += Math.min(0.15, shielded * 0.05);
        break;
      }
      case 'Hollow Light': {
        // Panic effect – handled separately
        break;
      }
      // ─── Valerius ────────────────────────────────────────────────
      case 'Unquenchable Fury': {
        const fury = ctx.getStack('furyStacks') || 0;
        if (fury >= 10) {
          result.critDamageBonus += 0.30;
          result.onHit = (c) => {
            const dmg = c.getStack('lastDamageDealt') || 0;
            c.healAllies(dmg * 0.10);
            c.addLog(`🔥 Unquenchable Fury: Healed ${Math.floor(dmg * 0.10)} HP`);
          };
        }
        break;
      }
      case 'Blood Pact (Ally)': {
        const bleed = ctx.enemyStacks.bleed || 0;
        const count = ctx.allyCount;
        result.damageBonus += Math.min(0.20, (bleed >= 2 ? 0.05 : 0) * count);
        result.speedBonus += Math.min(0.20, (bleed >= 2 ? 0.05 : 0) * count);
        break;
      }
      case 'Frenzied Void': {
        // Panic effect – handled separately
        break;
      }
      // ─── Morwen ──────────────────────────────────────────────────
      case 'Depths of Grief': {
        if ((ctx.getStack('depthStacks') || 0) >= 4) {
          result.healBonus += 0.10;
          ctx.addLog('🌊 Depths of Grief: All allies healed 10% and cleansed!');
        }
        break;
      }
      case 'Tidal Bond (Ally)': {
        const drown = ctx.enemyStacks.drowning || 0;
        const count = ctx.allyCount;
        result.defenseBonus += Math.min(0.24, (drown >= 3 ? 0.06 : 0) * count);
        result.damageBonus += Math.min(0.16, (drown >= 3 ? 0.04 : 0) * count);
        break;
      }
      case 'Sunken Silence': {
        // Panic effect – handled separately
        break;
      }
      // ─── Ragnar ──────────────────────────────────────────────────
      case 'Unyielding Rage': {
        if (ctx.playerHp / ctx.playerMaxHp < 0.50) {
          result.extraStackGain.rageStacks = (result.extraStackGain.rageStacks || 0) + 1;
        }
        const rage = ctx.getStack('rageStacks') || 0;
        result.defenseBonus += 0.05 * rage;
        break;
      }
      case 'Bloodlust Aura (Ally)': {
        const count = ctx.allyCount;
        result.damageBonus += Math.min(0.24, count * 0.08);
        result.critBonus += Math.min(0.12, count * 0.04);
        break;
      }
      case 'Frenzied Rampage': {
        // Panic effect – handled separately
        break;
      }
      // ─── Isolde ──────────────────────────────────────────────────
      case 'Grief Unleashed': {
        if (ctx.deadAllyCount > 0) {
          result.extraStackGain.resolveStacks = (result.extraStackGain.resolveStacks || 0) + 2;
          result.healBonus += 0.10;
          result.onHit = (c) => c.applyDebuff('Weaken', 1, 1);
        }
        break;
      }
      case 'Shared Mourning (Ally)': {
        const weaken = ctx.enemyStacks.weaken || 0;
        const count = ctx.allyCount;
        result.damageBonus += Math.min(0.20, (weaken >= 2 ? 0.05 : 0) * count);
        result.defenseBonus += Math.min(0.20, (weaken >= 2 ? 0.05 : 0) * count);
        break;
      }
      case 'Grief-Stricken': {
        // Panic effect – handled separately
        break;
      }
      // ─── Theron ──────────────────────────────────────────────────
      case 'Attuned Soul': {
        const buff = ctx.allyCount * 2;
        const debuff = ctx.enemyStacks.dissonance || 0;
        if (buff === debuff && buff > 0) {
          result.extraStackGain.balanceStacks = (result.extraStackGain.balanceStacks || 0) + 2;
          ctx.addLog('⚖️ Attuned Soul: Balance restored! +2 Balance, cleansed!');
        }
        break;
      }
      case 'Shared Equilibrium (Ally)': {
        const harmony = ctx.getStack('harmonyStacks') || 0;
        result.damageBonus += Math.min(0.24, harmony * 0.06);
        result.defenseBonus += Math.min(0.24, harmony * 0.06);
        break;
      }
      case 'Chaotic Void': {
        // Panic effect – handled separately
        break;
      }
      // ─── Siora ──────────────────────────────────────────────────
      case 'Lifeblood Covenant': {
        if (ctx.alliesBelow30Percent > 0) {
          result.extraStackGain.furyStacks = (result.extraStackGain.furyStacks || 0) + 2;
          result.healBonus += 0.15;
          ctx.addLog('🩸 Lifeblood Covenant: Low HP allies triggered! +2 Fury, +15% healing');
        }
        break;
      }
      case 'Blood Bond (Ally)': {
        const count = ctx.allyCount;
        result.damageBonus += Math.min(0.20, count * 0.05);
        result.defenseBonus += Math.min(0.20, count * 0.05);
        break;
      }
      case 'Bloodrage': {
        // Panic effect – handled separately
        break;
      }
      // ─── Orin ────────────────────────────────────────────────────
      case 'Void Resonance': {
        const total = Object.values(ctx.enemyStacks).reduce((a, b) => a + b, 0);
        if (total >= 6) {
          result.damageBonus += 0.10;
          result.speedBonus += 0.10;
          if ((ctx.enemyStacks.echo || 0) >= 4) {
            result.extraStackGain.echo = (result.extraStackGain.echo || 0) + 1;
          }
        }
        break;
      }
      case 'Echo Chamber (Ally)': {
        const debuffed = Object.values(ctx.enemyStacks).filter(v => v >= 3).length;
        result.damageBonus += Math.min(0.24, debuffed * 0.06);
        result.speedBonus += Math.min(0.16, debuffed * 0.04);
        break;
      }
      case 'Void Gaze': {
        // Panic effect – handled separately
        break;
      }
      default:
        break;
    }
  }

  // ─── Transformation passive (if active) ──────────────────────────
  if (ctx.isTransformed && identity.transformationPassive) {
    const transCtx: TransformationPassiveContext = {
      identity,
      transformationActive: ctx.isTransformed,
      turnCount: ctx.turnCount,
      playerHp: ctx.playerHp,
      playerMaxHp: ctx.playerMaxHp,
      playerAtk: ctx.playerAtk,
      playerDef: ctx.playerDef,
      stacks: ctx.stacks,
      enemyStacks: ctx.enemyStacks,
      addLog: ctx.addLog,
      applyDebuff: ctx.applyDebuff,
      healAllies: ctx.healAllies,
      applyBuff: ctx.applyBuff,
      dealDamage: ctx.dealBonusDamage,
      cleanseDebuffs: (count) => {
        ctx.addLog(`🧹 Cleansed ${count} debuffs!`);
      },
    };
    const transResult = applyTransformationPassive(transCtx);
    if (transResult.applied) {
      result.damageBonus += transResult.damageBonus;
      result.healBonus += transResult.healBonus;
      result.defenseBonus += transResult.defenseBonus;
    }
  }

  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────
export function hasPassive(identity: Identity, passiveName: string): boolean {
  if (identity.corePassive?.name === passiveName) return true;
  if (identity.passives.some(p => p.name === passiveName)) return true;
  if (identity.transformationPassive?.name === passiveName) return true;
  return false;
}

export function getPassiveDescription(identity: Identity, passiveName: string): string | undefined {
  if (identity.corePassive?.name === passiveName) return identity.corePassive.description;
  const found = identity.passives.find(p => p.name === passiveName);
  if (found) return found.description;
  if (identity.transformationPassive?.name === passiveName) return identity.transformationPassive.description;
  return undefined;
}

export function getActivePassives(identity: Identity, rank: number): string[] {
  const active: string[] = [];
  if (identity.corePassive) active.push(identity.corePassive.name);
  for (const p of identity.passives) {
    if (rank >= p.rankRequired) active.push(p.name);
  }
  if (identity.transformationPassive) active.push(identity.transformationPassive.name);
  return active;
}

export function getTransformationInfo(identity: Identity): {
  hasTransformation: boolean;
  triggerType: string;
  duration: number;
  triggerDescription: string;
} {
  const has = !!(identity.transformedSkills && identity.transformedSkills.length > 0);
  if (!has) {
    return {
      hasTransformation: false,
      triggerType: 'none',
      duration: 0,
      triggerDescription: 'No transformation available.',
    };
  }
  const triggerMap: Record<string, string> = {
    timer: `Triggers after ${identity.triggerTurns || 10} turns.`,
    ultimate: 'Triggers when Ultimate is used at 100%.',
    custom: identity.transformationCondition || 'Triggers on custom condition.',
    none: 'No transformation trigger.',
  };
  return {
    hasTransformation: true,
    triggerType: identity.transformationTrigger || 'none',
    duration: identity.ultimateDuration || 8,
    triggerDescription: triggerMap[identity.transformationTrigger || 'none'] || 'Unknown trigger condition.',
  };
}
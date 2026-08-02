// utils/weaponPassives.ts – Generic weapon passive system
import { weapons, type Weapon } from '../data/weapons';
import type { Identity } from '../data/identities';

export interface WeaponPassiveContext {
  // Combat state
  playerHp: number;
  playerMaxHp: number;
  playerAtk: number;
  playerDef: number;
  playerSp: number;
  ultimateBar: number;
  isEgo: boolean;
  isTransformed: boolean;
  isGuarding: boolean;

  // Stack states
  resolveStacks: number;
  witherStacks: number;
  bleedStacks: number;
  furyStacks: number;
  rageStacks: number;
  depthStacks: number;
  radianceStacks: number;
  eclipseStacks: number;
  shadowStacks: number;
  harmonyStacks: number;

  // Enemy state (for passives that affect enemies)
  enemyShadowMarks: number;
  enemyBleedStacks: number;
  enemyWeakenStacks: number;
  enemyDrowningStacks: number;
  enemyDissonanceStacks: number;

  // Ally state (for support passives)
  allyCount: number;
  alliesBelow50Percent: number;
  alliesBelow30Percent: number;
  deadAllies: number;

  // Helper functions
  addLog: (msg: string) => void;
  setStack: (stackName: string, value: number) => void;
  applyBuff: (buffName: string, value: number, turns: number) => void;
  applyDebuff: (debuffName: string, value: number, turns: number) => void;
  healAllies: (amount: number) => void;
  dealBonusDamage: (amount: number) => void;
}

export interface WeaponPassiveResult {
  // Modifiers to apply
  damageBonus: number;           // +% damage
  defenseBonus: number;          // +% defense
  critBonus: number;             // +% crit chance
  critDamageBonus: number;       // +% crit damage
  healBonus: number;            // +% healing
  shieldBonus: number;          // +% shielding
  speedBonus: number;           // +% speed

  // Stack modifications
  extraShadowMarkDefReduction: number;
  extraWeakenStacks: number;
  extraResolveOnAllyDeath: number;

  // Boolean flags
  unbreakableAllAttacks: boolean;
  freeEgo: boolean;
  autoSelectSkill: boolean;
  autoSelectChance: number;

  // Special effects (for complex passives)
  specialEffects: {
    onHit?: (context: WeaponPassiveContext) => void;
    onHeal?: (context: WeaponPassiveContext) => void;
    onAllyDeath?: (context: WeaponPassiveContext) => void;
    onGuard?: (context: WeaponPassiveContext) => void;
    onTurnStart?: (context: WeaponPassiveContext) => void;
    onEgoCast?: (context: WeaponPassiveContext) => void;
    onTransformation?: (context: WeaponPassiveContext) => void;
  }[];
}

// ─── Default result (no passive active) ─────────────────────────────
const DEFAULT_RESULT: WeaponPassiveResult = {
  damageBonus: 0,
  defenseBonus: 0,
  critBonus: 0,
  critDamageBonus: 0,
  healBonus: 0,
  shieldBonus: 0,
  speedBonus: 0,
  extraShadowMarkDefReduction: 0,
  extraWeakenStacks: 0,
  extraResolveOnAllyDeath: 0,
  unbreakableAllAttacks: false,
  freeEgo: false,
  autoSelectSkill: false,
  autoSelectChance: 0,
  specialEffects: [],
};

// ─── Apply weapon passive ────────────────────────────────────────────
export function applyWeaponPassive(
  weaponId: string | null | undefined,
  context: WeaponPassiveContext
): WeaponPassiveResult {
  if (!weaponId) return DEFAULT_RESULT;

  const weapon = weapons.find(w => w.id === weaponId);
  if (!weapon || !weapon.passive) return DEFAULT_RESULT;

  const result = { ...DEFAULT_RESULT };

  switch (weapon.id) {
    // ─── ARTHUR ─────────────────────────────────────────────────────
    case 'eclipse_blade':
      result.autoSelectSkill = true;
      result.autoSelectChance = 0.25;
      result.specialEffects.push({
        onHit: (ctx) => {
          // Golden Heart Will on kill with True Execution
          // (handled in combat logic separately)
        }
      });
      break;

    // ─── GENEVIEVE ──────────────────────────────────────────────────
    case 'weeping_garden_gauntlets':
      result.specialEffects.push({
        onTransformation: (ctx) => {
          // Each turn during transformation, apply Wither stack
          ctx.applyDebuff('Wither', 0.05, 1);
          ctx.addLog('🌹 Weeping Garden: Wither applied to enemy!');
        }
      });
      break;

    // ─── KAELEN ─────────────────────────────────────────────────────
    case 'eclipse_shard':
      result.extraShadowMarkDefReduction = 0.02;
      result.damageBonus = context.enemyShadowMarks >= 5 ? 0.15 : 0;
      result.specialEffects.push({
        onHit: (ctx) => {
          if (ctx.enemyShadowMarks >= 5) {
            ctx.addLog('🌑 Eclipse Shard: +15% damage to target with 5+ Shadow Marks!');
          }
        }
      });
      break;

    // ─── SERAPHINA ──────────────────────────────────────────────────
    case 'radiant_scepter':
      result.specialEffects.push({
        onHeal: (ctx) => {
          const newRadiance = ctx.radianceStacks + 1;
          ctx.setStack('radianceStacks', Math.min(6, newRadiance));
          ctx.addLog(`☀️ Radiant Scepter: Radiance stack ${Math.min(6, newRadiance)}/6`);
          if (newRadiance >= 6) {
            result.freeEgo = true;
            ctx.addLog('⚡ Radiant Scepter: Next Ego is FREE!');
          }
        }
      });
      result.healBonus = 0.05 * Math.min(6, context.radianceStacks);
      break;

    // ─── VALERIUS ───────────────────────────────────────────────────
    case 'crimson_edge':
      result.specialEffects.push({
        onHit: (ctx) => {
          // Critical hits build Fury 2x faster
          // (handled in combat logic)
          if (ctx.furyStacks >= 10) {
            result.unbreakableAllAttacks = true;
            result.critDamageBonus = 0.30;
            ctx.addLog('🔥 Crimson Edge: Unbreakable all attacks! +30% crit damage!');
          }
        }
      });
      result.critBonus = 0.05 * Math.min(10, context.furyStacks);
      break;

    // ─── MORWEN ─────────────────────────────────────────────────────
    case 'abyssal_anchor':
      result.specialEffects.push({
        onGuard: (ctx) => {
          const newDepth = context.depthStacks + 2;
          ctx.setStack('depthStacks', Math.min(6, newDepth));
          ctx.addLog(`🌊 Abyssal Anchor: +2 Depth (${Math.min(6, newDepth)}/6)`);
          if (newDepth >= 6) {
            result.unbreakableAllAttacks = true;
            result.damageBonus = 0.25;
            ctx.addLog('⚡ Abyssal Anchor: Unbreakable all attacks! +25% damage!');
          }
        }
      });
      break;

    // ─── RAGNAR ─────────────────────────────────────────────────────
    case 'world_cleaver':
      result.critBonus = 0.03 * Math.min(5, context.rageStacks);
      result.specialEffects.push({
        onTurnStart: (ctx) => {
          if (context.rageStacks >= 5) {
            result.unbreakableAllAttacks = true;
            result.damageBonus = 0.50;
            ctx.addLog('🔥 World Cleaver: Unbreakable all attacks! +50% damage!');
          }
        }
      });
      break;

    // ─── ISOLDE ─────────────────────────────────────────────────────
    case 'vengeance_blade':
      result.extraWeakenStacks = 1;
      result.extraResolveOnAllyDeath = 3;
      result.specialEffects.push({
        onAllyDeath: (ctx) => {
          // All allies gain 3 Resolve and +20% healing received for 2 turns
          ctx.setStack('resolveStacks', context.resolveStacks + 3);
          ctx.applyBuff('healingReceived', 0.20, 2);
          ctx.addLog('💀 Vengeance Blade: Allies gain 3 Resolve and +20% healing!');
        }
      });
      break;

    // ─── THERON ─────────────────────────────────────────────────────
    case 'harmonic_baton':
      result.specialEffects.push({
        onTurnStart: (ctx) => {
          // If buff count = debuff count, gain 2 Balance and cleanse
          const buffCount = ctx.allyCount * 2; // approximate
          const debuffCount = ctx.enemyShadowMarks + ctx.enemyBleedStacks + ctx.enemyWeakenStacks;
          if (buffCount === debuffCount) {
            ctx.setStack('balanceStacks', context.harmonyStacks + 2);
            ctx.addLog('⚖️ Harmonic Baton: Balance restored! +2 Balance, cleanse applied!');
          }
        }
      });
      result.damageBonus = 0.05 * context.harmonyStacks;
      break;

    // ─── SIORA ──────────────────────────────────────────────────────
    case 'shepherds_staff':
      result.healBonus = context.alliesBelow30Percent > 0 ? 0.50 : 0;
      result.defenseBonus = 0.05 * Math.min(3, context.bleedStacks);
      result.specialEffects.push({
        onHit: (ctx) => {
          if (ctx.alliesBelow30Percent > 0) {
            ctx.addLog('🩸 Shepherd\'s Staff: +50% healing to low-HP allies!');
          }
        }
      });
      break;

    // ─── ORIN ───────────────────────────────────────────────────────
    case 'echoing_resonator':
      result.specialEffects.push({
        onHit: (ctx) => {
          // Each debuff applied grants 1 Shadow stack
          const newShadow = context.shadowStacks + 1;
          ctx.setStack('shadowStacks', newShadow);
          ctx.addLog(`👁️ Echoing Resonator: +1 Shadow stack (${newShadow}/5)`);
          if (newShadow >= 5) {
            result.critDamageBonus = 0.20;
            result.defenseBonus = 0.10; // ignore 10% DEF
            ctx.addLog('⚡ Echoing Resonator: +20% crit damage, ignore 10% DEF!');
          }
        }
      });
      break;

    default:
      break;
  }

  return result;
}

// ─── Helper: Check if weapon has a specific passive ─────────────────
export function hasPassiveEffect(weaponId: string | null | undefined, effect: string): boolean {
  if (!weaponId) return false;
  const weapon = weapons.find(w => w.id === weaponId);
  if (!weapon || !weapon.passive) return false;
  return weapon.passive.toLowerCase().includes(effect.toLowerCase());
}
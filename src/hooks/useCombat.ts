// src/hooks/useCombat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { identities, scaledStats, skillDmgMult, getClassCategory, classCategoryEffect } from '../data/identities';
import { getDisplayName } from '../auth/discord';

export interface Combatant {
  identityId: string;
  level: number;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  shield: number;
  skills: Array<{
    name: string;
    power: number;
    coins: number;
    type: 'normal1' | 'normal2' | 'normal3' | 'ego';
    dmgMult: number;
    skillLevel: number;
  }>;
  element: string;
  classCategory: string;
  classEffect: number;
  isDead: boolean;
  isAwakened: boolean;
  awakeningTurns: number;
  damageBuff: number;
  defenseBuff: number;
}

export interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  element: string;
  resist: string;
  skills: Array<{ name: string; power: number; coins: number }>;
  portrait: string;
  dullStacks: number;
  isBoss?: boolean;
  bossMechanic?: any;
}

export interface CombatState {
  phase: 'idle' | 'teamSelect' | 'fighting' | 'waveClear' | 'defeat' | 'victory';
  wave: number;
  timeLeft: number;
  enemies: Enemy[];
  team: Combatant[];
  activeCombatantIndex: number;
  log: string[];
  score: number;
  totalEnemiesDefeated: number;
  bossesDefeated: number;
  selectedSkillIndex: number;
  selectedEnemyIndex: number;
  turn: 'player' | 'resolve' | 'enemy';
  clashData: any;
  isPvP: boolean;
  opponentTeam?: Combatant[];
  currentAttacker?: 'player' | 'opponent';
}

export function useCombat(initialState: Partial<CombatState> = {}) {
  const [state, setState] = useState<CombatState>({
    phase: 'idle',
    wave: 1,
    timeLeft: 300,
    enemies: [],
    team: [],
    activeCombatantIndex: 0,
    log: [],
    score: 0,
    totalEnemiesDefeated: 0,
    bossesDefeated: 0,
    selectedSkillIndex: 0,
    selectedEnemyIndex: 0,
    turn: 'player',
    clashData: null,
    isPvP: false,
    ...initialState,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const rollCoin = useCallback((power: number): number => Math.random() < 0.5 ? power : 1, []);
  const clash = useCallback((pP: number, eP: number, pC: number, eC: number) => {
    let pt = rollCoin(pP), et = rollCoin(eP);
    for (let i = 1; i < Math.max(pC, eC); i++) {
      if (i < pC) pt += rollCoin(pP);
      if (i < eC) et += rollCoin(eP);
    }
    return { playerTotal: pt, enemyTotal: et };
  }, [rollCoin]);

  const elementMult = useCallback((attackerElement: string, defenderResist: string, defenderElement: string): number => {
    if (attackerElement === defenderResist) return 0.5;
    const order = ['Void', 'Light', 'Dark', 'Chaos', 'Fire', 'Water', 'Physical', 'Spectro'];
    const ai = order.indexOf(attackerElement);
    const di = order.indexOf(defenderElement);
    if (ai >= 0 && di >= 0 && (ai + 1) % order.length === di) return 1.5;
    return 1.0;
  }, []);

  const calculatePlayerDamage = useCallback((playerTotal: number, enemyTotal: number, enemyMaxHp: number, mult: number, skillDmgMult: number, classMult: number, tankBonus: number) => {
    const diff = playerTotal - enemyTotal;
    const basePercent = 0.005 + 0.0015 * diff;
    let finalPercent = basePercent * mult * skillDmgMult * classMult * tankBonus;
    finalPercent *= (0.85 + Math.random() * 0.3);
    const damage = Math.floor(finalPercent * enemyMaxHp);
    return Math.max(1, damage);
  }, []);

  const calculateEnemyDamage = useCallback((enemyTotal: number, playerTotal: number, playerMaxHp: number, mult: number = 1.0) => {
    const diff = enemyTotal - playerTotal;
    if (diff <= 0) return 0;
    const basePercent = 0.005 + 0.0015 * diff;
    let finalPercent = basePercent * mult;
    finalPercent *= (0.85 + Math.random() * 0.3);
    finalPercent = Math.min(finalPercent, 0.15);
    return Math.floor(finalPercent * playerMaxHp);
  }, []);

  const playerAct = useCallback(() => {
    const { team, activeCombatantIndex, enemies, selectedSkillIndex, selectedEnemyIndex, turn, isPvP } = state;
    if (turn !== 'player') return;
    const attacker = team[activeCombatantIndex];
    if (!attacker || attacker.isDead) return;
    const skill = attacker.skills[selectedSkillIndex];
    if (!skill) return;
    const target = enemies[selectedEnemyIndex];
    if (!target || target.hp <= 0) return;

    const enemySkill = target.skills[Math.floor(Math.random() * target.skills.length)];
    const result = clash(skill.power, enemySkill.power, skill.coins, enemySkill.coins);
    const mult = elementMult(attacker.element, target.resist, target.element);

    if (skill.type === 'ego') attacker.sp = Math.max(0, attacker.sp - 40);
    let classMult = 1.0;
    if (attacker.classCategory === 'Attacker') classMult += attacker.classEffect;
    if (attacker.classCategory === 'Amplifier' && skill.type === 'ego') classMult += attacker.classEffect;
    let tankBonus = 1.0;

    if (result.playerTotal >= result.enemyTotal) {
      const dmg = calculatePlayerDamage(result.playerTotal, result.enemyTotal, target.maxHp, mult, skill.dmgMult, classMult, tankBonus);
      const newHp = Math.max(0, target.hp - dmg);
      setState(prev => ({
        ...prev,
        enemies: prev.enemies.map((e, i) => i === selectedEnemyIndex ? { ...e, hp: newHp } : e),
        log: [...prev.log, `✅ ${getDisplayName(attacker)} won clash! ${skill.name} → ${dmg} dmg`],
        turn: 'resolve',
        clashData: { playerTotal: result.playerTotal, enemyTotal: result.enemyTotal, dmg, won: true },
      }));
    } else {
      const dmg = calculateEnemyDamage(result.enemyTotal, result.playerTotal, attacker.maxHp);
      const newHp = Math.max(0, attacker.hp - dmg);
      setState(prev => ({
        ...prev,
        team: prev.team.map((c, i) => i === activeCombatantIndex ? { ...c, hp: newHp } : c),
        log: [...prev.log, `❌ ${getDisplayName(attacker)} lost clash! ${target.name} → ${dmg} dmg`],
        turn: 'resolve',
        clashData: { playerTotal: result.playerTotal, enemyTotal: result.enemyTotal, dmg, won: false },
      }));
    }
  }, [state, clash, elementMult, calculatePlayerDamage, calculateEnemyDamage]);

  const resolveTurn = useCallback(() => {
    setState(prev => {
      const allEnemiesDead = prev.enemies.every(e => e.hp <= 0);
      const allTeamDead = prev.team.every(c => c.isDead);
      if (allEnemiesDead) return { ...prev, phase: 'victory', turn: 'player' };
      if (allTeamDead) return { ...prev, phase: 'defeat', turn: 'player' };
      // Enemy attacks (simplified) – for PvE only
      if (!prev.isPvP) {
        // enemy turn logic would go here – for now, just switch back
      }
      return { ...prev, turn: 'player', clashData: null };
    });
  }, []);

  const startCombat = useCallback((teamData: any[], enemyData: Enemy[], pvp = false) => {
    const combatants = teamData.map(member => {
      const identity = identities.find(i => i.id === member.identityId);
      const stats = scaledStats(identity!, member.level, member.classSkillLevel ?? 1);
      const classCategory = getClassCategory(member.identityId);
      const classEffect = classCategoryEffect(member.classSkillLevel ?? 1);
      const skills = identity!.skills.filter(s => s.type !== 'class').map((skill, idx) => {
        const sl = member.skillLevels?.[idx] ?? 1;
        const power = skill.basePower + skill.powerGrowth * (sl - 1);
        const coins = skill.coinGrowth > 0 ? skill.baseCoins + Math.floor((sl - 1) / skill.coinGrowth) : skill.baseCoins;
        const dmgMult = skillDmgMult(skill.type, sl);
        return {
          name: skill.name,
          power,
          coins,
          type: skill.type as 'normal1' | 'normal2' | 'normal3' | 'ego',
          dmgMult,
          skillLevel: sl,
        };
      });
      return {
        identityId: member.identityId,
        level: member.level,
        hp: stats.hp,
        maxHp: stats.hp,
        sp: 50,
        maxSp: 100,
        shield: 0,
        skills,
        element: identity!.element,
        classCategory,
        classEffect,
        isDead: false,
        isAwakened: false,
        awakeningTurns: 0,
        damageBuff: 1,
        defenseBuff: 1,
      };
    });

    setState({
      phase: 'fighting',
      wave: 1,
      timeLeft: pvp ? 0 : 300,
      enemies: enemyData,
      team: combatants,
      activeCombatantIndex: 0,
      log: pvp ? ['⚔️ DUEL STARTED!'] : ['⚔️ Combat started...'],
      score: 0,
      totalEnemiesDefeated: 0,
      bossesDefeated: 0,
      selectedSkillIndex: 0,
      selectedEnemyIndex: 0,
      turn: 'player',
      clashData: null,
      isPvP: pvp,
    });
  }, []);

  const selectSkill = useCallback((index: number) => setState(prev => ({ ...prev, selectedSkillIndex: index })), []);
  const selectEnemy = useCallback((index: number) => setState(prev => ({ ...prev, selectedEnemyIndex: index })), []);
  const endCombat = useCallback(() => setState(prev => ({ ...prev, phase: 'idle' })), []);

  useEffect(() => {
    if (state.phase === 'fighting' && !state.isPvP) {
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) }));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.phase, state.isPvP]);

  useEffect(() => {
    if (state.timeLeft === 0 && state.phase === 'fighting') {
      setState(prev => ({ ...prev, phase: 'defeat' }));
    }
  }, [state.timeLeft, state.phase]);

  return {
    state,
    startCombat,
    playerAct,
    resolveTurn,
    selectSkill,
    selectEnemy,
    endCombat,
  };
}
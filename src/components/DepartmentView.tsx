// DepartmentView.tsx – Co‑op facility management with native WebSocket
// Added: Global Chat with React.lazy to avoid circular dependency.
import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';
import { useAuth } from '../auth/AuthContext';
import {
  identities,
  scaledStats,
  getClassCategory,
  classCategoryEffect,
  damageTypeMult,
  infusionMult,
  skillDmgMult,
  type Identity,
  type CombatCategory,
} from '../data/identities';
import {
  buildTransformedSkills,
  checkTransformationTrigger,
  applyTransformationPassive,
  type TransformedSkill,
} from '../data/identitiesPassives';
import { weapons, canEquipWeapon } from '../data/weapons';
import { egoGifts } from '../data/egoGifts';
import { DEPARTMENTS, DepartmentId } from '../data/departments';
import { abnormalities, getAbnormalityById, type WorkType } from '../data/abnormalities';
import { getDisplayName } from '../auth/discord';

// ─── Lazy import GlobalChat ──────────────────────────────────────────
const GlobalChat = React.lazy(() => import('../components/GlobalChat'));

// ─── Constants ──────────────────────────────────────────────────────────
const MAX_CLASH_POWER = 50;
const ULTIMATE_GAIN_MIN = 0.003;
const ULTIMATE_GAIN_MAX = 0.03;
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://qliphoth-backend.archlouder4.workers.dev';

// ─── Helpers ──────────────────────────────────────────────────────────
function getRiskEmoji(risk: string): string {
  const map: Record<string, string> = {
    ZAYIN: '🟢',
    TETH: '🔵',
    HE: '🟡',
    WAW: '🟠',
    ALEPH: '🔴',
  };
  return map[risk?.toUpperCase()] || '⚪';
}

function getRequiredEnergyForDay(day: number): number {
  if (day <= 1) return 50;
  return Math.min(50 + (day - 1) * 20, 2000);
}

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

// ─── Compute agent stats ──────────────────────────────────────────────
function computeAgentStats(
  identityId: string,
  ownedIdentity: any,
  equippedWeaponId: string | null,
  equippedGiftIds: string[],
  facility: any,
  ownedWeapons: any[],
  ownedGifts: any[]
): {
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  atk: number;
  def: number;
  spd: number;
  damageType: string;
  infusion: string;
  classCategory: CombatCategory;
  classEffect: number;
  workSuccess: number;
  skills: any[];
} {
  const identity = identities.find(i => i.id === identityId);
  if (!identity) throw new Error(`Identity ${identityId} not found`);

  const weapon = equippedWeaponId ? weapons.find(w => w.id === equippedWeaponId) : null;
  const giftStats = equippedGiftIds.reduce(
    (acc, gid) => {
      const gift = egoGifts.find(g => g.id === gid);
      if (gift && gift.stats) {
        acc.hp += gift.stats.hp || 0;
        acc.atk += gift.stats.atk || 0;
        acc.def += gift.stats.def || 0;
        acc.spd += gift.stats.spd || 0;
      }
      return acc;
    },
    { hp: 0, atk: 0, def: 0, spd: 0 }
  );

  const baseStats = scaledStats(identity, ownedIdentity.level, ownedIdentity.classSkillLevel ?? 1);
  const totalHp = baseStats.hp + giftStats.hp;
  const totalAtk = baseStats.atk + giftStats.atk + (weapon?.baseStats.atk || 0);
  const totalSpd = baseStats.spd + giftStats.spd;
  const totalDef = baseStats.def + giftStats.def;

  const classCategory = getClassCategory(identity.id);
  const classEffect = classCategoryEffect(ownedIdentity.classSkillLevel ?? 1);

  let workMult = 1.0;
  if (facility.unlockedResearch) {
    if (facility.unlockedResearch.includes('tt2_protocol')) workMult *= 1.10;
    if (facility.unlockedResearch.includes('education_manuals')) workMult *= 1.15;
    if (facility.unlockedResearch.includes('professional_education')) workMult *= 1.25;
    if (facility.unlockedResearch.includes('hp_sp_bullets')) workMult *= 1.05;
  }

  const skills = identity.skills
    .filter(s => s.type !== 'class')
    .map((skill, idx) => {
      const sl = ownedIdentity.skillLevels?.[idx] ?? 1;
      const power = skill.basePower + skill.powerGrowth * (sl - 1);
      const coins = skill.coinGrowth > 0 ? skill.baseCoins + Math.floor((sl - 1) / skill.coinGrowth) : skill.baseCoins;
      const dmgMult = skillDmgMult(skill.type, sl);
      return {
        ...skill,
        power: Math.min(power, MAX_CLASH_POWER),
        coins,
        dmgMult,
        skillLevel: sl,
        isEgo: skill.type === 'ego',
        damageType: skill.damageType || identity.element,
        infusion: skill.infusion || identity.baseInfusion || 'Slash',
      };
    });

  return {
    hp: totalHp,
    maxHp: totalHp,
    sp: 50,
    maxSp: 100,
    atk: totalAtk,
    def: totalDef,
    spd: totalSpd,
    damageType: identity.element,
    infusion: identity.baseInfusion || 'Slash',
    classCategory,
    classEffect,
    workSuccess: workMult,
    skills,
  };
}

// ─── Main Component ──────────────────────────────────────────────────
export default function DepartmentView() {
  const { user } = useAuth();
  const {
    facility,
    createFacility,
    joinFacility,
    leaveFacility,
    deployAbnormality,
    workOnAbnormality,
    advanceDay,
    resolveOrdeal,
    suppressBreach,
    unlockResearch,
    useMemoryRepository,
    addBullets,
    fireBullet,
    lunacy,
    ownedIdentities,
    ownedWeapons,
    ownedGifts,
    equippedGifts,
  } = useGameStore();

  // ─── WebSocket ref ───────────────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // ─── Co‑op state ──────────────────────────────────────────────────
  const [isCoop, setIsCoop] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [isHost, setIsHost] = useState(false);

  // ─── UI state ──────────────────────────────────────────────────────
  const [view, setView] = useState<'dashboard' | 'deploy' | 'work' | 'research' | 'missions' | 'bullets' | 'memory' | 'combat'>('dashboard');
  const [selectedAbnoIndex, setSelectedAbnoIndex] = useState<number | null>(null);
  const [workResult, setWorkResult] = useState<any>(null);
  const [targetDay, setTargetDay] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [isForceLeaving, setIsForceLeaving] = useState(false);
  const [selectedIdentityId, setSelectedIdentityId] = useState<string | null>(null);

  // ─── Work progress animation state ────────────────────────────────
  const [workInProgress, setWorkInProgress] = useState(false);
  const [workProgress, setWorkProgress] = useState(0);
  const workTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingWorkType, setPendingWorkType] = useState<WorkType | null>(null);

  // ─── Disband confirmation ──────────────────────────────────────────
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);

  // ─── Combat state ──────────────────────────────────────────────────
  const [combatEnemy, setCombatEnemy] = useState<any>(null);
  const [combatPlayer, setCombatPlayer] = useState<any>(null);
  const [combatTurn, setCombatTurn] = useState<'player' | 'resolve' | 'enemy'>('player');
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0);
  const [clashData, setClashData] = useState<{ p: number; e: number; won: boolean; dmg: number; actorName: string } | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isCombatFinished, setIsCombatFinished] = useState(false);
  const [playerHp, setPlayerHp] = useState(0);
  const [playerMaxHp, setPlayerMaxHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [enemyMaxHp, setEnemyMaxHp] = useState(0);
  const [combatInitiator, setCombatInitiator] = useState<string | null>(null);

  // ─── Hydration ────────────────────────────────────────────────────
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('qliphoth_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.state?.facility?.isActive) {
          const current = useGameStore.getState().facility;
          if (!current.isActive) {
            useGameStore.setState({ facility: parsed.state.facility });
          }
        }
      } catch (e) {}
    }
    setIsHydrated(true);
  }, []);

  // ─── Clean up work timer ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (workTimerRef.current) {
        clearInterval(workTimerRef.current);
        workTimerRef.current = null;
      }
    };
  }, []);

  // ─── Force Leave ──────────────────────────────────────────────────
  const handleForceLeave = async () => {
    if (isForceLeaving) return;
    setIsForceLeaving(true);
    try {
      const result = leaveFacility(user?.id || 'guest');
      if (result.success) {
        alert('🚪 You left the facility.');
        setIsForceLeaving(false);
        return;
      }
      alert('⚠️ Normal leave failed. Performing emergency reset...');
      useGameStore.setState((state) => ({
        facility: {
          ...state.facility,
          isActive: false,
          name: '',
          managerId: null,
          departmentKey: null,
          currentDay: 1,
          energy: 0,
          maxEnergy: 100,
          totalEnergy: 0,
          members: [],
          deployedAbnos: [],
          deployedToday: [],
          unlockedResearch: [],
          completedMissions: [],
          missionProgress: {},
          completedCoreSuppressions: [],
          suppressionRewards: [],
          ordealsCompleted: 0,
          activeOrdeal: null,
          activeBoost: null,
          qliphothOverload: {},
          log: [],
        },
      }));
      const stored = localStorage.getItem('qliphoth_state');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.state?.facility) {
            parsed.state.facility.isActive = false;
            localStorage.setItem('qliphoth_state', JSON.stringify(parsed));
          }
        } catch (e) {}
      }
      alert('✅ Emergency reset complete.');
    } catch (err) {
      console.error('Force leave error:', err);
      alert('❌ Force leave failed. Please refresh the page.');
    } finally {
      setIsForceLeaving(false);
    }
  };

  // ─── WebSocket connection helpers ──────────────────────────────────
  const connectWebSocket = (roomId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    const wsUrl = SERVER_URL.replace(/^https?:\/\//, '');
    const ws = new WebSocket(`wss://${wsUrl}/room/department/${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to department room');
      ws.send(JSON.stringify({
        type: 'join',
        playerId: user?.id || crypto.randomUUID(),
        playerName: getDisplayName(user),
        identityId: selectedIdentityId,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (roomId) connectWebSocket(roomId);
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // ─── Handle incoming WebSocket messages ──────────────────────────
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'stateUpdate':
        useGameStore.setState({ facility: data.facility });
        setPlayers(data.players || []);
        if (data.combat) {
          setCombatEnemy(data.combat.enemy);
          setCombatPlayer(data.combat.player);
          setPlayerHp(data.combat.playerHp);
          setPlayerMaxHp(data.combat.playerMaxHp);
          setEnemyHp(data.combat.enemyHp);
          setEnemyMaxHp(data.combat.enemyMaxHp);
          setCombatTurn(data.combat.turn);
          setClashData(data.combat.clashData || null);
          setCombatLog(data.combat.log || []);
          setIsCombatFinished(data.combat.isFinished);
          setCombatInitiator(data.combat.initiator);
          setView('combat');
        } else {
          setView('dashboard');
        }
        break;

      case 'departmentRoomDisbanded':
        useGameStore.setState((state) => ({
          facility: {
            ...state.facility,
            isActive: false,
            members: [],
            deployedAbnos: [],
            deployedToday: [],
            log: [],
          },
        }));
        setIsCoop(false);
        setRoomId(null);
        setPlayers([]);
        setIsHost(false);
        setView('dashboard');
        alert('The room has been disbanded by the host.');
        disconnectWebSocket();
        break;

      case 'departmentCombatAction':
        setPlayerHp(data.playerHp);
        setEnemyHp(data.enemyHp);
        setClashData(data.clashData || null);
        setCombatTurn(data.turn);
        if (data.log) setCombatLog(prev => [...prev.slice(-20), data.log]);
        break;

      case 'departmentCombatFinished':
        setIsCombatFinished(true);
        setView('dashboard');
        if (data.won) {
          suppressBreach(data.abnoId, true);
          addFacilityLog(`${data.initiator} suppressed ${data.enemyName}!`, 'success');
        } else {
          addFacilityLog(`${data.initiator} failed to suppress ${data.enemyName}.`, 'danger');
        }
        break;

      case 'error':
        alert(`❌ ${data.message}`);
        break;

      case 'welcome':
        console.log('Welcome from server:', data.message);
        break;

      default:
        console.log('Unhandled WebSocket message:', data);
    }
  };

  // ─── Send action via WebSocket ──────────────────────────────────
  const sendAction = (type: string, payload?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      alert('WebSocket is not connected. Please try again.');
    }
  };

  // ─── Create/Join room with custom code support ──────────────────
  const createDepartmentRoom = (deptId: string, customRoomId?: string) => {
    if (!user) {
      alert('Please log in first.');
      return;
    }
    const roomId = customRoomId || crypto.randomUUID().slice(0, 8);
    setRoomId(roomId);
    setIsHost(true);
    setIsCoop(true);
    const result = createFacility(deptId, user.id);
    if (result.success) {
      connectWebSocket(roomId);
      alert(`🏢 Room created: ${roomId}`);
    } else {
      alert(`❌ ${result.reason}`);
    }
  };

  const joinDepartmentRoom = (roomId: string) => {
    if (!user) {
      alert('Please log in first.');
      return;
    }
    setRoomId(roomId);
    setIsCoop(true);
    connectWebSocket(roomId);
    alert(`🔗 Joining room: ${roomId}`);
  };

  // ─── Disband room ──────────────────────────────────────────────────
  const disbandRoom = () => {
    if (facility.managerId !== user?.id) {
      alert('Only the manager can disband the facility.');
      return;
    }

    sendAction('disbandDepartmentRoom', {});
    useGameStore.setState((state) => ({
      facility: {
        ...state.facility,
        isActive: false,
        name: '',
        managerId: null,
        departmentKey: null,
        currentDay: 1,
        energy: 0,
        maxEnergy: 100,
        members: [],
        deployedAbnos: [],
        deployedToday: [],
        unlockedResearch: [],
        completedMissions: [],
        missionProgress: {},
        log: [],
      },
    }));
    setIsCoop(false);
    setRoomId(null);
    setPlayers([]);
    setIsHost(false);
    setView('dashboard');
    setShowDisbandConfirm(false);
    disconnectWebSocket();
    alert('🏢 Facility disbanded.');
  };

  // ─── Facility Log helper ─────────────────────────────────────────
  const addFacilityLog = (message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
    const entry = {
      timestamp: Date.now(),
      message,
      type,
      player: getDisplayName(user),
    };
    useGameStore.setState((state) => ({
      facility: {
        ...state.facility,
        log: [entry, ...(state.facility.log || [])].slice(0, 50),
      },
    }));
    if (isCoop && wsRef.current) {
      sendAction('addLog', entry);
    }
  };

  // ─── Get agent stats ──────────────────────────────────────────────
  const getAgentStats = () => {
    if (!selectedIdentityId) return null;
    const owned = ownedIdentities.find(o => o.identityId === selectedIdentityId);
    if (!owned) return null;
    const weaponId = owned.equippedWeaponId || null;
    const giftIds = equippedGifts[selectedIdentityId] || [];
    return computeAgentStats(
      selectedIdentityId,
      owned,
      weaponId,
      giftIds,
      facility,
      ownedWeapons,
      ownedGifts
    );
  };

  // ─── Get available abnormalities ──────────────────────────────────
  const getAvailableAbnos = () => {
    const deployedIds = facility.deployedAbnos.map((a: any) => a.abnoId);
    return abnormalities.filter(ab => !deployedIds.includes(ab.id));
  };

  // ─── Execute work with animation ──────────────────────────────────
  const executeWork = (workType: WorkType) => {
    if (workInProgress) return;
    if (!selectedAbnoIndex) return;
    const abno = facility.deployedAbnos[selectedAbnoIndex];
    if (!abno) return;

    setPendingWorkType(workType);
    setWorkInProgress(true);
    setWorkProgress(0);

    const duration = 2000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    if (workTimerRef.current) {
      clearInterval(workTimerRef.current);
      workTimerRef.current = null;
    }

    workTimerRef.current = setInterval(() => {
      currentStep += 1;
      const progress = Math.min(100, (currentStep / steps) * 100);
      setWorkProgress(progress);

      if (progress >= 100) {
        if (workTimerRef.current) {
          clearInterval(workTimerRef.current);
          workTimerRef.current = null;
        }
        performWork(workType);
      }
    }, interval);
  };

  const performWork = (workType: WorkType) => {
    if (!selectedAbnoIndex) {
      setWorkInProgress(false);
      setWorkProgress(0);
      return;
    }
    const abno = facility.deployedAbnos[selectedAbnoIndex];
    if (!abno) {
      setWorkInProgress(false);
      setWorkProgress(0);
      return;
    }

    const result = workOnAbnormality(abno.abnoId, workType, user?.id || 'guest');
    setWorkResult(result);
    addFacilityLog(`${getDisplayName(user)} worked on ${abno.abnoName} (${workType}) - ${result.isSuccess ? 'Success' : 'Failed'}`, result.isSuccess ? 'success' : 'danger');
    if (isCoop) sendAction('work', { abnoId: abno.abnoId, workType });
    if (result.breached) alert(`⚠️ ${abno.abnoName} has breached!`);
    if (result.boostDropped) alert(`🎉 Temperance Boost dropped!`);

    setWorkInProgress(false);
    setWorkProgress(0);
    setPendingWorkType(null);

    setTimeout(() => {
      setWorkResult(null);
    }, 3000);
  };

  // ─── Combat action ──────────────────────────────────────────────────
  const handleCombatAction = () => {
    if (combatTurn !== 'player' || isCombatFinished) return;
    if (combatInitiator && combatInitiator !== user?.id) {
      alert('Only the initiator can take combat actions.');
      return;
    }
    const player = combatPlayer;
    const enemy = combatEnemy;
    if (!player || !enemy) return;

    const skill = player.skills[selectedSkillIndex];
    if (!skill) return;

    const eSkill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
    const result = clash(skill.power, eSkill.power, skill.coins, eSkill.coins);
    const dmgMult = damageTypeMult(skill.damageType || player.damageType, enemy.resistDamageType);
    const infMult = infusionMult(skill.infusion || player.infusion, enemy.resistInfusion);
    const mult = dmgMult * infMult;
    let won = result.playerTotal >= result.enemyTotal;
    let dmg = 0;
    let enemyDmg = 0;
    if (won) {
      const diff = result.playerTotal - result.enemyTotal;
      const basePercent = 0.005 + 0.0015 * diff;
      let finalPercent = basePercent * mult * skill.dmgMult;
      finalPercent *= (0.85 + Math.random() * 0.3);
      dmg = Math.max(1, Math.floor(finalPercent * enemy.maxHp));
      const newEnemyHp = Math.max(0, enemyHp - dmg);
      setEnemyHp(newEnemyHp);
      setClashData({ p: result.playerTotal, e: result.enemyTotal, won: true, dmg, actorName: player.name });
      const logMsg = `✅ ${player.name} dealt ${dmg} damage to ${enemy.name}!`;
      setCombatLog(prev => [...prev.slice(-20), logMsg]);
      if (isCoop) {
        sendAction('combatAction', { playerHp, enemyHp: newEnemyHp, clashData: { p: result.playerTotal, e: result.enemyTotal, won: true, dmg, actorName: player.name }, turn: 'resolve', log: logMsg });
      }
      if (newEnemyHp <= 0) {
        setIsCombatFinished(true);
        const finishLog = `🏆 ${enemy.name} defeated!`;
        setCombatLog(prev => [...prev, finishLog]);
        addFacilityLog(`${player.name} suppressed ${enemy.name}!`, 'success');
        if (isCoop) {
          sendAction('combatFinish', { abnoId: enemy.abnoId, won: true, initiator: user?.id, enemyName: enemy.name });
        } else {
          suppressBreach(enemy.abnoId, true);
        }
        return;
      }
    } else {
      const diff = result.enemyTotal - result.playerTotal;
      const basePercent = 0.005 + 0.0015 * diff;
      let finalPercent = basePercent;
      finalPercent *= (0.85 + Math.random() * 0.3);
      finalPercent = Math.min(finalPercent, 0.15);
      enemyDmg = Math.max(1, Math.floor(finalPercent * player.maxHp));
      const newPlayerHp = Math.max(0, playerHp - enemyDmg);
      setPlayerHp(newPlayerHp);
      setClashData({ p: result.playerTotal, e: result.enemyTotal, won: false, dmg: enemyDmg, actorName: enemy.name });
      const logMsg = `❌ ${enemy.name} dealt ${enemyDmg} damage to ${player.name}!`;
      setCombatLog(prev => [...prev.slice(-20), logMsg]);
      if (isCoop) {
        sendAction('combatAction', { playerHp: newPlayerHp, enemyHp, clashData: { p: result.playerTotal, e: result.enemyTotal, won: false, dmg: enemyDmg, actorName: enemy.name }, turn: 'resolve', log: logMsg });
      }
      if (newPlayerHp <= 0) {
        setIsCombatFinished(true);
        const finishLog = `💀 ${player.name} has fallen!`;
        setCombatLog(prev => [...prev, finishLog]);
        addFacilityLog(`${player.name} was defeated by ${enemy.name}!`, 'danger');
        if (isCoop) {
          sendAction('combatFinish', { abnoId: enemy.abnoId, won: false, initiator: user?.id, enemyName: enemy.name });
        }
        return;
      }
    }
    setCombatTurn('resolve');
  };

  const resolveCombat = () => {
    if (enemyHp <= 0) return;
    setCombatTurn('enemy');
    setTimeout(() => {
      const enemy = combatEnemy;
      const player = combatPlayer;
      if (!enemy || !player) return;
      const eSkill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
      const playerDefense = player.def > 0 ? player.def : 30;
      const playerTotal = 5 + Math.floor(playerDefense / 10);
      let enemyTotal = 0;
      for (let c = 0; c < eSkill.coins; c++) {
        enemyTotal += rollCoin(eSkill.power);
      }
      const diff = enemyTotal - playerTotal;
      let dmg = 0;
      if (diff > 0) {
        const basePercent = 0.005 + 0.0015 * diff;
        let finalPercent = basePercent;
        finalPercent *= (0.85 + Math.random() * 0.3);
        finalPercent = Math.min(finalPercent, 0.12);
        dmg = Math.max(1, Math.floor(finalPercent * player.maxHp));
        const newPlayerHp = Math.max(0, playerHp - dmg);
        setPlayerHp(newPlayerHp);
        const logMsg = `👊 ${enemy.name} attacks for ${dmg} damage.`;
        setCombatLog(prev => [...prev.slice(-20), logMsg]);
        if (isCoop) {
          sendAction('combatAction', { playerHp: newPlayerHp, enemyHp, clashData: null, turn: 'player', log: logMsg });
        }
        if (newPlayerHp <= 0) {
          setIsCombatFinished(true);
          setCombatLog(prev => [...prev, `💀 ${player.name} has fallen!`]);
          addFacilityLog(`${player.name} was defeated by ${enemy.name}!`, 'danger');
          if (isCoop) {
            sendAction('combatFinish', { abnoId: enemy.abnoId, won: false, initiator: user?.id, enemyName: enemy.name });
          }
          return;
        }
      } else {
        const logMsg = `🛡️ ${player.name} blocked the attack.`;
        setCombatLog(prev => [...prev.slice(-20), logMsg]);
        if (isCoop) {
          sendAction('combatAction', { playerHp, enemyHp, clashData: null, turn: 'player', log: logMsg });
        }
      }
      setCombatTurn('player');
      setClashData(null);
    }, 800);
  };

  // ─── Early return if no facility ──────────────────────────────────
  if (!isHydrated) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <p className="text-cyan-400 animate-pulse">Loading facility data...</p>
      </div>
    );
  }

  if (!facility || !facility.isActive) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">🏢 Facility Management</h2>
        <p className="text-gray-400 mb-6">You don't have a facility yet. Create one to start managing abnormalities!</p>

        <div className="mb-6 p-3 border border-red-500/30 bg-red-500/10 rounded-lg">
          <p className="text-red-400 text-sm mb-2">⚠️ Stuck? Use emergency leave:</p>
          <button
            onClick={handleForceLeave}
            disabled={isForceLeaving}
            className="px-4 py-2 bg-red-500/20 border border-red-400 text-red-400 rounded hover:bg-red-500 hover:text-white transition disabled:opacity-50"
          >
            {isForceLeaving ? 'Processing...' : '🚪 Emergency Leave'}
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setIsCoop(false)}
            className={`px-4 py-2 border rounded ${!isCoop ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400' : 'border-gray-700 text-gray-400'}`}
          >
            🎮 Solo
          </button>
          <button
            onClick={() => setIsCoop(true)}
            className={`px-4 py-2 border rounded ${isCoop ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400' : 'border-gray-700 text-gray-400'}`}
          >
            🌐 Co‑op
          </button>
        </div>

        {isCoop ? (
          <div className="border border-gray-700 rounded p-4 bg-gray-800/30">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">🌐 Co‑op Lobby</h3>
            <p className="text-sm text-gray-400 mb-4">Create a room or join by code.</p>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Room Code (empty = auto-generate)"
                  className="flex-1 bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:border-cyan-400 outline-none rounded"
                  id="roomCodeInput"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      const code = input.value.trim();
                      if (code) {
                        joinDepartmentRoom(code);
                      } else {
                        const deptId = Object.keys(DEPARTMENTS)[0] as DepartmentId;
                        createDepartmentRoom(deptId);
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('roomCodeInput') as HTMLInputElement;
                    const code = input.value.trim();
                    if (code) {
                      joinDepartmentRoom(code);
                    } else {
                      const deptId = Object.keys(DEPARTMENTS)[0] as DepartmentId;
                      createDepartmentRoom(deptId);
                    }
                  }}
                  className="px-4 py-2 bg-cyan-400/20 border border-cyan-400 text-cyan-400 rounded hover:bg-cyan-400 hover:text-gray-900 transition"
                >
                  Join / Create
                </button>
              </div>
              <p className="text-xs text-gray-500">If you leave code empty, a random one will be generated.</p>
              {roomId && (
                <p className="text-xs text-cyan-400">Room Code: <span className="font-mono font-bold">{roomId}</span></p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {Object.values(DEPARTMENTS).map(dept => (
              <button
                key={dept.id}
                onClick={async () => {
                  if (isCreating) return;
                  setIsCreating(true);
                  const result = createFacility(dept.id, user?.id || 'guest');
                  if (result.success) {
                    alert(`✅ ${dept.name} facility created!`);
                    setIsCreating(false);
                    window.location.reload();
                  } else {
                    alert(`❌ ${result.reason}`);
                    setIsCreating(false);
                  }
                }}
                className="p-3 border border-gray-700 rounded hover:border-cyan-400 transition text-left disabled:opacity-50"
                style={{ borderColor: dept.color }}
                disabled={isCreating}
              >
                <span className="text-lg">{dept.icon}</span>
                <span className="text-white font-bold ml-2">{dept.name}</span>
                <p className="text-xs text-gray-400 mt-1">Unlocks Day {dept.unlockDay} · {dept.maxAbnormalities} abno/day</p>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => joinFacility(user?.id || 'guest')}
          className="mt-4 px-4 py-2 bg-cyan-500/20 border border-cyan-400 text-cyan-400 rounded hover:bg-cyan-400 hover:text-gray-900 transition"
          disabled={isCreating}
        >
          Join Existing Facility
        </button>
      </div>
    );
  }

  const deptConfig = DEPARTMENTS[facility.departmentKey as DepartmentId];
  const isManager = facility.managerId === user?.id;
  const maxDeploy = deptConfig?.maxAbnormalities || 1;
  const requiredEnergy = getRequiredEnergyForDay(facility.currentDay);
  const canAdvance = facility.energy >= requiredEnergy;

  // ─── Render: Dashboard ─────────────────────────────────────────────
  const renderDashboard = () => {
    const boost = facility.activeBoost;
    const boostRemaining = boost ? Math.floor((boost.expiresAt - Date.now()) / 1000) : 0;
    const boostActive = boost && boostRemaining > 0;

    const identityOptions = ownedIdentities.map(o => ({
      id: o.identityId,
      name: identities.find(i => i.id === o.identityId)?.name || o.identityId,
      portrait: identities.find(i => i.id === o.identityId)?.portrait || '👤',
    }));

    const HpBar = ({ value, max, color = 'green', label }: any) => {
      const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
      const colorClass = color === 'green' ? 'bg-green-500' : color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-500' : 'bg-blue-500';
      return (
        <div className="w-full">
          {label && <div className="flex justify-between text-xs text-gray-400"><span>{label}</span><span>{Math.round(pct)}%</span></div>}
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div className={`h-full transition-all duration-300 ${colorClass}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-gray-700 bg-gray-800/50 p-3 rounded text-center">
            <p className="text-xs text-gray-400">Day</p>
            <p className="text-2xl font-bold text-white">{facility.currentDay}</p>
          </div>
          <div className="border border-gray-700 bg-gray-800/50 p-3 rounded text-center">
            <p className="text-xs text-gray-400">Energy</p>
            <p className="text-xl font-bold text-cyan-400">{facility.energy} / {facility.maxEnergy}</p>
            <HpBar value={facility.energy} max={facility.maxEnergy} color="cyan" />
          </div>
          <div className="border border-gray-700 bg-gray-800/50 p-3 rounded text-center">
            <p className="text-xs text-gray-400">Qliphoth Level</p>
            <p className="text-2xl font-bold text-amber-400">{facility.qliphothLevel}</p>
          </div>
          <div className="border border-gray-700 bg-gray-800/50 p-3 rounded text-center">
            <p className="text-xs text-gray-400">Members</p>
            <p className="text-2xl font-bold text-white">{facility.members.length}</p>
            {isCoop && <p className="text-xs text-cyan-400">🌐 Co‑op</p>}
          </div>
        </div>

        {/* Identity Selection */}
        <div className="border border-cyan-500/20 bg-cyan-500/5 p-3 rounded">
          <p className="text-xs text-gray-400 mb-1">Select an identity for work & combat:</p>
          <div className="flex flex-wrap gap-2">
            {identityOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSelectedIdentityId(opt.id)}
                className={`px-3 py-1 text-sm font-mono border rounded transition ${
                  selectedIdentityId === opt.id
                    ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                    : 'border-gray-700 text-gray-400 hover:border-cyan-400/50'
                }`}
              >
                {opt.portrait} {opt.name}
              </button>
            ))}
          </div>
          {selectedIdentityId && (
            <div className="mt-2 text-xs text-gray-400">
              {(() => {
                const stats = getAgentStats();
                if (!stats) return 'Stats not available.';
                return (
                  <div className="flex flex-wrap gap-3">
                    <span>HP: <span className="text-green-400">{stats.maxHp}</span></span>
                    <span>SP: <span className="text-blue-400">{stats.maxSp}</span></span>
                    <span>ATK: <span className="text-red-400">{stats.atk}</span></span>
                    <span>DEF: <span className="text-yellow-400">{stats.def}</span></span>
                    <span>Work Bonus: <span className="text-purple-400">+{Math.round((stats.workSuccess - 1) * 100)}%</span></span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Boost Active */}
        {boostActive && (
          <div className="border border-green-500/30 bg-green-500/10 p-3 rounded flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <div>
              <p className="text-green-400 font-bold">Temperance Boost Active!</p>
              <p className="text-xs text-gray-400">+50% Temperance · {Math.floor(boostRemaining / 60)}:{String(boostRemaining % 60).padStart(2, '0')} remaining</p>
            </div>
          </div>
        )}

        {/* Active Ordeal */}
        {facility.activeOrdeal && (
          <div className="border border-red-500/30 bg-red-500/10 p-3 rounded">
            <p className="text-red-400 font-bold">⚠️ ORDEAL IN PROGRESS</p>
            <p className="text-white">{facility.activeOrdeal.name}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  resolveOrdeal(facility.activeOrdeal!.id, true);
                  addFacilityLog(`${getDisplayName(user)} resolved ordeal: Victory`, 'success');
                  if (isCoop) sendAction('resolveOrdeal', { id: facility.activeOrdeal!.id, victory: true });
                }}
                className="px-3 py-1 bg-red-500/20 border border-red-400 text-red-400 rounded text-sm hover:bg-red-400 hover:text-gray-900 transition"
              >
                Resolve (Victory)
              </button>
              <button
                onClick={() => {
                  resolveOrdeal(facility.activeOrdeal!.id, false);
                  addFacilityLog(`${getDisplayName(user)} resolved ordeal: Defeat`, 'danger');
                  if (isCoop) sendAction('resolveOrdeal', { id: facility.activeOrdeal!.id, victory: false });
                }}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition"
              >
                Resolve (Defeat)
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView('deploy')}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-400 text-cyan-400 rounded hover:bg-cyan-400 hover:text-gray-900 transition"
          >
            📦 Deploy Abnormality
          </button>
          <button
            onClick={() => setView('work')}
            className="px-4 py-2 bg-green-500/20 border border-green-400 text-green-400 rounded hover:bg-green-400 hover:text-gray-900 transition"
          >
            🔨 Work
          </button>
          <button
            onClick={() => setView('research')}
            className="px-4 py-2 bg-purple-500/20 border border-purple-400 text-purple-400 rounded hover:bg-purple-400 hover:text-gray-900 transition"
          >
            🔬 Research
          </button>
          <button
            onClick={() => setView('missions')}
            className="px-4 py-2 bg-amber-500/20 border border-amber-400 text-amber-400 rounded hover:bg-amber-400 hover:text-gray-900 transition"
          >
            📜 Missions
          </button>
          {isManager && (
            <button
              onClick={() => setView('bullets')}
              className="px-4 py-2 bg-red-500/20 border border-red-400 text-red-400 rounded hover:bg-red-400 hover:text-gray-900 transition"
            >
              🔫 Bullets
            </button>
          )}
          {isManager && facility.memoryRepositoryAvailable && (
            <button
              onClick={() => setView('memory')}
              className="px-4 py-2 bg-indigo-500/20 border border-indigo-400 text-indigo-400 rounded hover:bg-indigo-400 hover:text-gray-900 transition"
            >
              🔄 Memory
            </button>
          )}
          <button
            onClick={() => {
              if (canAdvance) {
                const result = advanceDay();
                if (result.success) {
                  addFacilityLog(`${getDisplayName(user)} advanced to Day ${result.newDay}`, 'success');
                  if (result.ordeal) addFacilityLog(`Ordeal triggered: ${result.ordeal.name}`, 'warning');
                  alert(`✅ Advanced to Day ${result.newDay}`);
                  if (result.ordeal) alert(`⚠️ Ordeal triggered: ${result.ordeal.name}`);
                } else alert(`❌ ${result.reason}`);
                if (isCoop) sendAction('advanceDay', {});
              } else {
                alert(`❌ Need ${requiredEnergy} energy to advance`);
              }
            }}
            className={`px-4 py-2 border rounded transition ${canAdvance ? 'border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-gray-900' : 'border-gray-600 text-gray-500 cursor-not-allowed'}`}
          >
            ➡️ Advance Day ({requiredEnergy}⚡)
          </button>

          {/* ─── LEAVE / DISBAND BUTTON ─── */}
          <button
            onClick={() => {
              const isManager = facility.managerId === user?.id;
              if (isManager) {
                setShowDisbandConfirm(true);
                return;
              }
              const confirmMsg = 'Are you sure you want to leave the facility?';
              if (confirm(confirmMsg)) {
                const result = leaveFacility(user?.id || 'guest');
                if (result.success) {
                  if (isCoop && wsRef.current) {
                    sendAction('leaveDepartmentRoom', {});
                    disconnectWebSocket();
                  }
                  useGameStore.setState((state) => ({
                    facility: {
                      ...state.facility,
                      isActive: false,
                      name: '',
                      managerId: null,
                      departmentKey: null,
                      currentDay: 1,
                      energy: 0,
                      maxEnergy: 100,
                      members: [],
                      deployedAbnos: [],
                      deployedToday: [],
                      unlockedResearch: [],
                      completedMissions: [],
                      missionProgress: {},
                      log: [],
                    },
                  }));
                  setIsCoop(false);
                  setRoomId(null);
                  setPlayers([]);
                  setIsHost(false);
                  setView('dashboard');
                } else {
                  alert(`❌ ${result.reason}`);
                }
              }
            }}
            className={`px-4 py-2 border rounded transition ${
              facility.managerId === user?.id
                ? 'border-red-400 text-red-400 hover:bg-red-400 hover:text-gray-900'
                : 'border-red-400 text-red-400 hover:bg-red-400 hover:text-gray-900'
            }`}
          >
            {facility.managerId === user?.id ? '💥 Disband Facility' : '🚪 Leave Facility'}
          </button>

          {/* ─── EMERGENCY LEAVE ─── */}
          <button
            onClick={handleForceLeave}
            disabled={isForceLeaving}
            className="px-4 py-2 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 transition disabled:opacity-50 text-xs"
          >
            {isForceLeaving ? 'Processing...' : '🚪 Emergency Leave'}
          </button>
        </div>

        {/* Disband Confirmation Overlay */}
        {showDisbandConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-red-500/30 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-bold text-red-400">💥 Disband Facility?</h3>
              <p className="text-sm text-gray-300 mt-2">
                {isCoop
                  ? 'This will disband the room and force all players to leave. Are you sure?'
                  : 'This will permanently delete your facility and all progress. Are you sure?'}
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowDisbandConfirm(false)}
                  className="px-4 py-2 border border-gray-600 text-gray-400 rounded hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={disbandRoom}
                  className="px-4 py-2 bg-red-500/20 border border-red-400 text-red-400 rounded hover:bg-red-400 hover:text-gray-900 transition"
                >
                  Disband
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deployed Abnormalities */}
        <div className="border border-gray-700 rounded p-4 bg-gray-800/30">
          <h3 className="text-sm font-bold text-white mb-2">📋 Deployed Abnormalities</h3>
          {facility.deployedAbnos.length === 0 ? (
            <p className="text-gray-400 text-sm">No abnormalities deployed.</p>
          ) : (
            <div className="space-y-2">
              {facility.deployedAbnos.map((abno: any, idx: number) => {
                const isBreaching = abno.qliphothCounter <= 0;
                const riskEmoji = getRiskEmoji(abno.risk);
                return (
                  <div key={idx} className={`border p-3 rounded ${isBreaching ? 'border-red-500/50 bg-red-500/10' : 'border-gray-700 bg-gray-800/50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{riskEmoji}</span>
                        <span className="text-white font-bold">{abno.abnoName}</span>
                        <span className="text-xs text-gray-400">{abno.risk}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Qliphoth</p>
                        <div className="w-24">
                          <HpBar value={abno.qliphothCounter} max={abno.maxCounter} color={isBreaching ? 'red' : 'amber'} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {isBreaching ? (
                        <button
                          onClick={() => {
                            if (!selectedIdentityId) {
                              alert('Please select an identity first.');
                              return;
                            }
                            const stats = getAgentStats();
                            if (!stats) {
                              alert('Could not get agent stats.');
                              return;
                            }
                            const abnoData = getAbnormalityById(abno.abnoId);
                            if (!abnoData) return;
                            const enemySkills = abnoData.combatPages?.map(p => ({
                              name: p.name,
                              power: p.basePower || p.min || 5,
                              coins: p.coins || 1,
                              damageType: p.damageType || 'Red',
                              infusion: p.infusion || 'Slash',
                            })) || [{ name: 'Strike', power: 5, coins: 1, damageType: 'Red', infusion: 'Slash' }];
                            const enemy = {
                              name: abnoData.name,
                              hp: abnoData.hp || 100,
                              maxHp: abnoData.hp || 100,
                              atk: abnoData.atk || 10,
                              def: abnoData.def || 5,
                              damageType: 'Red',
                              infusion: 'Slash',
                              resistDamageType: 'Pale',
                              resistInfusion: 'Pierce',
                              skills: enemySkills,
                              abnoId: abno.abnoId,
                            };
                            const player = {
                              name: identities.find(i => i.id === selectedIdentityId)?.name || 'Agent',
                              hp: stats.maxHp,
                              maxHp: stats.maxHp,
                              atk: stats.atk,
                              def: stats.def,
                              damageType: stats.damageType,
                              infusion: stats.infusion,
                              skills: stats.skills,
                            };
                            setCombatEnemy(enemy);
                            setCombatPlayer(player);
                            setPlayerHp(player.hp);
                            setPlayerMaxHp(player.maxHp);
                            setEnemyHp(enemy.hp);
                            setEnemyMaxHp(enemy.maxHp);
                            setCombatTurn('player');
                            setSelectedSkillIndex(0);
                            setClashData(null);
                            setCombatLog(['⚔️ Breach combat started!']);
                            setIsCombatFinished(false);
                            setCombatInitiator(user?.id || null);
                            setView('combat');
                            if (isCoop && wsRef.current) {
                              sendAction('startCombat', { enemy, player, abnoId: abno.abnoId, initiator: user?.id });
                            }
                          }}
                          className="text-xs px-2 py-1 bg-red-500/20 border border-red-400 text-red-400 rounded hover:bg-red-400 hover:text-gray-900 transition"
                        >
                          ⚔️ Suppress Breach (Global)
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedAbnoIndex(idx);
                            setView('work');
                          }}
                          className="text-xs px-2 py-1 bg-cyan-500/20 border border-cyan-400 text-cyan-400 rounded hover:bg-cyan-400 hover:text-gray-900 transition"
                        >
                          🔨 Work
                        </button>
                      )}
                      {isManager && !isBreaching && (
                        <button
                          onClick={() => {
                            const newAbnos = facility.deployedAbnos.filter((_: any, i: number) => i !== idx);
                            useGameStore.setState((s) => ({
                              facility: {
                                ...s.facility,
                                deployedAbnos: newAbnos,
                              },
                            }));
                            addFacilityLog(`${getDisplayName(user)} removed ${abno.abnoName}`, 'info');
                            if (isCoop) sendAction('removeAbno', { abnoId: abno.abnoId });
                          }}
                          className="text-xs px-2 py-1 border border-gray-600 text-gray-400 rounded hover:border-red-400 hover:text-red-400 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Facility Log */}
        <div className="border border-gray-700 rounded p-4 bg-gray-800/30">
          <h3 className="text-sm font-bold text-white mb-2">📜 Facility Log</h3>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {(facility.log || []).map((entry: any, i: number) => {
              const time = new Date(entry.timestamp).toLocaleTimeString();
              const color = entry.type === 'success' ? 'text-green-400' : entry.type === 'danger' ? 'text-red-400' : entry.type === 'warning' ? 'text-amber-400' : 'text-gray-400';
              return (
                <div key={i} className={`text-xs ${color}`}>
                  <span className="text-gray-600">[{time}]</span> {entry.player}: {entry.message}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ─── Render: Deploy ─────────────────────────────────────────────────
  const renderDeploy = () => {
    const deployedToday = facility.deployedToday.length;
    const canDeploy = deployedToday < maxDeploy;
    const availableAbnos = getAvailableAbnos();

    const getCost = (risk: string) => {
      if (risk === 'ALEPH') return 50;
      if (risk === 'WAW') return 30;
      if (risk === 'HE') return 15;
      if (risk === 'ZAYIN' || risk === 'TETH') return 0;
      return 5;
    };

    return (
      <div className="border border-gray-700 rounded p-4 bg-gray-800/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-cyan-400">📦 Deploy Abnormality</h3>
          <button onClick={() => setView('dashboard')} className="text-sm text-gray-400 hover:text-white">← Back</button>
        </div>
        <p className="text-sm text-gray-400 mb-2">Deployments today: {deployedToday}/{maxDeploy}</p>
        {!canDeploy ? (
          <p className="text-amber-400">Maximum deployments for today reached.</p>
        ) : availableAbnos.length === 0 ? (
          <p className="text-gray-400">No abnormalities available to deploy.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableAbnos.map(abno => {
              const alreadyDeployed = facility.deployedAbnos.some((a: any) => a.abnoId === abno.id);
              const cost = getCost(abno.risk);
              const canAfford = facility.energy >= cost;
              const isFree = cost === 0;

              return (
                <div key={abno.id} className="flex items-center justify-between border border-gray-700 bg-gray-800/50 p-2 rounded">
                  <div>
                    <span className="text-lg">{getRiskEmoji(abno.risk)}</span>
                    <span className="text-white ml-2">{abno.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{abno.risk}</span>
                    <span className="text-xs text-amber-400 ml-2">
                      Cost: {isFree ? 'Free' : `${cost}⚡`}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (alreadyDeployed) return;
                      if (!isFree && !canAfford) {
                        alert(`❌ Not enough energy (need ${cost})`);
                        return;
                      }
                      const result = deployAbnormality(abno.id, user?.id || 'guest');
                      if (result.success) {
                        alert(`✅ ${result.abnormality} deployed!`);
                        addFacilityLog(`${getDisplayName(user)} deployed ${abno.name}`, 'success');
                        if (isCoop) sendAction('deployAbno', { abnoId: abno.id });
                        setView('dashboard');
                      } else {
                        alert(`❌ ${result.reason}`);
                      }
                    }}
                    disabled={alreadyDeployed || (!isFree && !canAfford)}
                    className={`px-3 py-1 rounded text-sm ${
                      alreadyDeployed ? 'bg-gray-700 text-gray-500 cursor-not-allowed' :
                      isFree ? 'bg-green-500/20 border border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 transition' :
                      'bg-cyan-500/20 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900 transition'
                    }`}
                  >
                    {alreadyDeployed ? 'Deployed' : 'Deploy'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── Render: Work (Lobotomy Corp style) ──────────────────────────
  const renderWork = () => {
    if (!selectedIdentityId) {
      return (
        <div className="border border-gray-700 rounded p-4">
          <p className="text-amber-400">Please select an identity on the dashboard first.</p>
          <button onClick={() => setView('dashboard')} className="mt-2 text-sm text-cyan-400 hover:text-white">← Back</button>
        </div>
      );
    }
    const agentStats = getAgentStats();
    if (!agentStats) {
      return (
        <div className="border border-gray-700 rounded p-4">
          <p className="text-red-400">Agent stats not available.</p>
          <button onClick={() => setView('dashboard')} className="mt-2 text-sm text-cyan-400 hover:text-white">← Back</button>
        </div>
      );
    }

    const abnos = facility.deployedAbnos.filter((a: any) => a.qliphothCounter > 0);
    if (abnos.length === 0) {
      return (
        <div className="border border-gray-700 rounded p-4">
          <p className="text-gray-400">No abnormalities available to work on.</p>
          <button onClick={() => setView('dashboard')} className="mt-2 text-sm text-cyan-400 hover:text-white">← Back</button>
        </div>
      );
    }

    const selectedAbno = selectedAbnoIndex !== null ? abnos[selectedAbnoIndex] : null;

    if (!selectedAbno) {
      return (
        <div className="border border-gray-700 rounded p-4">
          <h3 className="text-lg font-bold text-green-400 mb-4">🔨 Select an Abnormality</h3>
          <div className="space-y-2">
            {abnos.map((abno: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedAbnoIndex(idx)}
                className="w-full text-left border border-gray-700 bg-gray-800/50 p-2 rounded hover:border-cyan-400 transition"
              >
                <span className="text-lg">{getRiskEmoji(abno.risk)}</span>
                <span className="text-white ml-2">{abno.abnoName}</span>
                <span className="text-xs text-gray-400 ml-2">Qliphoth: {abno.qliphothCounter}/{abno.maxCounter}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setView('dashboard')} className="mt-4 text-sm text-gray-400 hover:text-white">← Back</button>
        </div>
      );
    }

    const abnoData = getAbnormalityById(selectedAbno.abnoId);
    const baseChances = abnoData?.workChances || { instinct: 0.5, insight: 0.5, attachment: 0.5, repression: 0.5 };
    const modifiedChances = {
      instinct: Math.min(1, baseChances.instinct * agentStats.workSuccess),
      insight: Math.min(1, baseChances.insight * agentStats.workSuccess),
      attachment: Math.min(1, baseChances.attachment * agentStats.workSuccess),
      repression: Math.min(1, baseChances.repression * agentStats.workSuccess),
    };

    const identity = identities.find(i => i.id === selectedIdentityId);
    const identityPortrait = identity?.portrait || '👤';

    return (
      <div className="border border-gray-700 rounded p-4 bg-gray-800/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-green-400">
            🔨 Work on {getRiskEmoji(selectedAbno.risk)} {selectedAbno.abnoName}
          </h3>
          <button onClick={() => setSelectedAbnoIndex(null)} className="text-sm text-gray-400 hover:text-white">← Back</button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-700/20 rounded">
          <div className="text-center">
            <p className="text-xs text-gray-400">Abnormality</p>
            <p className="text-xl font-bold text-white">{selectedAbno.abnoName}</p>
            <p className="text-sm text-gray-400">Risk: {selectedAbno.risk}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Agent</p>
            <p className="text-xl font-bold text-cyan-400">{identity?.name || 'Agent'}</p>
            <p className="text-sm text-gray-400">Work Bonus: +{Math.round((agentStats.workSuccess - 1) * 100)}%</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between p-2 bg-gray-800/30 rounded">
          <span className="text-sm text-gray-400">Qliphoth Counter</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${(selectedAbno.qliphothCounter / selectedAbno.maxCounter) * 100}%` }}
              />
            </div>
            <span className="text-white font-mono">{selectedAbno.qliphothCounter}/{selectedAbno.maxCounter}</span>
          </div>
        </div>

        {workInProgress && (
          <div className="mb-4 p-4 border-2 border-cyan-500/50 bg-cyan-500/10 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-4 mb-2">
              <div className="text-4xl">{getRiskEmoji(selectedAbno.risk)}</div>
              <div className="flex-1">
                <div className="flex justify-between text-sm text-cyan-400 font-bold">
                  <span>WORKING ON {selectedAbno.abnoName.toUpperCase()}...</span>
                  <span>{Math.round(workProgress)}%</span>
                </div>
                <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden border border-cyan-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-green-400 transition-all duration-100 rounded-full"
                    style={{ width: `${workProgress}%` }}
                  />
                </div>
              </div>
              <div className="text-3xl">{identityPortrait}</div>
            </div>
            <div className="text-center text-xs text-cyan-300 font-mono">
              ⏳ {pendingWorkType?.toUpperCase()} in progress... Agent is working.
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {(['instinct', 'insight', 'attachment', 'repression'] as WorkType[]).map(type => {
            const chance = modifiedChances[type];
            const isDisabled = workInProgress;
            return (
              <button
                key={type}
                onClick={() => {
                  if (isDisabled) return;
                  executeWork(type);
                }}
                disabled={isDisabled}
                className={`p-3 border rounded transition capitalize text-sm ${
                  isDisabled
                    ? 'border-gray-600 bg-gray-700/50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-700 bg-gray-800/30 hover:border-cyan-400 hover:bg-cyan-400/10'
                }`}
              >
                <div className="font-bold">{type}</div>
                <div className="text-xs text-gray-400">{Math.round(chance * 100)}% success</div>
                {isDisabled && workInProgress && (
                  <div className="text-[10px] text-cyan-400 animate-pulse">⏳ Working...</div>
                )}
              </button>
            );
          })}
        </div>

        {workResult && (
          <div className={`mt-4 p-4 border-2 rounded-lg shadow-lg transition-all duration-500 ${
            workResult.isSuccess
              ? 'border-green-500/50 bg-green-500/10 scale-100'
              : 'border-red-500/50 bg-red-500/10 scale-100'
          }`}>
            <div className="flex items-center gap-4">
              <span className="text-4xl">{workResult.isSuccess ? '✅' : '❌'}</span>
              <div className="flex-1">
                <p className={`text-xl font-bold ${workResult.isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                  {workResult.isSuccess ? 'GOOD' : 'BAD'} WORK RESULT
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-gray-400">Energy:</span>
                    <span className="text-cyan-400 ml-1">+{workResult.energyGain}</span>
                  </div>
                  {workResult.peBoxes > 0 && (
                    <div>
                      <span className="text-gray-400">PE Boxes:</span>
                      <span className="text-amber-400 ml-1">+{workResult.peBoxes}</span>
                    </div>
                  )}
                </div>
                {workResult.breached && (
                  <p className="text-red-400 text-sm animate-pulse mt-1">⚠️ BREACH TRIGGERED!</p>
                )}
                {workResult.boostDropped && (
                  <p className="text-green-400 text-sm mt-1">📈 Temperance Boost dropped!</p>
                )}
              </div>
            </div>
          </div>
        )}

        <button onClick={() => setView('dashboard')} className="mt-4 text-sm text-gray-400 hover:text-white">← Back</button>
      </div>
    );
  };

  // ─── Render: Research ─────────────────────────────────────────────
  const renderResearch = () => {
    const deptKey = facility.departmentKey;
    const dept = DEPARTMENTS[deptKey as DepartmentId];
    const researches = dept?.research || [];

    return (
      <div className="border border-gray-700 rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-purple-400">🔬 Research</h3>
          <button onClick={() => setView('dashboard')} className="text-sm text-gray-400 hover:text-white">← Back</button>
        </div>
        <div className="space-y-2">
          {researches.map(r => {
            const unlocked = facility.unlockedResearch.includes(r.id);
            return (
              <div key={r.id} className="border border-gray-700 bg-gray-800/30 p-3 rounded flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.description}</p>
                  <p className="text-xs text-amber-400">Cost: {r.cost.lunacy}🌟 / {r.cost.energy}⚡</p>
                </div>
                <button
                  onClick={() => {
                    if (unlocked) return;
                    const result = unlockResearch(r.id);
                    if (result.success) {
                      alert(`✅ ${r.name} unlocked!`);
                      addFacilityLog(`${getDisplayName(user)} researched ${r.name}`, 'success');
                      if (isCoop) sendAction('unlockResearch', { researchId: r.id });
                    } else alert(`❌ ${result.reason}`);
                  }}
                  disabled={unlocked}
                  className={`px-3 py-1 rounded text-sm ${unlocked ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-purple-500/20 border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-gray-900 transition'}`}
                >
                  {unlocked ? 'Unlocked' : 'Unlock'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Render: Missions ─────────────────────────────────────────────
  const renderMissions = () => {
    const missions = [
      { id: 'm1', name: 'First Work', description: 'Complete 1 successful work', progress: facility.missionProgress?.worksCompleted || 0, required: 1 },
      { id: 'm2', name: 'Energy Collector', description: 'Collect 50 energy', progress: facility.totalEnergy || 0, required: 50 },
      { id: 'm3', name: 'Deployer', description: 'Deploy 3 abnormalities', progress: facility.deployedToday.length || 0, required: 3 },
    ];
    const completed = facility.completedMissions || [];

    return (
      <div className="border border-gray-700 rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-amber-400">📜 Missions</h3>
          <button onClick={() => setView('dashboard')} className="text-sm text-gray-400 hover:text-white">← Back</button>
        </div>
        <div className="space-y-2">
          {missions.map(m => {
            const done = completed.includes(m.id);
            const pct = Math.min(100, (m.progress / m.required) * 100);
            return (
              <div key={m.id} className={`border p-3 rounded ${done ? 'border-green-500/30 bg-green-500/10' : 'border-gray-700 bg-gray-800/30'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{done ? '✅' : '📋'} {m.name}</p>
                    <p className="text-xs text-gray-400">{m.description}</p>
                  </div>
                  <span className="text-xs text-amber-400">{Math.round(pct)}%</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded mt-1 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{m.progress}/{m.required}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Render: Bullets ──────────────────────────────────────────────
  const renderBullets = () => {
    if (!isManager) return null;
    const bulletTypes = [
      { key: 'red', label: 'Red', emoji: '🔴' },
      { key: 'white', label: 'White', emoji: '⚪' },
      { key: 'black', label: 'Black', emoji: '⚫' },
      { key: 'pale', label: 'Pale', emoji: '💀' },
      { key: 'hp', label: 'HP Heal', emoji: '💚' },
      { key: 'sp', label: 'SP Heal', emoji: '💙' },
      { key: 'adrenaline', label: 'Adrenaline', emoji: '⚡' },
      { key: 'execution', label: 'Execution', emoji: '🔫' },
    ];

    return (
      <div className="border border-gray-700 rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-400">🔫 Bullets</h3>
          <button onClick={() => setView('dashboard')} className="text-sm text-gray-400 hover:text-white">← Back</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {bulletTypes.map(b => {
            const count = facility.bullets?.[b.key] || 0;
            return (
              <div key={b.key} className="border border-gray-700 bg-gray-800/30 p-2 rounded flex items-center justify-between">
                <span className="text-white">{b.emoji} {b.label}</span>
                <span className="text-cyan-400 font-mono">{count}</span>
                <button
                  onClick={() => {
                    addBullets(b.key, 10);
                    addFacilityLog(`${getDisplayName(user)} added ${b.label} bullets`, 'info');
                    if (isCoop) sendAction('addBullets', { type: b.key, amount: 10 });
                  }}
                  className="text-xs px-2 py-0.5 border border-gray-600 text-gray-400 rounded hover:border-cyan-400 hover:text-cyan-400 transition"
                >
                  +10
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-400">Bullet capacity: {Math.floor(10 * (facility.bulletCapacityMultiplier || 1))}</p>
        </div>
      </div>
    );
  };

  // ─── Render: Memory ──────────────────────────────────────────────
  const renderMemory = () => {
    if (!isManager || !facility.memoryRepositoryAvailable) return null;
    return (
      <div className="border border-gray-700 rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-indigo-400">🔄 Memory Repository</h3>
          <button onClick={() => setView('dashboard')} className="text-sm text-gray-400 hover:text-white">← Back</button>
        </div>
        <p className="text-sm text-gray-400 mb-2">Return to a previous day (costs 1500 Lunacy)</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={targetDay}
            onChange={(e) => setTargetDay(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            max={facility.currentDay}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white w-24"
          />
          <button
            onClick={() => {
              if (lunacy < 1500) {
                alert(`❌ Not enough Lunacy (need 1500, have ${lunacy})`);
                return;
              }
              const result = useMemoryRepository(targetDay);
              if (result.success) {
                alert(`🔄 Reset to Day ${targetDay}`);
                addFacilityLog(`${getDisplayName(user)} used Memory Repository to Day ${targetDay}`, 'warning');
                if (isCoop) sendAction('memoryRepository', { targetDay });
                setView('dashboard');
              } else {
                alert(`❌ ${result.reason}`);
              }
            }}
            className="px-4 py-1 bg-indigo-500/20 border border-indigo-400 text-indigo-400 rounded hover:bg-indigo-400 hover:text-gray-900 transition"
          >
            Reset to Day {targetDay} (1500🌟)
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Your Lunacy: {lunacy}</p>
      </div>
    );
  };

  // ─── Render: Combat ────────────────────────────────────────────────
  const renderCombat = () => {
    if (!combatPlayer || !combatEnemy) return null;

    const isInitiator = combatInitiator === user?.id;

    const HpBarCombat = ({ value, max, color = 'green', label }: any) => {
      const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
      const colorClass = color === 'green' ? 'bg-green-500' : color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-500' : 'bg-blue-500';
      return (
        <div className="w-full">
          {label && <div className="flex justify-between text-xs text-gray-400"><span>{label}</span><span>{Math.round(pct)}%</span></div>}
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div className={`h-full transition-all duration-300 ${colorClass}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    };

    return (
      <div className="border border-cyan-500/30 bg-gray-900/80 p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-red-400">⚔️ BREACH SUPPRESSION</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Initiator: {combatInitiator ? players.find(p => p.id === combatInitiator)?.name || combatInitiator : 'Unknown'}</span>
            <button
              onClick={() => {
                if (isCombatFinished) {
                  setView('dashboard');
                } else if (isInitiator && confirm('Retreat from combat?')) {
                  setIsCombatFinished(true);
                  setView('dashboard');
                  addFacilityLog(`${getDisplayName(user)} retreated from combat`, 'danger');
                  if (isCoop) sendAction('combatRetreat', {});
                } else if (!isInitiator) {
                  alert('Only the initiator can retreat.');
                }
              }}
              className="text-sm text-gray-400 hover:text-white"
            >
              {isCombatFinished ? '← Back' : (isInitiator ? '🏳️ Retreat' : '⏳ Spectating...')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-700 p-3 rounded">
            <p className="text-sm font-bold text-green-400">{combatPlayer.name} (You)</p>
            <HpBarCombat value={playerHp} max={playerMaxHp} color="green" label="HP" />
            <div className="mt-1 flex gap-2 text-xs text-gray-400">
              <span>ATK: {combatPlayer.atk}</span>
              <span>DEF: {combatPlayer.def}</span>
            </div>
          </div>
          <div className="border border-gray-700 p-3 rounded">
            <p className="text-sm font-bold text-red-400">{combatEnemy.name}</p>
            <HpBarCombat value={enemyHp} max={enemyMaxHp} color="red" label="HP" />
            <div className="mt-1 flex gap-2 text-xs text-gray-400">
              <span>ATK: {combatEnemy.atk}</span>
              <span>DEF: {combatEnemy.def}</span>
            </div>
          </div>
        </div>

        {clashData && (
          <div className={`border p-3 rounded ${clashData.won ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
            <p className="text-center font-bold">{clashData.won ? '✅ CLASH WON!' : '❌ CLASH LOST!'}</p>
            <p className="text-center text-sm text-gray-400">
              {clashData.actorName} dealt {clashData.dmg} damage.
            </p>
          </div>
        )}

        {!isCombatFinished && combatTurn === 'player' && isInitiator && (
          <div>
            <p className="text-xs font-mono font-bold text-gray-400 mb-2">SELECT SKILL</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {combatPlayer.skills.map((skill: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSkillIndex(idx)}
                  className={`p-2 border transition-all ${selectedSkillIndex === idx ? 'border-cyan-400 bg-cyan-400/20' : 'border-gray-700 bg-gray-900/50 hover:border-cyan-400/30'}`}
                >
                  <p className="text-white text-sm font-bold truncate">{skill.name}</p>
                  <div className="flex gap-1 text-[10px] text-gray-400">
                    <span>P:{skill.power}</span>
                    <span>C:{skill.coins}</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleCombatAction}
              className="w-full py-2 bg-cyan-400/20 border border-cyan-400 text-cyan-400 font-mono font-bold hover:bg-cyan-400 hover:text-gray-900 transition rounded"
            >
              ⚔️ CLASH
            </button>
          </div>
        )}

        {!isCombatFinished && combatTurn === 'resolve' && isInitiator && (
          <button
            onClick={resolveCombat}
            className="w-full py-2 bg-amber-400/20 border border-amber-400 text-amber-400 font-mono font-bold hover:bg-amber-400 hover:text-gray-900 transition rounded"
          >
            ⏳ RESOLVE
          </button>
        )}

        {!isInitiator && !isCombatFinished && (
          <div className="text-center text-gray-400 py-4">⏳ Waiting for {combatInitiator ? players.find(p => p.id === combatInitiator)?.name : 'the initiator'} to act...</div>
        )}

        {isCombatFinished && (
          <button
            onClick={() => setView('dashboard')}
            className="w-full py-2 bg-cyan-400/20 border border-cyan-400 text-cyan-400 font-mono font-bold hover:bg-cyan-400 hover:text-gray-900 transition rounded"
          >
            ↩️ BACK TO FACILITY
          </button>
        )}

        <div className="border border-gray-700 bg-gray-900/50 p-2 rounded max-h-32 overflow-y-auto">
          <p className="text-xs font-mono font-bold text-gray-400 mb-1">⚔️ COMBAT LOG</p>
          {combatLog.map((line, i) => (
            <p key={i} className="text-xs text-gray-400">{line}</p>
          ))}
        </div>
      </div>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-cyan-400">
          {deptConfig?.icon} {deptConfig?.name || 'Facility'}
          {isCoop && <span className="text-sm text-cyan-300 ml-2">🌐 Co‑op</span>}
        </h1>
        <span className="text-sm text-gray-400">Manager: {facility.managerId === user?.id ? 'You' : facility.managerId}</span>
      </div>

      {view === 'combat' ? renderCombat() : (
        <>
          {view === 'dashboard' && renderDashboard()}
          {view === 'deploy' && renderDeploy()}
          {view === 'work' && renderWork()}
          {view === 'research' && renderResearch()}
          {view === 'missions' && renderMissions()}
          {view === 'bullets' && renderBullets()}
          {view === 'memory' && renderMemory()}
        </>
      )}

      {/* ─── Global Chat ─── */}
      {isCoop && (
        <React.Suspense fallback={<div className="h-12 w-12" />}>
          <GlobalChat />
        </React.Suspense>
      )}
    </div>
  );
}

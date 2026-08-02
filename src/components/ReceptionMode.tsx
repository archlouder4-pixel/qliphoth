// ReceptionMode.tsx – 1v1 Duel with WebSocket
// Now with Global Chat (visible only during combat or result)
import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';
import { useAuth } from '../auth/AuthContext';
import {
  identities,
  scaledStats,
  getClassCategory,
  classCategoryEffect,
  getClassInfo,
  CharacterClass,
} from '../data/identities';
import {
  buildTransformedSkills,
  getTransformationInfo,
} from '../data/identitiesPassives';
import { weapons, canEquipWeapon } from '../data/weapons';
import { egoGifts } from '../data/egoGifts';
import { applyWeaponPassive } from '../data/weaponPassives';
import GlobalChat from '../components/GlobalChat';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://qliphoth-backend.archlouder4.workers.dev';

interface ReceptionModeProps {
  onExit: () => void;
  availableIdentities: string[];
  initialScore?: number;
  initialLives?: number;
  initialWins?: number;
  initialLosses?: number;
}

const RANK_GROUPS = [
  { name: 'Manager', minScore: 0, color: '#4CAF50', nextRank: 'Professional', nextThreshold: 401 },
  { name: 'Professional', minScore: 401, color: '#2196F3', nextRank: 'Librarian', nextThreshold: 801 },
  { name: 'Librarian', minScore: 801, color: '#FF9800', nextRank: 'Patron', nextThreshold: 1201 },
  { name: 'Patron', minScore: 1201, color: '#FFD700', nextRank: null, nextThreshold: null },
];

function getRankInfo(score: number) {
  for (let i = RANK_GROUPS.length - 1; i >= 0; i--) {
    if (score >= RANK_GROUPS[i].minScore) {
      const next = i < RANK_GROUPS.length - 1 ? RANK_GROUPS[i + 1] : null;
      return {
        name: RANK_GROUPS[i].name,
        color: RANK_GROUPS[i].color,
        nextRank: next ? next.name : null,
        nextThreshold: next ? next.minScore : null,
      };
    }
  }
  return RANK_GROUPS[0];
}

function getRankColor(rank: string): string {
  const found = RANK_GROUPS.find(r => r.name === rank);
  return found ? found.color : '#A9A9A9';
}

const PGR_STYLES = {
  bgPrimary: 'bg-[#070a14]',
  bgSecondary: 'bg-[#0c1020]',
  bgPanel: 'bg-[#0f1525]/90',
  bgPanelHover: 'bg-[#131a2e]/90',
  bgAccent: 'bg-[#00d4ff]/10',
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
};

function TacticalPanel({ children, className = '', variant = 'default', header, headerRight, glow = false }: any) {
  const variantStyles = {
    default: PGR_STYLES.panel,
    accent: PGR_STYLES.panelAccent,
    danger: PGR_STYLES.panelDanger,
    success: `${PGR_STYLES.panel} border-[#05ffa1]/30`,
    warning: `${PGR_STYLES.panel} border-[#ff9e00]/30`,
  };
  return (
    <div
      className={`${variantStyles[variant]} ${glow ? PGR_STYLES.glowAccent : ''} ${className}`}
      style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
    >
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
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variantMap[variant]} ${sizeMap[size]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
    >
      {children}
    </button>
  );
}

export default function ReceptionMode({
  onExit,
  availableIdentities,
  initialScore = 0,
  initialLives = 5,
  initialWins = 0,
  initialLosses = 0,
}: ReceptionModeProps) {
  const store = useGameStore();
  const { user } = useAuth();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<'lobby' | 'combat' | 'result'>('lobby');
  const [playerName, setPlayerName] = useState('Agent');
  const [identityId, setIdentityId] = useState(availableIdentities[0] || '');
  const [myPlayerIndex, setMyPlayerIndex] = useState<0 | 1>(0);
  const [roomState, setRoomState] = useState<any>(null);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [queued, setQueued] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [log, setLog] = useState<string[]>(['[SYSTEM] Welcome to The Reception']);
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
  const [showClashResult, setShowClashResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ultBarValue, setUltBarValue] = useState(0);
  const [passiveActivating, setPassiveActivating] = useState(false);
  const [weaponError, setWeaponError] = useState<string | null>(null);

  const myPlayerIndexRef = useRef<0 | 1>(0);
  const roomStateRef = useRef<any>(null);
  const selectSkillRef = useRef<(idx: number) => void>(() => {});
  const addLogRef = useRef<(msg: string) => void>(() => {});
  const clashSigRef = useRef<string | null>(null);

  const addLog = (msg: string) => {
    setLog(prev => [...prev.slice(-49), msg]);
  };
  addLogRef.current = addLog;

  useEffect(() => {
    if (!identityId) return;
    const identity = identities.find(i => i.id === identityId);
    if (!identity?.signatureWeaponId) return;
    const owned = store.ownedIdentities.find(o => o.identityId === identityId);
    if (!owned) return;
    if (owned.equippedWeaponId) return;
    const sigWeaponId = identity.signatureWeaponId;
    if (!canEquipWeapon(identityId, sigWeaponId)) return;
    const ownedWeapon = store.ownedWeapons.find(ow => ow.weaponId === sigWeaponId);
    if (!ownedWeapon) return;
    store.setEquippedWeapon(identityId, sigWeaponId);
    addLogRef.current(`[SYSTEM] Auto-equipped signature weapon: ${sigWeaponId}`);
  }, [identityId, store]);

  const triggerAutoSelectPassive = () => {
    if (passiveActivating || isSubmitting) return;
    const myKey = myPlayerIndexRef.current === 0 ? 'p1' : 'p2';
    const oppKey = myPlayerIndexRef.current === 0 ? 'p2' : 'p1';
    if (roomStateRef.current?.[myKey + 'SkillIdx'] !== null) return;
    if (roomStateRef.current?.[oppKey + 'SkillIdx'] !== null) return;

    const me = roomStateRef.current?.[myKey];
    if (!me || !me.skills || me.skills.length === 0) return;

    const identity = identities.find(i => i.id === me.identityId);
    if (!identity?.autoSelectPassive) return;

    const { probability } = identity.autoSelectPassive;
    if (Math.random() > probability) return;

    setPassiveActivating(true);
    addLogRef.current(`[${identity.name}] Passive awakening!`);

    const randomIdx = Math.floor(Math.random() * me.skills.length);
    setSelectedSkill(randomIdx);

    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const myKey2 = myPlayerIndexRef.current === 0 ? 'p1' : 'p2';
        if (roomStateRef.current?.[myKey2 + 'SkillIdx'] === null) {
          sendAction('selectSkill', randomIdx);
          const skill = me.skills?.[randomIdx];
          if (skill) addLogRef.current(`[AUTO] Selected ${skill.name}`);
          setIsSubmitting(true);
          setPassiveActivating(false);
        } else {
          setPassiveActivating(false);
        }
      } else {
        setPassiveActivating(false);
      }
    }, 800);
  };

  useEffect(() => {
    if (phase !== 'combat') return;
    if (!roomState) return;

    const myKey = myPlayerIndexRef.current === 0 ? 'p1' : 'p2';
    const oppKey = myPlayerIndexRef.current === 0 ? 'p2' : 'p1';
    const me = roomState[myKey];
    const opponent = roomState[oppKey];

    const hasSelected = roomState[myKey + 'SkillIdx'] !== null;
    const canAct = !showClashResult && !hasSelected && !isSubmitting && !passiveActivating && me?.hp > 0 && opponent?.hp > 0;

    if (canAct && !passiveActivating && !isSubmitting && !hasSelected) {
      triggerAutoSelectPassive();
    }
  }, [phase, roomState, showClashResult, isSubmitting, passiveActivating]);

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    const wsUrl = SERVER_URL.replace(/^https?:\/\//, '');
    const ws = new WebSocket(`wss://${wsUrl}/room/reception/match`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to Reception');
      sendAction('getLeaderboard');
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
        connectWebSocket();
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

  const sendAction = (type: string, payload?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected, cannot send:', type);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'roomJoined': {
        const playerIndex = data.playerIndex;
        myPlayerIndexRef.current = playerIndex;
        setMyPlayerIndex(playerIndex);
        setPhase('combat');
        setQueued(false);
        addLogRef.current('[SYSTEM] Matched! Battle begins.');
        break;
      }

      case 'queued': {
        setQueued(true);
        addLogRef.current('[SYSTEM] Searching for opponent...');
        break;
      }

      case 'matchCancelled': {
        setQueued(false);
        addLogRef.current('[SYSTEM] Match search cancelled.');
        break;
      }

      case 'gameState': {
        const state = data.state;
        setRoomState(state);
        roomStateRef.current = state;

        const myKey = myPlayerIndexRef.current === 0 ? 'p1' : 'p2';
        const me = state[myKey];
        if (me) {
          setUltBarValue(me.ultimateBar || 0);
        }

        if (state.clashResult) {
          const clashSig = JSON.stringify(state.clashResult);
          if (clashSig !== clashSigRef.current) {
            clashSigRef.current = clashSig;
            const { actorName, pName, eName, won, dmg, ultimateGain } = state.clashResult;
            const result = won ? '✅ Won' : '❌ Lost';
            addLogRef.current(`[${actorName}] ${result} clash! ${pName} vs ${eName} → ${dmg} dmg`);
            if (won && ultimateGain !== undefined) {
              addLogRef.current(`[ULTIMATE] Bar +${(ultimateGain * 100).toFixed(1)}%`);
            }
            setSelectedSkill(null);
            setIsSubmitting(false);
            setPassiveActivating(false);
            setShowClashResult(true);
          }
        } else {
          clashSigRef.current = null;
          setShowClashResult(false);
          if (state.p1SkillIdx === null && state.p2SkillIdx === null) {
            setPassiveActivating(false);
          }
        }

        if (state.winner) {
          const winnerName = state.winner === 'p1' ? state.p1.playerName : state.p2.playerName;
          addLogRef.current(`🏆 ${winnerName} wins the match!`);
        }
        break;
      }

      case 'matchResult': {
        setMatchResult(data);
        setPhase('result');
        const isP1 = myPlayerIndexRef.current === 0;
        const won = (isP1 && data.winner === 'p1') || (!isP1 && data.winner === 'p2');
        const score = isP1 ? data.scoreChanges?.p1 || 0 : data.scoreChanges?.p2 || 0;
        addLogRef.current(`[RESULT] ${won ? 'Victory!' : 'Defeat!'} Score: ${score}`);
        break;
      }

      case 'leaderboard': {
        setLeaderboard(data);
        break;
      }

      case 'error': {
        alert(`❌ ${data.message}`);
        break;
      }

      case 'welcome': {
        console.log('Welcome from server:', data.message);
        break;
      }

      default:
        console.log('Unhandled WebSocket message:', data);
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, []);

  const selectSkill = (idx: number) => {
    if (!wsRef.current || isSubmitting || passiveActivating) return;
    const myKey = myPlayerIndexRef.current === 0 ? 'p1' : 'p2';
    if (roomStateRef.current?.[myKey + 'SkillIdx'] !== null) return;

    setIsSubmitting(true);
    setSelectedSkill(idx);
    sendAction('selectSkill', idx);
    const me = roomStateRef.current?.[myKey];
    if (me) {
      const skill = me.skills?.[idx];
      if (skill) addLog(`[${me.playerName}] Selected ${skill.name}`);
    }
    addLog('[SYSTEM] Skill submitted – waiting for opponent.');
  };
  selectSkillRef.current = selectSkill;

  const handleContinue = () => {
    setShowClashResult(false);
    setIsSubmitting(false);
    setPassiveActivating(false);
  };

  const buildPlayerData = () => {
    const identity = identities.find(i => i.id === identityId);
    if (!identity) {
      addLog('[SYSTEM] Identity not found.');
      return null;
    }

    const owned = store.ownedIdentities.find(o => o.identityId === identityId);
    if (!owned) {
      addLog('[SYSTEM] Identity not owned.');
      return null;
    }

    let weaponId = owned.equippedWeaponId || null;

    if (identityId === 'arthur_excalibur') {
      const targetWeaponId = 'excalibur_greatsword';
      if (canEquipWeapon(identityId, targetWeaponId)) {
        const ownedWeapon = store.ownedWeapons.find(ow => ow.weaponId === targetWeaponId);
        if (ownedWeapon) {
          if (owned.equippedWeaponId !== targetWeaponId) {
            store.setEquippedWeapon(identityId, targetWeaponId);
          }
          weaponId = targetWeaponId;
        } else {
          setWeaponError('Excalibur weapon not owned.');
          addLog('[SYSTEM] Excalibur weapon not owned.');
          return null;
        }
      } else {
        setWeaponError('Cannot equip Excalibur on this identity.');
        addLog('[SYSTEM] Cannot equip Excalibur on this identity.');
        return null;
      }
    } else {
      if (!weaponId && identity.signatureWeaponId) {
        const sigWeaponId = identity.signatureWeaponId;
        if (canEquipWeapon(identityId, sigWeaponId)) {
          const ownedWeapon = store.ownedWeapons.find(ow => ow.weaponId === sigWeaponId);
          if (ownedWeapon) {
            store.setEquippedWeapon(identityId, sigWeaponId);
            weaponId = sigWeaponId;
            addLog(`[SYSTEM] Auto-equipped signature weapon: ${sigWeaponId}`);
          } else {
            setWeaponError(`Signature weapon "${sigWeaponId}" not owned.`);
            addLog('[SYSTEM] Signature weapon not owned.');
            return null;
          }
        } else {
          setWeaponError(`Cannot equip signature weapon on this identity.`);
          addLog('[SYSTEM] Cannot equip signature weapon.');
          return null;
        }
      }
    }

    if (!weaponId) {
      setWeaponError('No weapon equipped. Please equip a compatible weapon.');
      addLog('[SYSTEM] No weapon equipped. Please equip a compatible weapon.');
      return null;
    }

    setWeaponError(null);

    let weaponAtk = 0;
    let weaponPassive = '';
    if (weaponId) {
      const weapon = weapons.find(w => w.id === weaponId);
      if (weapon) {
        weaponAtk = weapon.baseStats.atk + (owned.level - 1) * (weapon.atkGrowth || 0);
        weaponPassive = weapon.passive || '';
      }
    }

    const giftIds = store.identityEquippedGifts?.[identityId] || [];
    let giftStats = { hp: 0, atk: 0, def: 0, spd: 0 };
    for (const slot of giftIds) {
      if (!slot.giftId) continue;
      const gift = egoGifts.find(g => g.id === slot.giftId);
      if (gift) {
        giftStats.hp += (gift.stats?.hp || 0);
        giftStats.atk += (gift.stats?.atk || 0);
        giftStats.def += (gift.stats?.def || 0);
        giftStats.spd += (gift.stats?.spd || 0);
      }
    }

    const baseStats = scaledStats(identity, owned.level, owned.classSkillLevel ?? 1);
    const totalHp = baseStats.hp + giftStats.hp;
    const totalAtk = baseStats.atk + giftStats.atk + weaponAtk;
    const totalDef = baseStats.def + giftStats.def;
    const totalSpd = baseStats.spd + giftStats.spd;

    const trigger = identity.transformationTrigger || 'none';
    const hasUltimate = identity.skills.some(s => s.type === 'ego' || s.isUltimate);

    const baseSkills = identity.skills.map((skill, idx) => {
      const lvl = owned.skillLevels[idx] || 1;
      const power = skill.basePower + skill.powerGrowth * (lvl - 1);
      const coins = skill.coinGrowth > 0 ? skill.baseCoins + Math.floor((lvl - 1) / skill.coinGrowth) : skill.baseCoins;
      return {
        ...skill,
        power,
        coins,
        level: lvl,
        isEgo: skill.type === 'ego',
        isTransformed: false,
        isUltimate: skill.isUltimate || skill.type === 'ego',
      };
    });

    let transformedSkills: any[] = [];
    if (identity.transformedSkills && identity.transformedSkills.length > 0) {
      transformedSkills = identity.transformedSkills.map((skill) => {
        const lvl = 1;
        const power = skill.basePower + skill.powerGrowth * (lvl - 1);
        const coins = skill.coinGrowth > 0 ? skill.baseCoins + Math.floor((lvl - 1) / skill.coinGrowth) : skill.baseCoins;
        return {
          ...skill,
          power,
          coins,
          level: lvl,
          isEgo: skill.type === 'ego',
          isTransformed: true,
          isUltimate: skill.isUltimate || false,
        };
      });
    }

    const classCategory = getClassCategory(identityId);
    const classEffect = classCategoryEffect(owned.classSkillLevel ?? 1);

    return {
      identityId,
      weaponId,
      giftIds: giftIds.map(g => g.giftId).filter(Boolean),
      playerName,
      classes: identity.classes,
      stats: {
        score: initialScore,
        lives: initialLives,
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
      transformationTrigger: trigger,
      hasUltimate,
      transformationPassive: identity.transformationPassive || null,
      classCategory,
      classEffect,
      weaponPassive,
    };
  };

  // ─── FIXED "Find Match" ──────────────────────────────────────────
  const findMatch = () => {
    // Ensure WebSocket is connected
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('[SYSTEM] Connecting to server...');
      connectWebSocket();
      // Retry after connection
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const playerData = buildPlayerData();
          if (playerData) {
            sendAction('findMatch', playerData);
            addLog('[SYSTEM] Finding match...');
          }
        } else {
          addLog('[SYSTEM] Failed to connect to server.');
        }
      }, 500);
      return;
    }
    const playerData = buildPlayerData();
    if (!playerData) return;
    sendAction('findMatch', playerData);
    addLog('[SYSTEM] Finding match...');
  };

  const cancelMatch = () => {
    if (!wsRef.current) return;
    sendAction('cancelMatch');
  };

  const rankInfo = getRankInfo(initialScore);
  const progressToNext = rankInfo.nextThreshold
    ? Math.min(100, ((initialScore - rankInfo.minScore) / (rankInfo.nextThreshold - rankInfo.minScore)) * 100)
    : 100;

  // ─── RENDER: LOBBY ──────────────────────────────────────────────────
  if (phase === 'lobby') {
    const allIdentities = identities.filter(id => availableIdentities.includes(id.id));
    const getWeaponName = () => {
      const owned = store.ownedIdentities.find(o => o.identityId === identityId);
      if (!owned) return 'None';
      let weaponId = owned.equippedWeaponId;
      if (identityId === 'arthur_excalibur' && weaponId !== 'excalibur_greatsword') {
        const ownedWeapon = store.ownedWeapons.find(ow => ow.weaponId === 'excalibur_greatsword');
        if (ownedWeapon && canEquipWeapon(identityId, 'excalibur_greatsword')) {
          store.setEquippedWeapon(identityId, 'excalibur_greatsword');
          weaponId = 'excalibur_greatsword';
        }
      }
      if (!weaponId) return 'None';
      const weapon = weapons.find(w => w.id === weaponId);
      return weapon ? weapon.name : 'None';
    };
    const getGiftCount = () => {
      const gifts = store.identityEquippedGifts?.[identityId] || [];
      return gifts.filter(g => g.giftId).length;
    };

    return (
      <div className="min-h-screen bg-[#070a14] text-white font-sans p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <TacticalPanel variant="accent" glow header="⚔️ THE RECEPTION" headerRight={<span className="text-[10px] text-[#4a5568]">DUEL MODE</span>}>
            <p className="text-sm text-[#8b9bb4]">Find a match and climb the ranks.</p>
          </TacticalPanel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-[#4a5568] block mb-1">Player Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  disabled={queued}
                  className="w-full bg-[#0f1525] border border-[#1a2332] px-3 py-2 text-white focus:border-[#00d4ff]/60 focus:outline-none disabled:opacity-50"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[#4a5568] block mb-1">Identity</label>
                <select
                  className="w-full bg-[#0f1525] border border-[#1a2332] px-3 py-2 text-white focus:border-[#00d4ff]/60 focus:outline-none disabled:opacity-50"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                  value={identityId}
                  onChange={e => setIdentityId(e.target.value)}
                  disabled={queued}
                >
                  {allIdentities.map(id => (
                    <option key={id.id} value={id.id}>{id.portrait} {id.name}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-[#4a5568]">
                <p>Weapon: <span className="text-white">{getWeaponName()}</span></p>
                <p>Gifts: <span className="text-white">{getGiftCount()} equipped</span></p>
                <p>Class: <span className="text-[#00d4ff]">{getClassCategory(identityId)}</span></p>
                {identities.find(i => i.id === identityId)?.transformedSkills?.length > 0 && (
                  <p className="text-amber-400">⭐ Has Transformation</p>
                )}
                {weaponError && <p className="text-red-500 text-xs mt-1">{weaponError}</p>}
              </div>
            </div>
            <div className="space-y-3">
              <TacticalPanel>
                <p className="text-xs text-[#4a5568] uppercase tracking-wider">Rank Progress</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-lg font-bold" style={{ color: rankInfo.color }}>{rankInfo.name}</span>
                  <span className="text-sm text-[#4a5568]">
                    {rankInfo.nextRank ? `${initialScore} / ${rankInfo.nextThreshold}` : 'MAX'}
                  </span>
                </div>
                <div className="h-2 bg-[#1a2332] mt-1 overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                  <div className="h-full transition-all" style={{ width: `${progressToNext}%`, backgroundColor: rankInfo.color, boxShadow: `0 0 10px ${rankInfo.color}40` }} />
                </div>
                <div className="flex justify-between text-xs text-[#4a5568] mt-1">
                  <span>Score: {initialScore}</span>
                  <span>Lives: <span className="text-[#ff2a6d]">{initialLives}</span></span>
                  <span>W/L: <span className="text-[#05ffa1]">{initialWins}</span>/<span className="text-[#ff2a6d]">{initialLosses}</span></span>
                </div>
              </TacticalPanel>
              {queued ? (
                <TacticalPanel variant="warning" className="text-center">
                  <p className="text-[#ff9e00] font-bold animate-pulse">⏳ SEARCHING FOR OPPONENT...</p>
                  <p className="text-xs text-[#4a5568] mt-1">Waiting for another player to join</p>
                  <TacticalButton onClick={cancelMatch} variant="danger" size="md" className="mt-3 w-full">CANCEL</TacticalButton>
                </TacticalPanel>
              ) : (
                <TacticalButton onClick={findMatch} variant="primary" size="lg" className="w-full">⚔️ FIND MATCH</TacticalButton>
              )}
              <TacticalButton onClick={onExit} variant="neutral" size="md" className="w-full">← Exit</TacticalButton>
            </div>
          </div>
          <TacticalPanel header="🏆 LEADERBOARD">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-[#4a5568]">No players yet.</p>
              ) : (
                leaderboard.map((entry, i) => (
                  <div key={entry.userId} className={`flex items-center justify-between text-xs border-b border-[#1a2332]/30 py-1.5 px-1 ${entry.username === playerName ? 'bg-[#00d4ff]/5' : ''}`}>
                    <span className="text-[#4a5568] w-6">{i + 1}.</span>
                    <span className="text-white flex-1 truncate">{entry.username}</span>
                    <span style={{ color: getRankColor(entry.rank) }} className="mx-2">{entry.rank}</span>
                    <span className="text-[#8b9bb4] font-mono">{entry.score}</span>
                  </div>
                ))
              )}
            </div>
          </TacticalPanel>
        </div>
      </div>
    );
  }

  // ─── RENDER: COMBAT ──────────────────────────────────────────────────
  if (phase === 'combat') {
    if (!roomState) {
      return (
        <div className="min-h-screen bg-[#070a14] text-white font-sans p-4 flex items-center justify-center">
          <TacticalPanel variant="warning" className="text-center">
            <p className="text-amber-400 font-bold animate-pulse">⏳ Waiting for game state...</p>
          </TacticalPanel>
        </div>
      );
    }

    const myKey = myPlayerIndexRef.current === 0 ? 'p1' : 'p2';
    const oppKey = myPlayerIndexRef.current === 0 ? 'p2' : 'p1';
    const me = roomState[myKey];
    const opponent = roomState[oppKey];

    const hasSelected = roomState[myKey + 'SkillIdx'] !== null;
    const canAct = !showClashResult && !hasSelected && !isSubmitting && !passiveActivating && me?.hp > 0 && opponent?.hp > 0;

    const identityData = identities.find(i => i.id === me?.identityId);
    const triggerType = identityData?.transformationTrigger || 'none';
    const isTransformed = me?.transformationActive === true;
    const turnsLeft = me?.transformationTurnsLeft || 0;
    const ultimateBar = me?.ultimateBar || 0;
    const hasUltimate = me?.hasUltimate || false;
    const ultimateReady = hasUltimate && ultimateBar >= 100;

    const passive = identityData?.transformationPassive;
    let passiveDisplay = null;
    if (isTransformed && passive) {
      let stacks = 0;
      if (passive.mechanics && passive.mechanics.corrosionPerTurn) {
        stacks = opponent?.corrosionStacks || 0;
      } else {
        stacks = me?.passiveStacks || 0;
      }
      passiveDisplay = (
        <div className="text-xs text-amber-400 mt-1">
          {passive.name}: {passive.description} (stacks: {stacks}/{passive.mechanics?.maxStacks || 1})
        </div>
      );
    }

    const coinTypeBadge = (type?: string) => {
      const map: Record<string, { label: string; color: string }> = {
        normal: { label: 'N', color: 'text-gray-400' },
        unbreakable: { label: 'UB', color: 'text-[#ff9e00]' },
        counter: { label: 'CT', color: 'text-[#00d4ff]' },
        incision: { label: 'IN', color: 'text-[#ff2a6d]' },
      };
      const info = map[type || 'normal'] || map.normal;
      return <span className={`text-[8px] font-bold ${info.color}`}>{info.label}</span>;
    };

    if (passiveActivating) {
      return (
        <div className="min-h-screen bg-[#070a14] text-white font-sans p-4 flex items-center justify-center">
          <div className="max-w-md w-full space-y-4">
            <TacticalPanel variant="warning" glow className="text-center py-8">
              <div className="text-6xl mb-4">⚔️</div>
              <p className="text-2xl font-bold text-amber-400 animate-pulse">PASSIVE AWAKENING</p>
              <p className="text-sm text-[#8b9bb4] mt-2">The identity's innate power takes over...</p>
              <div className="mt-4 h-1 bg-[#1a2332] overflow-hidden rounded-full">
                <div className="h-full bg-amber-400 animate-[progress_0.8s_ease-in-out] rounded-full" style={{ width: '100%' }} />
              </div>
            </TacticalPanel>
            <TacticalPanel header="TACTICAL LOG">
              <div className="max-h-32 overflow-y-auto bg-[#0a0e14] p-3 font-mono text-xs space-y-0.5">
                {log.map((l, i) => (
                  <p key={i} className="text-[#4a5568] break-words hover:text-[#8b9bb4] transition-colors">
                    <span className="text-[#00d4ff]/50">[{String(i).padStart(3, '0')}]</span> {l}
                  </p>
                ))}
              </div>
            </TacticalPanel>
          </div>
        </div>
      );
    }

    if (showClashResult && roomState.clashResult) {
      const cr = roomState.clashResult;
      const isP1 = myPlayerIndexRef.current === 0;
      const iWon = (isP1 && cr.won) || (!isP1 && !cr.won);
      const winnerName = cr.actorName;

      return (
        <div className="min-h-screen bg-[#070a14] text-white font-sans p-4 flex items-center justify-center">
          <div className="max-w-2xl w-full space-y-4">
            <TacticalPanel variant={iWon ? 'success' : 'danger'} glow className="text-center py-8">
              <p className="text-2xl font-bold">
                {iWon ? '✅ You win the clash!' : `❌ ${winnerName} wins the clash!`}
              </p>
              <div className="flex justify-around text-center mt-6">
                <div>
                  <p className="text-xs text-[#05ffa1]">{cr.pName}</p>
                  <p className="text-4xl font-bold font-mono text-white">{cr.p}</p>
                </div>
                <span className="text-[#4a5568] font-bold text-2xl self-center">VS</span>
                <div>
                  <p className="text-xs text-[#ff2a6d]">{cr.eName}</p>
                  <p className="text-4xl font-bold font-mono text-white">{cr.e}</p>
                </div>
              </div>
              <p className="text-center text-sm text-[#8b9bb4] mt-2">Damage: {cr.dmg}</p>
              {cr.ultimateGain !== undefined && hasUltimate && (
                <p className="text-center text-xs text-yellow-400 mt-1">ULT +{(cr.ultimateGain * 100).toFixed(1)}%</p>
              )}
              <div className="mt-6">
                <TacticalButton onClick={handleContinue} variant="primary" size="lg" className="w-full">
                  CONTINUE
                </TacticalButton>
              </div>
            </TacticalPanel>
            <TacticalPanel header="TACTICAL LOG">
              <div className="max-h-32 overflow-y-auto bg-[#0a0e14] p-3 font-mono text-xs space-y-0.5">
                {log.map((l, i) => (
                  <p key={i} className="text-[#4a5568] break-words hover:text-[#8b9bb4] transition-colors">
                    <span className="text-[#00d4ff]/50">[{String(i).padStart(3, '0')}]</span> {l}
                  </p>
                ))}
              </div>
            </TacticalPanel>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#070a14] text-white font-sans p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TacticalPanel
              key={`player-${me?.playerName}-${ultBarValue}`}
              variant={isTransformed ? 'accent' : 'default'}
              glow={isTransformed}
              header={
                <div className="flex items-center gap-2">
                  {me.playerName + ' (You)'}
                  {isTransformed && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                      ⭐ E.G.O ACTIVE ({turnsLeft}t)
                    </span>
                  )}
                  {ultimateReady && hasUltimate && (
                    <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded border border-yellow-500/40 animate-pulse">
                      ⚡ ULT READY
                    </span>
                  )}
                </div>
              }
              headerRight={
                <div className="text-right">
                  <span className={`font-mono font-bold ${me.hp < me.maxHp * 0.3 ? 'text-[#ff2a6d]' : 'text-[#05ffa1]'}`}>
                    HP {me.hp}/{me.maxHp}
                  </span>
                  <div className="text-[9px] text-[#4a5568] flex gap-2 justify-end">
                    {!hasUltimate && (
                      <span>SP: <span className="text-[#00d4ff]">{me.sp}</span></span>
                    )}
                    <span>🛡 {me.shield}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                    {me.resolveStacks > 0 && <span className="text-amber-400">Resolve: {me.resolveStacks}</span>}
                    {me.witherStacks > 0 && <span className="text-purple-400">Wither: {me.witherStacks}</span>}
                    {me.bleedStacks > 0 && <span className="text-red-400">Bleed: {me.bleedStacks}</span>}
                  </div>
                  {passiveDisplay}
                  {hasUltimate && (
                    <div className="mt-1">
                      <div className="flex justify-between text-[8px] text-[#4a5568]">
                        <span>ULT</span>
                        <span>{Math.round(ultimateBar)}%</span>
                      </div>
                      <div className="h-1.5 bg-[#1a2332] overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))' }}>
                        <div className="h-full transition-all duration-500" style={{ width: `${Math.min(100, ultimateBar)}%`, backgroundColor: '#FFD700', boxShadow: '0 0 10px rgba(255,215,0,0.5)' }} />
                      </div>
                    </div>
                  )}
                  {triggerType === 'timer' && !isTransformed && (
                    <div className="text-[9px] text-[#4a5568] mt-1">
                      Transformation in: {identityData?.triggerTurns || 0} turns
                    </div>
                  )}
                </div>
              }
            >
              <div className="h-1.5 bg-[#1a2332] relative overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))' }}>
                <div className="h-full bg-[#ff2a6d] transition-all duration-500" style={{ width: `${(me.hp / me.maxHp) * 100}%` }} />
              </div>
              <div className="text-[10px] text-[#4a5568] mt-1 flex flex-wrap gap-1 items-center">
                {me.classes?.map((cls: string) => {
                  const info = getClassInfo(cls as CharacterClass);
                  return (
                    <span key={cls} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#1a2332] rounded-sm">
                      <span>{info.icon}</span>
                      <span>{info.name}</span>
                    </span>
                  );
                })}
                <span className="text-[#4a5568]">→</span>
                <span className="text-[#00d4ff]">{me.classCategory || 'Attacker'}</span>
                {me.classEffect && <span className="ml-2">+{(me.classEffect * 100).toFixed(0)}%</span>}
              </div>
            </TacticalPanel>

            <TacticalPanel
              variant={opponent.transformationActive ? 'danger' : 'default'}
              header={
                <div className="flex items-center gap-2">
                  {opponent.playerName}
                  {opponent.transformationActive && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                      ⭐ E.G.O ACTIVE
                    </span>
                  )}
                  {opponent.ultimateBar >= 100 && opponent.hasUltimate && (
                    <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded border border-yellow-500/40 animate-pulse">
                      ⚡ ULT READY
                    </span>
                  )}
                </div>
              }
              headerRight={
                <div className="text-right">
                  <span className={`font-mono font-bold ${opponent.hp < opponent.maxHp * 0.3 ? 'text-[#ff2a6d]' : 'text-[#ff9e00]'}`}>
                    HP {opponent.hp}/{opponent.maxHp}
                  </span>
                  <div className="text-[9px] text-[#4a5568] flex gap-2 justify-end">
                    {!opponent.hasUltimate && (
                      <span>SP: <span className="text-[#ff9e00]">{opponent.sp}</span></span>
                    )}
                    <span>🛡 {opponent.shield}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                    {opponent.resolveStacks > 0 && <span className="text-amber-400">Resolve: {opponent.resolveStacks}</span>}
                    {opponent.witherStacks > 0 && <span className="text-purple-400">Wither: {opponent.witherStacks}</span>}
                    {opponent.bleedStacks > 0 && <span className="text-red-400">Bleed: {opponent.bleedStacks}</span>}
                  </div>
                  {opponent.hasUltimate && (
                    <div className="mt-1">
                      <div className="flex justify-between text-[8px] text-[#4a5568]">
                        <span>ULT</span>
                        <span>{Math.round(opponent.ultimateBar || 0)}%</span>
                      </div>
                      <div className="h-1.5 bg-[#1a2332] overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))' }}>
                        <div className="h-full transition-all duration-500" style={{ width: `${Math.min(100, opponent.ultimateBar || 0)}%`, backgroundColor: '#FFD700', boxShadow: '0 0 10px rgba(255,215,0,0.5)' }} />
                      </div>
                    </div>
                  )}
                </div>
              }
            >
              <div className="h-1.5 bg-[#1a2332] relative overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))' }}>
                <div className="h-full bg-[#ff2a6d] transition-all duration-500" style={{ width: `${(opponent.hp / opponent.maxHp) * 100}%` }} />
              </div>
              <div className="text-[10px] text-[#4a5568] mt-1 flex flex-wrap gap-1 items-center">
                {opponent.classes?.map((cls: string) => {
                  const info = getClassInfo(cls as CharacterClass);
                  return (
                    <span key={cls} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#1a2332] rounded-sm">
                      <span>{info.icon}</span>
                      <span>{info.name}</span>
                    </span>
                  );
                })}
                <span className="text-[#4a5568]">→</span>
                <span className="text-[#ff9e00]">{opponent.classCategory || 'Attacker'}</span>
              </div>
            </TacticalPanel>
          </div>

          {isTransformed && (
            <TacticalPanel variant="warning" glow className="text-center py-2">
              <p className="text-amber-400 font-bold text-sm tracking-wider">
                {identityData?.transformationPassive?.name || 'E.G.O ACTIVE'} — {turnsLeft} turns remaining
              </p>
              {passive && <p className="text-xs text-[#8b9bb4] mt-1">{passive.name}: {passive.description}</p>}
            </TacticalPanel>
          )}

          <TacticalPanel variant="warning" className="text-center py-2">
            {showClashResult ? (
              <p className="text-[#ff9e00] font-bold text-sm tracking-wider">⚡ CLASH RESOLVED</p>
            ) : (
              <p className="text-[#00d4ff] font-bold text-sm tracking-wider">
                {canAct ? 'SELECT YOUR SKILL' : (hasSelected ? 'SKILL SUBMITTED – WAITING FOR OPPONENT...' : 'WAITING FOR OPPONENT...')}
              </p>
            )}
          </TacticalPanel>

          {canAct && (
            <TacticalPanel header={isTransformed ? "COMBAT PROTOCOLS — TRANSFORMED" : "COMBAT PROTOCOLS"}>
              <p className="text-xs text-[#8b9bb4] mb-3">
                {isTransformed ? '✦ Transformed skills active' : 'SELECT SKILL'}
                {ultimateReady && hasUltimate && (
                  <span className="ml-2 text-yellow-400 font-bold animate-pulse">⚡ ULTIMATE READY!</span>
                )}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {(() => {
                  let activeSkills = (me.skills || []).filter(
                    (s: any) => s.type !== 'class' && s.isTransformed === isTransformed
                  );

                  if (activeSkills.length === 0) {
                    const identity = identities.find(i => i.id === me?.identityId);
                    if (identity) {
                      activeSkills = identity.skills
                        .filter(s => s.type !== 'class')
                        .map(s => ({
                          ...s,
                          isTransformed: false,
                          isEgo: s.type === 'ego',
                          isUltimate: s.isUltimate || s.type === 'ego',
                          power: s.basePower,
                          coins: s.baseCoins,
                        }));
                    }
                  }

                  if (activeSkills.length === 0) {
                    activeSkills = [
                      { name: 'Basic Strike', power: 5, coins: 1, type: 'normal1', damageType: 'Physical', isEgo: false, isTransformed: false },
                      { name: 'Heavy Blow', power: 8, coins: 1, type: 'normal2', damageType: 'Physical', isEgo: false, isTransformed: false },
                      { name: 'Quick Slash', power: 3, coins: 2, type: 'normal3', damageType: 'Physical', isEgo: false, isTransformed: false },
                    ];
                  }

                  return activeSkills.map((skill: any) => {
                    const fullIndex = me.skills ? me.skills.indexOf(skill) : activeSkills.indexOf(skill);
                    const isEgo = skill.type === 'ego';
                    const isUltimate = isEgo && skill.isUltimate;
                    const canUse = !isEgo || ultimateReady;
                    const isSelected = selectedSkill === fullIndex;
                    const isDisabled = !canUse || hasSelected || isSubmitting || passiveActivating || showClashResult;

                    let borderClass = 'border-[#1a2332]';
                    let bgClass = 'bg-[#0f1525]';
                    if (isSelected) {
                      borderClass = 'border-[#00d4ff]/80';
                      bgClass = 'bg-[#00d4ff]/15';
                    } else if (isUltimate && canUse) {
                      borderClass = 'border-[#FFD700]/60';
                      bgClass = 'bg-[#FFD700]/10';
                    } else if (isEgo && !isUltimate) {
                      borderClass = 'border-[#ff9e00]/40';
                      bgClass = 'bg-[#ff9e00]/5';
                    } else if (skill.isTransformed) {
                      borderClass = 'border-amber-500/40';
                      bgClass = 'bg-amber-500/5';
                    }
                    if (isDisabled || !canUse) {
                      borderClass = 'border-[#1a2332]';
                      bgClass = 'bg-[#0a0e14]';
                    }

                    return (
                      <button
                        key={fullIndex}
                        onClick={() => !isDisabled && selectSkill(fullIndex)}
                        disabled={isDisabled}
                        className={`relative p-3 border text-left transition-all ${
                          !isDisabled && canUse ? 'hover:border-[#00d4ff]/30' : 'opacity-40 cursor-not-allowed'
                        } ${borderClass} ${bgClass}`}
                        style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                      >
                        <div className="flex items-center gap-1 mb-1 flex-wrap">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 font-bold tracking-wider ${
                              isUltimate ? 'bg-yellow-500/20 text-yellow-400' :
                              isEgo ? 'bg-[#ff2a6d]/20 text-[#ff2a6d]' :
                              skill.isTransformed ? 'bg-amber-500/20 text-amber-400' : 'bg-[#1a2332] text-[#8b9bb4]'
                            }`}
                            style={{ clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))' }}
                          >
                            {isUltimate ? '⚡ ULT' : isEgo ? 'EGO' : skill.isTransformed ? '✦ EGO' : 'NORMAL'}
                          </span>
                          {isUltimate && canUse && <span className="text-[10px] text-yellow-400 animate-pulse">⭐ READY</span>}
                          {skill.isTransformed && <span className="text-[10px] text-amber-400">✦</span>}
                          {skill.damageType && <span className="text-[9px] font-mono text-gray-400">{skill.damageType}</span>}
                          {skill.infusion && <span className="text-[9px] font-mono text-gray-500">{skill.infusion}</span>}
                          {skill.coinType && coinTypeBadge(skill.coinType)}
                        </div>
                        <p className="font-bold text-white text-sm mt-0.5">{skill.name}</p>
                        <div className="flex gap-3 text-[10px] text-[#4a5568] font-mono mt-1">
                          <span>⚔️ {skill.power}</span>
                          <span>🪙 {skill.coins}</span>
                          {skill.buffEffect && <span className="text-cyan-400 text-[9px] truncate">{skill.buffEffect}</span>}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
              {hasSelected && (
                <div className="text-center text-xs text-amber-400 font-mono py-2">
                  ⏳ Skill submitted – waiting for clash resolution...
                </div>
              )}
            </TacticalPanel>
          )}

          {!canAct && !showClashResult && !passiveActivating && (
            <TacticalPanel className="text-center py-4">
              <p className="text-[#4a5568] text-sm tracking-wider">
                {hasSelected ? 'SKILL SUBMITTED – WAITING FOR OTHER PLAYER' : 'WAITING FOR OPPONENT...'}
              </p>
            </TacticalPanel>
          )}

          <TacticalPanel header="TACTICAL LOG">
            <div
              className="max-h-40 overflow-y-auto bg-[#0a0e14] p-3 font-mono text-xs space-y-0.5"
              style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
            >
              {log.map((l, i) => (
                <p key={i} className="text-[#4a5568] break-words hover:text-[#8b9bb4] transition-colors">
                  <span className="text-[#00d4ff]/50">[{String(i).padStart(3, '0')}]</span> {l}
                </p>
              ))}
            </div>
          </TacticalPanel>
        </div>
      </div>
    );
  }

  // ─── RENDER: RESULT ──────────────────────────────────────────────────
  if (phase === 'result') {
    const isP1 = myPlayerIndexRef.current === 0;
    const won = (isP1 && matchResult?.winner === 'p1') || (!isP1 && matchResult?.winner === 'p2');
    const scoreChange = isP1 ? matchResult?.scoreChanges?.p1 || 0 : matchResult?.scoreChanges?.p2 || 0;
    const lifeChange = isP1 ? matchResult?.lifeChanges?.p1 || 0 : matchResult?.lifeChanges?.p2 || 0;
    const newRank = isP1
      ? (matchResult?.newRanks?.p1 || 'Patron')
      : (matchResult?.newRanks?.p2 || 'Patron');

    return (
      <div className="min-h-screen bg-[#070a14] text-white font-sans p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <TacticalPanel variant={won ? 'success' : 'danger'} glow className="text-center py-8">
            <div className="text-6xl mb-4">{won ? '🏆' : '💔'}</div>
            <h2
              className={`text-3xl font-bold tracking-wider ${won ? 'text-[#05ffa1]' : 'text-[#ff2a6d]'}`}
              style={won ? { textShadow: '0 0 20px rgba(5,255,161,0.5)' } : { textShadow: '0 0 20px rgba(255,42,109,0.5)' }}
            >
              {won ? 'VICTORY!' : 'DEFEAT'}
            </h2>
            <div className="mt-6 space-y-2 text-sm">
              <p>Score change: <span className={scoreChange >= 0 ? 'text-[#05ffa1]' : 'text-[#ff2a6d]'}>{scoreChange >= 0 ? '+' : ''}{scoreChange}</span></p>
              <p>Lives change: <span className={lifeChange >= 0 ? 'text-[#05ffa1]' : 'text-[#ff2a6d]'}>{lifeChange >= 0 ? '+' : ''}{lifeChange}</span></p>
              <p>New rank: <span style={{ color: getRankColor(newRank) }}>{newRank}</span></p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <TacticalButton
                onClick={() => {
                  setPhase('lobby');
                  setMatchResult(null);
                  setRoomState(null);
                  setQueued(false);
                  setLog(['[SYSTEM] Welcome to The Reception']);
                  setSelectedSkill(null);
                  setShowClashResult(false);
                  setIsSubmitting(false);
                  setPassiveActivating(false);
                  setWeaponError(null);
                }}
                variant="primary"
                size="lg"
              >
                NEW MATCH
              </TacticalButton>
              <TacticalButton onClick={onExit} variant="neutral" size="lg">EXIT</TacticalButton>
            </div>
          </TacticalPanel>
          <TacticalPanel header="MATCH LOG">
            <div
              className="max-h-32 overflow-y-auto bg-[#0a0e14] p-3 font-mono text-xs space-y-0.5"
              style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
            >
              {log.map((l, i) => (
                <p key={i} className="text-[#4a5568] break-words hover:text-[#8b9bb4] transition-colors">
                  <span className="text-[#00d4ff]/50">[{String(i).padStart(3, '0')}]</span> {l}
                </p>
              ))}
            </div>
          </TacticalPanel>
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070a14] text-white font-sans p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* The entire content (lobby/combat/result) is rendered above */}
        {/* We need to render the chat after the content but still inside the outer div */}
      </div>
      {/* ─── GLOBAL CHAT ─── */}
      {(phase === 'combat' || phase === 'result') && <GlobalChat />}
    </div>
  );
}

// ExplorationView.tsx – Full-featured Exploration Mode (Solo & Co-op)
// Now with Global Chat (visible only in co‑op mode) – dynamically loaded
import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';
import {
  identities,
  scaledStats,
  getClassCategory,
  classCategoryEffect,
  damageTypeMult,
  infusionMult,
  skillDmgMult,
  DAMAGE_TYPE_INFO,
  INFUSION_INFO,
  DAMAGE_DEBUFFS,
  INFUSION_DEBUFFS,
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
import { explorationPlaces } from '../data/explorationPlaces';
import { explorationEnemies, type ExplorationEnemy as RawExplorationEnemy } from '../data/explorationEnemies';
import { DEPARTMENTS } from '../data/departments';
import { getDisplayName } from '../auth/discord';
import { useAuth } from '../auth/AuthContext';

const MAX_CLASH_POWER = 50;
const ULTIMATE_GAIN_MIN = 0.003;
const ULTIMATE_GAIN_MAX = 0.03;
const MAX_PLAYERS = 3;
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://qliphoth-backend.archlouder4.workers.dev';

interface ExplorationEnemy extends RawExplorationEnemy {
  damageType: string;
  infusion: string;
  resistDamageType: string;
  resistInfusion: string;
  skills: { name: string; power: number; coins: number; damageType?: string; infusion?: string }[];
  maxHp: number;
  currentHp: number;
  shield: number;
  dullStacks: number;
  corrosionTurns: number;
  isBoss: boolean;
  bossMechanic?: any;
}

interface IdentityState {
  identityId: string;
  name: string;
  playerName: string;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  ultimate: number;
  shield: number;
  transformationActive: boolean;
  transformationTurnsLeft: number;
  transformedSkills: TransformedSkill[];
  resolveStacks: number;
  witherStacks: number;
  bleedStacks: number;
  atk: number;
  def: number;
  spd: number;
  damageType: string;
  infusion: string;
  classCategory: CombatCategory;
  classEffect: number;
  skills: any[];
  isActive: boolean;
  attackerBuffTurns: number;
  hasLeaderSkill: boolean;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Easy': return 'border-green-400/30 text-green-400';
    case 'Normal': return 'border-blue-400/30 text-blue-400';
    case 'Hard': return 'border-orange-400/30 text-orange-400';
    case 'Very Hard': return 'border-red-400/30 text-red-400';
    default: return 'border-gray-400/30 text-gray-400';
  }
}

function rollCoin(power: number): number {
  return Math.random() < 0.5 ? power : 1;
}

function clash(pP: number, eP: number, pC: number, eC: number) {
  let pt = rollCoin(pP), et = rollCoin(eP);
  for (let i = 1; i < Math.max(pC, eC); i++) {
    if (i < pC) pt += rollCoin(pP);
    if (i < eC) et += rollCoin(eP);
  }
  return { playerTotal: pt, enemyTotal: et };
}

function computeDepartmentBonus(facility: any): {
  damageMultiplier: number;
  defenseMultiplier: number;
  rewardMultiplier: number;
  healBonus: number;
} {
  let dmgMult = 1.0,
    defMult = 1.0,
    rewardMult = 1.0,
    healBonus = 0.0;
  if (!facility || !facility.unlockedResearch) return { damageMultiplier: dmgMult, defenseMultiplier: defMult, rewardMultiplier: rewardMult, healBonus };
  if (facility.unlockedResearch.includes('tt2_protocol')) dmgMult *= 1.10;
  if (facility.unlockedResearch.includes('join_command')) defMult *= 1.05;
  if (facility.unlockedResearch.includes('corrective_measures')) rewardMult *= 1.10;
  if (facility.unlockedResearch.includes('malkuth_reward')) rewardMult *= 1.20;
  if (facility.unlockedResearch.includes('gebura_reward')) dmgMult *= 1.25;
  if (facility.unlockedResearch.includes('chesed_reward')) defMult *= 1.10;
  if (facility.unlockedResearch.includes('netzach_reward')) healBonus = 0.15;
  return { damageMultiplier: dmgMult, defenseMultiplier: defMult, rewardMultiplier: rewardMult, healBonus };
}

function convertRawEnemy(raw: RawExplorationEnemy, place?: any, difficulty?: string): ExplorationEnemy {
  const elementToDmg: Record<string, string> = {
    Physical: 'Red',
    Light: 'White',
    Dark: 'Black',
    Void: 'Pale',
    Fire: 'Red',
    Water: 'Pale',
    Chaos: 'Black',
    Spectro: 'White',
  };
  const resistToInf: Record<string, string> = {
    Physical: 'Blunt',
    Light: 'Pierce',
    Dark: 'Slash',
    Void: 'Pierce',
    Fire: 'Slash',
    Water: 'Pierce',
    Chaos: 'Blunt',
    Spectro: 'Slash',
  };
  const damageType = elementToDmg[raw.element] || 'Red';
  const infusion = resistToInf[raw.resist] || 'Slash';
  const allDmg = ['Red', 'White', 'Black', 'Pale'];
  const oppositeDmg = allDmg.find(d => d !== damageType) || 'Pale';
  const allInf = ['Slash', 'Pierce', 'Blunt'];
  const oppositeInf = allInf.find(i => i !== infusion) || 'Pierce';
  const skills = raw.skills.map(s => ({
    name: s.name,
    power: s.power || 5,
    coins: s.coins || 1,
    damageType: s.damageType || damageType,
    infusion: s.infusion || infusion,
  }));

  const diffMultipliers: Record<string, { hp: number; atk: number; def: number }> = {
    Easy: { hp: 0.7, atk: 0.7, def: 0.7 },
    Normal: { hp: 1.0, atk: 1.0, def: 1.0 },
    Hard: { hp: 1.4, atk: 1.3, def: 1.3 },
    'Very Hard': { hp: 1.8, atk: 1.6, def: 1.6 },
  };
  const scale = diffMultipliers[difficulty || 'Normal'] || diffMultipliers['Normal'];
  const maxHp = Math.floor(raw.maxHp * scale.hp);
  const atk = Math.floor(raw.atk * scale.atk);
  const def = Math.floor(raw.def * scale.def);

  return {
    ...raw,
    damageType,
    infusion,
    resistDamageType: oppositeDmg,
    resistInfusion: oppositeInf,
    skills,
    maxHp,
    currentHp: maxHp,
    shield: 0,
    dullStacks: 0,
    corrosionTurns: 0,
    isBoss: raw.isBoss || false,
    bossMechanic: raw.bossMechanic || null,
    atk,
    def,
  };
}

function buildIdentityState(
  identityId: string,
  playerName: string,
  store: any
): IdentityState | null {
  const identity = identities.find(i => i.id === identityId);
  if (!identity) return null;
  const owned = store.ownedIdentities.find((o: any) => o.identityId === identityId);
  if (!owned) return null;
  let weaponId = owned.equippedWeaponId || null;
  if (!weaponId && identity.signatureWeaponId) {
    const sig = identity.signatureWeaponId;
    if (canEquipWeapon(identity.id, sig)) {
      const ownedWeapon = store.ownedWeapons.find((ow: any) => ow.weaponId === sig);
      if (ownedWeapon) weaponId = sig;
    }
  }
  const weapon = weaponId ? weapons.find((w: any) => w.id === weaponId) : null;
  const giftIds = store.equippedGifts[identityId] || [];
  const giftStats = giftIds.reduce(
    (acc: any, gid: string) => {
      const gift = egoGifts.find((g: any) => g.id === gid);
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
  const baseStats = scaledStats(identity, owned.level, owned.classSkillLevel ?? 1);
  const totalHp = baseStats.hp + giftStats.hp;
  const totalAtk = baseStats.atk + giftStats.atk + (weapon?.baseStats.atk || 0);
  const totalDef = baseStats.def + giftStats.def;
  const totalSpd = baseStats.spd + giftStats.spd;
  const classCategory = getClassCategory(identity.id);
  const classEffect = classCategoryEffect(owned.classSkillLevel ?? 1);
  const skills = identity.skills
    .filter((s: any) => s.type !== 'class')
    .map((skill: any, idx: number) => {
      const sl = owned.skillLevels?.[idx] ?? 1;
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
    identityId: identity.id,
    name: identity.name,
    playerName: playerName,
    hp: totalHp,
    maxHp: totalHp,
    sp: 50,
    maxSp: 100,
    ultimate: 0,
    shield: 0,
    transformationActive: false,
    transformationTurnsLeft: 0,
    transformedSkills: [],
    resolveStacks: 0,
    witherStacks: 0,
    bleedStacks: 0,
    atk: totalAtk,
    def: totalDef,
    spd: totalSpd,
    damageType: identity.element,
    infusion: identity.baseInfusion || 'Slash',
    classCategory,
    classEffect,
    skills,
    isActive: false,
    attackerBuffTurns: 0,
    hasLeaderSkill: true,
  };
}

export default function ExplorationView() {
  const { user } = useAuth();
  const store = useGameStore();
  const {
    team,
    ownedIdentities,
    ownedWeapons,
    ownedGifts,
    equippedGifts,
    facility,
    addEnkephalin,
    addManagerExp,
    addThreads,
    addHarmonizationSigils,
    addEclipseResonanceMaterials,
  } = store;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const [gameMode, setGameMode] = useState<'solo' | 'coop'>('solo');
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<{ id: string; name: string; identityId: string }[]>([]);
  const [myPlayerIndex, setMyPlayerIndex] = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Normal');
  const [selectedCoopIdentityId, setSelectedCoopIdentityId] = useState<string>(() => {
    const firstOwned = ownedIdentities[0]?.identityId;
    return firstOwned || '';
  });
  const [roomPhase, setRoomPhase] = useState<'lobby' | 'placeSelect' | 'difficultySelect' | 'exploring'>('lobby');
  const [isWaitingForHost, setIsWaitingForHost] = useState(false);

  // Solo difficulty selector UI
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [pendingPlace, setPendingPlace] = useState<any>(null);

  const [phase, setPhase] = useState<'lobby' | 'exploring' | 'waveClear' | 'victory' | 'defeat'>('lobby');
  const [currentWaveIndex, setCurrentWaveIndex] = useState(0);
  const [enemies, setEnemies] = useState<ExplorationEnemy[]>([]);
  const [identityStates, setIdentityStates] = useState<IdentityState[]>([]);
  const [activeIdentityIndex, setActiveIdentityIndex] = useState(0);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0);
  const [selectedEnemyIndex, setSelectedEnemyIndex] = useState(0);
  const [log, setLog] = useState<string[]>(['🗺️ Welcome to Exploration Mode.']);
  const [turn, setTurn] = useState<'player' | 'enemy' | 'resolve' | 'finished'>('player');
  const [clashData, setClashData] = useState<{ p: number; e: number; won: boolean; dmg: number; actorName: string } | null>(null);
  const [totalEnemiesDefeated, setTotalEnemiesDefeated] = useState(0);
  const [bossesDefeated, setBossesDefeated] = useState(0);
  const [waveStartTime, setWaveStartTime] = useState<number | null>(null);
  const [synergyType, setSynergyType] = useState<'amplifier' | 'support' | null>(null);
  const [synergyAtkBuff, setSynergyAtkBuff] = useState(0);
  const [synergyDefBuff, setSynergyDefBuff] = useState(0);
  const [synergyHealBonus, setSynergyHealBonus] = useState(0);
  const [synergyDmgAmp, setSynergyDmgAmp] = useState(0);
  const [isCombatFinished, setIsCombatFinished] = useState(false);
  const [rewardsClaimed, setRewardsClaimed] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  // --- Dynamic import for GlobalChat ---
  const [ChatComponent, setChatComponent] = useState<React.ComponentType | null>(null);
  useEffect(() => {
    if (gameMode === 'coop') {
      import('../components/GlobalChat')
        .then(module => setChatComponent(() => module.default))
        .catch(err => console.error('Failed to load GlobalChat:', err));
    } else {
      setChatComponent(null);
    }
  }, [gameMode]);

  const activeIdentity = identityStates[activeIdentityIndex] || null;
  const activeSkills = activeIdentity
    ? activeIdentity.transformationActive && activeIdentity.transformedSkills.length > 0
      ? activeIdentity.transformedSkills
      : activeIdentity.skills
    : [];

  const deptBonus = computeDepartmentBonus(facility);

  const detectSynergy = (states: IdentityState[]) => {
    const classes = states.map((s) => s.classCategory);
    const hasAttacker = classes.includes('Attacker');
    const hasTank = classes.includes('Tank');
    const hasAmplifier = classes.includes('Amplifier');
    const hasSupport = classes.includes('Support');
    let atkBuff = 0,
      defBuff = 0,
      healBonus = 0,
      dmgAmp = 0,
      type: 'amplifier' | 'support' | null = null;
    if (hasAttacker && hasTank && hasAmplifier && !hasSupport) {
      atkBuff = 0.20;
      defBuff = 0.20;
      healBonus = 0.15;
      dmgAmp = 0.10;
      type = 'amplifier';
    } else if (hasAttacker && hasTank && hasSupport && !hasAmplifier) {
      atkBuff = 0.20;
      defBuff = 0.20;
      healBonus = 0.50;
      dmgAmp = 0;
      type = 'support';
    }
    return { atkBuff, defBuff, healBonus, dmgAmp, type };
  };

  const startSoloExploration = (place: any, selectedIds: string[], difficulty: string = 'Normal') => {
    const states = selectedIds
      .map((id) => {
        const playerName = user ? getDisplayName(user) : 'Solo';
        return buildIdentityState(id, playerName, store);
      })
      .filter(Boolean) as IdentityState[];
    if (states.length === 0) {
      setLog(['⚠️ No valid identities selected.']);
      return;
    }

    states.forEach((s) => {
      s.atk = Math.floor(s.atk * deptBonus.damageMultiplier);
      s.def = Math.floor(s.def * deptBonus.defenseMultiplier);
    });

    const synergy = detectSynergy(states);
    setSynergyType(synergy.type);
    setSynergyAtkBuff(synergy.atkBuff);
    setSynergyDefBuff(synergy.defBuff);
    setSynergyHealBonus(synergy.healBonus);
    setSynergyDmgAmp(synergy.dmgAmp);

    states.forEach((s) => {
      s.atk = Math.floor(s.atk * (1 + synergy.atkBuff));
      s.def = Math.floor(s.def * (1 + synergy.defBuff));
    });

    if (states.length > 0) states[0].isActive = true;
    setIdentityStates(states);
    setActiveIdentityIndex(0);

    setSelectedPlace(place);
    setSelectedDifficulty(difficulty);
    setCurrentWaveIndex(0);
    setTotalEnemiesDefeated(0);
    setBossesDefeated(0);
    setFinalScore(null);
    setRewardsClaimed(false);
    setIsCombatFinished(false);
    setShowDifficultySelector(false);
    setPendingPlace(null);

    const wave = place.waves[0];
    const waveEnemies = wave.enemies
      .map((id: string) => {
        const raw = explorationEnemies[id];
        if (!raw) return null;
        return convertRawEnemy(raw, place, difficulty);
      })
      .filter(Boolean) as ExplorationEnemy[];

    setEnemies(waveEnemies);
    setPhase('exploring');
    setTurn('player');
    setSelectedSkillIndex(0);
    setSelectedEnemyIndex(0);
    setLog([`🗺️ Exploring: ${place.name} (${difficulty})`]);
    addLog(`🌊 Wave ${currentWaveIndex + 1}: ${wave.description}`);
    if (waveEnemies.length > 0) {
      addLog(`⚔️ Encountered ${waveEnemies.map((e) => e.name).join(', ')}!`);
    }
  };

  const connectWebSocket = (roomId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    const wsUrl = SERVER_URL.replace(/^https?:\/\//, '');
    const ws = new WebSocket(`wss://${wsUrl}/room/exploration/${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to exploration room');
      const identityState = buildIdentityState(selectedCoopIdentityId, getDisplayName(user), store);
      if (!identityState) {
        addLog('⚠️ Could not build identity state.');
        ws.close();
        return;
      }
      ws.send(JSON.stringify({
        type: 'join',
        playerId: user?.id || crypto.randomUUID(),
        playerName: getDisplayName(user),
        identityState,
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

  const sendAction = (type: string, payload?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      alert('WebSocket is not connected. Please try again.');
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'explorationRoomCreated':
        setRoomId(data.roomId);
        setPlayers(data.players);
        setMyPlayerIndex(data.players.findIndex((p: any) => p.id === user?.id));
        setIsHost(true);
        setSelectedPlace(null);
        setRoomPhase('placeSelect');
        setIsWaitingForHost(false);
        addLog(`🌐 Room created. You are the host. Select a place and difficulty.`);
        break;

      case 'explorationRoomJoined':
        setRoomId(data.roomId);
        setPlayers(data.players);
        setMyPlayerIndex(data.players.findIndex((p: any) => p.id === user?.id));
        setIsHost(data.isHost || false);
        if (data.place) {
          const placeData = explorationPlaces.find(p => p.id === data.place.id);
          if (placeData) setSelectedPlace(placeData);
          setRoomPhase('difficultySelect');
          if (data.isHost) {
            addLog('🌐 Host: Select difficulty and start exploration.');
          } else {
            addLog(`🌐 Room joined. Waiting for host to start.`);
          }
        } else {
          setRoomPhase('placeSelect');
          setIsWaitingForHost(!data.isHost);
        }
        addLog(`🌐 Players: ${data.players.map((p: any) => p.name).join(', ')}`);
        break;

      case 'explorationStarted':
        const placeData = explorationPlaces.find(p => p.id === data.placeId);
        if (!placeData) {
          addLog('⚠️ Place not found.');
          return;
        }
        setSelectedPlace(placeData);
        setSelectedDifficulty(data.difficulty);
        setIdentityStates(data.identityStates);
        if (data.identityStates.length > 0) data.identityStates[0].isActive = true;
        setActiveIdentityIndex(0);
        setEnemies(data.enemies);
        setPhase('exploring');
        setTurn('player');
        setSelectedSkillIndex(0);
        setSelectedEnemyIndex(0);
        setLog(data.log || [`🗺️ Exploring: ${placeData.name} (${data.difficulty})`]);
        if (data.log && data.log.length > 0) {
          data.log.forEach((l: string) => addLog(l));
        }
        setRoomPhase('exploring');
        break;

      case 'explorationStateUpdate':
        setIdentityStates(data.identityStates);
        setEnemies(data.enemies);
        setTurn(data.turn);
        setActiveIdentityIndex(data.activeIdentityIndex);
        setClashData(data.clashData || null);
        setLog(data.log);
        break;

      case 'explorationFinished':
        setFinalScore(data.score);
        setPhase('victory');
        setIsCombatFinished(true);
        addLog(`🏆 Exploration complete! Score: ${data.score}`);
        break;

      case 'explorationDefeat':
        setPhase('defeat');
        setIsCombatFinished(true);
        addLog('💀 All identities defeated. Exploration failed.');
        break;

      case 'explorationError':
        alert(`❌ ${data.message}`);
        break;

      case 'explorationDisbanded':
        alert('The room has been disbanded by the host.');
        resetExploration();
        break;

      default:
        console.log('Unhandled WebSocket message:', data);
    }
  };

  const createRoom = (placeId: string, customRoomId?: string) => {
    if (!selectedCoopIdentityId) {
      addLog('⚠️ Please select an identity first.');
      return;
    }
    const identityState = buildIdentityState(selectedCoopIdentityId, getDisplayName(user), store);
    if (!identityState) {
      addLog('⚠️ Could not build identity data.');
      return;
    }
    const roomId = customRoomId || crypto.randomUUID().slice(0, 8);
    setRoomId(roomId);
    setIsHost(true);
    setRoomPhase('placeSelect');
    connectWebSocket(roomId);
  };

  const joinRoom = (roomId: string) => {
    if (!selectedCoopIdentityId) {
      addLog('⚠️ Please select an identity first.');
      return;
    }
    setRoomId(roomId);
    connectWebSocket(roomId);
  };

  const startExploration = () => {
    if (!roomId || !selectedPlace || !selectedDifficulty) return;
    sendAction('startExploration', {
      placeId: selectedPlace.id,
      difficulty: selectedDifficulty,
    });
  };

  const disbandRoom = () => {
    if (isHost) {
      sendAction('disbandExplorationRoom', {});
    }
  };

  const addLog = (msg: string) => setLog((prev) => [...prev.slice(-30), msg]);

  const handlePlayerAction = () => {
    if (turn !== 'player' || isCombatFinished) return;
    const active = identityStates[activeIdentityIndex];
    if (!active || active.hp <= 0) {
      const nextIdx = identityStates.findIndex((s, i) => i > activeIdentityIndex && s.hp > 0);
      if (nextIdx === -1) {
        addLog('💀 No alive identities left.');
        setIsCombatFinished(true);
        setTurn('finished');
        return;
      }
      setActiveIdentityIndex(nextIdx);
      return;
    }

    const skill = activeSkills[selectedSkillIndex];
    if (!skill) return;
    const isEgo = skill.type === 'ego';
    if (isEgo && active.ultimate < 100) {
      addLog('⚠️ Ultimate not full! Ego needs 100% Ultimate.');
      return;
    }

    const enemy = enemies[selectedEnemyIndex];
    if (!enemy || enemy.currentHp <= 0) {
      const nextEnemy = enemies.findIndex((e) => e.currentHp > 0);
      if (nextEnemy === -1) {
        addLog('⚠️ No enemies left!');
        return;
      }
      setSelectedEnemyIndex(nextEnemy);
      return;
    }

    const eSkill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
    const result = clash(skill.power, eSkill.power, skill.coins, eSkill.coins);

    const dmgMult = damageTypeMult(skill.damageType || active.damageType, enemy.resistDamageType);
    const infMult = infusionMult(skill.infusion || active.infusion, enemy.resistInfusion);
    let mult = dmgMult * infMult;

    let classMult = 1.0;
    if (active.classCategory === 'Attacker') classMult += active.classEffect;
    if (active.classCategory === 'Amplifier' && isEgo) classMult += active.classEffect;
    if (synergyDmgAmp > 0) classMult += synergyDmgAmp;
    if (active.attackerBuffTurns > 0) classMult += 0.30;

    let tankBonus = 1.0;
    if (enemy.corrosionTurns > 0) tankBonus += 0.08;

    const won = result.playerTotal >= result.enemyTotal;
    let dmg = 0;

    if (won) {
      const diff = result.playerTotal - result.enemyTotal;
      const basePercent = 0.005 + 0.0015 * diff;
      let finalPercent = basePercent * mult * skill.dmgMult * classMult * tankBonus;
      finalPercent *= 0.85 + Math.random() * 0.3;
      dmg = Math.max(1, Math.floor(finalPercent * enemy.maxHp));

      const newEnemies = enemies.map((e, i) =>
        i === selectedEnemyIndex ? { ...e, currentHp: Math.max(0, e.currentHp - dmg) } : e
      );
      setEnemies(newEnemies);
      addLog(`✅ ${active.name} won clash! ${skill.name} → ${dmg} dmg (${((dmg / enemy.maxHp) * 100).toFixed(1)}% of enemy HP)`);
      setClashData({ p: result.playerTotal, e: result.enemyTotal, won: true, dmg, actorName: active.name });

      const gain = ULTIMATE_GAIN_MIN + Math.random() * (ULTIMATE_GAIN_MAX - ULTIMATE_GAIN_MIN);
      setIdentityStates((prev) =>
        prev.map((s, i) =>
          i === activeIdentityIndex ? { ...s, ultimate: Math.min(100, s.ultimate + gain * 100) } : s
        )
      );

      if (active.classCategory === 'Attacker' && isEgo) {
        setIdentityStates((prev) =>
          prev.map((s) =>
            s.identityId === active.identityId
              ? { ...s, attackerBuffTurns: 2, atk: Math.floor(s.atk * 1.3) }
              : s
          )
        );
        addLog('⚔️ Attacker buff active! +30% ATK for 2 turns');
      }
      if (active.classCategory === 'Tank' && isEgo) {
        const shred = active.classEffect;
        setEnemies((prev) =>
          prev.map((e) =>
            e === enemy ? { ...e, def: Math.max(1, Math.floor(e.def * (1 - shred))) } : e
          )
        );
        addLog(`🛡️ Tank shred: enemy DEF reduced by ${(shred * 100).toFixed(0)}%`);
        setEnemies((prev) =>
          prev.map((e) => (e === enemy ? { ...e, corrosionTurns: 2 } : e))
        );
        addLog('🛡️ Corrosion applied! Enemy resistances -8% for 2 turns');
        const shieldAmt = Math.floor(dmg * 0.15);
        setIdentityStates((prev) =>
          prev.map((s) => (s.hp > 0 ? { ...s, shield: s.shield + shieldAmt } : s))
        );
        addLog(`🛡️ All allies gained ${shieldAmt} shield!`);
      }
      if (active.classCategory === 'Amplifier' && isEgo) {
        const healPct = 0.15 + active.classEffect * 0.5 + synergyHealBonus + deptBonus.healBonus;
        const healAmt = Math.max(3, Math.floor(dmg * healPct));
        setIdentityStates((prev) =>
          prev.map((s) => {
            if (s.hp <= 0) return s;
            return { ...s, hp: Math.min(s.maxHp, s.hp + healAmt) };
          })
        );
        addLog(`💚 Amplifier Ego: all allies healed for ${healAmt} HP (${(healPct * 100).toFixed(0)}% of damage)`);
      }
      if (active.classCategory === 'Support' && isEgo) {
        const healPct = 0.20 + active.classEffect + synergyHealBonus + deptBonus.healBonus;
        const healAmt = Math.floor(dmg * healPct);
        setIdentityStates((prev) =>
          prev.map((s) => {
            if (s.hp <= 0) return s;
            return { ...s, hp: Math.min(s.maxHp, s.hp + healAmt) };
          })
        );
        addLog(`💚 Support Ego: all allies healed for ${healAmt} HP (${(healPct * 100).toFixed(0)}% of damage)`);
      }

      if (isEgo) {
        const identity = identities.find((i) => i.id === active.identityId);
        if (identity && identity.transformedSkills?.length > 0) {
          const triggerCtx = {
            ultimateBar: active.ultimate,
            isEgo: true,
            stacks: { ultimate: active.ultimate },
            enemyStacks: {},
            allyCount: identityStates.length,
            deadAllyCount: identityStates.filter((s) => s.hp <= 0).length,
            totalEnemiesDefeated,
          };
          const shouldTrigger = checkTransformationTrigger(identity, triggerCtx);
          if (shouldTrigger.shouldTrigger) {
            const newSkills = buildTransformedSkills(identity, active.damageType, active.infusion);
            setIdentityStates((prev) =>
              prev.map((s, i) =>
                i === activeIdentityIndex
                  ? {
                      ...s,
                      ultimate: 0,
                      transformedSkills: newSkills,
                      transformationActive: true,
                      transformationTurnsLeft: identity.ultimateDuration || 8,
                    }
                  : s
              )
            );
            addLog(`🌹 ${identity.name} transformed! Skills replaced for ${identity.ultimateDuration || 8} turns.`);
          }
        }
      }
    } else {
      const diff = result.enemyTotal - result.playerTotal;
      const basePercent = 0.005 + 0.0015 * diff;
      let finalPercent = basePercent;
      finalPercent *= 0.85 + Math.random() * 0.3;
      finalPercent = Math.min(finalPercent, 0.15);
      const enemyDmg = Math.max(1, Math.floor(finalPercent * active.maxHp));
      const afterShield = Math.max(0, enemyDmg - active.shield);
      setIdentityStates((prev) =>
        prev.map((s, i) =>
          i === activeIdentityIndex
            ? {
                ...s,
                hp: Math.max(0, s.hp - afterShield),
                shield: Math.max(0, s.shield - enemyDmg),
              }
            : s
        )
      );
      addLog(`❌ ${active.name} lost clash! ${enemy.name} deals ${enemyDmg} damage.`);
      setClashData({ p: result.playerTotal, e: result.enemyTotal, won: false, dmg: enemyDmg, actorName: enemy.name });
      if (active.classCategory === 'Amplifier' && afterShield > 0) {
        setIdentityStates((prev) =>
          prev.map((s) => {
            if (s.hp <= 0) return s;
            return { ...s, hp: Math.min(s.maxHp, s.hp + afterShield) };
          })
        );
        addLog(`💚 Amplifier resonance: allies healed for ${afterShield} HP.`);
      }
    }

    if (!isEgo) {
      setIdentityStates((prev) =>
        prev.map((s, i) =>
          i === activeIdentityIndex ? { ...s, sp: Math.max(0, s.sp - 10) } : s
        )
      );
    } else {
      setIdentityStates((prev) =>
        prev.map((s, i) => (i === activeIdentityIndex ? { ...s, ultimate: 0 } : s))
      );
    }

    setTurn('resolve');
    if (gameMode === 'coop' && wsRef.current) {
      sendAction('playerAction', {
        selectedSkillIndex,
        selectedEnemyIndex,
      });
    }
  };

  const resolvePhase = () => {
    const aliveEnemies = enemies.filter((e) => e.currentHp > 0);
    if (aliveEnemies.length === 0) {
      const wave = selectedPlace.waves[currentWaveIndex];
      const enemyCount = selectedPlace.waves[currentWaveIndex].enemies.length;
      setTotalEnemiesDefeated((prev) => prev + enemyCount);
      if (wave.isBoss) setBossesDefeated((prev) => prev + 1);
      addLog(`🏁 Wave ${currentWaveIndex + 1} cleared!`);

      if (currentWaveIndex < selectedPlace.waves.length - 1) {
        const nextIdx = currentWaveIndex + 1;
        setCurrentWaveIndex(nextIdx);
        const nextWave = selectedPlace.waves[nextIdx];
        const nextEnemies = nextWave.enemies
          .map((id: string) => {
            const raw = explorationEnemies[id];
            if (!raw) return null;
            return convertRawEnemy(raw, selectedPlace, selectedDifficulty);
          })
          .filter(Boolean) as ExplorationEnemy[];
        setEnemies(nextEnemies);
        addLog(`🌊 Wave ${nextIdx + 1}: ${nextWave.description}`);
        if (nextEnemies.length > 0) {
          addLog(`⚔️ Encountered ${nextEnemies.map((e) => e.name).join(', ')}!`);
        }
        const firstAlive = identityStates.findIndex((s) => s.hp > 0);
        if (firstAlive !== -1) setActiveIdentityIndex(firstAlive);
        setTurn('player');
        setSelectedSkillIndex(0);
        setSelectedEnemyIndex(0);
        setClashData(null);
        return;
      } else {
        addLog('🏆 Exploration complete!');
        setIsCombatFinished(true);
        setPhase('victory');
        const rawLunacy = selectedPlace.waves.reduce((sum: number, w: any) => sum + rand(w.rewards.lunacy.min, w.rewards.lunacy.max), 0);
        const rawExp = selectedPlace.waves.reduce((sum: number, w: any) => sum + rand(w.rewards.exp.min, w.rewards.exp.max), 0);
        const bonus = computeDepartmentBonus(facility);
        const totalLunacy = Math.floor(rawLunacy * bonus.rewardMultiplier);
        const totalExp = Math.floor(rawExp * bonus.rewardMultiplier);
        const threads = selectedPlace.waves.some((w: any) => w.rewards.threads) ? Math.floor(totalLunacy / 50) : 0;
        const sigils = Math.floor(Math.random() * 3);
        const eclipse = Math.floor(Math.random() * 2);
        addEnkephalin(totalLunacy);
        addManagerExp(totalExp);
        if (threads > 0) addThreads(threads);
        if (sigils > 0) addHarmonizationSigils(sigils);
        if (eclipse > 0) addEclipseResonanceMaterials(eclipse);
        setFinalScore(totalLunacy + totalExp * 10);
        addLog(`💰 Gained ${totalLunacy}⚡ Enkephalin, ${totalExp}🌟 Manager EXP${threads > 0 ? `, ${threads}🧵 Threads` : ''}${sigils > 0 ? `, ${sigils}💎 Sigils` : ''}${eclipse > 0 ? `, ${eclipse}✨ Eclipse Mats` : ''}!`);
        setRewardsClaimed(true);
        setTurn('finished');
        if (gameMode === 'coop' && wsRef.current) {
          sendAction('explorationFinished', { score: finalScore });
        }
        return;
      }
    }

    setTurn('enemy');
    if (gameMode === 'coop' && wsRef.current) {
      sendAction('resolve', {});
    }
    setTimeout(() => {
      executeEnemyTurn();
    }, 500);
  };

  const executeEnemyTurn = () => {
    const aliveEnemies = enemies.filter((e) => e.currentHp > 0);
    const aliveIdentities = identityStates.filter((s) => s.hp > 0);
    if (aliveIdentities.length === 0) {
      addLog('💀 All identities defeated.');
      setIsCombatFinished(true);
      setPhase('defeat');
      setTurn('finished');
      return;
    }

    for (const enemy of aliveEnemies) {
      const targetIdx = Math.floor(Math.random() * aliveIdentities.length);
      const target = aliveIdentities[targetIdx];
      const realIdx = identityStates.findIndex((s) => s.identityId === target.identityId);
      if (realIdx === -1) continue;

      const eSkill = enemy.skills[Math.floor(Math.random() * enemy.skills.length)];
      let enemyTotal = 0;
      for (let c = 0; c < eSkill.coins; c++) {
        enemyTotal += rollCoin(eSkill.power);
      }
      const playerDefense = target.def > 0 ? target.def : 30;
      const playerTotal = 5 + Math.floor(playerDefense / 10);
      const diff = enemyTotal - playerTotal;
      if (diff > 0) {
        const basePercent = 0.005 + 0.0015 * diff;
        let finalPercent = basePercent;
        finalPercent *= 0.85 + Math.random() * 0.3;
        finalPercent = Math.min(finalPercent, 0.12);
        const dmg = Math.max(1, Math.floor(finalPercent * target.maxHp));
        const afterShield = Math.max(0, dmg - target.shield);
        setIdentityStates((prev) =>
          prev.map((s, i) =>
            i === realIdx
              ? {
                  ...s,
                  hp: Math.max(0, s.hp - afterShield),
                  shield: Math.max(0, s.shield - dmg),
                }
              : s
          )
        );
        addLog(`👊 ${enemy.name} attacks ${target.name} for ${dmg} damage.`);
        if (target.classCategory === 'Amplifier' && afterShield > 0) {
          setIdentityStates((prev) =>
            prev.map((s) => {
              if (s.hp <= 0) return s;
              return { ...s, hp: Math.min(s.maxHp, s.hp + afterShield) };
            })
          );
          addLog(`💚 Amplifier resonance: allies healed for ${afterShield} HP.`);
        }
        if (identityStates[realIdx].hp <= 0) {
          addLog(`💀 ${target.name} has fallen!`);
        }
      } else {
        addLog(`🛡️ ${target.name} blocked ${enemy.name}'s attack.`);
      }
    }

    const anyAlive = identityStates.some((s) => s.hp > 0);
    if (!anyAlive) {
      addLog('💀 All identities defeated. Exploration failed.');
      setIsCombatFinished(true);
      setPhase('defeat');
      setTurn('finished');
      return;
    }

    const nextAlive = identityStates.findIndex((s, i) => i > activeIdentityIndex && s.hp > 0);
    if (nextAlive === -1) {
      const firstAlive = identityStates.findIndex((s) => s.hp > 0);
      if (firstAlive !== -1) setActiveIdentityIndex(firstAlive);
    } else {
      setActiveIdentityIndex(nextAlive);
    }
    setTurn('player');
    setClashData(null);
    setSelectedSkillIndex(0);
  };

  const retreat = () => {
    if (isCombatFinished) {
      resetExploration();
      return;
    }
    addLog('🏳️ You retreated from the exploration.');
    if (gameMode === 'coop' && wsRef.current) {
      sendAction('retreat', {});
    }
    resetExploration();
  };

  const resetExploration = () => {
    setSelectedPlace(null);
    setSelectedDifficulty('Normal');
    setPhase('lobby');
    setRoomPhase('lobby');
    setEnemies([]);
    setIdentityStates([]);
    setLog(['🗺️ Choose a location to explore.']);
    setIsCombatFinished(false);
    setRewardsClaimed(false);
    setFinalScore(null);
    setShowDifficultySelector(false);
    setPendingPlace(null);
    if (gameMode === 'coop' && wsRef.current) {
      sendAction('leaveExplorationRoom', {});
      disconnectWebSocket();
    }
    setIsHost(false);
    setRoomId(null);
    setPlayers([]);
  };

  const handlePlaceClick = (place: any) => {
    if (team.length === 0) {
      addLog('⚠️ Select at least one identity first.');
      return;
    }
    setPendingPlace(place);
    setShowDifficultySelector(true);
  };

  const selectDifficulty = (difficulty: string) => {
    if (pendingPlace) {
      startSoloExploration(pendingPlace, team, difficulty);
    }
  };

  const cancelDifficultySelection = () => {
    setShowDifficultySelector(false);
    setPendingPlace(null);
  };

  // ─── RENDER: LOBBY ──────────────────────────────────────────────────
  if (phase === 'lobby' && roomPhase === 'lobby') {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="border border-cyan-500/30 bg-gray-900/80 p-4 rounded-lg">
          <h2 className="text-xl font-mono font-bold text-cyan-400">🗺️ EXPLORATION MODE</h2>
          <p className="text-sm text-gray-400 mt-1">Select game mode and a location.</p>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setGameMode('solo')}
            className={`px-6 py-3 font-mono font-bold border transition-all ${gameMode === 'solo' ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400' : 'border-gray-700 text-gray-400 hover:border-cyan-400/50'}`}
            style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
          >
            🎮 SOLO (up to 3 identities)
          </button>
          <button
            onClick={() => setGameMode('coop')}
            className={`px-6 py-3 font-mono font-bold border transition-all ${gameMode === 'coop' ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400' : 'border-gray-700 text-gray-400 hover:border-cyan-400/50'}`}
            style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
          >
            🌐 CO-OP (up to 3 players)
          </button>
        </div>

        {gameMode === 'solo' && (
          <>
            <div className="border border-gray-700 bg-gray-900/80 p-4 rounded-lg">
              <h3 className="text-sm font-mono font-bold text-gray-400 mb-2">SELECT IDENTITIES (max 3)</h3>
              <div className="flex flex-wrap gap-2">
                {ownedIdentities.map((o) => {
                  const identity = identities.find((i) => i.id === o.identityId);
                  if (!identity) return null;
                  const isSelected = team.includes(o.identityId);
                  return (
                    <button
                      key={o.identityId}
                      onClick={() => {
                        const newTeam = isSelected ? team.filter((id) => id !== o.identityId) : [...team, o.identityId];
                        if (newTeam.length > 3) {
                          addLog('⚠️ You can only select up to 3 identities.');
                          return;
                        }
                        useGameStore.setState({ team: newTeam });
                      }}
                      className={`px-3 py-1 text-xs font-mono border transition-all ${isSelected ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400' : 'border-gray-700 text-gray-400 hover:border-cyan-400/50'}`}
                      style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}
                    >
                      {identity.portrait} {identity.name}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">Current team: {team.join(', ')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {explorationPlaces.map((place) => (
                <div
                  key={place.id}
                  onClick={() => handlePlaceClick(place)}
                  className="border border-gray-700 bg-gray-900/80 p-4 rounded-lg cursor-pointer hover:border-cyan-400 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">🗺️</span>
                    <div className="flex-1">
                      <p className="font-bold text-white">{place.name}</p>
                      <p className="text-xs text-gray-400 line-clamp-2">{place.description}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-gray-500">{place.waves.length} waves</span>
                    <span className="text-[10px] text-gray-500">👥 {place.minMembers}-{place.maxMembers} members</span>
                  </div>
                  <div className="mt-2 flex gap-3 text-xs text-gray-400">
                    <span>⚡ ~{place.waves.reduce((s, w) => s + Math.floor((w.rewards.lunacy.min + w.rewards.lunacy.max)/2), 0)}</span>
                    <span>🌟 ~{place.waves.reduce((s, w) => s + Math.floor((w.rewards.exp.min + w.rewards.exp.max)/2), 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {gameMode === 'coop' && (
          <div className="border border-gray-700 bg-gray-900/80 p-4 rounded-lg">
            <h3 className="text-sm font-mono font-bold text-gray-400 mb-2">🌐 CO-OP LOBBY</h3>
            <p className="text-sm text-gray-400 mb-4">Select your identity, then create or join a room.</p>
            <div className="mb-4">
              <label className="text-xs uppercase tracking-wider text-[#4a5568] block mb-1">Your Identity</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:border-cyan-400 outline-none rounded"
                style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                value={selectedCoopIdentityId}
                onChange={(e) => setSelectedCoopIdentityId(e.target.value)}
              >
                {ownedIdentities.map((o) => {
                  const identity = identities.find((i) => i.id === o.identityId);
                  if (!identity) return null;
                  return (
                    <option key={o.identityId} value={o.identityId}>
                      {identity.portrait} {identity.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Room Code (empty = auto-generate)"
                  className="flex-1 bg-gray-800 border border-gray-700 px-3 py-2 text-white focus:border-cyan-400 outline-none rounded"
                  id="explorationRoomCodeInput"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      const code = input.value.trim();
                      if (code) {
                        joinRoom(code);
                      } else {
                        createRoom(explorationPlaces[0]?.id || '');
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('explorationRoomCodeInput') as HTMLInputElement;
                    const code = input.value.trim();
                    if (code) {
                      joinRoom(code);
                    } else {
                      createRoom(explorationPlaces[0]?.id || '');
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
        )}

        {showDifficultySelector && pendingPlace && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-cyan-500/30 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-bold text-cyan-400 mb-2">⚙️ SELECT DIFFICULTY</h3>
              <p className="text-sm text-gray-400 mb-4">
                Choose difficulty for <span className="text-white font-bold">{pendingPlace.name}</span>
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {['Easy', 'Normal', 'Hard', 'Very Hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => selectDifficulty(diff)}
                    className={`p-3 border transition-all ${difficultyColor(diff)} hover:border-cyan-400 hover:bg-cyan-400/10`}
                    style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                  >
                    <div className="text-sm font-bold">{diff}</div>
                    <div className="text-[10px] text-gray-500">
                      {diff === 'Easy' ? 'Relaxed' : diff === 'Normal' ? 'Standard' : diff === 'Hard' ? 'Challenging' : 'Brutal'}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelDifficultySelection}
                  className="px-4 py-2 border border-gray-600 text-gray-400 rounded hover:border-red-400 hover:text-red-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: CO-OP ROOM LOBBY ──────────────────────────────────────
  if (roomPhase === 'placeSelect' || roomPhase === 'difficultySelect') {
    const isPlaceSelect = roomPhase === 'placeSelect';
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="border border-cyan-500/30 bg-gray-900/80 p-4 rounded-lg flex justify-between items-center">
          <div>
            <h3 className="text-lg font-mono font-bold text-cyan-400">
              {isPlaceSelect ? '📍 SELECT PLACE' : '⚙️ SELECT DIFFICULTY'}
            </h3>
            <p className="text-sm text-gray-400">
              {isPlaceSelect
                ? 'Choose a location to explore with your party.'
                : `Host: select difficulty for ${selectedPlace?.name}`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400">Players: {players.map(p => p.name).join(', ')}</span>
            {isHost && <span className="text-xs text-cyan-400 block">You are the host</span>}
            {!isHost && <span className="text-xs text-amber-400 block">Waiting for host...</span>}
          </div>
        </div>

        {isPlaceSelect ? (
          <>
            {isHost ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {explorationPlaces.map((place) => (
                  <div
                    key={place.id}
                    onClick={() => {
                      setSelectedPlace(place);
                      setRoomPhase('difficultySelect');
                    }}
                    className="border border-gray-700 bg-gray-900/80 p-4 rounded-lg cursor-pointer hover:border-cyan-400 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">🗺️</span>
                      <div className="flex-1">
                        <p className="font-bold text-white">{place.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-2">{place.description}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-gray-500">{place.waves.length} waves</span>
                      <span className="text-[10px] text-gray-500">👥 {place.minMembers}-{place.maxMembers} members</span>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-gray-400">
                      <span>⚡ ~{place.waves.reduce((s, w) => s + Math.floor((w.rewards.lunacy.min + w.rewards.lunacy.max)/2), 0)}</span>
                      <span>🌟 ~{place.waves.reduce((s, w) => s + Math.floor((w.rewards.exp.min + w.rewards.exp.max)/2), 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-amber-500/30 bg-amber-500/5 p-8 text-center rounded-lg">
                <p className="text-amber-400 font-bold text-lg">⏳ Waiting for host to choose a place...</p>
                <p className="text-gray-400 text-sm mt-2">The host will select a location and difficulty.</p>
              </div>
            )}
          </>
        ) : (
          <>
            {isHost ? (
              <div className="border border-gray-700 bg-gray-900/80 p-4 rounded-lg">
                <h3 className="text-sm font-mono font-bold text-gray-400 mb-3">Select Difficulty</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Easy', 'Normal', 'Hard', 'Very Hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`p-3 border transition-all ${
                        selectedDifficulty === diff
                          ? `border-cyan-400 bg-cyan-400/10 text-cyan-400`
                          : 'border-gray-700 bg-gray-900/50 text-gray-400 hover:border-cyan-400/50'
                      }`}
                      style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                    >
                      <span className={`text-xs font-mono font-bold ${difficultyColor(diff)}`}>{diff}</span>
                      <p className="text-[10px] text-gray-500">
                        {diff === 'Easy' ? 'Relaxed' : diff === 'Normal' ? 'Standard' : diff === 'Hard' ? 'Challenging' : 'Brutal'}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={startExploration}
                    disabled={!selectedPlace || !selectedDifficulty}
                    className="px-6 py-2 bg-green-500/20 border border-green-400 text-green-400 font-mono font-bold hover:bg-green-400 hover:text-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
                  >
                    ⚔️ START EXPLORATION ({selectedDifficulty})
                  </button>
                  <button
                    onClick={() => setRoomPhase('placeSelect')}
                    className="px-4 py-2 border border-gray-600 text-gray-400 rounded hover:border-cyan-400 hover:text-cyan-400 transition"
                  >
                    ← Back to Places
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-amber-500/30 bg-amber-500/5 p-8 text-center rounded-lg">
                <p className="text-amber-400 font-bold text-lg">⏳ Host is choosing difficulty...</p>
                <p className="text-gray-400 text-sm mt-2">The host will start the exploration when ready.</p>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3">
          {isHost ? (
            <button
              onClick={disbandRoom}
              className="px-4 py-2 border border-red-400 text-red-400 rounded hover:bg-red-400 hover:text-gray-900 transition"
            >
              💥 Disband Room
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm('Leave the room?')) {
                  resetExploration();
                }
              }}
              className="px-4 py-2 border border-gray-600 text-gray-400 rounded hover:border-red-400 hover:text-red-400 transition"
            >
              🚪 Leave Room
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('Exit to lobby?')) resetExploration();
            }}
            className="px-4 py-2 border border-gray-600 text-gray-400 rounded hover:border-cyan-400 hover:text-cyan-400 transition"
          >
            ← Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // ─── RENDER: COMBAT / EXPLORING ──────────────────────────────────
  if (phase === 'exploring' || phase === 'waveClear' || phase === 'victory' || phase === 'defeat') {
    const isFinished = phase === 'victory' || phase === 'defeat';
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="border border-cyan-500/30 bg-gray-900/80 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-bold text-white">{selectedPlace?.name} <span className="text-xs text-cyan-400">({selectedDifficulty})</span></p>
            <p className="text-xs text-gray-400">
              Wave {currentWaveIndex + 1} of {selectedPlace?.waves.length} · 
              {enemies.filter(e => e.currentHp > 0).length} enemies remaining
            </p>
            {gameMode === 'coop' && (
              <p className="text-xs text-cyan-400">🌐 Co-op · {players.map(p => p.name).join(', ')}</p>
            )}
          </div>
          <div className="text-right">
            {synergyType && (
              <span className="text-xs px-2 py-0.5 border border-amber-400 text-amber-400">
                {synergyType === 'amplifier' ? '⚡ Synergy: Offensive' : '💚 Synergy: Defensive'}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {identityStates.map((state, idx) => {
            const isActive = idx === activeIdentityIndex;
            const hpPct = state.maxHp > 0 ? (state.hp / state.maxHp) * 100 : 0;
            return (
              <div
                key={state.identityId}
                className={`border p-3 transition-all ${isActive ? 'border-cyan-400 bg-cyan-400/10' : state.hp <= 0 ? 'border-red-500/30 bg-red-500/10 opacity-50' : 'border-gray-700 bg-gray-900/80'}`}
                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{identities.find(i => i.id === state.identityId)?.portrait || '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{state.name}</p>
                    <p className="text-[10px] text-gray-400">{state.playerName} · {state.classCategory}</p>
                  </div>
                  {state.transformationActive && <span className="text-amber-400 text-sm">⭐</span>}
                  {isActive && <span className="text-cyan-400 text-xs">ACTIVE</span>}
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>HP</span>
                    <span>{Math.round(state.hp)}/{state.maxHp}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${hpPct > 50 ? 'bg-green-400' : hpPct > 25 ? 'bg-yellow-400' : 'bg-red-400'}`}
                         style={{ width: `${Math.max(0, hpPct)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>SP</span>
                    <span>{Math.round(state.sp)}/{state.maxSp}</span>
                  </div>
                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${(state.sp / state.maxSp) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>ULT</span>
                    <span>{Math.round(state.ultimate)}%</span>
                  </div>
                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${state.ultimate}%` }} />
                  </div>
                  {state.shield > 0 && (
                    <div className="text-[10px] text-cyan-400">🛡 {Math.round(state.shield)}</div>
                  )}
                  {state.transformationActive && (
                    <div className="text-[10px] text-amber-400">⭐ Transformed ({state.transformationTurnsLeft}t)</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border border-gray-700 bg-gray-900/80 p-4 rounded-lg">
          <h3 className="text-xs font-mono font-bold text-gray-400 mb-2">⚔️ ENEMIES</h3>
          <div className="space-y-2">
            {enemies.map((enemy, idx) => {
              const isSelected = idx === selectedEnemyIndex && enemy.currentHp > 0;
              const hpPct = enemy.maxHp > 0 ? (enemy.currentHp / enemy.maxHp) * 100 : 0;
              return (
                <div
                  key={idx}
                  onClick={() => enemy.currentHp > 0 && setSelectedEnemyIndex(idx)}
                  className={`flex items-center justify-between p-2 border transition-all cursor-pointer ${isSelected ? 'border-cyan-400 bg-cyan-400/10' : enemy.currentHp > 0 ? 'border-gray-700 bg-gray-900/50 hover:border-cyan-400/30' : 'border-gray-800 opacity-40'}`}
                  style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{enemy.portrait || '👾'}</span>
                    <div>
                      <p className="font-bold text-white text-sm flex items-center gap-2">
                        {enemy.name}
                        {enemy.isBoss && <span className="text-[10px] text-amber-400 font-bold">⭐BOSS</span>}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {DAMAGE_TYPE_INFO[enemy.damageType]?.icon || ''} {enemy.damageType} · 
                        {INFUSION_INFO[enemy.infusion]?.icon || ''} {enemy.infusion}
                        · Resists: {enemy.resistDamageType} / {enemy.resistInfusion}
                      </p>
                      {enemy.corrosionTurns > 0 && (
                        <span className="text-[10px] text-red-400">🛡️ Corroded ({enemy.corrosionTurns}t)</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-red-400">{Math.round(hpPct)}%</p>
                    <div className="h-1.5 w-20 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${hpPct > 50 ? 'bg-red-400' : hpPct > 25 ? 'bg-orange-400' : 'bg-red-600'}`}
                           style={{ width: `${Math.max(0, hpPct)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!isFinished && turn === 'player' && (
          <div className="border border-gray-700 bg-gray-900/80 p-4 rounded-lg">
            <p className="text-xs font-mono font-bold text-gray-400 mb-2">SELECT SKILL</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {activeSkills.map((skill, idx) => {
                const isEgo = skill.type === 'ego';
                const canUse = !isEgo || (activeIdentity && activeIdentity.ultimate >= 100);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedSkillIndex(idx)}
                    disabled={!canUse}
                    className={`relative p-2 border transition-all ${selectedSkillIndex === idx ? 'border-cyan-400 bg-cyan-400/20' : 'border-gray-700 bg-gray-900/50 hover:border-cyan-400/30'} ${!canUse ? 'opacity-40 cursor-not-allowed' : ''}`}
                    style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}
                  >
                    <span className={`text-[10px] px-1.5 py-0.5 font-bold ${isEgo ? 'bg-amber-400/20 text-amber-400' : 'bg-gray-700 text-gray-400'}`}>
                      {isEgo ? 'EGO' : 'NORM'}
                    </span>
                    <p className="text-white text-sm font-bold truncate">{skill.name}</p>
                    <div className="flex gap-1 text-[10px] text-gray-400">
                      <span>P:{skill.power}</span>
                      <span>C:{skill.coins}</span>
                      {skill.damageType && <span>{DAMAGE_TYPE_INFO[skill.damageType]?.icon}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={handlePlayerAction}
              disabled={!activeIdentity || activeIdentity.hp <= 0}
              className="w-full py-3 bg-cyan-400/20 border border-cyan-400 text-cyan-400 font-mono font-bold hover:bg-cyan-400 hover:text-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
            >
              ⚔️ EXECUTE CLASH
            </button>
          </div>
        )}

        {turn === 'resolve' && !isFinished && (
          <button
            onClick={resolvePhase}
            className="w-full py-3 bg-amber-400/20 border border-amber-400 text-amber-400 font-mono font-bold hover:bg-amber-400 hover:text-gray-900 transition-all"
            style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
          >
            ⏳ RESOLVE
          </button>
        )}

        {turn === 'enemy' && !isFinished && (
          <div className="border border-gray-700 bg-gray-900/80 p-4 text-center text-gray-400">
            <p>⚔️ Enemy turn in progress...</p>
          </div>
        )}

        {clashData && (
          <div className={`border p-4 ${clashData.won ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}
               style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
            <p className="text-center font-bold">{clashData.won ? '✅ CLASH WON!' : '❌ CLASH LOST!'}</p>
            <p className="text-center text-sm text-gray-400">
              {clashData.actorName} dealt {clashData.dmg} damage.
            </p>
          </div>
        )}

        {isFinished && (
          <div className={`border p-6 text-center ${phase === 'victory' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}
               style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}>
            <span className="text-6xl">{phase === 'victory' ? '🏆' : '💔'}</span>
            <h2 className="text-2xl font-bold mt-2">{phase === 'victory' ? 'VICTORY!' : 'DEFEAT'}</h2>
            {finalScore !== null && (
              <p className="text-xl font-mono text-cyan-400 mt-2">Score: {finalScore}</p>
            )}
            <button
              onClick={resetExploration}
              className="mt-4 px-6 py-3 bg-cyan-400/20 border border-cyan-400 text-cyan-400 font-mono font-bold hover:bg-cyan-400 hover:text-gray-900 transition-all"
              style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
            >
              🔄 BACK TO MAP
            </button>
          </div>
        )}

        {!isFinished && (
          <button
            onClick={retreat}
            className="w-full py-2 border border-gray-700 text-gray-400 font-mono text-sm hover:border-red-400 hover:text-red-400 transition-all"
            style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
          >
            🏳️ RETREAT
          </button>
        )}

        <div className="border border-gray-700 bg-gray-900/80 p-4 rounded-lg">
          <h3 className="text-xs font-mono font-bold text-gray-400 mb-2">📜 EXPLORATION LOG</h3>
          <div className="max-h-40 overflow-y-auto font-mono text-xs space-y-0.5 bg-gray-800/30 p-2 rounded">
            {log.map((l, i) => <p key={i} className="text-gray-400">{l}</p>)}
          </div>
        </div>

        {/* ─── GLOBAL CHAT (co-op only) ─── */}
        {ChatComponent && <ChatComponent />}
      </div>
    );
  }

  return null;
}

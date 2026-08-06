// src/views/IdentityView.tsx – Full file with 15-slot EGO gifts, empty + slots, conditional resonance
import { useState, useEffect } from 'react';
import useGameStore, {
  RESONANCE_TYPES,
  RESONANCE_HYPERTUNE_MULTIPLIERS,
  UPPER_RESONANCE_SLOTS,
  TOTAL_RESONANCE_SLOTS,
  type ResonanceType,
} from '../store/gameStore';
import {
  identities,
  expForLevel,
  scaledStats,
  leaderSkills,
  getClassCategory,
  getClassCategories,
  classCategoryEffect,
  CLASS_CATEGORY_INFO,
  CLASS_INFO,
  INFUSION_INFO,
  combatCategories,
  type Identity,
  type CombatCategory,
} from '../data/identities';
import { weapons, compatibleWeapons } from '../data/weapons';
import {
  egoGifts,
  setBonuses,
  RESONANCE_STATS,
  HYPERTUNE_LEVELS,
  EGO_GIFT_SLOTS,
  type EgoGiftSlot,
} from '../data/egoGifts';
import { storyChapters } from '../data/story';
import { CR_REGIONS, SQUAD_INFO, getCurrentWeek, getWeeklyZones, type CRRegion, type Squad, type ZoneElement } from '../data/competitive';
import { getFirstTutorialStep, getTabTutorialSteps } from '../data/tutorial';

// ─── Rarity Config ─────────────────────────────────────────────────────────
const RARITY_CONFIG = {
  SSR: { color: '#ffd700', glow: '0 0 20px rgba(255,215,0,0.15)', label: '000' },
  SR: { color: '#00cc88', glow: '0 0 20px rgba(0,204,136,0.15)', label: '00' },
  S: { color: '#8b8b8b', glow: '0 0 20px rgba(139,139,139,0.15)', label: 'Base' },
};

// ─── Damage Type Debuff Definitions ──────────────────────────────────────
const DAMAGE_DEBUFFS: Record<string, { name: string; emoji: string; effect: string }> = {
  Pale: { name: 'Pale Decay', emoji: '🪦', effect: 'Reduces ATK and DEF by 10%' },
  Red: { name: 'Bleeding Wound', emoji: '🩸', effect: 'Deals 5% ATK as Red damage per turn' },
  White: { name: 'Mental Fracture', emoji: '⚪', effect: 'Reduces SP regeneration by 20%' },
  Black: { name: 'Black Curse', emoji: '⚫', effect: 'Increases damage taken by 15%' },
};

// ─── Infusion Debuff Definitions ─────────────────────────────────────────
const INFUSION_DEBUFFS: Record<string, { name: string; emoji: string; effect: string }> = {
  Slash: { name: 'Laceration', emoji: '🗡️', effect: 'Reduces healing by 20%' },
  Pierce: { name: 'Stagger', emoji: '💉', effect: 'Reduces SPD by 15%' },
  Blunt: { name: 'Concussion', emoji: '🔨', effect: 'Reduces ATK by 10%' },
};

// ─── Helper: normalize infusion key ──────────────────────────────────
function normalizeInfusion(infusion: string | undefined): string {
  if (!infusion) return 'Slash';
  return infusion.charAt(0).toUpperCase() + infusion.slice(1).toLowerCase();
}

const CLASS_DEBUFFS: Record<CombatCategory, { name: string; emoji: string; effect: string }> = {
  Attacker: { name: 'Bleed', emoji: '🩸', effect: 'Deals 3% ATK as damage per turn' },
  Tank: { name: 'Corrosion', emoji: '🛡️', effect: 'Reduces DEF by 10%' },
  Amplifier: { name: 'Weaken', emoji: '🔽', effect: 'Reduces ATK by 8%' },
  Support: { name: 'Silence', emoji: '🔇', effect: 'Disables skill usage for 1 turn' },
};

// ─── Material Detail Modal ────────────────────────────────────────────────
function MaterialDetailModal({ isOpen, onClose, materialKey, amount }: { isOpen: boolean; onClose: () => void; materialKey: string; amount: number }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative max-w-sm w-full border border-gray-700 bg-gray-900 shadow-2xl p-6 animate-fadeIn">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 border border-gray-700 bg-gray-800 flex items-center justify-center mb-3 text-2xl">📦</div>
          <h3 className="text-base font-bold text-white tracking-wide">{materialKey}</h3>
          <p className="text-xs text-gray-400 mt-1 font-mono">OWNED ×{amount}</p>
          <div className="w-full h-px bg-gray-700 my-4" />
          <p className="text-sm text-gray-400 leading-relaxed">Material used for crafting and upgrades.</p>
          <button onClick={onClose} className="mt-6 w-full py-2 text-sm font-bold tracking-wider border border-gray-600 hover:border-cyan-400 text-gray-300 hover:text-cyan-400 transition">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Clickable Material ──────────────────────────────────────────────────
function ClickableMaterial({ materialKey, amount, label, onClick, className = '' }: { materialKey: string; amount: number; label?: string | number; onClick: (key: string) => void; className?: string }) {
  return (
    <button onClick={() => onClick(materialKey)} className={`inline-flex items-center gap-1 hover:bg-white/5 rounded-sm px-1 py-0.5 transition-colors cursor-pointer ${className}`} title={`${materialKey}: ${amount}`}>
      <span className="w-4 h-4 text-center text-xs text-gray-400">📦</span>
      {label !== undefined && <span className="font-mono text-xs leading-none text-white">{label}</span>}
    </button>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-5 bg-cyan-400" />
      <div>
        <h3 className="text-sm font-bold text-white tracking-wider uppercase">{title}</h3>
        {subtitle && <p className="text-[10px] text-gray-400 font-mono">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Stat Display ──────────────────────────────────────────────────────────
function StatDisplay({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col items-center p-3 border border-gray-700 bg-gray-800">
      <span className="text-[10px] text-gray-400 font-mono tracking-wider mb-1">{label}</span>
      <span className="text-lg font-bold font-mono" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Rank Badge ────────────────────────────────────────────────────────────
function RankBadge({ rank, rarity }: { rank: number; rarity: string }) {
  const config = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG];
  const isMax = rank >= 8;
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 border" style={{ borderColor: isMax ? config?.color : 'gray', background: isMax ? `${config?.color}10` : 'gray-800' }}>
      <span className="text-xs font-bold font-mono" style={{ color: config?.color || 'white' }}>
        {config?.label}{rank}
      </span>
      {isMax && <span className="text-[10px]" style={{ color: config?.color || 'white' }}>MAX</span>}
    </div>
  );
}

// ─── Skill Row ─────────────────────────────────────────────────────────────
function SkillRow({ name, type, level, maxLevel, description, power, coins, dmgBonus, damageType, onLevelUp, canLevelUp, cost, isEgo = false }: { name: string; type: string; level: number; maxLevel: number; description: string; power: number; coins: number; dmgBonus: string; damageType?: string; onLevelUp: () => void; canLevelUp: boolean; cost: React.ReactNode; isEgo?: boolean }) {
  const safePower = isNaN(power) ? 0 : power;
  const safeCoins = isNaN(coins) ? 0 : coins;
  const safeDmgBonus = isNaN(parseFloat(dmgBonus)) ? '+0%' : dmgBonus;
  return (
    <div className="border-l-2 pl-4 py-3 mb-3" style={{ borderColor: isEgo ? '#f43f5e' : 'gray' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 border font-mono" style={{ borderColor: isEgo ? 'rgba(244,63,94,0.3)' : 'gray', color: isEgo ? '#f43f5e' : 'gray-400' }}>{type}</span>
          <span className="text-sm font-bold text-white">{name}</span>
          {damageType && <span className="text-[10px] px-1.5 py-0.5 border border-gray-600 text-gray-400 font-mono">{damageType}</span>}
        </div>
        <span className="text-xs font-mono text-gray-400">Lv.{level}/{maxLevel}</span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed mb-2">{description}</p>
      <div className="flex items-center gap-4 text-xs font-mono text-gray-400 mb-2">
        <span>⚔️ <span className="text-white">{safePower}</span></span>
        <span>🪙 <span className="text-white">{safeCoins}</span></span>
        <span className="text-green-400">{safeDmgBonus}</span>
      </div>
      {level < maxLevel ? (
        <button onClick={onLevelUp} disabled={!canLevelUp} className="text-xs px-3 py-1.5 border border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 disabled:opacity-30 transition-all font-mono">Lv.UP {cost}</button>
      ) : (
        <span className="text-xs text-amber-400 font-mono font-bold">MAX LEVEL</span>
      )}
    </div>
  );
}

// ─── Resonance Slot Component ──────────────────────────────────────────────
function ResonanceSlot({ slot, index, onClick, onHypertune }: { slot: { type: ResonanceType | null; hypertuneLevel: number }; index: number; onClick: () => void; onHypertune: () => void }) {
  const hasType = slot.type !== null;
  const typeData = hasType ? RESONANCE_TYPES[slot.type] : null;
  const hypertuneLevel = slot.hypertuneLevel;
  const multiplier = RESONANCE_HYPERTUNE_MULTIPLIERS[hypertuneLevel] || 1;
  const isUpper = index < UPPER_RESONANCE_SLOTS;
  const specialDescriptions: Partial<Record<ResonanceType, string>> = { ego_skill_level: 'E.G.O Skill +1', core_passive_level: 'Core Passive +1', class_skill_level: 'Class Skill +1' };
  const specialDesc = hasType ? specialDescriptions[slot.type] : null;

  return (
    <div className={`relative p-2 border rounded-lg cursor-pointer transition-all ${hasType ? isUpper ? 'border-[#00d4ff]/40 bg-[#00d4ff]/5' : 'border-[#ff9e00]/40 bg-[#ff9e00]/5' : 'border-[#1a2332] bg-[#0f1525] hover:border-[#00d4ff]/30'}`} onClick={onClick}>
      {hasType ? (
        <>
          <div className="text-xs font-bold text-white truncate">{typeData!.label}</div>
          <div className="text-[10px] text-[#8b9bb4] mt-0.5">
            {specialDesc || (typeData!.stats.hp ? `HP+${typeData!.stats.hp} ` : '') + (typeData!.stats.atk ? `ATK+${typeData!.stats.atk} ` : '') + (typeData!.stats.def ? `DEF+${typeData!.stats.def} ` : '') + (typeData!.stats.spd ? `SPD+${typeData!.stats.spd} ` : '') + (typeData!.stats.crit ? `CRIT+${typeData!.stats.crit} ` : '') + (typeData!.stats.clashPower ? `Clash+${typeData!.stats.clashPower}` : '')}
          </div>
          {hypertuneLevel > 0 && (
            <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-[#ff9e00] text-[8px] font-bold px-1 rounded-full text-black cursor-pointer hover:bg-[#ffaa33]" onClick={(e) => { e.stopPropagation(); onHypertune(); }} title={`Hypertune (costs ${100 + (hypertuneLevel + 1) * 150} Threads & ${hypertuneLevel + 1} Materials)`}>+{hypertuneLevel}</div>
          )}
          <div className="text-[8px] text-[#4a5568] mt-0.5">×{multiplier.toFixed(2)}</div>
        </>
      ) : (
        <div className="flex items-center justify-center h-10 text-[#4a5568] text-2xl">+</div>
      )}
      <div className="text-[8px] text-[#4a5568] mt-1 text-center">Slot {index + 1}</div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────
export default function IdentityView() {
  const store = useGameStore();

  // ── Safe extraction ──────────────────────────────────────────────────
  const ownedIdentities = Array.isArray(store.ownedIdentities) ? store.ownedIdentities : [];
  const expSerum = store.expSerum ?? 0;
  const expSerumM = store.expSerumM ?? 0;
  const expSerumL = store.expSerumL ?? 0;
  const expSerumXL = store.expSerumXL ?? 0;
  const lowTierMats = store.lowTierMats ?? 0;
  const weaponParts = store.weaponParts ?? 0;
  const syncEnhancementMats = store.syncEnhancementMats ?? 0;
  const syncSerumMats = store.syncSerumMats ?? 0;
  const threads = store.threads ?? 0;
  const eclipseResonanceMaterials = store.eclipseResonanceMaterials ?? 0;
  const harmonizationSigils = store.harmonizationSigils ?? 0;
  const ownedWeapons = Array.isArray(store.ownedWeapons) ? store.ownedWeapons : [];
  const shardInventory = store.shardInventory ?? {};
  const ownedGifts = Array.isArray(store.ownedGifts) ? store.ownedGifts : [];
  const giftResonance = store.giftResonance ?? {};
  const giftHypertune = store.giftHypertune ?? {};
  const weaponHarmonization = store.weaponHarmonization ?? {};
  const identityEquippedGifts = store.identityEquippedGifts ?? {};

  // ── Resonance ──────────────────────────────────────────────────────────
  const resonance = store.resonance ?? { slots: Array.from({ length: 12 }, () => ({ type: null, hypertuneLevel: 0 })) };
  const egoManifestEssence = store.egoManifestEssence ?? 0;
  const setResonanceSlot = store.setResonanceSlot || (() => {});
  const hypertuneResonanceSlot = store.hypertuneResonanceSlot || (() => {});
  const removeEgoManifestEssence = store.removeEgoManifestEssence || (() => {});
  const getTotalResonanceStats = store.getTotalResonanceStats || (() => ({ hp: 0, atk: 0, def: 0, spd: 0, crit: 0, clashPower: 0 }));

  // ── Store functions ──────────────────────────────────────────────────
  const levelUpIdentityWithSerums = store.levelUpIdentityWithSerums || (() => {});
  const levelUpSkill = store.levelUpSkill || (() => {});
  const levelUpClassSkill = store.levelUpClassSkill || (() => {});
  const levelUpCorePassive = store.levelUpCorePassive || (() => {});
  const levelUpDefense = store.levelUpDefense || (() => {});
  const upgradeIdentity = store.upgradeIdentity || (() => {});
  const setEquippedWeapon = store.setEquippedWeapon || (() => {});
  const recycleShards = store.recycleShards || (() => {});
  const levelUpGift = store.levelUpGift || (() => {});
  const syncGift = store.syncGift || (() => {});
  const equipOwnedGift = store.equipOwnedGift || (() => {});
  const resonateGift = store.resonateGift || (() => {});
  const hypertuneGift = store.hypertuneGift || (() => {});
  const harmonizeWeapon = store.harmonizeWeapon || (() => {});
  const getTotalGiftStats = store.getTotalGiftStats || (() => ({ hp: 0, atk: 0, def: 0, spd: 0, sanity: 0, resistRed: 0, resistPale: 0, resistBlack: 0, resistWhite: 0, clashPower: 0, healBonus: 0 }));
  const getTotalResistances = store.getTotalResistances || (() => ({ red: 0, pale: 0, black: 0, white: 0 }));
  const getTotalSetBonuses = store.getTotalSetBonuses || (() => []);

  // ── Local state ──────────────────────────────────────────────────────
  const [serumS, setSerumS] = useState(0);
  const [serumM, setSerumM] = useState(0);
  const [serumL, setSerumL] = useState(0);
  const [serumXL, setSerumXL] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'skills' | 'equipment' | 'gifts'>('details');
  const [showWeaponSelect, setShowWeaponSelect] = useState(false);
  const [showGiftSelect, setShowGiftSelect] = useState(false);
  const [recycleAmount, setRecycleAmount] = useState(1);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [selectedMaterialKey, setSelectedMaterialKey] = useState<string | null>(null);
  const [selectedMaterialAmount, setSelectedMaterialAmount] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showResonancePicker, setShowResonancePicker] = useState(false);

  // ─── Auto‑select first identity ──────────────────────────────────────
  useEffect(() => {
    if (ownedIdentities.length > 0 && !selectedId) {
      const validOwned = ownedIdentities.find(o => identities.some(i => i.id === o.identityId));
      setSelectedId(validOwned ? validOwned.identityId : ownedIdentities[0].identityId);
    }
  }, [ownedIdentities, selectedId]);

  const openMaterialModal = (key: string, amount: number) => {
    setSelectedMaterialKey(key);
    setSelectedMaterialAmount(amount);
    setMaterialModalOpen(true);
  };
  const closeMaterialModal = () => {
    setMaterialModalOpen(false);
    setSelectedMaterialKey(null);
    setSelectedMaterialAmount(0);
  };

  const selectedIdentity = identities.find(i => i.id === selectedId);
  const owned = ownedIdentities.find(o => o.identityId === selectedId);
  const equippedGifts = store.equippedGifts || []; // 15 slots
  const giftStats = getTotalGiftStats();
  const resistances = getTotalResistances();
  const setBonusesActive = getTotalSetBonuses();

  // ── Handlers ──────────────────────────────────────────────────────────
  const getShardCostForNextRank = (identity: Identity, currentRank: number): number | null => {
    if (currentRank >= 8) return null;
    const costs = identity.rarity === 'SSR' ? identity.rankUpgrades?.ssr : identity.rankUpgrades?.sr;
    if (!costs) return null;
    return costs[currentRank];
  };

  const isHarmonized = (identityId: string, weaponId: string) => weaponHarmonization[identityId] === weaponId;
  const ownedCompatibleWeapons = selectedIdentity ? compatibleWeapons(selectedIdentity.id).filter(w => ownedWeapons.some(ow => ow.weaponId === w.id)) : [];

  const calculateSetBonuses = () => {
    const setCounts: Record<string, number> = {};
    equippedGifts.forEach(g => {
      if (!g.giftId) return;
      const gift = egoGifts.find(eg => eg.id === g.giftId);
      if (gift?.set) setCounts[gift.set] = (setCounts[gift.set] || 0) + 1;
    });
    return setCounts;
  };
  const activeSetCounts = calculateSetBonuses();

  const getActiveSetBonuses = () => {
    const result: { setName: string; pieces: number; description: string; effect: string; isActive: boolean }[] = [];
    Object.entries(activeSetCounts).forEach(([setName, count]) => {
      const bonuses = setBonuses[setName];
      if (!bonuses) return;
      let isHarmonizedActive = false;
      if (selectedIdentity) {
        const weapon = weapons.find(w => w.id === owned?.equippedWeaponId);
        if (weapon && weapon.signatureFor === selectedIdentity.id && isHarmonized(selectedIdentity.id, weapon.id)) {
          isHarmonizedActive = true;
        }
      }
      bonuses.forEach(b => {
        const isActive = isHarmonizedActive ? count >= b.pieces : count >= b.pieces;
        result.push({ setName, pieces: b.pieces, description: b.description, effect: b.effect, isActive });
      });
    });
    return result;
  };

  const getSignatureGiftIds = (identityId: string): string[] => egoGifts.filter(gift => gift.signatureFor === identityId).map(gift => gift.id);
  const BUFF_SET_CLASS_MAP: Record<string, string> = {
    "Attacker's Edge": 'Attacker',
    "Tank's Bastion": 'Tank',
    "Amplifier's Resonance": 'Amplifier',
    "Support's Grace": 'Support',
  };
  const getCompatibleBuffGiftIds = (identityId: string): string[] => {
    const characterClass = getClassCategory(identityId);
    return egoGifts.filter(gift => {
      if (gift.signatureFor) return false;
      if (gift.set && BUFF_SET_CLASS_MAP[gift.set]) return BUFF_SET_CLASS_MAP[gift.set] === characterClass;
      return true;
    }).map(gift => gift.id);
  };

  const upgradeGiftToMax = (slotId: EgoGiftSlot) => {
    let safety = 200;
    while (safety-- > 0) {
      const gift = equippedGifts.find(g => g.slot === slotId);
      if (!gift || !gift.giftId || gift.level >= 25 || store.threads < 100) break;
      levelUpGift(slotId);
    }
  };

  const computeBP = () => {
    if (!selectedIdentity || !owned) return 0;
    const charBP = Math.min(owned.level, 60) * 50;
    let weaponBP = 0;
    const weapon = owned.equippedWeaponId ? weapons.find(w => w.id === owned.equippedWeaponId) : null;
    if (weapon) {
      const ownedWeapon = ownedWeapons.find(ow => ow.weaponId === weapon.id);
      const weaponLevel = ownedWeapon?.level || 1;
      const isSignature = weapon.signatureFor === selectedIdentity.id;
      if (isSignature) {
        weaponBP = Math.min(weaponLevel, 30) * 25;
        if (isHarmonized(selectedIdentity.id, weapon.id)) weaponBP += 450;
      } else {
        weaponBP = Math.min(weaponLevel, 30) * 10;
      }
    }
    let relicBP = 0;
    for (const slot of equippedGifts) {
      if (slot.giftId) {
        const level = slot.level || 1;
        relicBP += Math.min(25 + (level - 1) * 5, 150);
      }
    }
    let hypertuneBP = 0;
    for (const slot of equippedGifts) {
      if (giftHypertune[slot.slot] > 0) hypertuneBP += 175;
    }
    const rankBP = owned.rank * 112.5;
    return Math.round(charBP + weaponBP + relicBP + hypertuneBP + rankBP);
  };

  // ─── Resonance Handlers ──────────────────────────────────────────────────
  const handleResonanceSlotClick = (index: number) => { setSelectedSlot(index); setShowResonancePicker(true); };
  const handleResonanceSelect = (type: ResonanceType | null) => {
    if (selectedSlot === null) return;
    const current = resonance.slots[selectedSlot];
    if (current.type === type) { setShowResonancePicker(false); setSelectedSlot(null); return; }
    if (type !== null && egoManifestEssence < 1) { alert('Not enough E.G.O Manifest Essence!'); return; }
    if (type !== null && current.type !== type) { removeEgoManifestEssence(1); }
    setResonanceSlot(selectedSlot, type);
    setShowResonancePicker(false);
    setSelectedSlot(null);
  };
  const handleHypertune = (index: number) => hypertuneResonanceSlot(index);
  const isUpper = (index: number) => index < UPPER_RESONANCE_SLOTS;
  const availableTypes = (index: number) => {
    const upperTypes: ResonanceType[] = ['precision_attack', 'tactical_modification', 'strengthened_power', 'positioned_action'];
    const lowerTypes: ResonanceType[] = ['ego_skill_level', 'core_passive_level', 'class_skill_level', 'precision_attack', 'tactical_modification', 'strengthened_power', 'positioned_action'];
    return isUpper(index) ? upperTypes : lowerTypes;
  };

  // ─── Check if identity has any gift equipped ──────────────────────────
  const hasAnyGift = equippedGifts.some(g => g.giftId !== '');

  // ─── Early returns ──────────────────────────────────────────────────────
  if (ownedIdentities.length === 0) {
    return <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-gray-950 text-white"><p className="text-gray-400 font-mono">No Manifest owned. Pull the Gacha to get started.</p></div>;
  }
  if (!selectedId) {
    return <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-gray-950 text-white"><p className="text-gray-400 font-mono">Loading Manifest...</p></div>;
  }
  if (!selectedIdentity || !owned) {
    return <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-gray-950 text-white"><p className="text-gray-400 font-mono">Identity not found.</p></div>;
  }

  const stats = scaledStats(selectedIdentity, owned.level, owned.classSkillLevel ?? 1);
  const rarityLabel = RARITY_CONFIG[selectedIdentity.rarity as keyof typeof RARITY_CONFIG]?.label || selectedIdentity.rarity;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-gray-950 text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-800 flex flex-col shrink-0 bg-gray-900">
        <div className="p-3 border-b border-gray-800">
          <h3 className="text-xs font-bold text-white tracking-widest uppercase">Members</h3>
          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{ownedIdentities.length} Construct(s)</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {ownedIdentities.map(o => {
            const identity = identities.find(i => i.id === o.identityId);
            if (!identity) return null;
            const isSelected = selectedId === o.identityId;
            const config = RARITY_CONFIG[identity.rarity as keyof typeof RARITY_CONFIG];
            return (
              <button key={o.identityId} onClick={() => setSelectedId(o.identityId)} className={`w-full flex items-center gap-3 p-2 border transition-all`} style={{ borderColor: isSelected ? config?.color : 'transparent', background: isSelected ? `${config?.color}08` : 'transparent' }}>
                <div className="relative w-12 h-12 border-2 flex items-center justify-center shrink-0" style={{ borderColor: config?.color }}>
                  <span className="text-xl">{identity.portrait}</span>
                  <div className="absolute -bottom-1 -right-1 text-[8px] px-1 font-bold text-white" style={{ background: config?.color }}>{config?.label}</div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-white truncate">{identity.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{identity.title}</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {identity.classes.map((cls) => {
                      const info = CLASS_INFO[cls];
                      return (
                        <span key={cls} className="text-[10px] px-1 border border-gray-600 text-gray-400 flex items-center gap-0.5">
                          <span className="text-[8px]">{info.icon}</span>
                          <span>{info.name}</span>
                        </span>
                      );
                    })}
                    <span className="text-[10px] text-gray-400 font-mono">Lv.{o.level}</span>
                    <span className="text-[10px] px-1 border border-gray-600 text-gray-400">{identity.element}</span>
                    <span className="text-[10px] px-1 border border-gray-600 text-gray-400">{normalizeInfusion(identity.baseInfusion)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0"><span className="text-[10px] font-mono text-gray-400">R{o.rank}</span></div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b border-gray-800 p-4 flex items-start gap-6 bg-gray-900">
          {(() => {
            const config = RARITY_CONFIG[selectedIdentity.rarity];
            const primaryDamageType = selectedIdentity.element;
            const primaryInfusion = normalizeInfusion(selectedIdentity.baseInfusion);
            return (
              <>
                <div className="w-24 h-24 border-2 flex items-center justify-center shrink-0 relative bg-gray-800" style={{ borderColor: config?.color }}>
                  <span className="text-5xl">{selectedIdentity.portrait}</span>
                  <div className="absolute -bottom-1 -right-1 text-xs px-1.5 py-0.5 font-bold text-white" style={{ background: config?.color }}>{config?.label}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <RankBadge rank={owned.rank} rarity={selectedIdentity.rarity} />
                    <span className="text-xs text-gray-400 font-mono">{selectedIdentity.faction}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{selectedIdentity.name}</h2>
                  <p className="text-xs text-gray-400">{selectedIdentity.title}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {selectedIdentity.classes.map((classKey) => {
                      const info = CLASS_INFO[classKey];
                      return (
                        <span key={classKey} className="flex items-center gap-1 text-[10px] px-2 py-0.5 border border-gray-600 font-bold text-gray-400">
                          <span className="text-xs">{info.icon}</span>
                          <span>{info.name}</span>
                        </span>
                      );
                    })}
                    <span className="text-[10px] text-gray-500">→</span>
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 border border-cyan-500/40 font-bold text-cyan-400">
                      <span className="text-xs">⚔️</span>
                      <span>{getClassCategory(selectedIdentity.id)}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 border border-gray-600 font-bold text-gray-400">
                      <span className="w-5 h-5 text-center text-xs">💥</span>
                      {primaryDamageType}
                      {primaryInfusion && (
                        <span className="ml-1 flex items-center gap-1">
                          <span className="text-xs">{INFUSION_INFO[primaryInfusion]?.icon || '🗡️'}</span>
                          <span>{primaryInfusion}</span>
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Battle Power</p>
                  <p className="text-3xl font-bold font-mono text-white">{computeBP()}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">Lv.{owned.level} / {selectedIdentity.levelCap}</p>
                </div>
              </>
            );
          })()}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 bg-gray-900">
          {(['details', 'skills', 'equipment', 'gifts'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-xs font-bold tracking-wider uppercase transition-colors`} style={{ color: activeTab === tab ? '#22d3ee' : '#6b7280', borderBottom: activeTab === tab ? '2px solid #22d3ee' : '2px solid transparent' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-950">

          {/* ═══ DETAILS TAB ═══ */}
          {activeTab === 'details' && (
            <div className="space-y-6 max-w-3xl">
              {/* Class Info */}
              <div className="border border-gray-800 p-4 bg-gray-900">
                <SectionHeader title="Classes" />
                <div className="space-y-2">
                  {selectedIdentity.classes.map((classKey) => {
                    const info = CLASS_INFO[classKey];
                    const category = combatCategories[classKey];
                    return (
                      <div key={classKey} className="flex items-start gap-3 border-b border-gray-800 py-2 last:border-0">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-white">{info.name}</p>
                          <p className="text-xs text-gray-400">{info.description}</p>
                          <p className="text-[10px] text-cyan-400 font-mono mt-1">Category: {category}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skills Summary */}
              <div className="border border-gray-800 p-4 bg-gray-900">
                <SectionHeader title="Skills Summary" />
                <div className="space-y-2">
                  {selectedIdentity.skills.filter(s => s.type !== 'class').map((skill, idx) => {
                    const isEgo = skill.type === 'ego';
                    const isDefense = skill.type === 'defense';
                    const isTransformed = skill.name.includes('Resolve') || skill.name.includes('Slay') || skill.name.includes('SHIT') || skill.name.includes('True Execution');
                    return (
                      <div key={idx} className={`flex items-center gap-2 pl-3 py-1 ${isEgo ? 'border-l-2 border-rose-500' : isDefense ? 'border-l-2 border-emerald-500' : isTransformed ? 'border-l-2 border-amber-500/50' : 'border-l-2 border-gray-600'}`}>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {isEgo ? 'EGO' : isDefense ? 'DEF' : isTransformed ? '✦' : `N${idx + 1}`}
                        </span>
                        <span className="text-sm text-white">{skill.name}</span>
                        {skill.damageType && <span className="text-[10px] text-gray-400 font-mono">({skill.damageType})</span>}
                        {skill.infusion && <span className="text-[10px] text-gray-400 font-mono">[{normalizeInfusion(skill.infusion)}]</span>}
                        {isTransformed && <span className="text-[10px] text-amber-400 font-mono">[TRANSFORMED]</span>}
                        {isDefense && <span className="text-[10px] text-emerald-400 font-mono">[EVASIVE]</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Base Stats + Gift Stats + Resistances */}
              <div>
                <SectionHeader title="Stats" subtitle="Base + Gifts" />
                <div className="grid grid-cols-3 gap-4 border border-gray-800 p-4 bg-gray-900">
                  <StatDisplay label="HP" value={stats.hp + giftStats.hp} color="#ff2a2a" />
                  <StatDisplay label="ATK" value={stats.atk + giftStats.atk} color="#ffaa00" />
                  <StatDisplay label="DEF" value={stats.def + giftStats.def} color="#60a5fa" />
                  <StatDisplay label="SPD" value={stats.spd + giftStats.spd} color="#00ff88" />
                  <StatDisplay label="Sanity" value={stats.sanity + (giftStats.sanity || 0)} color="#a855f7" />
                  <StatDisplay label="Clash Power" value={giftStats.clashPower || 0} color="#fcd34d" />
                </div>
              </div>

              {/* Resistances */}
              <div className="border border-gray-800 p-4 bg-gray-900">
                <SectionHeader title="Resistances (from Gifts)" subtitle="Reduces incoming damage of that type" />
                <div className="grid grid-cols-4 gap-4">
                  <StatDisplay label="Red" value={`${resistances.red}%`} color="#ef4444" />
                  <StatDisplay label="Pale" value={`${resistances.pale}%`} color="#d1d5db" />
                  <StatDisplay label="Black" value={`${resistances.black}%`} color="#4b5563" />
                  <StatDisplay label="White" value={`${resistances.white}%`} color="#60a5fa" />
                </div>
              </div>

              {/* Debuff Profile */}
              <div className="border border-gray-800 p-4 bg-gray-900">
                <SectionHeader title="Debuff Profile" subtitle="Applied to enemies" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-800 p-3 bg-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 text-center text-xs">💥</span>
                      <span className="text-xs font-bold text-white">{selectedIdentity.element}</span>
                    </div>
                    <p className="text-xs text-gray-400">{DAMAGE_DEBUFFS[selectedIdentity.element]?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{DAMAGE_DEBUFFS[selectedIdentity.element]?.effect || 'None'}</p>
                  </div>
                  <div className="border border-gray-800 p-3 bg-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 text-center text-xs">🗡️</span>
                      <span className="text-xs font-bold text-white">{normalizeInfusion(selectedIdentity.baseInfusion)}</span>
                    </div>
                    <p className="text-xs text-gray-400">{INFUSION_DEBUFFS[normalizeInfusion(selectedIdentity.baseInfusion)]?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{INFUSION_DEBUFFS[normalizeInfusion(selectedIdentity.baseInfusion)]?.effect || 'None'}</p>
                  </div>
                  {selectedIdentity.classes.map((classKey) => {
                    const info = CLASS_INFO[classKey];
                    const category = combatCategories[classKey];
                    const debuff = CLASS_DEBUFFS[category];
                    return (
                      <div key={classKey} className="border border-gray-800 p-3 bg-gray-800">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs">{info.icon}</span>
                          <span className="text-xs font-bold text-white">{info.name}</span>
                          <span className="text-[10px] text-gray-500">→ {category}</span>
                        </div>
                        <p className="text-xs text-gray-400">{debuff?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{debuff?.effect || 'None'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Level Up */}
              <div className="border border-gray-800 p-4 bg-gray-900">
                <SectionHeader title="Level Up" subtitle="Use Eclipse Essences" />
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1"><span>EXP {owned.exp} / {expForLevel(owned.level)}</span><span>{Math.min(100, (owned.exp / expForLevel(owned.level)) * 100).toFixed(1)}%</span></div>
                  <div className="h-2 border border-gray-700 bg-gray-800"><div className="h-full transition-all" style={{ width: `${Math.min(100, (owned.exp / expForLevel(owned.level)) * 100)}%`, background: '#22d3ee', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }} /></div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[{ label: 'S', exp: 100, owned: expSerum, value: serumS, set: setSerumS, key: 'expSerum' }, { label: 'M', exp: 500, owned: expSerumM, value: serumM, set: setSerumM, key: 'expSerumM' }, { label: 'L', exp: 2000, owned: expSerumL, value: serumL, set: setSerumL, key: 'expSerumL' }, { label: 'XL', exp: 10000, owned: expSerumXL, value: serumXL, set: setSerumXL, key: 'expSerumXL' }].map(s => (
                    <div key={s.label} className="border border-gray-800 p-2 bg-gray-800">
                      <div className="flex items-center justify-between mb-1"><ClickableMaterial materialKey={s.key} amount={s.owned} label={s.label} onClick={openMaterialModal} /><span className="text-[10px] text-gray-400 font-mono">×{s.owned}</span></div>
                      <p className="text-[10px] text-gray-400 mb-2">{s.exp.toLocaleString()} EXP</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => s.set(Math.max(0, s.value - 1))} className="w-6 h-6 border border-gray-600 text-xs text-gray-400 hover:text-white transition-colors">−</button>
                        <input type="number" min={0} max={s.owned} value={s.value} onChange={e => s.set(Math.min(s.owned, Math.max(0, parseInt(e.target.value) || 0)))} className="w-full text-center text-xs py-0.5 font-mono border border-gray-700 bg-gray-900 text-white" />
                        <button onClick={() => s.set(Math.min(s.owned, s.value + 1))} className="w-6 h-6 border border-gray-600 text-xs text-gray-400 hover:text-white transition-colors">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-gray-400">Total EXP: {(serumS * 100 + serumM * 500 + serumL * 2000 + serumXL * 10000).toLocaleString()}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setSerumS(0); setSerumM(0); setSerumL(0); setSerumXL(0); }} className="text-xs px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-white transition-colors">Clear</button>
                    <button onClick={() => { setSerumS(expSerum); setSerumM(expSerumM); setSerumL(expSerumL); setSerumXL(expSerumXL); }} disabled={owned.level >= selectedIdentity.levelCap} className="text-xs px-3 py-1.5 border border-gray-600 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">Use All</button>
                    <button onClick={() => { levelUpIdentityWithSerums(owned.identityId, { s: serumS, m: serumM, l: serumL, xl: serumXL }); setSerumS(0); setSerumM(0); setSerumL(0); setSerumXL(0); }} disabled={owned.level >= selectedIdentity.levelCap || (serumS + serumM + serumL + serumXL) === 0} className="btn-pgr-primary text-xs px-4 py-1.5 disabled:opacity-30 font-bold tracking-wider bg-cyan-500/20 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900">APPLY</button>
                  </div>
                </div>
              </div>

              {/* Rank Up */}
              {owned.rank < 8 && (
                <div className="border border-gray-800 p-4 bg-gray-900">
                  <SectionHeader title="Rank Up" subtitle="Consume Shards to increase rank" />
                  <div className="flex gap-1 mb-4">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(rank => {
                      const costs = selectedIdentity.rarity === 'SSR' ? selectedIdentity.rankUpgrades?.ssr : selectedIdentity.rankUpgrades?.sr;
                      const cost = costs?.[rank];
                      const isCurrent = owned.rank === rank;
                      const isComplete = owned.rank > rank;
                      const config = RARITY_CONFIG[selectedIdentity.rarity];
                      return <div key={rank} className="flex-1 border p-1.5 text-center" style={{ borderColor: isComplete ? config?.color : isCurrent ? config?.color : 'gray', background: isCurrent ? `${config?.color}15` : isComplete ? `${config?.color}08` : 'gray-800' }}>
                        <p className="text-[10px] font-mono font-bold" style={{ color: isCurrent ? config?.color : isComplete ? 'gray-400' : 'gray-400' }}>
                          {rarityLabel}{rank}
                        </p>
                        {cost && <p className="text-[8px] text-gray-400 font-mono">{cost}</p>}
                      </div>;
                    })}
                  </div>
                  {(() => {
                    const nextCost = getShardCostForNextRank(selectedIdentity, owned.rank);
                    const totalShards = owned.shards + (shardInventory[selectedIdentity.id] || 0);
                    return nextCost !== null ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-mono">Shards: {totalShards} / {nextCost} needed</span>
                        <button onClick={() => upgradeIdentity(owned.identityId)} disabled={totalShards < nextCost} className="btn-pgr-primary text-xs px-4 py-1.5 disabled:opacity-30 font-bold tracking-wider bg-cyan-500/20 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900">
                          RANK UP → {rarityLabel}{owned.rank + 1}
                        </button>
                      </div>
                    ) : <p className="text-xs text-gray-400 font-mono">MAX RANK REACHED</p>;
                  })()}
                </div>
              )}

              {/* Core Passive */}
              {selectedIdentity.corePassive && (
                <div className="border-l-4 p-4 border-purple-500 bg-gray-900">
                  <SectionHeader title="Core Passive" />
                  <p className="text-sm font-bold text-white mb-1">{selectedIdentity.corePassive.name}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{selectedIdentity.corePassive.description}</p>
                  <p className="text-xs text-purple-400 font-mono mt-2">{selectedIdentity.corePassive.effect}</p>
                </div>
              )}

              {/* Class Skill */}
              <div className="border border-gray-800 p-4 bg-gray-900">
                <SectionHeader title="Common Effect" />
                {(() => {
                  const classSkill = selectedIdentity.skills.find(s => s.type === 'class');
                  if (!classSkill) return null;
                  const classLvl = owned.classSkillLevel ?? 1;
                  const categories = getClassCategories(selectedIdentity.id);
                  const curPct = (classCategoryEffect(classLvl) * 100).toFixed(0);
                  const nextPct = classLvl < 20 ? (classCategoryEffect(classLvl + 1) * 100).toFixed(0) : null;
                  const effectLabelFor = (category: CombatCategory) => {
                    if (category === 'Attacker') return `Extra Damage Bonus: +${curPct}%`;
                    if (category === 'Tank') return `Damage Reduction Shred: ${curPct}%`;
                    if (category === 'Amplifier') return `On-damage Amplification: +${curPct}%`;
                    if (category === 'Support') return `Healing Amount Bonus: +${curPct}%`;
                    return '';
                  };
                  return (
                    <div className="border-l-2 pl-4 border-blue-400 space-y-3">
                      <div className="flex items-center gap-2"><span className="text-xs text-gray-400 font-mono">Lv.{classLvl}/20</span></div>
                      {categories.map((category) => (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-1"><span className="text-[10px] px-1.5 py-0.5 border border-gray-600 font-bold text-gray-400">{category.toUpperCase()}</span></div>
                          <p className="text-xs text-gray-400 mb-1">{CLASS_CATEGORY_INFO[category].description}</p>
                          <p className="text-xs text-green-400 font-mono font-bold">{effectLabelFor(category)}</p>
                        </div>
                      ))}
                      {classLvl < 20 ? (
                        <button onClick={() => levelUpClassSkill(owned.identityId)} disabled={lowTierMats < 8 || expSerum < 3} className="text-xs px-3 py-1.5 border border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 disabled:opacity-30 font-mono transition-all">Lv.UP → {nextPct}% (8 Dust + 3 Essence S)</button>
                      ) : <span className="text-xs text-amber-400 font-mono font-bold">MAX LEVEL</span>}
                    </div>
                  );
                })()}
              </div>

              {/* Leader Skill */}
              {(() => {
                const ls = leaderSkills[selectedIdentity.id];
                if (!ls) return null;
                return <div className="border border-gray-800 p-4 bg-gray-900"><SectionHeader title="Leader Skill" /><div className="border-l-2 pl-4 border-amber-400"><p className="text-sm font-bold text-white mb-1">{ls.name}</p><p className="text-xs text-gray-400 mb-2">{ls.description}</p><p className="text-xs text-amber-400 font-mono">{ls.buffEffect}</p></div></div>;
              })()}

              {/* Passives */}
              {selectedIdentity.passives.length > 0 && (
                <div className="border border-gray-800 p-4 bg-gray-900">
                  <SectionHeader title="Evolution Effects" />
                  <div className="space-y-3">
                    {selectedIdentity.passives.map((passive, i) => (
                      <div key={i} className="border-l-2 pl-4" style={{ borderColor: owned.rank >= passive.rankRequired ? '#a855f7' : 'gray', opacity: owned.rank >= passive.rankRequired ? 1 : 0.5 }}>
                        <div className="flex items-center gap-2 mb-1"><span className="text-[10px] text-purple-400 font-mono font-bold">{rarityLabel}{passive.rankRequired}</span><span className="text-xs font-bold text-white">{passive.name}</span>{owned.rank < passive.rankRequired && <span className="text-[10px] text-gray-400">(LOCKED)</span>}</div>
                        <p className="text-xs text-gray-400">{passive.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rank Buffs */}
              <div className="border border-gray-800 p-4 bg-gray-900">
                <SectionHeader title="Rank Buffs" />
                <div className="space-y-2">
                  {(() => {
                    const egoSkill = selectedIdentity.skills.find(s => s.type === 'ego');
                    const n1Skill = selectedIdentity.skills.find(s => s.type === 'normal1');
                    const n2Skill = selectedIdentity.skills.find(s => s.type === 'normal2');
                    const egoName = egoSkill?.name || 'Ego';
                    const n1Name = n1Skill?.name || 'N1';
                    const n2Name = n2Skill?.name || 'N2';
                    const rar = selectedIdentity.rarity;
                    const buffs = rar === 'SSR' ? [{ rank: 5, name: n1Name, type: 'NORMAL', val: '+15%' }, { rank: 6, name: n2Name, type: 'NORMAL', val: '+20%' }, { rank: 7, name: egoName, type: 'EGO', val: '+25%' }, { rank: 8, name: egoName, type: 'EGO', val: '+40%' }] : [{ rank: 6, name: n1Name, type: 'NORMAL', val: '+12%' }, { rank: 7, name: egoName, type: 'EGO', val: '+12%' }, { rank: 8, name: egoName, type: 'EGO', val: '+20%' }];
                    return buffs.map(b => {
                      const unlocked = owned.rank >= b.rank;
                      return <div key={b.rank} className="flex items-center justify-between py-2 border-b border-gray-800" style={{ opacity: unlocked ? 1 : 0.4 }}>
                        <div className="flex items-center gap-3"><span className="text-xs font-mono font-bold text-white w-8">{rarityLabel}{b.rank}</span><span className="text-[10px] px-1.5 py-0.5 border" style={{ borderColor: b.type === 'EGO' ? 'rgba(244,63,94,0.3)' : 'gray', color: b.type === 'EGO' ? '#f43f5e' : 'gray-400' }}>{b.type}</span><span className="text-xs text-white">{b.name}</span></div>
                        <span className="text-xs font-mono text-amber-400 font-bold">{b.val}</span>
                      </div>;
                    });
                  })()}
                </div>
              </div>

              {/* Shard Recycle */}
              {(() => {
                const maxRank = 8;
                if (owned.rank < maxRank) return null;
                const totalShards = owned.shards + (shardInventory[selectedIdentity.id] || 0);
                if (totalShards <= 0) return null;
                const isSSR = selectedIdentity.rarity === 'SSR';
                const recycleRate = isSSR ? 3 : 1;
                return <div className="border border-amber-500/20 p-4 bg-gray-900">
                  <SectionHeader title="Shard Recycle" />
                  <p className="text-xs text-gray-400 mb-3">Max rank reached. Recycle excess shards → {isSSR ? 'SSR' : 'SR'} Manifest Shards (×{recycleRate})</p>
                  <div className="flex items-center gap-3">
                    <input type="number" min={1} max={totalShards} value={recycleAmount} onChange={e => setRecycleAmount(Math.max(1, Math.min(totalShards, parseInt(e.target.value) || 1)))} className="w-20 border border-gray-700 px-2 py-1 text-center text-xs font-mono bg-gray-800 text-white" />
                    <button onClick={() => { recycleShards(selectedIdentity.id, recycleAmount); setRecycleAmount(1); }} className="text-xs px-4 py-1.5 font-bold tracking-wider bg-amber-500/20 border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-gray-900">RECYCLE</button>
                    <button onClick={() => setRecycleAmount(totalShards)} className="text-xs text-gray-400 hover:text-amber-400">Max</button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-mono">Receive: {recycleAmount * recycleRate} {isSSR ? 'SSR' : 'SR'} Shards</p>
                </div>;
              })()}
            </div>
          )}

          {/* ═══ SKILLS TAB ═══ */}
          {activeTab === 'skills' && (
            <div className="space-y-6 max-w-3xl">
              <div className="border border-gray-800 p-4 bg-gray-900">
                <SectionHeader title="Basic Skills" />
                {(() => {
                  const upgradableTypes = ['normal1', 'normal2', 'normal3', 'ego'];
                  const upgradableSkills = selectedIdentity.skills.filter(s => upgradableTypes.includes(s.type));
                  return upgradableSkills.map((skill, i) => {
                    const realIndex = selectedIdentity.skills.indexOf(skill);
                    const skillLvl = owned.skillLevels[realIndex] ?? 1;
                    const currentPower = skill.basePower + skill.powerGrowth * (skillLvl - 1);
                    const currentCoins = skill.coinGrowth > 0 ? skill.baseCoins + Math.floor((skillLvl - 1) / skill.coinGrowth) : skill.baseCoins;
                    const isEgo = skill.type === 'ego';
                    return <SkillRow key={i} name={skill.name} type={isEgo ? 'EGO' : 'NORMAL'} level={skillLvl} maxLevel={15} description={skill.description} power={currentPower} coins={currentCoins} dmgBonus={`+${((skillLvl - 1) * 0.05).toFixed(2)}%`} damageType={skill.damageType} onLevelUp={() => levelUpSkill(owned.identityId, realIndex)} canLevelUp={skillLvl < 15 && lowTierMats >= 5 && expSerum >= 2} cost={<>5 Dust + 2 Essence S</>} isEgo={isEgo} />;
                  });
                })()}
              </div>

              {/* Core Passive Skill */}
              {selectedIdentity.corePassive && (
                <div className="border border-purple-500/20 p-4 bg-gray-900">
                  <SectionHeader title="Core Passive" subtitle="Upgradeable" />
                  <SkillRow
                    name={selectedIdentity.corePassive.name}
                    type="PASSIVE"
                    level={owned.corePassiveLevel ?? 1}
                    maxLevel={10}
                    description={selectedIdentity.corePassive.description}
                    power={0}
                    coins={0}
                    dmgBonus={`+${((owned.corePassiveLevel ?? 1) - 1) * 5}%`}
                    onLevelUp={() => levelUpCorePassive(owned.identityId)}
                    canLevelUp={(owned.corePassiveLevel ?? 1) < 10 && lowTierMats >= 5 && expSerum >= 2}
                    cost={<>5 Dust + 2 Essence S</>}
                    isEgo={false}
                  />
                </div>
              )}

              {/* Defense Skill */}
              {(() => {
                const defenseSkill = selectedIdentity.skills.find(s => s.type === 'defense');
                if (!defenseSkill) return null;
                return (
                  <div className="border border-emerald-500/20 p-4 bg-gray-900">
                    <SectionHeader title="Defense Skill" subtitle="Evasive" />
                    <SkillRow
                      name={defenseSkill.name}
                      type="DEFENSE"
                      level={owned.defenseLevel ?? 1}
                      maxLevel={10}
                      description={defenseSkill.description}
                      power={0}
                      coins={0}
                      dmgBonus={`+${((owned.defenseLevel ?? 1) - 1) * 3}% Evasion`}
                      onLevelUp={() => levelUpDefense(owned.identityId)}
                      canLevelUp={(owned.defenseLevel ?? 1) < 10 && lowTierMats >= 5 && expSerum >= 2}
                      cost={<>5 Dust + 2 Essence S</>}
                      isEgo={false}
                    />
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <button onClick={() => { let safety = 10000; while (safety-- > 0) { const s = useGameStore.getState(); const o = s.ownedIdentities?.find(x => x.identityId === owned.identityId); if (!o) break; if (s.lowTierMats < 5 || s.expSerum < 2) break; const idx = o.skillLevels.findIndex(lv => lv < 15); if (idx === -1) break; levelUpSkill(owned.identityId, idx); } }} disabled={lowTierMats < 5 || expSerum < 2} className="btn-pgr-primary text-xs px-4 py-2 disabled:opacity-30 font-bold tracking-wider bg-cyan-500/20 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900">UPGRADE ALL SKILLS</button>
              </div>
            </div>
          )}

          {/* ═══ EQUIPMENT TAB ═══ */}
          {activeTab === 'equipment' && (
            <div className="space-y-6 max-w-3xl">
              <div className="border border-gray-800 p-4 bg-gray-900">
                <SectionHeader title="Equipped Weapon" />
                {owned?.equippedWeaponId ? (
                  (() => {
                    const equipped = weapons.find(w => w.id === owned.equippedWeaponId);
                    if (!equipped) return null;
                    const ownedWeapon = ownedWeapons.find(ow => ow.weaponId === equipped.id);
                    const isSignatureSSR = equipped.signatureFor === selectedIdentity.id && equipped.rarity === 'SSR';
                    const isHarmonizedFlag = isHarmonized(selectedIdentity.id, equipped.id);
                    const config = RARITY_CONFIG[equipped.rarity];
                    return <div className="flex gap-4">
                      <div className="w-20 h-20 border-2 flex items-center justify-center shrink-0 relative bg-gray-800" style={{ borderColor: config?.color }}><span className="text-3xl">{equipped.icon}</span>{isSignatureSSR && <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-green-400"><span className="text-[8px] text-gray-900 font-bold">SIG</span></div>}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><span className="text-[10px] px-1.5 py-0.5 font-bold text-white" style={{ background: config?.color }}>{config?.label}</span><span className="text-sm font-bold text-white">{equipped.name}</span><span className="text-xs text-gray-400 font-mono">Lv.{ownedWeapon?.level || 1}</span></div>
                        <p className="text-xs text-gray-400 mb-2">{equipped.description}</p>
                        {equipped.passive && <div className="border p-2" style={{ borderColor: isSignatureSSR && isHarmonizedFlag ? 'rgba(255,170,0,0.2)' : 'gray', background: isSignatureSSR && isHarmonizedFlag ? 'rgba(255,170,0,0.05)' : 'gray-800' }}>
                          <p className="text-[10px] font-bold text-white mb-1">PASSIVE</p>
                          <p className="text-xs text-gray-400">{equipped.passive?.name}</p>
                          <p className="text-xs text-gray-300">{equipped.passive?.description}</p>
                          {isSignatureSSR && <div className="mt-2 flex items-center gap-2">{isHarmonizedFlag ? <span className="text-[10px] text-green-400 font-bold">✓ HARMONIZED — PASSIVE ACTIVE</span> : <><span className="text-[10px] text-gray-400">⚠ Requires Harmonization</span><button onClick={() => harmonizeWeapon(selectedIdentity.id, equipped.id)} disabled={harmonizationSigils < 25} className="text-[10px] px-2 py-0.5 border border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 disabled:opacity-30 transition-colors">Harmonize (25 Sigils)</button></>}</div>}
                        </div>}
                      </div>
                    </div>;
                  })()
                ) : <p className="text-xs text-gray-400">No weapon equipped.</p>}
                <div className="mt-4 border-t border-gray-800 pt-4">
                  <button onClick={() => setShowWeaponSelect(!showWeaponSelect)} className="text-xs font-bold text-white hover:text-cyan-400 tracking-wider transition-colors">{showWeaponSelect ? '▲ HIDE WEAPONS' : '▼ CHANGE WEAPON'}</button>
                  {showWeaponSelect && <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ownedCompatibleWeapons.length === 0 ? <p className="text-xs text-gray-400 col-span-full">No compatible weapons owned.</p> : ownedCompatibleWeapons.map(w => {
                      const ownedWeapon = ownedWeapons.find(ow => ow.weaponId === w.id);
                      const isEquipped = ownedWeapon && owned.equippedWeaponId === w.id;
                      const isSignatureSSR = w.signatureFor === selectedIdentity.id && w.rarity === 'SSR';
                      const isHarmonizedFlag = isHarmonized(selectedIdentity.id, w.id);
                      const config = RARITY_CONFIG[w.rarity];
                      return <button key={w.id} onClick={() => setEquippedWeapon(selectedIdentity.id, w.id)} className="border p-2 text-left transition-all" style={{ borderColor: isEquipped ? config?.color : 'gray', background: isEquipped ? `${config?.color}08` : 'gray-800' }}>
                        <div className="flex items-center gap-2"><span className="text-xl">{w.icon}</span><div className="flex-1 min-w-0"><p className="text-xs font-bold text-white truncate">{w.name}</p><div className="flex items-center gap-1"><span className="text-[8px] px-1 text-white font-bold" style={{ background: config?.color }}>{config?.label}</span><span className="text-[10px] text-gray-400 font-mono">Lv.{ownedWeapon?.level || 1}</span></div>{isSignatureSSR && <div className="mt-1">{isHarmonizedFlag ? <span className="text-[8px] text-green-400 font-bold">HARMONIZED</span> : <button onClick={(e) => { e.stopPropagation(); harmonizeWeapon(selectedIdentity.id, w.id); }} disabled={harmonizationSigils < 25} className="text-[8px] px-1.5 py-0.5 border border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400 disabled:opacity-30 transition-colors">Harmonize</button>}</div>}</div>{isEquipped && <span className="text-green-400 text-xs">✓</span>}</div>
                      </button>;
                    })}
                  </div>}
                </div>
              </div>
              <div className="border border-gray-800 p-4 bg-gray-900">
                <div className="flex items-center justify-between"><span className="text-xs text-gray-400 font-mono">Harmonization Sigils</span><div className="flex items-center gap-2"><span className="text-sm font-bold font-mono text-white">{harmonizationSigils}</span></div></div>
              </div>
            </div>
          )}

          {/* ═══ GIFTS TAB (15 slots) ═══ */}
          {activeTab === 'gifts' && (
            <div className="space-y-6 max-w-4xl">
              {/* ─── 15 Gift Slots ─────────────────────────────────────── */}
              <div className="border border-gray-800 p-4 bg-gray-900">
                <SectionHeader title="Sigil Relics" subtitle="15 slots • Mix and match sets" />

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {EGO_GIFT_SLOTS.map(slotDef => {
                    const slot = equippedGifts.find(g => g.slot === slotDef.id);
                    const gift = slot?.giftId ? egoGifts.find(g => g.id === slot.giftId) : null;
                    const res = giftResonance[slotDef.id] || { slot1: null, slot2: null };
                    const htLevel = giftHypertune[slotDef.id] || 0;
                    const isMaxLevel = slot?.level >= 25;
                    const isSetSlot = slotDef.type === 'set';
                    const isBuffSlot = slotDef.type === 'buff';

                    return (
                      <div key={slotDef.id} className="border p-3 bg-gray-800 flex flex-col items-center min-h-[220px] relative">
                        {/* Slot Label */}
                        <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mb-1">
                          {slotDef.name}
                          {isBuffSlot && <span className="ml-1 text-amber-400">(Buff)</span>}
                        </div>

                        {gift ? (
                          <>
                            {/* ─── Gift Equipped ────────────────────── */}
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-3xl bg-gray-700/50">
                              {gift.icon || '🔮'}
                            </div>
                            <p className="text-xs font-bold text-white text-center truncate w-full mt-1">{gift.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">Lv.{slot!.level}/25</p>

                            {/* Exp Bar */}
                            <div className="w-full h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-purple-500 transition-all" style={{ width: `${(slot!.exp / expForLevel(slot!.level)) * 100}%` }} />
                            </div>

                            {/* ─── Resonance (only if gift equipped) ── */}
                            <div className="flex gap-1 mt-1">
                              {[1, 2].map(idx => {
                                const key = idx === 1 ? 'slot1' : 'slot2';
                                const current = res[key as keyof typeof res];
                                return current ? (
                                  <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">{current}</span>
                                ) : (
                                  <select
                                    key={idx}
                                    onChange={(e) => resonateGift(slotDef.id, idx as 1 | 2, e.target.value as 'ATK' | 'HP' | 'DEF' | 'SPD')}
                                    className="text-[9px] border border-gray-600 rounded px-1 py-0.5 w-12 bg-gray-800 text-white"
                                    value=""
                                    disabled={eclipseResonanceMaterials < 1}
                                  >
                                    <option value="">—</option>
                                    <option value="ATK">ATK</option>
                                    <option value="HP">HP</option>
                                    <option value="DEF">DEF</option>
                                    <option value="SPD">SPD</option>
                                  </select>
                                );
                              })}
                            </div>

                            {/* Hypertune Level */}
                            <div className="text-[10px] text-amber-400 font-mono mt-0.5">Sync Lv.{htLevel}/5</div>

                            {/* Actions */}
                            <div className="mt-2 w-full space-y-1">
                              <button
                                onClick={() => levelUpGift(slotDef.id)}
                                disabled={threads < 100 || isMaxLevel}
                                className="w-full text-xs py-1 border border-purple-500/30 rounded hover:bg-purple-500 hover:text-white disabled:opacity-30 transition-colors text-purple-400"
                              >
                                +EXP (100 Threads)
                              </button>
                              <button
                                onClick={() => upgradeGiftToMax(slotDef.id)}
                                disabled={threads < 100 || isMaxLevel}
                                className="w-full text-xs py-1 border border-amber-500/30 rounded hover:bg-amber-500 hover:text-gray-900 disabled:opacity-30 transition-colors text-amber-400"
                              >
                                MAX LV
                              </button>
                              <button
                                onClick={() => syncGift(slotDef.id)}
                                disabled={syncEnhancementMats < 750 || syncSerumMats < 150}
                                className="w-full text-xs py-1 border border-cyan-500/30 rounded hover:bg-cyan-500 hover:text-gray-900 disabled:opacity-30 transition-colors text-cyan-400"
                              >
                                Sync
                              </button>
                              {htLevel < 5 && (
                                <button
                                  onClick={() => hypertuneGift(slotDef.id)}
                                  disabled={threads < (HYPERTUNE_LEVELS[htLevel + 1]?.cost || 0)}
                                  className="w-full text-xs py-1 border border-amber-500/30 rounded hover:bg-amber-400 hover:text-gray-900 disabled:opacity-30 transition-colors text-amber-400"
                                >
                                  +Sync ({HYPERTUNE_LEVELS[htLevel + 1]?.cost || 0} Threads)
                                </button>
                              )}
                              <button
                                onClick={() => equipOwnedGift('', slotDef.id)}
                                className="w-full text-xs py-1 border border-red-500/30 rounded hover:bg-red-500 hover:text-white transition-colors text-red-400"
                              >
                                Unequip
                              </button>
                            </div>
                          </>
                        ) : (
                          // ─── Empty Slot – Shows "+" ──────────────
                          <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
                            <span className="text-4xl opacity-30">+</span>
                            <span className="text-[10px] mt-1 text-gray-600">Empty</span>
                            <span className="text-[8px] text-gray-600">{isSetSlot ? 'Set Slot' : 'Buff Slot'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ─── Active Set Bonuses ────────────────────────────── */}
                <div className="mt-6 border border-amber-500/20 p-3 bg-amber-500/5">
                  <p className="text-[10px] font-bold text-amber-400 mb-2 tracking-wider uppercase">Active Set Bonuses</p>
                  {(() => {
                    const activeBonuses = getActiveSetBonuses();
                    const active = activeBonuses.filter(b => b.isActive);
                    if (active.length === 0) {
                      return <p className="text-xs text-gray-400">No set bonuses active. Equip 2+ gifts from the same set.</p>;
                    }
                    return active.map((b, i) => (
                      <div key={i} className="text-xs mb-1 text-white">
                        <span className="font-bold text-amber-400">{b.setName}</span>
                        <span className="text-gray-400"> ({b.pieces}-pc)</span>
                        <span className="text-green-400 ml-2">✓</span>
                        <span className="ml-2 text-gray-300">{b.description}</span>
                      </div>
                    ));
                  })()}
                  <p className="text-[10px] text-gray-400 mt-2">⚡ 4pc & 6pc bonuses require Harmonization (signature weapon).</p>
                </div>

                {/* ─── Resonance System ───────────────────────────────── */}
                {hasAnyGift && (
                  <div className="mt-6 border border-gray-700 p-3 bg-gray-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">Resonance System</p>
                      <p className="text-[10px] text-gray-400 font-mono">E.G.O Manifest Essence: {egoManifestEssence}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-2">Click any resonance slot below to assign/change resonance type (costs 1 Essence).</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {resonance.slots.slice(0, UPPER_RESONANCE_SLOTS).map((slot, idx) => (
                        <ResonanceSlot key={idx} slot={slot} index={idx} onClick={() => handleResonanceSlotClick(idx)} onHypertune={() => handleHypertune(idx)} />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                      {resonance.slots.slice(UPPER_RESONANCE_SLOTS).map((slot, idx) => {
                        const realIdx = idx + UPPER_RESONANCE_SLOTS;
                        return <ResonanceSlot key={realIdx} slot={slot} index={realIdx} onClick={() => handleResonanceSlotClick(realIdx)} onHypertune={() => handleHypertune(realIdx)} />;
                      })}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2">
                      Total: HP+{getTotalResonanceStats().hp} ATK+{getTotalResonanceStats().atk} DEF+{getTotalResonanceStats().def} SPD+{getTotalResonanceStats().spd} CRIT+{getTotalResonanceStats().crit} Clash+{getTotalResonanceStats().clashPower}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Owned Gifts Inventory ────────────────────────────── */}
              <div className="border border-gray-800 p-4 bg-gray-900">
                <button
                  onClick={() => setShowGiftSelect(!showGiftSelect)}
                  className="text-xs font-bold text-white hover:text-cyan-400 tracking-wider mb-3 transition-colors"
                >
                  {showGiftSelect ? '▲ HIDE OWNED RELICS' : '▼ SHOW OWNED RELICS'}
                </button>
                {showGiftSelect && (
                  <>
                    <p className="text-[10px] text-gray-400 mb-2 italic">Click a relic to equip it to an empty slot.</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {ownedGifts.length === 0 ? (
                        <p className="text-xs text-gray-400 col-span-full">No relics owned.</p>
                      ) : (
                        ownedGifts.map(id => {
                          const gift = egoGifts.find(g => g.id === id);
                          if (!gift) return null;
                          const isEquipped = equippedGifts.some(g => g.giftId === id);
                          const targetSlot = equippedGifts.find(g => g.slot === gift.slot);
                          const canEquip = !targetSlot?.giftId;
                          return (
                            <button
                              key={id}
                              onClick={() => {
                                if (canEquip) equipOwnedGift(id);
                                else alert(`Slot ${gift.slot} is already occupied!`);
                              }}
                              className={`border p-2 text-left transition-all ${isEquipped ? 'border-purple-500/40 bg-purple-500/10' : 'border-gray-700 bg-gray-800 hover:border-cyan-400/40'} ${!canEquip ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={!canEquip}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{gift.icon || '🔮'}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold text-white truncate">{gift.name}</p>
                                  <p className="text-[8px] text-gray-400 font-mono">{gift.set || 'No Set'}</p>
                                  <p className="text-[8px] text-gray-500 font-mono">Slot: {gift.slot}</p>
                                </div>
                                {isEquipped && <span className="text-[10px] text-purple-400">✓</span>}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* ─── Material Counters ────────────────────────────────── */}
              <div className="border border-gray-800 p-4 bg-gray-900">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🧵</span>
                    <div>
                      <p className="text-[10px] text-gray-400 font-mono">Threads</p>
                      <p className="text-sm font-bold font-mono text-white">{threads}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">✨</span>
                    <div>
                      <p className="text-[10px] text-gray-400 font-mono">Resonance Mats</p>
                      <p className="text-sm font-bold font-mono text-white">{eclipseResonanceMaterials}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🔧</span>
                    <div>
                      <p className="text-[10px] text-gray-400 font-mono">Sync Enhancement</p>
                      <p className="text-sm font-bold font-mono text-white">{syncEnhancementMats}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💧</span>
                    <div>
                      <p className="text-[10px] text-gray-400 font-mono">Sync Serum</p>
                      <p className="text-sm font-bold font-mono text-white">{syncSerumMats}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Resonance Picker Modal ─── */}
      {showResonancePicker && selectedSlot !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c1020] border border-[#00d4ff]/30 p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">Select Resonance for Slot {selectedSlot + 1}{resonance.slots[selectedSlot].type !== null && <span className="text-xs text-gray-400 ml-2">(Changing will cost 1 Essence)</span>}</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 border border-[#1a2332] rounded hover:border-[#00d4ff]/30 transition-colors text-[#8b9bb4] hover:text-white" onClick={() => handleResonanceSelect(null)}>❌ Clear Slot</button>
              {availableTypes(selectedSlot).map((type) => {
                const stats = RESONANCE_TYPES[type].stats;
                const special = { ego_skill_level: 'E.G.O Skill Level +1', core_passive_level: 'Core Passive +1', class_skill_level: 'Class Skill +1' }[type];
                const label = RESONANCE_TYPES[type].label;
                let description = special || '';
                if (!description) {
                  const parts = [];
                  if (stats.hp) parts.push(`HP +${stats.hp}`);
                  if (stats.atk) parts.push(`ATK +${stats.atk}`);
                  if (stats.def) parts.push(`DEF +${stats.def}`);
                  if (stats.spd) parts.push(`SPD +${stats.spd}`);
                  if (stats.crit) parts.push(`CRIT +${stats.crit}`);
                  if (stats.clashPower) parts.push(`Clash Power +${stats.clashPower}`);
                  description = parts.join(', ');
                }
                return <button key={type} className="w-full text-left px-3 py-2 border border-[#1a2332] rounded hover:border-[#00d4ff]/30 transition-colors" onClick={() => handleResonanceSelect(type)}><div className="font-semibold text-white">{label}</div><div className="text-xs text-[#8b9bb4]">{description}</div></button>;
              })}
            </div>
            <button className="mt-4 w-full py-2 border border-pgr-border rounded text-[#8b9bb4] hover:bg-[#1a2332] transition-colors" onClick={() => { setShowResonancePicker(false); setSelectedSlot(null); }}>Cancel</button>
          </div>
        </div>
      )}

      <MaterialDetailModal isOpen={materialModalOpen} onClose={closeMaterialModal} materialKey={selectedMaterialKey!} amount={selectedMaterialAmount} />
    </div>
  );
}

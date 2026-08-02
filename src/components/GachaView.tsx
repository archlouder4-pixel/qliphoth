// GachaView.tsx – PGR R&D-style UI with vertical beam and sequential card reveal
// - REMOVED: MaterialIcon (to avoid "not defined" error)
// - Replaced with plain text/emoji fallbacks

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import useGameStore, {
  type BannerType,
  type GachaResult,
  type PullHistoryEntry,
  IDENTITY_MATERIAL_RATES,
  WEAPON_MATERIAL_RATES,
} from '../store/gameStore';
import { identities } from '../data/identities';
import { weapons } from '../data/weapons';
import { useAuth } from '../auth/AuthContext';

// ── Featured characters ──
const featuredIdentities = identities.filter(i =>
  ['doran_warden', 'gwendolyn_anvil', 'mira_shepherd'].includes(i.id)
);
const rerunIdentities = identities.filter(i =>
  ['verg_dark_slayer', 'rin_devil_hunter'].includes(i.id)
);
const featuredWeapons = weapons.filter(w =>
  ['iron_verdict', 'bulwark_oaths', 'chime_tranquility'].includes(w.id)
);
const rerunWeapons = weapons.filter(w =>
  ['yamato', 'rebellion'].includes(w.id)
);

// ── Banner display info ──
const bannerInfo: Record<BannerType, {
  title: string;
  description: string;
  color: string;
  bgGradient: string;
}> = {
  standard: {
    title: 'GENESIS EXTRACTION',
    description: 'Use Basic Manifest Tickets to pull. Genesis (SR) guaranteed every 10 pulls. Ascension-Threat (SSR) drops are random from the full pool (excluding Chaos Lord). Hard pity at 60 (0.5% base).',
    color: 'from-blue-600 to-blue-400',
    bgGradient: 'from-blue-950/30 to-blue-900/10',
  },
  featured: {
    title: 'ASCENSION-THREAT EXTRACTION',
    description: 'Currently featuring: Doran, Gwendolyn, and Mira! Select your target below. When you hit SSR, it is guaranteed to be one of the featured characters. Hard pity at 60 pulls (base 0.5%).',
    color: 'from-cyan-600 to-cyan-400',
    bgGradient: 'from-cyan-950/30 to-cyan-900/10',
  },
  fate: {
    title: 'ASCENSION-THREAT DESTINY EXTRACTION',
    description: 'Featured Ascension-Threat (SSR): Doran, Gwendolyn, Mira. Select your target below. Base 1.5% (1.9% combined chance including guarantee). Floating guarantee between 80 and 100 pulls.',
    color: 'from-rose-600 to-rose-400',
    bgGradient: 'from-rose-950/30 to-rose-900/10',
  },
  weapon: {
    title: 'QLIPHOTH ARSENAL EXTRACTION',
    description: 'Select a signature weapon to target. SSR total 5% (4% target, 1% off‑target). SR total 13.5% (12% UP, 1.5% other). Hard pity at 40 pulls. 80/20 split with calibration.',
    color: 'from-emerald-600 to-emerald-400',
    bgGradient: 'from-emerald-950/30 to-emerald-900/10',
  },
  rerun: {
    title: 'RERUN EXTRACTION',
    description: 'Featuring Verg and Rin! Select your target below. When you hit an SSR, there is a 70% chance it will be one of the featured characters. If you miss your target, calibration activates and your next SSR is guaranteed to be your target. Hard pity at 60 pulls (base 0.5%). SR guaranteed every 10 pulls.',
    color: 'from-amber-600 to-amber-400',
    bgGradient: 'from-amber-950/30 to-amber-900/10',
  },
  rerun_weapon: {
    title: 'RERUN ARSENAL EXTRACTION',
    description: 'Select a signature weapon to target. SSR total 5% (4% target, 1% off‑target). SR total 13.5% (12% UP, 1.5% other). Hard pity at 40 pulls. 80/20 split with calibration.',
    color: 'from-fuchsia-600 to-fuchsia-400',
    bgGradient: 'from-fuchsia-950/30 to-fuchsia-900/10',
  },
  rerun_fate: {
    title: 'ECHO - DESTINY EXTRACTION',
    description: 'Featuring Verg and Rin! Select your target below. Base 1.5% (1.9% combined chance including guarantee). Floating guarantee between 80 and 100 pulls. If you miss your target, calibration activates and your next SSR is guaranteed to be your target.',
    color: 'from-orange-600 to-orange-400',
    bgGradient: 'from-orange-950/30 to-orange-900/10',
  },
};

// ── Tab grouping ──
type BannerTab = 'featured' | 'rerun' | 'weapon' | 'standard';
const tabBanners: Record<BannerTab, BannerType[]> = {
  featured: ['featured', 'fate'],
  rerun: ['rerun', 'rerun_fate'],
  weapon: ['weapon', 'rerun_weapon'],
  standard: ['standard'],
};
const tabLabels: Record<BannerTab, string> = {
  featured: 'Qliphoth Ascension',
  rerun: 'Qliphoth Echo',
  weapon: 'Qliphoth Arsenal',
  standard: 'Qliphoth Genesis',
};
const tabOrder: BannerTab[] = ['featured', 'rerun', 'weapon', 'standard'];

// ── Sidebar nav metadata ──
const tabMeta: Record<BannerTab, { icon: string; badge: string; badgeColor: string }> = {
  featured: { icon: '◈', badge: 'Featured', badgeColor: 'text-cyan-400 border-cyan-400/40' },
  rerun: { icon: '◆', badge: 'Limited', badgeColor: 'text-amber-400 border-amber-400/40' },
  weapon: { icon: '⬡', badge: 'Weapon', badgeColor: 'text-emerald-400 border-emerald-400/40' },
  standard: { icon: '◇', badge: 'Standard', badgeColor: 'text-gray-400 border-gray-500/40' },
};

const subBannerLabel: Record<BannerType, string> = {
  standard: 'Genesis',
  featured: 'Ascension',
  fate: 'Destiny',
  weapon: 'Arsenal',
  rerun: 'Echo',
  rerun_weapon: 'Echo – Armament',
  rerun_fate: 'Echo – Destiny',
};

// ─── Background Environment ──────────────────────────────────────────────
const BackgroundEnvironment = React.memo(() => {
  const stars = useMemo(() =>
    Array.from({ length: 200 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 5,
      opacity: 0.2 + Math.random() * 0.6,
    })), []
  );

  const particles = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 6,
      delay: Math.random() * 6,
      duration: 25 + Math.random() * 30,
      tx: (Math.random() - 0.5) * 40,
      ty: (Math.random() - 0.5) * 40,
      color: `hsl(${200 + Math.random() * 60}, 70%, 60%)`,
    })), []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-blue-900/30 animate-pulse-glow" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent animate-spin-slow" style={{ animationDuration: '40s' }} />
      <div className="absolute inset-0">
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              width: star.size + 'px',
              height: star.size + 'px',
              left: star.x + '%',
              top: star.y + '%',
              animationDelay: star.delay + 's',
              animationDuration: star.duration + 's',
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full animate-float-particle"
            style={{
              width: p.size + 'px',
              height: p.size + 'px',
              left: p.x + '%',
              top: p.y + '%',
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              animationDelay: p.delay + 's',
              animationDuration: p.duration + 's',
              '--tx': p.tx + '%',
              '--ty': p.ty + '%',
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
});
BackgroundEnvironment.displayName = 'BackgroundEnvironment';

// ─── Admin Panel ──────────────────────────────────────────────────────────
function AdminPanel({ isOpen, onClose, toast, setToast }: {
  isOpen: boolean;
  onClose: () => void;
  toast: string | null;
  setToast: (msg: string | null) => void;
}) {
  const {
    addEnkephalin,
    addBasicManifestTickets,
    addEventManifestTickets,
    addTargetArsenalTickets,
    addThreads,
    addManagerExp,
    addExpSerum,
    addExpSerumM,
    addExpSerumL,
    addExpSerumXL,
    addWeaponParts,
    addLowTierMats,
    addSyncEnhancement,
    addSyncSerum,
    adminGiveSSRShards,
    adminGiveSRShards,
    adminGiveRandomSigWeapon,
    adminGiveRandomSSR,
    adminMaxAllCharacters,
  } = useGameStore();

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-xl border border-amber-500/30 bg-gray-900/95 shadow-2xl p-6">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-xl font-mono font-bold text-amber-400 mb-4">⚙️ ADMIN PANEL</h2>
        {toast && <div className="mb-4 rounded border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs text-emerald-300">{toast}</div>}

        <div className="space-y-4">
          <div>
            <p className="text-xs font-mono text-pgr-dim font-semibold uppercase tracking-wider mb-2">Currencies & EXP</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button onClick={() => { addEnkephalin(1750); showToast('+1,750 Eclipse Energy'); }} className="rounded border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-400 hover:bg-yellow-500 hover:text-pgr-dark transition-all">+1,750 ⚡</button>
              <button onClick={() => { addBasicManifestTickets(1750); showToast('+1,750 Basic Tickets'); }} className="rounded border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-xs text-blue-400 hover:bg-blue-500 hover:text-pgr-dark transition-all">+1,750 🎟️</button>
              <button onClick={() => { addEventManifestTickets(1750); showToast('+1,750 Event Tickets'); }} className="rounded border border-violet-500/30 bg-violet-500/5 px-3 py-2 text-xs text-violet-400 hover:bg-violet-500 hover:text-pgr-dark transition-all">+1,750 🎫</button>
              <button onClick={() => { addTargetArsenalTickets(1750); showToast('+1,750 Arsenal Tickets'); }} className="rounded border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500 hover:text-pgr-dark transition-all">+1,750 🎯</button>
              <button onClick={() => { addThreads(1750); showToast('+1,750 Sigil Strands'); }} className="rounded border border-purple-500/30 bg-purple-500/5 px-3 py-2 text-xs text-purple-400 hover:bg-purple-500 hover:text-pgr-dark transition-all">+1,750 🧵</button>
              <button onClick={() => { addManagerExp(1000); showToast('+1,000 Manager EXP'); }} className="rounded border border-violet-500/30 bg-violet-500/5 px-3 py-2 text-xs text-violet-400 hover:bg-violet-500 hover:text-pgr-dark transition-all">+1,000 🌟</button>
            </div>
          </div>

          <div>
            <p className="text-xs font-mono text-pgr-dim font-semibold uppercase tracking-wider mb-2">Leveling Materials</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button onClick={() => { addExpSerum(100); showToast('+100 Essence S'); }} className="rounded border border-green-500/30 bg-green-500/5 px-3 py-2 text-xs text-green-400 hover:bg-green-500 hover:text-pgr-dark transition-all">+100 💉 S</button>
              <button onClick={() => { addExpSerumM(50); showToast('+50 Essence M'); }} className="rounded border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-400 hover:bg-cyan-500 hover:text-pgr-dark transition-all">+50 💉 M</button>
              <button onClick={() => { addExpSerumL(20); showToast('+20 Essence L'); }} className="rounded border border-violet-500/30 bg-violet-500/5 px-3 py-2 text-xs text-violet-400 hover:bg-violet-500 hover:text-pgr-dark transition-all">+20 💉 L</button>
              <button onClick={() => { addExpSerumXL(10); showToast('+10 Essence XL'); }} className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500 hover:text-pgr-dark transition-all">+10 💉 XL</button>
              <button onClick={() => { addWeaponParts(100); showToast('+100 Forge Alloy'); }} className="rounded border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-400 hover:bg-cyan-500 hover:text-pgr-dark transition-all">+100 🔩</button>
              <button onClick={() => { addLowTierMats(100); showToast('+100 Dust'); }} className="rounded border border-gray-500/30 bg-gray-500/5 px-3 py-2 text-xs text-gray-300 hover:bg-gray-400 hover:text-pgr-dark transition-all">+100 ⚙️</button>
              <button onClick={() => { addSyncEnhancement(1500); showToast('+1,500 Sync Cores'); }} className="rounded border border-indigo-500/30 bg-indigo-500/5 px-3 py-2 text-xs text-indigo-400 hover:bg-indigo-500 hover:text-pgr-dark transition-all">+1,500 🔧</button>
              <button onClick={() => { addSyncSerum(300); showToast('+300 Fluid'); }} className="rounded border border-teal-500/30 bg-teal-500/5 px-3 py-2 text-xs text-teal-400 hover:bg-teal-500 hover:text-pgr-dark transition-all">+300 💧</button>
            </div>
          </div>

          <div>
            <p className="text-xs font-mono text-pgr-dim font-semibold uppercase tracking-wider mb-2">Shards & Drops</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button onClick={() => { const id = adminGiveSSRShards(20); if (id) showToast(`+20 SSR Shards (${id})`); }} className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500 hover:text-pgr-dark transition-all">+20 SSR Shards</button>
              <button onClick={() => { const id = adminGiveSRShards(8); if (id) showToast(`+8 SR Shards (${id})`); }} className="rounded border border-violet-500/30 bg-violet-500/5 px-3 py-2 text-xs text-violet-400 hover:bg-violet-500 hover:text-pgr-dark transition-all">+8 SR Shards</button>
              <button onClick={() => { const id = adminGiveRandomSigWeapon(); if (id) showToast(`Random Sig Weapon: ${id}`); }} className="rounded border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500 hover:text-pgr-dark transition-all">🎲 Random Weapon</button>
              <button onClick={() => { const id = adminGiveRandomSSR(); if (id) showToast(`Random SSR: ${id}`); }} className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500 hover:text-pgr-dark transition-all">🎲 Random SSR</button>
              <button onClick={() => { adminMaxAllCharacters(); showToast('⚡ All characters maxed!'); }} className="rounded border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500 hover:text-pgr-dark transition-all">⚡ MAX ALL</button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-600 rounded text-sm text-gray-300 hover:border-cyan-400 hover:text-cyan-400 transition">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Rules Modal ──────────────────────────────────────────────────────────
function RulesModal({
  isOpen,
  onClose,
  activeBanner,
  bannerState,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeBanner: BannerType;
  bannerState: any;
}) {
  const [activeTab, setActiveTab] = useState<'basic' | 'drop' | 'event'>('basic');
  const [rateView, setRateView] = useState<'overview' | 'detailed'>('overview');

  if (!isOpen) return null;

  const isRerun = activeBanner === 'rerun' || activeBanner === 'rerun_fate';
  const isFate = activeBanner === 'fate' || activeBanner === 'rerun_fate';
  const isWeaponBanner = activeBanner === 'weapon' || activeBanner === 'rerun_weapon';

  const materialRates = isWeaponBanner ? WEAPON_MATERIAL_RATES : IDENTITY_MATERIAL_RATES;

  const renderBasicRules = () => {
    if (activeBanner === 'standard') {
      return (
        <div className="space-y-4">
          <div className="border-b border-gray-700 pb-2">
            <h4 className="text-sm font-bold text-cyan-400">Guaranteed SR in 10 Attempts</h4>
            <p className="text-sm text-gray-300">Guaranteed to receive an SR or above identity for every 10 research attempts.</p>
          </div>
          <div className="border-b border-gray-700 pb-2">
            <h4 className="text-sm font-bold text-amber-400">Guaranteed SSR in 60 Attempts</h4>
            <p className="text-sm text-gray-300">Guaranteed to receive an SSR identity for every 60 research attempts.</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-purple-400">SSR Pool</h4>
            <p className="text-sm text-gray-300">When you hit an SSR, you will receive a random SSR identity from the full pool of all available SSR Manifest identities.</p>
          </div>
        </div>
      );
    }
    if (activeBanner === 'featured' || activeBanner === 'fate' || activeBanner === 'rerun' || activeBanner === 'rerun_fate') {
      return (
        <div className="space-y-4">
          <div className="border-b border-gray-700 pb-2">
            <h4 className="text-sm font-bold text-cyan-400">Guaranteed SR in 10 Attempts</h4>
            <p className="text-sm text-gray-300">Guaranteed to receive an SR or above identity for every 10 research attempts.</p>
          </div>
          <div className="border-b border-gray-700 pb-2">
            <h4 className={`text-sm font-bold ${isFate ? 'text-rose-400' : 'text-amber-400'}`}>
              {isFate ? 'Floating Guarantee' : 'Guaranteed SSR in 60 Attempts'}
            </h4>
            {isFate ? (
              <p className="text-sm text-gray-300">A random value between 80 and 100 is generated. An SSR is guaranteed within that many pulls. The value resets after an SSR is obtained.</p>
            ) : (
              <p className="text-sm text-gray-300">Guaranteed to receive an SSR identity for every 60 research attempts.</p>
            )}
          </div>
          <div>
            <h4 className={`text-sm font-bold ${isRerun ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isRerun ? '70/30 Rate-up with Calibration' : 'Rate-up SSR'}
            </h4>
            <p className="text-sm text-gray-300">
              {isRerun
                ? 'When you hit an SSR, there is a 70% chance it will be one of the featured characters (Verg, Rin). If you do not get your selected target, the next SSR is guaranteed to be your target (calibration).'
                : 'When you hit an SSR, it is guaranteed to be one of the featured characters (Doran, Gwendolyn, Mira).'}
            </p>
          </div>
          {isFate && (
            <div className="border-t border-gray-700 pt-2">
              <h4 className="text-sm font-bold text-rose-400">Base Rate</h4>
              <p className="text-sm text-gray-300">Base SSR rate: 1.5% (combined with guarantee: 1.9%).</p>
            </div>
          )}
        </div>
      );
    }
    if (isWeaponBanner) {
      return (
        <div className="space-y-4">
          <div className="border-b border-gray-700 pb-2">
            <h4 className="text-sm font-bold text-cyan-400">Guaranteed SSR Weapon in 40 Attempts</h4>
            <p className="text-sm text-gray-300">Guaranteed to receive an SSR weapon for every 40 research attempts.</p>
          </div>
          <div className="border-b border-gray-700 pb-2">
            <h4 className="text-sm font-bold text-emerald-400">80/20 Rate</h4>
            <p className="text-sm text-gray-300">When you hit an SSR weapon, there is an 80% chance it will be your selected target, and 20% chance it will be a random non-target SSR weapon.</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-400">Calibration</h4>
            <p className="text-sm text-gray-300">If you do not get your target on an SSR, the next SSR weapon you obtain will be guaranteed to be your target. This calibration carries over between weapon banners of the same type.</p>
            {bannerState?.calibrationActive && (
              <p className="text-sm text-amber-300 mt-1">⚡ Calibration is active! Your next SSR weapon will be your target.</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderDropDetails = () => {
    if (
      activeBanner === 'standard' ||
      activeBanner === 'featured' ||
      activeBanner === 'fate' ||
      activeBanner === 'rerun' ||
      activeBanner === 'rerun_fate'
    ) {
      const identityRows = [
        { item: 'SSR Identity (with guarantee)', rate: '1.9%', note: isFate ? 'floating pity included' : 'pity included' },
        { item: 'SSR Identity (base)', rate: isFate ? '1.5%' : '0.5%', note: '' },
        { item: 'SR Identity', rate: '2.5%', note: 'guaranteed every 10 pulls' },
      ];
      const materialRows = materialRates.map(r => ({
        item: r.label,
        rate: r.weight.toFixed(2) + '%',
        note: r.key === 'sync_mats' ? 'cores + fluid' : r.key === 'manifest_shard' ? 'random SR identity shard' : '',
      }));
      const allRows = [...identityRows, ...materialRows];
      if (rateView === 'overview') {
        return (
          <div>
            <p className="text-sm text-gray-400 mb-2">Drop Overview</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {allRows.map((r, i) => (
                <div key={i} className="flex justify-between border-b border-gray-800 py-1">
                  <span>{r.item}</span>
                  <span className="text-cyan-300">{r.rate}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">* Combined rates including pity and guarantees may vary.</p>
          </div>
        );
      } else {
        return (
          <div>
            <p className="text-sm text-gray-400 mb-2">Detailed Rates</p>
            <div className="space-y-1 text-xs">
              {allRows.map((r, i) => (
                <div key={i} className="flex justify-between border-b border-gray-800 py-1">
                  <span>{r.item}</span>
                  <span className="text-cyan-300">{r.rate}</span>
                  {r.note && <span className="text-gray-500 text-[10px]">{r.note}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    if (isWeaponBanner) {
      const targetWeapon = weapons.find(w => w.id === bannerState?.selectedWeaponId);
      const targetName = targetWeapon ? targetWeapon.name : 'Selected Weapon';
      let srUpName = 'SR UP Weapon';
      if (targetWeapon && targetWeapon.signatureFor) {
        const fallback = weapons.find(w => w.fallbackFor === targetWeapon.signatureFor && w.inGacha);
        if (fallback) srUpName = fallback.name;
      }
      const weaponRows = [
        { item: `SSR ${targetName} (UP)`, rate: '4.00%', note: '80% of SSR' },
        { item: 'SSR Off-target', rate: '1.00%', note: '20% of SSR' },
        { item: `SR ${srUpName} (UP)`, rate: '12.00%', note: 'SR up' },
        { item: 'SR Other weapons', rate: '1.50%', note: '' },
      ];
      const materialRows = materialRates.map(r => ({
        item: r.label,
        rate: r.weight.toFixed(2) + '%',
        note: r.key === 'sync_mats' ? 'cores + fluid' : '',
      }));
      const allRows = [...weaponRows, ...materialRows];
      if (rateView === 'overview') {
        return (
          <div>
            <p className="text-sm text-gray-400 mb-2">Drop Overview</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {allRows.map((r, i) => (
                <div key={i} className="flex justify-between border-b border-gray-800 py-1">
                  <span>{r.item}</span>
                  <span className="text-cyan-300">{r.rate}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">* Calibration guarantees the target on next SSR if missed.</p>
          </div>
        );
      } else {
        return (
          <div>
            <p className="text-sm text-gray-400 mb-2">Detailed Rates</p>
            <div className="space-y-1 text-xs">
              {allRows.map((r, i) => (
                <div key={i} className="flex justify-between border-b border-gray-800 py-1">
                  <span>{r.item}</span>
                  <span className="text-cyan-300">{r.rate}</span>
                  {r.note && <span className="text-gray-500 text-[10px]">{r.note}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const renderEventRules = () => {
    if (activeBanner === 'standard' || activeBanner === 'featured' || activeBanner === 'fate' || activeBanner === 'rerun' || activeBanner === 'rerun_fate') {
      return (
        <div className="space-y-2 text-sm text-gray-300">
          <p><span className="text-cyan-400">Pity Inheritance:</span> Pity and guarantee progress are inherited between banners of the same type.</p>
          <p><span className="text-cyan-400">Event Period:</span> Each featured banner runs for a limited time.</p>
          <p><span className={isRerun ? 'text-amber-400' : 'text-cyan-400'}>
            {isRerun ? '70/30 Rate-up with Calibration:' : 'Rate-up:'}
          </span>
          {isRerun
            ? ' When you hit an SSR on a Rerun banner, there is a 70% chance it will be one of the rate‑up characters (Verg or Rin). If you do not get your selected target, the next SSR is guaranteed to be your target (calibration).'
            : ' When you hit an SSR on a Featured banner, you are guaranteed to get one of the rate‑up characters.'}
          </p>
          {isFate && (
            <p><span className="text-rose-400">Floating Guarantee:</span> A random number between 80 and 100 is assigned. You are guaranteed an SSR within that many pulls. The number resets after each SSR.</p>
          )}
        </div>
      );
    }
    if (isWeaponBanner) {
      return (
        <div className="space-y-2 text-sm text-gray-300">
          <p><span className="text-amber-400">Calibration:</span> If you fail to get your target on an SSR, the next SSR is guaranteed to be your target.</p>
          <p><span className="text-amber-400">80/20:</span> When you hit an SSR, there is an 80% chance for your selected target and 20% for a random off‑target weapon.</p>
          <p><span className="text-amber-400">Target Selection:</span> You can change your target at any time. Changing target resets calibration (if active).</p>
          <p><span className="text-amber-400">Pity:</span> SSR is guaranteed every 40 pulls. Pity carries over between Weapon banners.</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative max-w-2xl w-full rounded-xl border border-gray-700 bg-gray-900/95 shadow-2xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="p-6">
          <h2 className="text-xl font-mono font-bold text-white mb-4">📋 Banner Rules</h2>
          <div className="flex border-b border-gray-700 mb-4">
            {(['basic', 'drop', 'event'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-mono font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-cyan-400 text-cyan-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'basic' ? 'Basic Rules' : tab === 'drop' ? 'Drop Details' : 'Event Rules'}
              </button>
            ))}
          </div>
          <div className="min-h-[200px]">
            {activeTab === 'basic' && renderBasicRules()}
            {activeTab === 'drop' && (
              <>
                <div className="flex justify-end gap-2 mb-2">
                  <button
                    onClick={() => setRateView('overview')}
                    className={`px-2 py-1 text-xs font-mono rounded ${
                      rateView === 'overview' ? 'bg-cyan-400/20 text-cyan-400' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setRateView('detailed')}
                    className={`px-2 py-1 text-xs font-mono rounded ${
                      rateView === 'detailed' ? 'bg-cyan-400/20 text-cyan-400' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Detailed Rates
                  </button>
                </div>
                {renderDropDetails()}
              </>
            )}
            {activeTab === 'event' && renderEventRules()}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 border border-gray-600 rounded text-sm text-gray-300 hover:border-cyan-400 hover:text-cyan-400 transition">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pull Record Modal ────────────────────────────────────────────────────
function PullRecordModal({
  isOpen,
  onClose,
  history,
}: {
  isOpen: boolean;
  onClose: () => void;
  history: PullHistoryEntry[];
}) {
  const [activeBanner, setActiveBanner] = useState<BannerType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  if (!isOpen) return null;

  const filtered = activeBanner === 'all' ? history : history.filter(e => e.bannerType === activeBanner);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * ITEMS_PER_PAGE;
  const end = Math.min(start + ITEMS_PER_PAGE, filtered.length);
  const pageItems = filtered.slice(start, end);

  const goToPage = (page: number) => {
    const newPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(newPage);
  };

  const handleBannerChange = (banner: typeof activeBanner) => {
    setActiveBanner(banner);
    setCurrentPage(1);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative max-w-2xl w-full max-h-[85vh] rounded-xl border border-gray-700 bg-gray-900/95 shadow-2xl flex flex-col">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-300">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="p-4 flex-1 flex flex-col overflow-hidden">
          <h2 className="text-xl font-mono font-bold text-white mb-3">📜 Pull Record</h2>

          <div className="flex overflow-x-auto gap-1 border-b border-gray-700 mb-3 pb-1 scrollbar-thin scrollbar-thumb-gray-700">
            {(['all', 'standard', 'featured', 'fate', 'weapon', 'rerun', 'rerun_weapon', 'rerun_fate'] as const).map((b) => (
              <button
                key={b}
                onClick={() => handleBannerChange(b)}
                className={`px-2 py-1.5 text-xs font-mono rounded-t-lg transition-colors whitespace-nowrap ${
                  activeBanner === b
                    ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {b === 'all' ? 'All' : b.charAt(0).toUpperCase() + b.slice(1)}
                {b !== 'all' && ` (${history.filter(e => e.bannerType === b).length})`}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {pageItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">No pulls recorded for this banner.</p>
            ) : (
              pageItems.map((entry) => {
                const rarityColor = entry.result.rarity === 'SSR' ? 'text-amber-400' : entry.result.rarity === 'SR' ? 'text-violet-400' : 'text-gray-400';
                const date = new Date(entry.timestamp);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={entry.id} className="flex justify-between items-center border-b border-gray-800 py-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={rarityColor}>{entry.result.rarity === 'SSR' ? '⭐' : entry.result.rarity === 'SR' ? '✦' : '•'}</span>
                      <span className="text-white font-mono">{entry.result.name}</span>
                    </div>
                    <span className="text-gray-500 font-mono">{dateStr}</span>
                  </div>
                );
              })
            )}
          </div>

          {filtered.length > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-gray-800 pt-2 text-xs text-gray-500">
              <span>
                {filtered.length} entries · Page {safePage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage <= 1}
                  className="px-3 py-1 rounded border border-gray-700 disabled:opacity-30 hover:border-cyan-400 hover:text-cyan-400 transition disabled:hover:border-gray-700 disabled:hover:text-gray-500"
                >
                  Previous
                </button>
                <button
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="px-3 py-1 rounded border border-gray-700 disabled:opacity-30 hover:border-cyan-400 hover:text-cyan-400 transition disabled:hover:border-gray-700 disabled:hover:text-gray-500"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GachaView Main ──────────────────────────────────────────────────────
export default function GachaView() {
  const {
    enkephalin,
    eventManifestTickets,
    targetArsenalTickets,
    basicManifestTickets,
    banners,
    pullGacha,
    setBannerTarget,
    exchangeEnkephalinToBasicTickets,
    exchangeEnkephalinToEventTickets,
    exchangeEnkephalinToArsenalTickets,
    shardInventory,
    ownedIdentities,
    ownedWeapons,
    unlockIdentityWithShards,
    pullHistory,
  } = useGameStore();
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;
  const [adminToast, setAdminToast] = useState<string | null>(null);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  // ── Tab & Banner selection ──
  const [activeTab, setActiveTab] = useState<BannerTab>('featured');
  const [activeBanner, setActiveBanner] = useState<BannerType>('featured');

  const [results, setResults] = useState<GachaResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  // ── Pull stages ──
  type PullStage = 'idle' | 'beam' | 'burst' | 'shards' | 'done';
  const [pullStage, setPullStage] = useState<PullStage>('idle');
  const [pullCount, setPullCount] = useState<1 | 10>(1);
  const [maxRarity, setMaxRarity] = useState<'SSR' | 'SR' | 'material' | null>(null);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);

  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const burstTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [prePullIdentityIds, setPrePullIdentityIds] = useState<string[]>([]);
  const [prePullWeaponIds, setPrePullWeaponIds] = useState<string[]>([]);

  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [chargeData, setChargeData] = useState<{
    count: 1 | 10;
    cost: number;
    primaryMaterialKey: string;
    primaryLabel: string;
    primaryAmount: number;
    deficit: number;
    bannerType: BannerType;
  } | null>(null);

  const banner = banners[activeBanner] ?? {
    pity: 0,
    totalPulls: 0,
    selectedWeaponId: undefined,
    calibrationActive: false,
    selectedTargetId: undefined,
    featuredId: undefined,
  };
  const info = bannerInfo[activeBanner];

  const isFeaturedOrFate = activeBanner === 'featured' || activeBanner === 'fate' || activeBanner === 'rerun_fate';
  const isWeapon = activeBanner === 'weapon' || activeBanner === 'rerun_weapon';
  const isStandard = activeBanner === 'standard';
  const isRerun = activeBanner === 'rerun' || activeBanner === 'rerun_fate';
  const isFate = activeBanner === 'fate' || activeBanner === 'rerun_fate';

  const costPerPull = 175;
  const costPer10 = 1750;

  const getCurrencyDisplay = (): { materialKey: string; label: string; amount: number } => {
    if (isWeapon) {
      return { materialKey: 'targetArsenalTickets', label: 'Arsenal Tickets', amount: targetArsenalTickets };
    } else if (isFeaturedOrFate || isRerun) {
      return { materialKey: 'eventManifestTickets', label: 'Event Tickets', amount: eventManifestTickets };
    } else {
      return { materialKey: 'basicManifestTickets', label: 'Basic Tickets', amount: basicManifestTickets };
    }
  };

  const currency = getCurrencyDisplay();
  const srIdentities = identities.filter(i => i.rarity === 'SR');

  // ── Auto-select logic ──
  useEffect(() => {
    const bannersInTab = tabBanners[activeTab];
    if (bannersInTab && bannersInTab.length > 0 && !bannersInTab.includes(activeBanner)) {
      setActiveBanner(bannersInTab[0]);
    }
  }, [activeTab, activeBanner]);

  useEffect(() => {
    if (isWeapon && !banner?.selectedWeaponId) {
      const featured = activeBanner === 'rerun_weapon' ? rerunWeapons : featuredWeapons;
      if (featured.length > 0) {
        setBannerTarget(activeBanner, featured[0].id);
      }
    }
  }, [activeBanner, isWeapon, banner?.selectedWeaponId, setBannerTarget]);

  useEffect(() => {
    if ((activeBanner === 'featured' || activeBanner === 'fate') && !banner?.featuredId) {
      if (featuredIdentities.length > 0) {
        setBannerTarget(activeBanner, featuredIdentities[0].id);
      }
    }
  }, [activeBanner, banner?.featuredId, setBannerTarget]);

  useEffect(() => {
    if (isRerun && !banner?.featuredId) {
      if (rerunIdentities.length > 0) {
        setBannerTarget(activeBanner, rerunIdentities[0].id);
      }
    }
  }, [activeBanner, isRerun, banner?.featuredId, setBannerTarget]);

  // ─── Sound System ──────────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const scheduledNodesRef = useRef<AudioNode[]>([]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (_) {}
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    if (!masterGainRef.current && audioCtxRef.current) {
      const master = audioCtxRef.current.createGain();
      master.gain.value = 0.5;
      master.connect(audioCtxRef.current.destination);
      masterGainRef.current = master;
    }
  };

  const playRingSound = (rarity: 'SSR' | 'SR' | 'material' | null) => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx || !masterGainRef.current) return;
    const master = masterGainRef.current;
    const now = ctx.currentTime;

    const freq = rarity === 'SSR' ? 1200 : rarity === 'SR' ? 800 : 500;
    const duration = 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration);
    scheduledNodesRef.current.push(osc, gain);
  };

  const playBeamSound = (rarity: 'SSR' | 'SR' | 'material' | null) => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx || !masterGainRef.current) return;
    const master = masterGainRef.current;
    const now = ctx.currentTime;

    const isSSR = rarity === 'SSR';
    const isSR = rarity === 'SR';

    scheduledNodesRef.current.forEach(node => {
      try { node.disconnect(); } catch (_) {}
    });
    scheduledNodesRef.current = [];

    // Deep bass
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isSSR ? 50 : isSR ? 70 : 90, now);
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(isSSR ? 0.25 : isSR ? 0.15 : 0.08, now + 0.05);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    subOsc.connect(subGain);
    subGain.connect(master);
    subOsc.start(now);
    subOsc.stop(now + 0.35);
    scheduledNodesRef.current.push(subOsc, subGain);

    // Rising synth
    const leadOsc = ctx.createOscillator();
    const leadGain = ctx.createGain();
    leadOsc.type = isSSR ? 'sawtooth' : isSR ? 'square' : 'sine';
    const startFreq = isSSR ? 120 : isSR ? 160 : 200;
    const endFreq = isSSR ? 550 : isSR ? 350 : 280;
    leadOsc.frequency.setValueAtTime(startFreq, now);
    leadOsc.frequency.exponentialRampToValueAtTime(endFreq, now + 2.0);
    leadGain.gain.setValueAtTime(0, now);
    leadGain.gain.linearRampToValueAtTime(isSSR ? 0.15 : isSR ? 0.1 : 0.05, now + 0.3);
    leadGain.gain.linearRampToValueAtTime(isSSR ? 0.2 : isSR ? 0.12 : 0.06, now + 1.5);
    leadGain.gain.linearRampToValueAtTime(0.0001, now + 2.2);
    leadOsc.connect(leadGain);
    leadGain.connect(master);
    leadOsc.start(now);
    leadOsc.stop(now + 2.3);
    scheduledNodesRef.current.push(leadOsc, leadGain);

    // Noise sweep
    const bufSize = ctx.sampleRate * 2.2;
    const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = isSSR ? 1.5 : isSR ? 1.2 : 1.0;
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(isSSR ? 3000 : isSR ? 1500 : 800, now + 2.0);
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(isSSR ? 0.12 : isSR ? 0.08 : 0.04, now + 0.2);
    noiseGain.gain.linearRampToValueAtTime(isSSR ? 0.2 : isSR ? 0.12 : 0.06, now + 1.2);
    noiseGain.gain.linearRampToValueAtTime(0.0001, now + 2.2);
    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    noiseSrc.start(now);
    noiseSrc.stop(now + 2.3);
    scheduledNodesRef.current.push(noiseSrc, filter, noiseGain);

    // Impact
    const impactTime = now + (pullCount === 10 ? 2.8 : 1.8);
    const hitOsc = ctx.createOscillator();
    const hitGain = ctx.createGain();
    hitOsc.type = 'square';
    hitOsc.frequency.setValueAtTime(isSSR ? 800 : isSR ? 600 : 400, impactTime);
    hitOsc.frequency.exponentialRampToValueAtTime(isSSR ? 120 : isSR ? 160 : 200, impactTime + 0.15);
    hitGain.gain.setValueAtTime(0, impactTime);
    hitGain.gain.linearRampToValueAtTime(isSSR ? 0.4 : isSR ? 0.25 : 0.15, impactTime + 0.02);
    hitGain.gain.exponentialRampToValueAtTime(0.0001, impactTime + 0.35);
    hitOsc.connect(hitGain);
    hitGain.connect(master);
    hitOsc.start(impactTime);
    hitOsc.stop(impactTime + 0.4);
    scheduledNodesRef.current.push(hitOsc, hitGain);

    if (isSSR) {
      const reverbBuffer = createReverbBuffer(ctx, 1.5, 5.0);
      const convolver = ctx.createConvolver();
      convolver.buffer = reverbBuffer;
      const reverbGain = ctx.createGain();
      reverbGain.gain.setValueAtTime(0.6, impactTime);
      reverbGain.gain.linearRampToValueAtTime(0.05, impactTime + 1.5);
      const reverbHitOsc = ctx.createOscillator();
      const reverbHitGain = ctx.createGain();
      reverbHitOsc.type = 'square';
      reverbHitOsc.frequency.setValueAtTime(800, impactTime);
      reverbHitOsc.frequency.exponentialRampToValueAtTime(120, impactTime + 0.15);
      reverbHitGain.gain.setValueAtTime(0, impactTime);
      reverbHitGain.gain.linearRampToValueAtTime(0.2, impactTime + 0.02);
      reverbHitGain.gain.exponentialRampToValueAtTime(0.0001, impactTime + 0.35);
      reverbHitOsc.connect(reverbHitGain);
      reverbHitGain.connect(convolver);
      convolver.connect(reverbGain);
      reverbGain.connect(master);
      reverbHitOsc.start(impactTime);
      reverbHitOsc.stop(impactTime + 0.4);
      scheduledNodesRef.current.push(reverbHitOsc, reverbHitGain, convolver, reverbGain);
    }
  };

  const stopBeamSound = () => {
    if (masterGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      masterGainRef.current.gain.linearRampToValueAtTime(0, now + 0.15);
      setTimeout(() => {
        if (masterGainRef.current) masterGainRef.current.gain.value = 0.5;
      }, 200);
    }
  };

  const createReverbBuffer = (ctx: AudioContext, duration: number, decay: number) => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * decay);
    }
    return buffer;
  };

  // ── Animation timers ──
  useEffect(() => {
    if (pullStage === 'beam') {
      playBeamSound(maxRarity);
      flashTimerRef.current = setTimeout(() => {
        setFlash(true);
        setShake(true);
        setTimeout(() => setShake(false), 550);
        setTimeout(() => {
          setFlash(false);
          setPullStage('burst');
          stopBeamSound();
        }, 450);
      }, 2000);

      return () => {
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        stopBeamSound();
      };
    }
  }, [pullStage]);

  useEffect(() => {
    if (pullStage === 'burst') {
      burstTimerRef.current = setTimeout(() => {
        setPullStage('shards');
      }, 700);
      return () => {
        if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      };
    }
  }, [pullStage]);

  // ── Execute pull ──
  const executePullWithAnimation = (count: 1 | 10) => {
    const currentIdentityIds = ownedIdentities.map(o => o.identityId);
    const currentWeaponIds = ownedWeapons.map(o => o.weaponId);
    setPrePullIdentityIds(currentIdentityIds);
    setPrePullWeaponIds(currentWeaponIds);

    const pullResults = pullGacha(activeBanner, count);
    setResults(pullResults);
    setPullCount(count);
    setShowResults(false);

    let max: 'SSR' | 'SR' | 'material' = 'material';
    for (const r of pullResults) {
      if (r.rarity === 'SSR') { max = 'SSR'; break; }
      if (r.rarity === 'SR' && max !== 'SSR') max = 'SR';
    }
    setMaxRarity(max);

    setPullStage('beam');
    setPulling(true);
    setFlash(false);
    setShake(false);
  };

  // ── Skip beam ──
  const handleSkipBeam = () => {
    if (pullStage === 'beam') {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      stopBeamSound();
      setPullStage('shards');
    }
  };

  // ── Reveal logic ──
  const advanceReveal = useCallback(() => {}, []);

  const handleContinue = useCallback(() => {
    if (pullStage === 'shards') {
      setPullStage('done');
      setTimeout(() => {
        setPullStage('idle');
        setPulling(false);
        setShowResults(true);
      }, 400);
    }
  }, [pullStage]);

  // ── Pull logic ──
  const handlePull = (count: 1 | 10) => {
    const cost = count === 10 ? costPer10 : costPerPull;

    if (isStandard) {
      if (basicManifestTickets >= cost) {
        executePullWithAnimation(count);
        return;
      }
      setChargeData({
        count, cost,
        primaryMaterialKey: 'basicManifestTickets',
        primaryLabel: 'Basic Tickets',
        primaryAmount: basicManifestTickets,
        deficit: cost - basicManifestTickets,
        bannerType: activeBanner,
      });
      setChargeModalOpen(true);
      return;
    }

    const primaryAmount = isWeapon ? targetArsenalTickets : eventManifestTickets;
    const primaryMaterialKey = isWeapon ? 'targetArsenalTickets' : 'eventManifestTickets';
    const primaryLabel = isWeapon ? 'Arsenal Tickets' : 'Event Tickets';

    if (primaryAmount >= cost) {
      executePullWithAnimation(count);
      return;
    }

    const deficit = cost - primaryAmount;
    setChargeData({ count, cost, primaryMaterialKey, primaryLabel, primaryAmount, deficit, bannerType: activeBanner });
    setChargeModalOpen(true);
  };

  const performExchange = () => {
    if (!chargeData) return;
    const { deficit, bannerType } = chargeData;
    if (bannerType === 'weapon' || bannerType === 'rerun_weapon') {
      exchangeEnkephalinToArsenalTickets(deficit);
    } else if (bannerType === 'featured' || bannerType === 'fate' || bannerType === 'rerun' || bannerType === 'rerun_fate') {
      exchangeEnkephalinToEventTickets(deficit);
    } else if (bannerType === 'standard') {
      exchangeEnkephalinToBasicTickets(deficit);
    } else {
      return;
    }
    setChargeModalOpen(false);
    setChargeData(null);
  };

  const getResultStatus = (result: GachaResult): { isNew: boolean; isConverted: boolean } => {
    if (result.type === 'identity') {
      return { isNew: !prePullIdentityIds.includes(result.id), isConverted: prePullIdentityIds.includes(result.id) };
    }
    if (result.type === 'weapon') {
      return { isNew: !prePullWeaponIds.includes(result.id), isConverted: prePullWeaponIds.includes(result.id) };
    }
    return { isNew: false, isConverted: false };
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'SSR': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'SR': return 'text-violet-400 bg-violet-500/10 border-violet-500/30';
      default: return 'text-pgr-dim bg-pgr-darker/30 border-pgr-border';
    }
  };

  const handleTargetChange = (targetId: string) => {
    setBannerTarget(activeBanner, targetId);
  };

  const unlockableIdentities = identities
    .filter(idn =>
      !ownedIdentities.some(o => o.identityId === idn.id) &&
      !idn.id.startsWith('rover_') &&
      idn.id !== 'rover_eclipse' &&
      idn.id !== 'xenon_chaos'
    )
    .map(idn => {
      const shards = shardInventory[idn.id] || 0;
      const required = idn.rarity === 'SSR' ? 70 : 50;
      return { ...idn, shards, required, canUnlock: shards >= required };
    })
    .filter(idn => idn.shards > 0);

  // ─── Resolve current target list / selection ──
  let targetList: any[] = [];
  let targetLabel = '';

  if (activeBanner === 'featured' || activeBanner === 'fate') {
    targetList = featuredIdentities;
    targetLabel = 'Select Target Character (SSR rate-up):';
  } else if (activeBanner === 'rerun' || activeBanner === 'rerun_fate') {
    targetList = rerunIdentities;
    targetLabel = 'Select Target Character (70/30 rate-up with calibration):';
  } else if (isWeapon) {
    targetList = activeBanner === 'rerun_weapon' ? rerunWeapons : featuredWeapons;
    targetLabel = 'Select Target Signature Weapon (80/20 rate):';
  }

  if (activeBanner === 'standard') {
    targetList = srIdentities;
    targetLabel = 'Select Target Genesis (SR) Identity (guaranteed every 10):';
  }

  const showTargetSelector = targetList.length > 0 && (
    isWeapon ||
    activeBanner === 'featured' ||
    activeBanner === 'fate' ||
    isRerun ||
    activeBanner === 'standard'
  );

  const getTargetValue = (): string => {
    if (!targetList.length) return '';
    if (isWeapon) return banner.selectedWeaponId || targetList[0].id;
    if (activeBanner === 'standard') return banner.selectedTargetId || targetList[0].id;
    return banner.featuredId || targetList[0].id;
  };

  const targetValue = getTargetValue();
  const featuredDisplay = targetList.find(item => item.id === targetValue) || targetList[0];

  // ─── Render Hero ──
  const renderHero = () => {
    let maxPity: number;
    let displayMax: string;
    if (isFate) {
      maxPity = 100;
      displayMax = '80~100';
    } else {
      maxPity = isWeapon ? 40 : 60;
      displayMax = String(maxPity);
    }

    return (
      <>
        <div className="absolute inset-0">
          <div className="absolute inset-0 flex items-center justify-center text-[260px] leading-none opacity-90 select-none">
            {featuredDisplay?.portrait || featuredDisplay?.icon || '🌀'}
          </div>
          <div className={`absolute inset-0 bg-gradient-to-t ${info.bgGradient} via-transparent to-black/40`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
          <div className="absolute inset-0 hex-grid-field opacity-25 pointer-events-none" />
        </div>

        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-black/50 backdrop-blur-sm">
            <span className="w-4 h-4 text-center text-cyan-400 text-sm">🎟️</span>
            <span className="font-mono text-sm font-bold text-cyan-300">{currency.amount.toLocaleString()}</span>
            <span className="text-[10px] text-pgr-dim/60 font-mono">{currency.label}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-yellow-500/20 bg-black/50 backdrop-blur-sm">
            <span className="w-4 h-4 text-center text-yellow-400 text-sm">⚡</span>
            <span className="font-mono text-sm font-bold text-yellow-300">{enkephalin.toLocaleString()}</span>
            <span className="text-[10px] text-pgr-dim/60 font-mono">Eclipse</span>
          </div>
        </div>

        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-[0.3em] text-cyan-400/70 px-2 py-1 rounded border border-cyan-500/20 bg-black/40 backdrop-blur-sm">
            {info.title}
          </span>
          <button
            onClick={() => setRulesModalOpen(true)}
            className="text-[10px] font-mono text-pgr-dim hover:text-white px-2 py-1 rounded border border-pgr-border/30 bg-black/40 hover:border-pgr-border transition backdrop-blur-sm"
          >
            📋 Rules
          </button>
          <button
            onClick={() => setRecordModalOpen(true)}
            className="text-[10px] font-mono text-pgr-dim hover:text-white px-2 py-1 rounded border border-pgr-border/30 bg-black/40 hover:border-pgr-border transition backdrop-blur-sm"
          >
            📜 Record
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 pt-16">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-400/30 text-amber-400 bg-amber-400/10">
                  {isWeapon ? 'SIGNATURE' : 'ASCENSION-THREAT'}
                </span>
                {banner.calibrationActive && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-400/30 text-amber-300 bg-amber-400/5">⚡ CALIBRATION</span>
                )}
              </div>
              <h2 className="text-3xl md:text-4xl font-mono font-bold text-white drop-shadow-lg">
                {featuredDisplay?.name || 'Select a target'}
              </h2>
              <p className="text-sm text-pgr-dim/70 mt-1">{featuredDisplay?.title || info.description}</p>

              {showTargetSelector && targetList.length > 0 && (
                <select
                  value={targetValue}
                  onChange={e => handleTargetChange(e.target.value)}
                  className="mt-3 bg-black/60 border border-gray-700 rounded px-3 py-2 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none w-full max-w-xs backdrop-blur-sm"
                >
                  {targetList.map(item => {
                    const label = 'title' in item ? `${item.name} - ${item.title}` : item.name;
                    return (
                      <option key={item.id} value={item.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              )}

              <div className="flex items-center gap-3 mt-4 text-[11px] font-mono text-pgr-dim/50">
                <span>PITY <span className="text-cyan-400 font-bold">{banner.pity ?? 0}</span> / {displayMax}</span>
                <span className="w-32 h-1 rounded-full bg-white/10 overflow-hidden inline-block">
                  <span
                    className="block h-full bg-gradient-to-r from-cyan-500 to-blue-400"
                    style={{ width: `${Math.min(100, ((banner.pity ?? 0) / maxPity) * 100)}%` }}
                  />
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[220px]">
              <button
                onClick={() => handlePull(10)}
                disabled={pulling || pullStage !== 'idle'}
                className="py-3.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-mono font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-cyan-500/20"
              >
                {pulling && pullStage !== 'idle' ? 'Extracting...' : `RESEARCH ×10  ·  ${costPer10}`}
              </button>
              <button
                onClick={() => handlePull(1)}
                disabled={pulling || pullStage !== 'idle'}
                className="py-2.5 rounded-lg border border-cyan-400/30 bg-black/40 text-cyan-400 hover:bg-cyan-400/10 disabled:opacity-40 transition-all font-mono font-semibold text-xs backdrop-blur-sm"
              >
                {pulling && pullStage !== 'idle' ? 'Extracting...' : `RESEARCH ×1  ·  ${costPerPull}`}
              </button>
              <p className="text-center text-[10px] text-pgr-dim/40 font-mono">
                {isWeapon ? 'SSR weapon guaranteed every 40 pulls' : 'S-Rank (SSR) guaranteed every 60 pulls'}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden flex">
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-cyan-500/10 bg-gradient-to-b from-gray-950 via-black to-gray-950 relative z-20">
        <div className="px-4 py-5 border-b border-cyan-500/10">
          <p className="text-[10px] font-mono tracking-[0.3em] text-cyan-500/50">QLIPHOTH R&D</p>
          <h1 className="text-sm font-mono font-bold text-white mt-0.5">Signal Extraction</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {tabOrder.map(tab => {
            const meta = tabMeta[tab];
            const isActiveTab = activeTab === tab;
            return (
              <div key={tab} className="px-2 mb-1">
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded transition-all text-left ${
                    isActiveTab ? 'bg-cyan-400/10 border border-cyan-400/30' : 'border border-transparent hover:bg-white/5'
                  }`}
                >
                  <span className={`text-base ${isActiveTab ? 'text-cyan-400' : 'text-gray-500'}`}>{meta.icon}</span>
                  <span className={`flex-1 text-xs font-mono font-semibold tracking-wide ${isActiveTab ? 'text-white' : 'text-gray-400'}`}>{tabLabels[tab]}</span>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${meta.badgeColor}`}>{meta.badge}</span>
                </button>
                {isActiveTab && (
                  <div className="mt-1 ml-3 pl-3 border-l border-cyan-500/10 space-y-0.5">
                    {tabBanners[tab].map(type => {
                      const bannerState = banners[type];
                      const isActiveBanner = activeBanner === type;
                      return (
                        <button
                          key={type}
                          onClick={() => { setActiveBanner(type); setShowResults(false); }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-mono transition-colors ${
                            isActiveBanner ? 'text-cyan-300 bg-cyan-400/5' : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          <span>{subBannerLabel[type]}</span>
                          <span className="flex items-center gap-1 text-[9px] text-gray-600">
                            {bannerState?.calibrationActive && <span className="text-amber-400">⚡</span>}
                            {bannerState?.pity ?? 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-cyan-500/10 flex gap-2">
          <button onClick={() => setRulesModalOpen(true)} className="flex-1 text-[10px] font-mono text-gray-400 hover:text-white border border-gray-700 rounded py-1.5">RULES</button>
          <button onClick={() => setRecordModalOpen(true)} className="flex-1 text-[10px] font-mono text-gray-400 hover:text-white border border-gray-700 rounded py-1.5">RECORD</button>
        </div>
        {isAdmin && (
          <div className="px-3 pb-3">
            <button onClick={() => setAdminPanelOpen(true)} className="w-full text-[10px] font-mono text-amber-400 hover:text-white border border-amber-500/30 rounded py-1.5">⚙ ADMIN</button>
          </div>
        )}
      </aside>

      <div className="flex-1 relative min-h-screen overflow-y-auto">
        <BackgroundEnvironment />

        <div className="md:hidden relative z-10 flex overflow-x-auto gap-1 border-b border-pgr-border/30 bg-black/60 backdrop-blur-sm px-2 py-2">
          {tabOrder.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-mono whitespace-nowrap border ${
                activeTab === tab ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10' : 'border-pgr-border/30 text-pgr-dim'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
        <div className="md:hidden relative z-10 flex overflow-x-auto gap-1 bg-black/40 backdrop-blur-sm px-2 py-1.5 border-b border-pgr-border/20">
          {tabBanners[activeTab].map(type => (
            <button
              key={type}
              onClick={() => { setActiveBanner(type); setShowResults(false); }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono whitespace-nowrap border ${
                activeBanner === type ? 'border-cyan-400 text-cyan-300 bg-cyan-400/5' : 'border-transparent text-gray-500'
              }`}
            >
              {subBannerLabel[type]} ({banners[type]?.pity ?? 0})
            </button>
          ))}
        </div>

        <div className="relative w-full h-[72vh] min-h-[480px] overflow-hidden border-b border-cyan-500/10">
          {renderHero()}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
          {showResults && results.length > 0 && (
            <div className="rounded border border-pgr-border bg-pgr-card/60 p-4 mb-6">
              <h3 className="text-lg font-mono font-bold text-white mb-3">EXTRACTION RESULTS</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {results.map((result, i) => {
                  const status = getResultStatus(result);
                  return (
                    <div key={i} className={`rounded border p-2 text-center ${getRarityColor(result.rarity)}`}>
                      <p className="text-xs font-mono font-medium">{result.rarity === 'SSR' ? '⭐ SSR' : result.rarity === 'SR' ? '✦ SR' : 'Material'}</p>
                      <p className={`mt-1 text-sm font-mono font-bold truncate ${result.rarity === 'SSR' ? 'text-amber-300' : result.rarity === 'SR' ? 'text-violet-300' : 'text-pgr-dim'}`}>{result.name}</p>
                      {result.shards && status.isConverted && <p className="text-[10px] opacity-70">+{result.shards} Shards</p>}
                      {status.isNew && <p className="text-[10px] text-green-400 font-bold">NEW!</p>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setShowResults(false)} className="mt-3 w-full py-2 border border-pgr-border rounded text-sm text-pgr-dim hover:text-cyan-400 transition">CLOSE</button>
            </div>
          )}

          {unlockableIdentities.length > 0 && (
            <div className="rounded border border-cyan-500/20 bg-cyan-500/5 p-4 mb-6">
              <h3 className="text-sm font-mono font-bold text-white mb-2">UNLOCK IDENTITIES WITH SHARDS</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {unlockableIdentities.map(idn => (
                  <div key={idn.id} className="rounded border border-pgr-border bg-pgr-darker/30 p-2 text-center">
                    <span className="text-2xl block">{idn.portrait}</span>
                    <p className="text-xs font-mono font-semibold text-white truncate">{idn.name}</p>
                    <p className="text-[10px] text-cyan-400">{idn.shards}/{idn.required}</p>
                    <button onClick={() => unlockIdentityWithShards(idn.id)} className="mt-1 w-full rounded border border-cyan-400 bg-cyan-400/10 py-1 text-[10px] font-mono text-cyan-400 hover:bg-cyan-400 hover:text-pgr-dark transition">UNLOCK</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AdminPanel
        isOpen={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
        toast={adminToast}
        setToast={setAdminToast}
      />

      <RulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        activeBanner={activeBanner}
        bannerState={banner}
      />

      <PullRecordModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        history={pullHistory}
      />

      {chargeModalOpen && chargeData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-500/30 bg-gray-900/95 p-6 shadow-2xl">
            <button onClick={() => setChargeModalOpen(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-lg font-mono font-bold text-amber-400 mb-2">⚠️ Insufficient Currency</h2>
            <p className="text-sm text-gray-400 mb-4">You don't have enough {chargeData.primaryLabel}.</p>
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Cost:</span><span className="text-white font-mono font-bold">{chargeData.cost}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Your {chargeData.primaryLabel}:</span><span className="font-mono font-bold text-rose-400">{chargeData.primaryAmount.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Eclipse Energy:</span><span className="font-mono font-bold text-yellow-300">{enkephalin.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm border-t border-gray-700 pt-2"><span className="text-gray-400">Shortage:</span><span className="font-mono font-bold text-amber-400">{chargeData.deficit}</span></div>
            </div>
            {enkephalin >= chargeData.deficit ? (
              <button onClick={performExchange} className="mt-4 w-full rounded-lg border border-cyan-400 bg-cyan-400/10 py-2.5 font-mono text-sm text-cyan-400 hover:bg-cyan-400 hover:text-gray-900 transition">Exchange {chargeData.deficit} ⚡</button>
            ) : (
              <p className="mt-4 text-center text-sm text-rose-400">Not enough Eclipse Energy even after exchange.</p>
            )}
            <button onClick={() => setChargeModalOpen(false)} className="mt-3 w-full rounded-lg border border-gray-700 bg-gray-800/50 py-2 text-sm text-gray-300 hover:border-gray-500 hover:text-white transition">Cancel</button>
          </div>
        </div>
      )}

      {/* ─── PGR-STYLE ANIMATION OVERLAY ───────────────────────────── */}
      {pullStage !== 'idle' && (
        <div
          className={`fixed inset-0 z-[150] overflow-hidden transition-opacity duration-500 ${
            shake ? 'animate-shake' : ''
          }`}
          style={{ perspective: '1000px', background: '#050508' }}
        >
          {/* Simplified animation placeholder – replace with actual beam animation */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/90">
            <div className="text-center text-white">
              <p className="text-3xl font-mono font-bold animate-pulse">
                {pullStage === 'beam' ? '🔮 EXTRACTING...' :
                 pullStage === 'burst' ? '💥' :
                 pullStage === 'shards' ? '✨ REVEALING...' :
                 '✅'}
              </p>
              {pullStage === 'beam' && (
                <button
                  onClick={handleSkipBeam}
                  className="mt-4 text-sm text-gray-500 hover:text-white underline"
                >
                  Skip
                </button>
              )}
              {pullStage === 'shards' && (
                <button
                  onClick={handleContinue}
                  className="mt-4 px-6 py-2 rounded-lg border border-cyan-400 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400 hover:text-gray-900 transition"
                >
                  Continue →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        @keyframes spin-reverse { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }
        .animate-spin-reverse { animation: spin-reverse 10s linear infinite; }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.2); } }
        .animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
        @keyframes float-particle { 0% { transform: translate(0,0) scale(1); opacity: 0.1; } 25% { transform: translate(var(--tx), var(--ty)) scale(1.3); opacity: 0.6; } 50% { transform: translate(calc(var(--tx) * -0.5), calc(var(--ty) * 0.7)) scale(0.8); opacity: 0.4; } 75% { transform: translate(calc(var(--tx) * 0.3), calc(var(--ty) * -0.5)) scale(1.2); opacity: 0.7; } 100% { transform: translate(0,0) scale(1); opacity: 0.1; } }
        .animate-float-particle { animation: float-particle ease-in-out infinite; will-change: transform, opacity; }
        @keyframes flash { 0% { opacity: 0.8; } 100% { opacity: 0; } }
        .animate-flash { animation: flash 0.45s ease-out forwards; }
        @keyframes shake { 0%, 100% { transform: translate(0); } 20% { transform: translate(-10px, 5px); } 40% { transform: translate(10px, -5px); } 60% { transform: translate(-5px, 10px); } 80% { transform: translate(5px, -10px); } }
        .animate-shake { animation: shake 0.55s ease-in-out; }
        @keyframes heavy-shake { 0% { transform: translate(0,0) rotate(0deg); } 10% { transform: translate(-15px,10px) rotate(-3deg); } 20% { transform: translate(15px,-8px) rotate(3deg); } 30% { transform: translate(-10px,12px) rotate(-2deg); } 40% { transform: translate(10px,-10px) rotate(2deg); } 50% { transform: translate(-12px,8px) rotate(-4deg); } 60% { transform: translate(12px,-6px) rotate(4deg); } 70% { transform: translate(-8px,10px) rotate(-2deg); } 80% { transform: translate(8px,-12px) rotate(2deg); } 90% { transform: translate(-5px,5px) rotate(-1deg); } 100% { transform: translate(0,0) rotate(0deg); } }
        .animate-heavy-shake { animation: heavy-shake 0.8s ease-in-out; }
        @keyframes white-flash { 0% { opacity: 0; } 10% { opacity: 0.9; } 30% { opacity: 0.6; } 50% { opacity: 0.9; } 70% { opacity: 0.3; } 100% { opacity: 0; } }
        .animate-white-flash { animation: white-flash 0.8s ease-out forwards; }

        .perspective-800 { perspective: 800px; }

        @keyframes particleFly {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx),var(--ty)) scale(0); opacity: 0; }
        }
        .animate-particle-fly { animation: particleFly 0.9s ease-out forwards; }

        @keyframes ring-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }

        .pgr-floor-grid {
          background-image:
            linear-gradient(rgba(96,212,255,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(96,212,255,0.07) 1px, transparent 1px);
          background-size: 34px 34px;
          mask-image: radial-gradient(ellipse at center bottom, black 0%, transparent 70%);
        }

        .hex-grid-field {
          background-image:
            linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(circle at center, black 55%, transparent 80%);
          animation: hex-grid-drift 12s linear infinite;
        }
        @keyframes hex-grid-drift { 0% { background-position: 0 0; } 100% { background-position: 28px 28px; } }

        @keyframes hex-float-vertical {
          0% { transform: translateY(0) rotateX(0deg) scale(0.8); opacity: 0.2; }
          100% { transform: translateY(-20px) rotateX(30deg) scale(1.2); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
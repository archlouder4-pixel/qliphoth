import { useState } from 'react';
import useGameStore from '../store/gameStore';
import { weapons } from '../data/weapons';
import { identities, expForLevel } from '../data/identities';

export default function WeaponView() {
  const { ownedWeapons, weaponParts, levelUpWeapon } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(ownedWeapons[0]?.weaponId || null);

  const selectedWeapon = weapons.find(w => w.id === selectedId);
  const owned = ownedWeapons.find(o => o.weaponId === selectedId);
  const signatureFor = selectedWeapon?.signatureFor
    ? identities.find(i => i.id === selectedWeapon.signatureFor)
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h3 className="mb-3 text-sm font-mono font-semibold uppercase tracking-wider text-pgr-dim">OWNED ARSENAL</h3>
        <div className="space-y-2">
          {ownedWeapons.length === 0 && <p className="text-sm text-pgr-dim/50">No weapons owned. Pull on the Weapon banner!</p>}
          {ownedWeapons.map(ow => {
            const weapon = weapons.find(w => w.id === ow.weaponId);
            if (!weapon) return null;
            return (
              <button
                key={ow.weaponId}
                onClick={() => setSelectedId(ow.weaponId)}
                className={`w-full rounded border p-3 text-left transition-all ${
                  selectedId === ow.weaponId
                    ? 'border-cyan-400 bg-cyan-400/10'
                    : 'border-pgr-border bg-pgr-darker/50 hover:border-cyan-400/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{weapon.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold text-white truncate">{weapon.name}</p>
                    <p className="text-xs text-pgr-dim">Lv.{ow.level}</p>
                  </div>
                  <span className={`text-xs font-mono font-bold ${weapon.rarity === 'SSR' ? 'text-amber-400' : 'text-violet-400'}`}>
                    {weapon.rarity}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedWeapon && owned ? (
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded border border-pgr-border bg-pgr-card/60 p-6">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{selectedWeapon.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${selectedWeapon.rarity === 'SSR' ? 'border-amber-500/30 text-amber-400' : 'border-violet-500/30 text-violet-400'}`}>
                    {selectedWeapon.rarity}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400">{selectedWeapon.type}</span>
                </div>
                <h2 className="mt-1 text-2xl font-mono font-bold text-white">{selectedWeapon.name}</h2>
                {signatureFor && <p className="mt-1 text-sm text-emerald-400 font-mono">Signature Weapon for: {signatureFor.name} - {signatureFor.title}</p>}
                <p className="mt-2 text-sm text-pgr-dim/70">{selectedWeapon.description}</p>
                {(() => {
                  // Show equippable identities (signature or fallback or same type)
                  const compatible = identities.filter(id => {
                    if (selectedWeapon.signatureFor === id.id) return true;
                    if (selectedWeapon.fallbackFor === id.id) return true;
                    if (selectedWeapon.rarity !== 'SR') return false;
                    const sig = weapons.find(w => w.signatureFor === id.id);
                    return sig?.type === selectedWeapon.type;
                  });
                  return (
                    <div className="mt-2 text-xs text-pgr-dim">
                      <span className="text-cyan-400">Equippable by:</span>{' '}
                      {compatible.length === 0 ? 'None' : compatible.map(c => `${c.portrait}${c.name}`).join(', ')}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3">
                <p className="text-xs text-pgr-dim">ATK</p>
                <p className="font-mono font-bold text-orange-400">{selectedWeapon.baseStats.atk}</p>
              </div>
              <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3">
                <p className="text-xs text-pgr-dim">{selectedWeapon.baseStats.bonusType}</p>
                <p className="font-mono font-bold text-green-400">{selectedWeapon.baseStats.bonusStat}%</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-pgr-dim">Weapon Level</p>
                <p className="text-2xl font-mono font-bold text-white">{owned.level} / {selectedWeapon.levelCap}</p>
              </div>
              <div>
                <p className="text-sm text-pgr-dim">Forge Alloy</p>
                <p className="text-2xl font-mono font-bold text-blue-300">{weaponParts}</p>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs text-pgr-dim mb-1">
                <span>EXP Progress</span>
                <span>{owned.exp} / {expForLevel(owned.level)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden border border-pgr-border bg-pgr-darker">
                <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all" style={{ width: `${Math.min(100, (owned.exp / expForLevel(owned.level)) * 100)}%` }} />
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => levelUpWeapon(owned.weaponId)}
                disabled={owned.level >= selectedWeapon.levelCap || weaponParts < 1}
                className="rounded border border-emerald-400 bg-emerald-400/10 px-4 py-2 text-sm font-mono font-medium text-emerald-400 hover:bg-emerald-400 hover:text-pgr-dark disabled:opacity-40 transition-all"
              >
                Add EXP (1 Alloy = 100 EXP)
              </button>
              <button
                onClick={() => {
                  let safety = 10000;
                  while (safety-- > 0) {
                    const s = useGameStore.getState();
                    const o = s.ownedWeapons.find(x => x.weaponId === owned.weaponId);
                    if (!o || o.level >= selectedWeapon.levelCap || s.weaponParts < 1) break;
                    levelUpWeapon(owned.weaponId);
                  }
                }}
                disabled={owned.level >= selectedWeapon.levelCap || weaponParts < 1}
                className="rounded border border-emerald-400 bg-emerald-400/10 px-3 py-2 text-xs font-mono font-medium text-emerald-400 hover:bg-emerald-400 hover:text-pgr-dark disabled:opacity-40 transition-all"
              >
                Upgrade All
              </button>
            </div>

            {/* ─── PASSIVE DISPLAY – FIXED ─── */}
            {selectedWeapon.passive && (
              <div className="mt-4 rounded border border-pgr-border bg-pgr-darker/30 p-4">
                <h4 className="text-xs font-mono font-semibold text-white">{selectedWeapon.passive.name}</h4>
                <p className="mt-1 text-sm text-pgr-dim">{selectedWeapon.passive.description}</p>
                {selectedWeapon.signatureFor && (
                  <p className="mt-2 text-xs text-amber-400">
                    ⚡ Signature Weapon – passive only fully active when harmonized with {identities.find(i => i.id === selectedWeapon.signatureFor)?.name}.
                  </p>
                )}
                {!selectedWeapon.signatureFor && !selectedWeapon.fallbackFor && (
                  <p className="mt-2 text-xs text-pgr-dim/50">✓ Universal passive – always active.</p>
                )}
                {selectedWeapon.fallbackFor && (
                  <p className="mt-2 text-xs text-pgr-dim/50">✓ Fallback passive – always active when equipped.</p>
                )}
              </div>
            )}

            {signatureFor && (
              <div className="mt-4 rounded border border-amber-500/20 bg-amber-500/5 p-4">
                <h3 className="font-mono font-semibold text-amber-400">SIGNATURE HARMONIZATION</h3>
                <p className="mt-2 text-sm text-pgr-dim/70">
                  When equipped by {signatureFor.name}, the {selectedWeapon.name} resonates with their Ego Gift set,
                  enhancing their Ego skill damage by 20% and granting 10% Crit Rate.
                </p>
                <p className="mt-2 text-xs text-pgr-dim/50">
                  Harmonize in the Manifest tab to activate the passive effect.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="lg:col-span-2 flex items-center justify-center py-20">
          <p className="text-pgr-dim">Select a weapon to view details</p>
        </div>
      )}
    </div>
  );
}
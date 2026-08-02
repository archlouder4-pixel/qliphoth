import useGameStore from '../store/gameStore';
import { egoGifts } from '../data/egoGifts';
import { identities } from '../data/identities';

export default function EgoGiftShop() {
  const { threads, buyEgoGift, ownedGifts } = useGameStore();

  return (
    <div className="space-y-6">
      <div className="rounded border border-pgr-border bg-pgr-card/60 p-6">
        <h2 className="text-lg font-mono font-bold text-white mb-2">SIGIL RELICS</h2>
        <p className="text-sm text-pgr-dim mb-4">
          Purchase Sigil Relics using Sigil Strands. Relics can be equipped and leveled up in the Manifest tab.
        </p>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-pgr-dim">🧵 Sigil Strands available:</span>
          <span className="text-lg font-mono font-bold text-purple-300">{threads}</span>
        </div>
      </div>

      <div className="rounded border border-pgr-border bg-pgr-card/60 p-6">
        <h3 className="text-sm font-mono font-semibold text-white mb-3">AVAILABLE GIFTS</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {egoGifts.map(gift => {
            const isOwned = ownedGifts.includes(gift.id);
            return (
              <div key={gift.id} className="rounded border border-pgr-border bg-pgr-darker/40 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{gift.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold text-white truncate">{gift.name}</p>
                    <p className="text-xs text-pgr-dim">
                      {gift.set ? `Set: ${gift.set}` : 'Buff'} · Slot {gift.slot}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1 text-xs text-pgr-dim/70">
                      {gift.stats.hp && <span>HP +{gift.stats.hp}</span>}
                      {gift.stats.atk && <span>ATK +{gift.stats.atk}</span>}
                      {gift.stats.def && <span>DEF +{gift.stats.def}</span>}
                      {gift.stats.spd && <span>SPD +{gift.stats.spd}</span>}
                    </div>
                    <p className="text-xs text-pgr-dim/50 mt-1">{gift.description}</p>
                    {gift.signatureFor && (
                      <p className="text-[10px] text-amber-400 mt-0.5">
                        ⚡ {identities.find(i => i.id === gift.signatureFor)?.name || 'Unknown'}'s set
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => buyEgoGift(gift.id)}
                  disabled={threads < gift.cost || isOwned}
                  className="mt-3 w-full rounded border border-violet-400 bg-violet-400/10 py-2 text-sm font-mono font-medium text-violet-400 hover:bg-violet-400 hover:text-pgr-dark disabled:opacity-40 transition-all"
                >
                  {isOwned ? '✓ OWNED' : `Buy (${gift.cost} 🧵)`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
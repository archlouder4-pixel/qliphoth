import { useState } from 'react';
import useGameStore from '../store/gameStore';
import { identities } from '../data/identities';

export default function ShardShopView() {
  const {
    shardInventory,
    ssrInverseMaterial,
    srInverseMaterial,
    ownedIdentities,
    purchasedShards,
    buyShardsWithInverse,
  } = useGameStore();

  const maxRankIdentities = ownedIdentities.filter(o => o.rank >= 8);
  const hasMaxRankSSR = maxRankIdentities.some(o =>
    identities.find(i => i.id === o.identityId)?.rarity === 'SSR'
  );
  const hasMaxRankSR = maxRankIdentities.some(o =>
    identities.find(i => i.id === o.identityId)?.rarity === 'SR'
  );

  if (!hasMaxRankSSR && !hasMaxRankSR) {
    return (
      <div className="rounded border border-pgr-border bg-pgr-card/60 p-6 text-center">
        <p className="text-pgr-dim">No identities at max rank. Reach R8 to unlock the Shard Shop.</p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'SSR' | 'SR'>(
    hasMaxRankSSR ? 'SSR' : 'SR'
  );

  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState(1);

  const shopIdentities = identities
    .filter(idn => {
      if (idn.id === 'rover_eclipse' || idn.id.startsWith('rover_')) return false;

      const owned = ownedIdentities.find(o => o.identityId === idn.id);
      if (!owned) return false;

      const rarity = idn.rarity;
      if (activeTab === 'SSR' && rarity !== 'SSR') return false;
      if (activeTab === 'SR' && rarity !== 'SR') return false;

      const maxRank = 8;
      const isMaxRank = owned.rank >= maxRank;
      if (isMaxRank) return false;

      const purchased = purchasedShards[idn.id] || 0;
      if (purchased >= 20) return false;

      return true;
    })
    .map(idn => {
      const owned = ownedIdentities.find(o => o.identityId === idn.id)!;
      const purchased = purchasedShards[idn.id] || 0;
      const remaining = Math.max(0, 20 - purchased);
      const isSSR = idn.rarity === 'SSR';
      const costPerShard = isSSR ? 30 : 10;
      const available = isSSR ? ssrInverseMaterial : srInverseMaterial;
      const canAfford = available >= costPerShard;
      return { ...idn, owned, isMaxRank: false, purchased, remaining, costPerShard, available, canAfford };
    });

  const selected = selectedIdentity ? identities.find(i => i.id === selectedIdentity) : null;
  const selectedData = selected ? shopIdentities.find(b => b.id === selected.id) : null;

  const handleBuy = () => {
    if (!selectedIdentity) return;
    if (buyAmount <= 0) return;
    const data = shopIdentities.find(b => b.id === selectedIdentity);
    if (!data || data.isMaxRank || data.remaining <= 0) return;
    const maxBuy = Math.min(data.remaining, Math.floor(data.available / data.costPerShard));
    const actualAmount = Math.min(buyAmount, maxBuy);
    if (actualAmount <= 0) return;
    buyShardsWithInverse(selectedIdentity, actualAmount);
    setBuyAmount(1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded border border-pgr-border bg-pgr-card/60 p-6">
        <h2 className="text-xl font-mono font-bold text-white mb-2">SHARD SHOP</h2>
        <p className="text-sm text-pgr-dim mb-4">
          Purchase shards for characters you own. Each character can receive up to 20 purchased shards.
          Characters at max rank cannot purchase shards.
        </p>
        <div className="flex gap-4 mb-4">
          {hasMaxRankSSR && (
            <div className="rounded border border-pgr-border bg-pgr-darker/30 px-4 py-2">
              <p className="text-xs text-pgr-dim">SSR-Manifest Shards</p>
              <p className="text-lg font-mono font-bold text-amber-400">{ssrInverseMaterial}</p>
            </div>
          )}
          {hasMaxRankSR && (
            <div className="rounded border border-pgr-border bg-pgr-darker/30 px-4 py-2">
              <p className="text-xs text-pgr-dim">SR-Manifest Shards</p>
              <p className="text-lg font-mono font-bold text-violet-400">{srInverseMaterial}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-pgr-border">
        {hasMaxRankSSR && (
          <button
            onClick={() => { setActiveTab('SSR'); setSelectedIdentity(null); }}
            className={`px-4 py-2 text-sm font-mono font-semibold transition-all ${
              activeTab === 'SSR'
                ? 'border-b-2 border-amber-400 text-amber-400'
                : 'text-pgr-dim hover:text-pgr-text'
            }`}
          >
            SSR-Manifest Exchange
          </button>
        )}
        {hasMaxRankSR && (
          <button
            onClick={() => { setActiveTab('SR'); setSelectedIdentity(null); }}
            className={`px-4 py-2 text-sm font-mono font-semibold transition-all ${
              activeTab === 'SR'
                ? 'border-b-2 border-violet-400 text-violet-400'
                : 'text-pgr-dim hover:text-pgr-text'
            }`}
          >
            SR-Manifest Exchange
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded border border-pgr-border bg-pgr-card/60 p-4">
          <h3 className="text-sm font-mono font-bold text-white mb-3">OWNED CHARACTERS</h3>
          {shopIdentities.length === 0 ? (
            <p className="text-xs text-pgr-dim/50">
              No purchasable characters of this rarity. All owned characters are either max rank or already have 20 purchased shards.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {shopIdentities.map(idn => (
                <button
                  key={idn.id}
                  onClick={() => setSelectedIdentity(idn.id)}
                  className={`w-full rounded border p-3 text-left transition-all ${
                    selectedIdentity === idn.id
                      ? 'border-cyan-400 bg-cyan-400/10'
                      : 'border-pgr-border bg-pgr-darker/30 hover:border-cyan-400/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{idn.portrait}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-semibold text-white truncate">{idn.name}</p>
                      <p className="text-xs text-pgr-dim">{idn.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-cyan-400">{idn.rarity}</p>
                        <p className="text-xs text-pgr-dim/50">{idn.remaining}/20 shards available</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 rounded border border-pgr-border bg-pgr-card/60 p-6">
          {selected && selectedData ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl">{selected.portrait}</span>
                <div>
                  <h3 className="text-xl font-mono font-bold text-white">{selected.name}</h3>
                  <p className="text-sm text-pgr-dim">{selected.title}</p>
                  <p className="text-xs text-cyan-400">
                    {selected.rarity} · Cost: {selectedData.costPerShard} {selected.rarity}-Manifest Shard per shard
                  </p>
                  <p className="text-xs text-pgr-dim">Already purchased: {selectedData.purchased}/20</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <label className="text-sm text-pgr-dim font-mono">Amount:</label>
                <input
                  type="number"
                  min={1}
                  max={Math.min(selectedData.remaining, Math.floor(selectedData.available / selectedData.costPerShard))}
                  value={buyAmount}
                  onChange={e => setBuyAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 rounded border border-pgr-border bg-pgr-darker px-2 py-1 text-white text-center font-mono"
                />
                <span className="text-xs text-pgr-dim">
                  (Max: {Math.min(selectedData.remaining, Math.floor(selectedData.available / selectedData.costPerShard))})
                </span>
              </div>

              <div className="mt-3 text-sm text-pgr-dim">
                Total cost: {buyAmount * selectedData.costPerShard} {selected.rarity}-Manifest Shards
                <span className="ml-2 text-xs">
                  (Available: {selectedData.available})
                </span>
              </div>

              <button
                onClick={handleBuy}
                disabled={buyAmount <= 0 || buyAmount > selectedData.remaining || buyAmount * selectedData.costPerShard > selectedData.available}
                className="mt-4 w-full rounded border border-cyan-400 bg-cyan-400/10 py-2 font-mono font-bold text-cyan-400 hover:bg-cyan-400 hover:text-pgr-dark disabled:opacity-40 transition-all"
              >
                PURCHASE {buyAmount} SHARD{buyAmount !== 1 ? 'S' : ''}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-pgr-dim/50">Select an owned character from the list to purchase shards.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
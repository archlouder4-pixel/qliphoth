// src/components/MovesetTab.tsx
import { useState } from 'react';
import useGameStore from '../store/gameStore';
import { data as movesetsData, ranks as rankEmojis } from '../data/movesets';

// Define the rank order for display (highest to lowest)
const RANK_ORDER = ['ALEPH', 'WAW', 'HE', 'TETH', 'ZAYIN', 'WALKIRKSNACHT'];

// Helper to get rank emoji
const getRankEmoji = (rank: string) => rankEmojis[rank as keyof typeof rankEmojis] || '❓';

export default function MovesetTab() {
  const {
    ownedMovesets,
    movesetTickets,
    wawMovesetTickets,
    alephMovesetTickets,
    walkirksnachtMovesetTickets,
    movesetShards,
    bloodLunacy,
    bloodLunacyThreshold,
    pullMoveset,
    recycleMovesetShards,
    claimBloodLunacyTicket,
  } = useGameStore();

  // Build a map for moveset data
  const movesetMap = new Map();
  movesetsData.forEach((m: any) => movesetMap.set(m.name, m));

  // Group owned movesets by rank
  const grouped: Record<string, string[]> = {};
  ownedMovesets.forEach(name => {
    const m = movesetMap.get(name);
    if (!m) return;
    const rank = m.rank || 'UNKNOWN';
    if (!grouped[rank]) grouped[rank] = [];
    grouped[rank].push(name);
  });

  // Handlers
  const handlePull = (ticketType: 'random' | 'waw' | 'aleph' | 'walkirksnacht') => {
    const result = pullMoveset(ticketType);
    if (result) {
      alert(`🎉 You pulled: ${result.name} (${result.rank})`);
    } else {
      alert(`❌ Not enough tickets!`);
    }
  };

  const handleRecycle = (name: string, amount: number = 1) => {
    if (window.confirm(`Recycle ${amount} shard(s) for "${name}"?`)) {
      const success = recycleMovesetShards(name, amount);
      if (success) {
        alert(`♻️ Recycled ${amount} shard(s) for ${name}.`);
      }
    }
  };

  const handleClaimBloodLunacy = () => {
    const success = claimBloodLunacyTicket();
    if (success) {
      alert('🎫 Claimed a Moveset Ticket from Blood Lunacy!');
    } else {
      alert('❌ Not enough Blood Lunacy.');
    }
  };

  const bloodProgress = Math.min(100, (bloodLunacy / bloodLunacyThreshold) * 100);
  const canClaimBlood = bloodLunacy >= bloodLunacyThreshold;

  return (
    <div className="space-y-6">
      {/* Blood Lunacy Milestone */}
      <div className="rounded border border-pgr-border bg-pgr-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono font-bold text-white">🩸 Blood Lunacy</span>
          <span className="text-xs text-pgr-dim">{bloodLunacy} / {bloodLunacyThreshold}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden border border-pgr-border bg-pgr-darker">
          <div className={`h-full transition-all ${bloodProgress >= 100 ? 'bg-red-500' : 'bg-red-700'}`} style={{ width: `${bloodProgress}%` }} />
        </div>
        {canClaimBlood ? (
          <button
            onClick={handleClaimBloodLunacy}
            className="mt-3 w-full rounded border border-red-400 bg-red-400/10 px-4 py-2 text-sm font-mono font-bold text-red-400 hover:bg-red-400 hover:text-pgr-dark transition"
          >
            🎫 Claim Moveset Ticket
          </button>
        ) : (
          <p className="mt-2 text-xs text-pgr-dim/50">
            Earn Blood Lunacy from Story and Gamemodes to claim tickets.
          </p>
        )}
      </div>

      {/* Ticket Counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3 text-center">
          <p className="text-xs text-pgr-dim">🎫 Random Ticket</p>
          <p className="font-mono font-bold text-cyan-300">{movesetTickets}</p>
          <button
            onClick={() => handlePull('random')}
            disabled={movesetTickets < 1}
            className="mt-1 rounded border border-cyan-400/30 bg-cyan-400/5 px-2 py-0.5 text-xs text-cyan-400 hover:bg-cyan-400 hover:text-pgr-dark disabled:opacity-40 transition"
          >
            Pull
          </button>
        </div>
        <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3 text-center">
          <p className="text-xs text-pgr-dim">🎫 WAW Ticket</p>
          <p className="font-mono font-bold text-yellow-300">{wawMovesetTickets}</p>
          <button
            onClick={() => handlePull('waw')}
            disabled={wawMovesetTickets < 1}
            className="mt-1 rounded border border-yellow-400/30 bg-yellow-400/5 px-2 py-0.5 text-xs text-yellow-400 hover:bg-yellow-400 hover:text-pgr-dark disabled:opacity-40 transition"
          >
            Pull
          </button>
        </div>
        <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3 text-center">
          <p className="text-xs text-pgr-dim">🎫 ALEPH Ticket</p>
          <p className="font-mono font-bold text-red-300">{alephMovesetTickets}</p>
          <button
            onClick={() => handlePull('aleph')}
            disabled={alephMovesetTickets < 1}
            className="mt-1 rounded border border-red-400/30 bg-red-400/5 px-2 py-0.5 text-xs text-red-400 hover:bg-red-400 hover:text-pgr-dark disabled:opacity-40 transition"
          >
            Pull
          </button>
        </div>
        <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3 text-center">
          <p className="text-xs text-pgr-dim">🎫 Walkirksnacht Ticket</p>
          <p className="font-mono font-bold text-purple-300">{walkirksnachtMovesetTickets}</p>
          <button
            onClick={() => handlePull('walkirksnacht')}
            disabled={walkirksnachtMovesetTickets < 1}
            className="mt-1 rounded border border-purple-400/30 bg-purple-400/5 px-2 py-0.5 text-xs text-purple-400 hover:bg-purple-400 hover:text-pgr-dark disabled:opacity-40 transition"
          >
            Pull
          </button>
        </div>
      </div>

      {/* Collection */}
      <div className="space-y-4">
        <h2 className="text-xl font-mono font-bold text-white">📚 Moveset Collection</h2>
        {ownedMovesets.length === 0 ? (
          <p className="text-pgr-dim">No movesets owned. Use tickets or Blood Lunacy to extract!</p>
        ) : (
          RANK_ORDER.map(rank => {
            const items = grouped[rank] || [];
            if (items.length === 0) return null;
            const emoji = getRankEmoji(rank);
            return (
              <div key={rank} className="border border-pgr-border rounded p-3 bg-pgr-card/60">
                <h3 className="text-sm font-mono font-bold text-white">{emoji} {rank}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {items.map(name => {
                    const m = movesetMap.get(name);
                    const grade = m?.grade || 'standard';
                    const shards = movesetShards[name] || 0;
                    return (
                      <div key={name} className="flex justify-between items-center bg-pgr-darker/30 p-2 rounded border border-pgr-border/30">
                        <div>
                          <span className="text-sm text-pgr-dim">{name}</span>
                          {grade !== 'standard' && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono uppercase">
                              {grade}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {shards > 0 && (
                            <span className="text-xs text-amber-400">Shards: {shards}</span>
                          )}
                          {shards > 0 && (
                            <button
                              onClick={() => handleRecycle(name, 1)}
                              className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded hover:bg-amber-500 hover:text-black transition"
                            >
                              Recycle
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
        <div className="text-xs text-pgr-dim/50 mt-4">
          💡 Duplicate movesets give shards. Recycle 1 shard → 3 Threads + 5 Lunacy.
        </div>
      </div>
    </div>
  );
}

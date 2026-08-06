// src/components/MovesetTab.tsx
import { useState } from 'react';
import useGameStore, { TICKET_COSTS } from '../store/gameStore';
import { data as movesetsData, ranks as rankEmojis } from '../data/movesets';

const RANK_ORDER = ['ALEPH', 'WAW', 'HE', 'TETH', 'ZAYIN', 'WALKIRKSNACHT'];

const getRankEmoji = (rank: string) => rankEmojis[rank as keyof typeof rankEmojis] || '❓';

const decodeMovesetCode = (code: string) => {
  try {
    return atob(code);
  } catch {
    return 'Invalid code format';
  }
};

const downloadMovesetCode = (name: string, code: string) => {
  const decoded = decodeMovesetCode(code);
  const blob = new Blob([decoded], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function MovesetTab() {
  const {
    ownedMovesets,
    movesetTickets,
    wawMovesetTickets,
    alephMovesetTickets,
    walkirksnachtMovesetTickets,
    movesetShards,
    bloodLunacy,
    pullMoveset,
    recycleMovesetShards,
    buyRandomMovesetTicket,
    buyWawMovesetTicket,
    buyAlephMovesetTicket,
  } = useGameStore();

  const [selectedMoveset, setSelectedMoveset] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  const movesetMap = new Map();
  movesetsData.forEach((m: any) => movesetMap.set(m.name, m));

  const grouped: Record<string, string[]> = {};
  ownedMovesets.forEach(name => {
    const m = movesetMap.get(name);
    if (!m) return;
    const rank = m.rank || 'UNKNOWN';
    if (!grouped[rank]) grouped[rank] = [];
    grouped[rank].push(name);
  });

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

  const selected = selectedMoveset ? movesetMap.get(selectedMoveset) : null;

  return (
    <div className="space-y-6">
      {/* Blood Lunacy Balance & Ticket Exchange Shop */}
      <div className="rounded border border-pgr-border bg-pgr-card/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-mono font-bold text-white">🩸 Blood Lunacy</span>
          <span className="text-sm font-mono text-red-400">{bloodLunacy}</span>
        </div>

        <h3 className="text-sm font-mono font-bold text-white mb-3">🛒 Ticket Exchange</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Random Ticket */}
          <button
            onClick={() => {
              if (buyRandomMovesetTicket()) {
                alert('✅ You bought a Random ticket!');
              } else {
                alert('❌ Not enough Blood Lunacy!');
              }
            }}
            className="rounded border border-cyan-400/30 bg-cyan-400/5 px-3 py-2 text-sm text-cyan-400 hover:bg-cyan-400 hover:text-pgr-dark transition flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={bloodLunacy < TICKET_COSTS.RANDOM}
          >
            <span>🎫 Random Ticket</span>
            <span className="text-xs font-mono">{TICKET_COSTS.RANDOM} 🩸</span>
          </button>

          {/* WAW Ticket */}
          <button
            onClick={() => {
              if (buyWawMovesetTicket()) {
                alert('✅ You bought a WAW ticket!');
              } else {
                alert('❌ Not enough Blood Lunacy!');
              }
            }}
            className="rounded border border-yellow-400/30 bg-yellow-400/5 px-3 py-2 text-sm text-yellow-400 hover:bg-yellow-400 hover:text-pgr-dark transition flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={bloodLunacy < TICKET_COSTS.WAW}
          >
            <span>🎫 WAW Ticket</span>
            <span className="text-xs font-mono">{TICKET_COSTS.WAW} 🩸</span>
          </button>

          {/* ALEPH Ticket */}
          <button
            onClick={() => {
              if (buyAlephMovesetTicket()) {
                alert('✅ You bought an ALEPH ticket!');
              } else {
                alert('❌ Not enough Blood Lunacy!');
              }
            }}
            className="rounded border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-red-400 hover:bg-red-400 hover:text-pgr-dark transition flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={bloodLunacy < TICKET_COSTS.ALEPH}
          >
            <span>🎫 ALEPH Ticket</span>
            <span className="text-xs font-mono">{TICKET_COSTS.ALEPH} 🩸</span>
          </button>

          {/* Walkirksnacht Ticket – Event Only */}
          <div className="rounded border border-purple-400/20 bg-purple-400/5 px-3 py-2 text-sm text-purple-400/50 flex items-center justify-between opacity-60">
            <span>🎫 Walkirksnacht Ticket</span>
            <span className="text-xs font-mono flex items-center gap-1">
              🔒 <span className="text-[10px]">Event Only</span>
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-pgr-dim/50">
          Earn Blood Lunacy from Story, Competitive, Duel, Facility Work, and Ordeals.
        </p>
      </div>

      {/* Ticket Counts & Pull Buttons */}
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
                      <div
                        key={name}
                        className="flex justify-between items-center bg-pgr-darker/30 p-2 rounded border border-pgr-border/30 hover:border-cyan-400/50 cursor-pointer transition group"
                        onClick={() => setSelectedMoveset(name)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-pgr-dim group-hover:text-white transition">{name}</span>
                          {grade !== 'standard' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono uppercase">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRecycle(name, 1);
                              }}
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

      {/* Moveset Detail Modal */}
      {selectedMoveset && selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => {
            setSelectedMoveset(null);
            setShowCode(false);
          }}
        >
          <div
            className="max-w-2xl w-full rounded-lg border border-cyan-500/30 bg-gray-900 p-6 shadow-glow-cyan max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-mono font-bold text-white">{selected.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-pgr-dim">{getRankEmoji(selected.rank)} {selected.rank}</span>
                  {selected.grade && selected.grade !== 'standard' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono uppercase">
                      {selected.grade}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedMoveset(null);
                  setShowCode(false);
                }}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {selected.video && (
              <div className="mb-4">
                <a
                  href={selected.video}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded border border-red-400/30 bg-red-400/5 px-4 py-2 text-sm text-red-400 hover:bg-red-400 hover:text-black transition"
                >
                  ▶ Watch Showcase
                </a>
              </div>
            )}

            <div className="mb-3 flex items-center gap-3">
              <button
                onClick={() => setShowCode(!showCode)}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition"
              >
                {showCode ? 'Hide Code' : 'Show Code'}
              </button>
              {showCode && (
                <button
                  onClick={() => downloadMovesetCode(selected.name, selected.code)}
                  className="text-sm text-green-400 hover:text-green-300 transition"
                >
                  ⬇ Download .txt
                </button>
              )}
            </div>

            {showCode && (
              <div className="relative">
                <pre className="rounded border border-pgr-border bg-pgr-darker/50 p-4 text-xs text-pgr-dim whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                  {decodeMovesetCode(selected.code)}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(decodeMovesetCode(selected.code));
                    alert('Code copied to clipboard!');
                  }}
                  className="absolute top-2 right-2 rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-500 hover:text-black transition"
                >
                  Copy
                </button>
              </div>
            )}

            {!selected.video && !showCode && (
              <p className="text-sm text-pgr-dim/50">No additional details available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

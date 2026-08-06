// src/components/MovesetTab.tsx
import { useState } from 'react';
import { decompress } from 'fzstd';
import useGameStore, { TICKET_COSTS } from '../store/gameStore';
import { data as movesetsData, ranks as rankEmojis } from '../data/movesets';

const RANK_ORDER = ['ALEPH', 'WAW', 'HE', 'TETH', 'ZAYIN', 'WALKIRKSNACHT'];

const GRADE_COLORS: Record<string, string> = {
  standard: 'text-gray-400 border-gray-500/30 bg-gray-500/10',
  plus: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
  commissioned: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  commissioned_unobtainable: 'text-red-400 border-red-500/30 bg-red-500/10',
  esoteric: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  esoteric_removed: 'text-gray-500 border-gray-600/30 bg-gray-600/10 line-through',
  library: 'text-green-400 border-green-500/30 bg-green-500/10',
  removed: 'text-red-500 border-red-600/30 bg-red-600/10 line-through',
};

const GRADE_LABELS: Record<string, string> = {
  standard: 'Standard',
  plus: 'Plus+',
  commissioned: 'Commissioned',
  commissioned_unobtainable: 'Commissioned (Unobtainable)',
  esoteric: 'Esoteric',
  esoteric_removed: 'Esoteric (Removed)',
  library: 'Library',
  removed: 'Removed',
};

const getRankEmoji = (rank: string) => rankEmojis[rank as keyof typeof rankEmojis] || '❓';

// ✅ FIXED: Sanitize Base64, patch Project Moon Zstd magic byte, then decompress
const decodeMovesetCode = async (code: string): Promise<string> => {
  try {
    // Clean up whitespace and convert URL-safe Base64 to standard Base64
    const cleanedCode = code.trim().replace(/-/g, '+').replace(/_/g, '/');

    const binaryString = atob(cleanedCode);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 🔥 HOTFIX: Project Moon's Base64 often corrupts the 4th byte of the Zstd magic number.
    // Zstd magic = 0x28 0xB5 0x2F 0xFD (Base64: KLUv/Q).
    // In-game data sometimes has 0x28 0xB5 0x2F 0xBF (Base64: KLUv/a).
    // We force the correct 4th byte, otherwise fzstd will throw "invalid zstd data".
    if (bytes.length >= 4 && bytes[0] === 0x28 && bytes[1] === 0xB5 && bytes[2] === 0x2F) {
      bytes[3] = 0xFD; 
    }

    const decompressed = decompress(bytes);
    return new TextDecoder().decode(decompressed);
  } catch (err) {
    console.error('Failed to decode moveset code:', err);
    return 'Invalid code format';
  }
};

// Download decoded code as .txt
const downloadMovesetCode = (name: string, decodedCode: string) => {
  const blob = new Blob([decodedCode], { type: 'text/plain' });
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
    buyWalkirksnachtMovesetTicket,
  } = useGameStore();

  const [selectedMoveset, setSelectedMoveset] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [decodedCode, setDecodedCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [showRemoved, setShowRemoved] = useState(false);

  // Walkirksnacht event flag
  const walkirksnachtEventActive = true; // Set to false when event is over

  const movesetMap = new Map();
  movesetsData.forEach((m: any) => movesetMap.set(m.name, m));

  const grouped: Record<string, string[]> = {};
  ownedMovesets.forEach(name => {
    const m = movesetMap.get(name);
    if (!m) return;
    if (m.grade === 'removed' && !showRemoved) return;
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

  const handleBuyTicket = (buyFn: () => boolean, ticketName: string) => {
    if (buyFn()) {
      alert(`✅ You bought a ${ticketName} ticket!`);
    } else {
      alert('❌ Not enough Blood Lunacy!');
    }
  };

  const selected = selectedMoveset ? movesetMap.get(selectedMoveset) : null;

  const handleShowCode = async () => {
    if (!selected) return;
    if (showCode && decodedCode) {
      setShowCode(false);
      setDecodedCode(null);
      return;
    }
    setLoadingCode(true);
    try {
      const decoded = await decodeMovesetCode(selected.code);
      setDecodedCode(decoded);
      setShowCode(true);
    } catch {
      alert('Failed to decode moveset code.');
    } finally {
      setLoadingCode(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedMoveset(null);
    setShowCode(false);
    setDecodedCode(null);
    setLoadingCode(false);
  };

  const gradeCounts: Record<string, number> = {};
  ownedMovesets.forEach(name => {
    const m = movesetMap.get(name);
    if (!m) return;
    const grade = m.grade || 'standard';
    gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
  });

  const totalMovesets = ownedMovesets.length;

  return (
    <div className="space-y-6">
      {/* Blood Lunacy & Ticket Exchange */}
      <div className="rounded border border-pgr-border bg-pgr-card/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-mono font-bold text-white">🩸 Blood Lunacy</span>
          <span className="text-sm font-mono text-red-400">{bloodLunacy}</span>
        </div>
        <div className="mb-4 h-2 w-full overflow-hidden border border-pgr-border bg-pgr-darker">
          <div
            className="h-full bg-red-600 transition-all"
            style={{ width: `${Math.min(100, (bloodLunacy / 1000) * 100)}%` }}
          />
        </div>

        <h3 className="text-sm font-mono font-bold text-white mb-3">🛒 Ticket Exchange</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleBuyTicket(buyRandomMovesetTicket, 'Random')}
            disabled={bloodLunacy < TICKET_COSTS.RANDOM}
            className="rounded border border-cyan-400/30 bg-cyan-400/5 px-3 py-2 text-sm text-cyan-400 hover:bg-cyan-400 hover:text-pgr-dark transition flex items-center justify-between disabled:opacity-40"
          >
            <span>🎫 Random Ticket</span>
            <span className="text-xs font-mono">{TICKET_COSTS.RANDOM} 🩸</span>
          </button>
          <button
            onClick={() => handleBuyTicket(buyWawMovesetTicket, 'WAW')}
            disabled={bloodLunacy < TICKET_COSTS.WAW}
            className="rounded border border-yellow-400/30 bg-yellow-400/5 px-3 py-2 text-sm text-yellow-400 hover:bg-yellow-400 hover:text-pgr-dark transition flex items-center justify-between disabled:opacity-40"
          >
            <span>🎫 WAW Ticket</span>
            <span className="text-xs font-mono">{TICKET_COSTS.WAW} 🩸</span>
          </button>
          <button
            onClick={() => handleBuyTicket(buyAlephMovesetTicket, 'ALEPH')}
            disabled={bloodLunacy < TICKET_COSTS.ALEPH}
            className="rounded border border-red-400/30 bg-red-400/5 px-3 py-2 text-sm text-red-400 hover:bg-red-400 hover:text-pgr-dark transition flex items-center justify-between disabled:opacity-40"
          >
            <span>🎫 ALEPH Ticket</span>
            <span className="text-xs font-mono">{TICKET_COSTS.ALEPH} 🩸</span>
          </button>
          <button
            onClick={() => handleBuyTicket(buyWalkirksnachtMovesetTicket, 'Walkirksnacht')}
            disabled={!walkirksnachtEventActive || bloodLunacy < TICKET_COSTS.WALKIRKSNACHT}
            className="rounded border border-purple-400/30 bg-purple-400/5 px-3 py-2 text-sm text-purple-400 hover:bg-purple-400 hover:text-pgr-dark transition flex items-center justify-between disabled:opacity-40"
          >
            <span>🎫 Walkirksnacht Ticket</span>
            <span className="text-xs font-mono">{walkirksnachtEventActive ? `${TICKET_COSTS.WALKIRKSNACHT} 🩸` : '🔒 EVENT'}</span>
          </button>
        </div>
        <p className="mt-3 text-xs text-pgr-dim/50">
          Earn Blood Lunacy from Story, Competitive, Duel, Facility Work, and Ordeals.
          {!walkirksnachtEventActive && ' Walkirksnacht tickets are only available during Walkirksnacht events.'}
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

      {/* Collection Stats */}
      <div className="rounded border border-pgr-border bg-pgr-card/60 p-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-mono text-white">📊 Collection: {totalMovesets} movesets</span>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(gradeCounts).map(([grade, count]) => (
            <span key={grade} className={`px-2 py-0.5 rounded ${GRADE_COLORS[grade] || 'text-gray-400'}`}>
              {GRADE_LABELS[grade] || grade}: {count}
            </span>
          ))}
          <button
            onClick={() => setShowRemoved(!showRemoved)}
            className={`px-2 py-0.5 rounded text-xs transition ${showRemoved ? 'bg-red-500/20 text-red-400' : 'text-pgr-dim hover:text-white'}`}
          >
            {showRemoved ? 'Hide Removed' : 'Show Removed'}
          </button>
        </div>
      </div>

      {/* Collection */}
      <div className="space-y-4">
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
                    const isRemoved = grade === 'removed' || grade === 'esoteric_removed';
                    return (
                      <div
                        key={name}
                        className={`flex justify-between items-center bg-pgr-darker/30 p-2 rounded border border-pgr-border/30 hover:border-cyan-400/50 cursor-pointer transition group ${isRemoved ? 'opacity-60' : ''}`}
                        onClick={() => setSelectedMoveset(name)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-sm truncate ${isRemoved ? 'line-through text-gray-500' : 'text-pgr-dim group-hover:text-white transition'}`}>
                            {name}
                          </span>
                          {grade && grade !== 'standard' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase whitespace-nowrap ${GRADE_COLORS[grade] || 'text-gray-400 border-gray-500/30 bg-gray-500/10'}`}>
                              {GRADE_LABELS[grade] || grade}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {shards > 0 && (
                            <span className="text-xs text-amber-400">Shards: {shards}</span>
                          )}
                          {shards > 0 && !isRemoved && (
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
          onClick={handleCloseModal}
        >
          <div
            className="max-w-2xl w-full rounded-lg border border-cyan-500/30 bg-gray-900 p-6 shadow-glow-cyan max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-mono font-bold text-white">{selected.name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-pgr-dim">{getRankEmoji(selected.rank)} {selected.rank}</span>
                  {selected.grade && selected.grade !== 'standard' && (
                    <span className={`text-xs px-2 py-0.5 rounded border font-mono uppercase ${GRADE_COLORS[selected.grade] || 'text-gray-400 border-gray-500/30 bg-gray-500/10'}`}>
                      {GRADE_LABELS[selected.grade] || selected.grade}
                    </span>
                  )}
                  {selected.grade === 'commissioned_unobtainable' && (
                    <span className="text-xs text-red-400">🔒 Not Obtainable</span>
                  )}
                  {(selected.grade === 'removed' || selected.grade === 'esoteric_removed') && (
                    <span className="text-xs text-red-500">❌ Removed</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleCloseModal}
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
                onClick={handleShowCode}
                disabled={loadingCode}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition disabled:opacity-50"
              >
                {loadingCode ? 'Decoding...' : showCode ? 'Hide Code' : 'Show Code'}
              </button>
              {showCode && decodedCode && (
                <button
                  onClick={() => downloadMovesetCode(selected.name, decodedCode)}
                  className="text-sm text-green-400 hover:text-green-300 transition"
                >
                  ⬇ Download .txt
                </button>
              )}
            </div>

            {showCode && decodedCode && (
              <div className="relative">
                <pre className="rounded border border-pgr-border bg-pgr-darker/50 p-4 text-xs text-pgr-dim whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                  {decodedCode}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(decodedCode);
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

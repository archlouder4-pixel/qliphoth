// src/components/MovesetTab.tsx
import useGameStore from '../store/gameStore';
const movesetsData = require('../data/movesets'); // if using .js
import BloodLunacyMilestone from './BloodLunacyMilestone'; // we'll create this

const RANK_EMOJIS: Record<string, string> = {
  ZAYIN: '<:zayin:1474861280836976721>',
  TETH: '<:teth:1474861321475592387>',
  HE: '<:he:1474861343466061906>',
  WAW: '<:waw:1474861364383191113>',
  ALEPH: '<:aleph:1474861385396649994>',
  WALKIRKSNACHT: '<:walkirksnacht:1477445829676499046>',
};

const RANK_ORDER = ['ALEPH', 'WAW', 'HE', 'TETH', 'ZAYIN', 'WALKIRKSNACHT'];

export default function MovesetTab() {
  const { ownedMovesets, movesetShards, recycleMovesetShards, movesetTickets } = useGameStore();

  // Build map for moveset data
  const movesetMap = new Map();
  movesetsData.data.forEach((m: any) => movesetMap.set(m.name, m));

  // Group owned by rank
  const grouped: Record<string, string[]> = {};
  ownedMovesets.forEach(name => {
    const m = movesetMap.get(name);
    if (!m) return;
    const rank = m.rank || 'UNKNOWN';
    if (!grouped[rank]) grouped[rank] = [];
    grouped[rank].push(name);
  });

  const handleRecycle = (name: string, amount: number = 1) => {
    if (window.confirm(`Recycle ${amount} shard(s) for ${name}?`)) {
      recycleMovesetShards(name, amount);
    }
  };

  return (
    <div className="space-y-6">
      {/* Blood Lunacy Milestone */}
      <BloodLunacyMilestone />

      {/* Moveset Ticket Count */}
      <div className="rounded border border-pgr-border bg-pgr-card/60 p-4 flex items-center justify-between">
        <span className="text-sm font-mono text-white">🎫 Moveset Tickets</span>
        <span className="text-lg font-mono font-bold text-cyan-300">{movesetTickets || 0}</span>
      </div>

      {/* Moveset Collection */}
      <div className="space-y-4">
        <h2 className="text-xl font-mono font-bold text-white">📚 Moveset Collection</h2>
        {ownedMovesets.length === 0 ? (
          <p className="text-pgr-dim">No movesets owned. Use tickets or Blood Lunacy to extract!</p>
        ) : (
          RANK_ORDER.map(rank => {
            const items = grouped[rank] || [];
            if (items.length === 0) return null;
            const emoji = RANK_EMOJIS[rank] || '❓';
            return (
              <div key={rank} className="border border-pgr-border rounded p-3 bg-pgr-card/60">
                <h3 className="text-sm font-mono font-bold text-white">{emoji} {rank}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {items.map(name => {
                    const shards = movesetShards[name] || 0;
                    return (
                      <div key={name} className="flex justify-between items-center bg-pgr-darker/30 p-2 rounded border border-pgr-border/30">
                        <span className="text-sm text-pgr-dim">{name}</span>
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

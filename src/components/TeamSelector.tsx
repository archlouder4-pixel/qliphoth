import useGameStore from '../store/gameStore';
import { identities } from '../data/identities';

interface Props {
  onReady: () => void;
  availableIds?: string[];
}

function createStoryOwned(identityId: string) {
  return {
    identityId,
    rank: 8,
    level: 65,
    exp: 0,
    shards: 0,
    skillLevels: [15, 15, 15, 15] as [number, number, number, number],
    classSkillLevel: 20,
    equippedWeaponId: undefined,
  };
}

export default function TeamSelector({ onReady, availableIds }: Props) {
  const {
    ownedIdentities,
    team,
    setTeam,
    leaderIndex,
    setLeaderIndex,
    trialIdentities,
    temporaryTrialIds,
    getMaxedIdentity,
  } = useGameStore();

  const isTrial = (id: string) => trialIdentities.includes(id);
  const canRemove = (id: string) => !isTrial(id) || id === 'rover_eclipse';

  const availableOwned = (availableIds
    ? availableIds.map(id => {
        const owned = ownedIdentities.find(o => o.identityId === id);
        return owned || createStoryOwned(id);
      })
    : ownedIdentities
  ).filter(owned => !isTrial(owned.identityId));

  const toggleMember = (identityId: string) => {
    if (team.includes(identityId)) {
      if (canRemove(identityId)) {
        setTeam(team.filter(id => id !== identityId));
      }
    } else if (team.length < 3) {
      setTeam([...team, identityId]);
    }
  };

  // ── Get team members with maxed stats for trials ──
  const teamMembers = team.map(id => {
    const maxed = getMaxedIdentity(id);
    const identity = identities.find(i => i.id === id);
    if (maxed) {
      return {
        ...identity,
        ...maxed,
        id: identity?.id,
        name: identity?.name || maxed.identityId,
        portrait: identity?.portrait || '👤',
        title: identity?.title || '',
        rarity: identity?.rarity || 'SSR',
      };
    }
    return identity;
  }).filter(Boolean);

  return (
    <div className="rounded border border-cyan-500/20 bg-pgr-card/60 p-4 sm:p-6 shadow-glow-cyan-sm">
      <h2 className="text-lg font-mono font-bold text-white mb-1">TEAM SELECTION</h2>
      <p className="text-sm text-pgr-dim mb-4">Select up to 3 members. The middle slot is the leader.</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[0, 1, 2].map(slot => {
          const member = teamMembers[slot];
          const isLeader = leaderIndex === slot;
          const id = member ? (member as any).id : null;
          const trial = id ? isTrial(id) : false;
          const removable = id ? canRemove(id) : false;
          const isDawnbreaker = id === 'rover_dawnbreaker_story';
          return (
            <div key={slot} className={`rounded border p-2 sm:p-3 text-center min-h-[80px] sm:min-h-[100px] flex flex-col items-center justify-center transition-all ${
              isLeader
                ? 'border-cyan-400 bg-cyan-400/10 shadow-glow-cyan-sm'
                : member
                  ? 'border-pgr-border bg-pgr-darker/50'
                  : 'border-dashed border-pgr-border bg-pgr-darker/30'
            }`}>
              {member ? (
                <>
                  <span className="text-2xl">{(member as any).portrait}</span>
                  <p className="text-xs sm:text-sm font-mono font-semibold text-white mt-1 truncate max-w-full">
                    {(member as any).name}
                    {isDawnbreaker && <span className="text-amber-400 ml-1">⚡</span>}
                  </p>
                  <p className="text-[10px] sm:text-xs text-pgr-dim truncate max-w-full">
                    {(member as any).title}
                  </p>
                  {isLeader && <p className="text-xs text-cyan-400 mt-1 font-bold">⭐ LEADER</p>}
                  {!isLeader && (
                    <button onClick={() => setLeaderIndex(slot)} className="mt-1 text-[10px] sm:text-xs text-pgr-dim hover:text-cyan-400 transition-all">
                      Set as Leader
                    </button>
                  )}
                  <button
                    onClick={() => toggleMember((member as any).id)}
                    disabled={!removable}
                    className={`mt-1 text-[10px] sm:text-xs transition-all ${
                      removable
                        ? 'text-rose-400 hover:text-rose-300'
                        : 'text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Remove {trial && <span className="text-gray-400">(Trial)</span>}
                  </button>
                  {trial && !removable && <span className="text-[8px] text-amber-400">🔒 Trial</span>}
                  {(member as any).level && (
                    <p className="text-[8px] text-pgr-dim mt-0.5">
                      Lv.{(member as any).level} · SSR{(member as any).rank}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[10px] sm:text-xs text-pgr-dim/50">Empty Slot {slot + 1}</p>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="text-sm font-mono text-pgr-dim mb-2">AVAILABLE IDENTITIES</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-48 overflow-y-auto">
        {availableOwned.map(owned => {
          const idn = identities.find(i => i.id === owned.identityId);
          if (!idn) return null;
          const inTeam = team.includes(idn.id);
          const isStory = !ownedIdentities.some(o => o.identityId === idn.id);
          const isDawnbreaker = idn.id === 'rover_dawnbreaker_story';
          return (
            <button
              key={idn.id}
              onClick={() => toggleMember(idn.id)}
              disabled={!inTeam && team.length >= 3}
              className={`rounded border p-2 text-left text-xs transition-all ${
                inTeam
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : team.length >= 3
                    ? 'border-pgr-border bg-pgr-darker/30 opacity-40 cursor-not-allowed'
                    : 'border-pgr-border bg-pgr-darker/50 hover:border-cyan-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{idn.portrait}</span>
                <div className="min-w-0">
                  <p className="font-mono font-medium text-white truncate">
                    {idn.name}
                    {isDawnbreaker && <span className="text-amber-400 ml-1">⚡</span>}
                  </p>
                  <p className="text-pgr-dim text-[10px] sm:text-xs truncate">
                    {isStory ? 'Lv.65 · MAX' : `Lv.${owned.level} · ${idn.rarity}${owned.rank}`}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onReady}
        disabled={team.length === 0}
        className="mt-6 w-full rounded border border-cyan-400 bg-cyan-400/10 py-3 font-mono font-bold text-cyan-400 hover:bg-cyan-400 hover:text-pgr-dark disabled:opacity-40 transition-all"
      >
        {team.length === 0 ? 'SELECT AT LEAST 1 MEMBER' : '⚔️ DEPLOY TEAM'}
      </button>
    </div>
  );
}
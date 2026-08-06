// src/components/BloodLunacyMilestone.tsx
import useGameStore from '../store/gameStore';

export default function BloodLunacyMilestone() {
  const { bloodLunacy, bloodLunacyThreshold, claimBloodLunacyTicket } = useGameStore();
  const progress = Math.min(100, (bloodLunacy / bloodLunacyThreshold) * 100);
  const canClaim = bloodLunacy >= bloodLunacyThreshold;

  return (
    <div className="rounded border border-pgr-border bg-pgr-card/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono font-bold text-white">🩸 Blood Lunacy</span>
        <span className="text-xs text-pgr-dim">{bloodLunacy} / {bloodLunacyThreshold}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden border border-pgr-border bg-pgr-darker">
        <div className={`h-full transition-all ${progress >= 100 ? 'bg-red-500' : 'bg-red-700'}`} style={{ width: `${progress}%` }} />
      </div>
      {canClaim ? (
        <button
          onClick={() => claimBloodLunacyTicket()}
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
  );
}
// DailyWeeklyView.tsx – Full updated file
import { useEffect } from 'react';
import useGameStore from '../store/gameStore';
import { useAuth } from '../auth/AuthContext';
import { getCurrentWeek } from '../data/competitive';

export default function DailyWeeklyView() {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;
  const {
    dailyTasks,
    weeklyTasks,
    claimDailyTask,
    claimWeeklyTask,
    claimDailyBonus,
    claimWeeklyBonus,
    addEnkephalin,
    addManagerExp,
    expSerum,
    expSerumM,
    expSerumL,
    expSerumXL,
    weaponParts,
    syncEnhancementMats,
    syncSerumMats,
    lowTierMats,
    weaponShards2Star,
    weaponShards3Star,
    ensureDailyWeeklyReset,
    movesetTickets,
    allDailyBonusClaimed,
    allWeeklyBonusClaimed,
  } = useGameStore();

  useEffect(() => {
    ensureDailyWeeklyReset(getCurrentWeek());
  }, []);

  const completedDailyCount = dailyTasks.filter((t) => t.claimed).length;
  const dailyActivityMax = 3;
  const dailyActivityPct = Math.min(100, (completedDailyCount / dailyActivityMax) * 100);
  const allDailyClaimed = dailyTasks.every((t) => t.claimed);
  const allWeeklyClaimed = weeklyTasks.every((t) => t.claimed);

  return (
    <div className="space-y-6">
      {/* Materials Overview */}
      <div className="rounded border border-pgr-border bg-pgr-card/60 p-6">
        <h2 className="mb-3 text-lg font-mono font-bold text-white">MATERIALS</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3 text-center">
            <p className="text-xs text-pgr-dim">Eclipse Essence (S/M/L/XL)</p>
            <p className="font-mono text-xs">
              <span className="text-green-300">{expSerum}</span> ·{' '}
              <span className="text-cyan-300">{expSerumM}</span> ·{' '}
              <span className="text-violet-300">{expSerumL}</span> ·{' '}
              <span className="text-amber-300">{expSerumXL}</span>
            </p>
          </div>
          <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3 text-center">
            <p className="text-xs text-pgr-dim">Forge Alloy</p>
            <p className="font-mono font-bold text-blue-300">{weaponParts}</p>
          </div>
          <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3 text-center">
            <p className="text-xs text-pgr-dim">Sync Cores</p>
            <p className="font-mono font-bold text-purple-300">{syncEnhancementMats}</p>
          </div>
          <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3 text-center">
            <p className="text-xs text-pgr-dim">Resonance Fluid</p>
            <p className="font-mono font-bold text-cyan-300">{syncSerumMats}</p>
          </div>
          <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3 text-center">
            <p className="text-xs text-pgr-dim">Qliphoth Dust</p>
            <p className="font-mono font-bold text-pgr-dim">{lowTierMats}</p>
          </div>
          <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3 text-center">
            <p className="text-xs text-pgr-dim">2★ Weapon Shards</p>
            <p className="font-mono font-bold text-green-300">{weaponShards2Star || 0}</p>
          </div>
          <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3 text-center">
            <p className="text-xs text-pgr-dim">3★ Weapon Shards</p>
            <p className="font-mono font-bold text-amber-300">{weaponShards3Star || 0}</p>
          </div>
          <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3 text-center">
            <p className="text-xs text-pgr-dim">🎫 Moveset Tickets</p>
            <p className="font-mono font-bold text-cyan-300">{movesetTickets || 0}</p>
          </div>
        </div>
      </div>

      {/* ─── DAILY TASKS ─── */}
      <div className="rounded border border-pgr-border bg-pgr-card/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono font-bold text-white">DAILY TASKS</h2>
          <span className="text-sm text-cyan-400 font-mono">
            Reward: 2 Weapon Shard Crates (50 shards each) + Bonus: 1 Moveset Ticket
          </span>
        </div>

        <div className="mb-4 rounded border border-pgr-border bg-pgr-darker/30 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-pgr-dim">Daily Activity</span>
            <span className="text-white font-mono font-bold">
              {completedDailyCount}/{dailyActivityMax} missions completed
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden border border-pgr-border bg-pgr-darker">
            <div
              className={`h-full transition-all ${dailyActivityPct >= 100 ? 'bg-cyan-400' : 'bg-violet-600'}`}
              style={{ width: `${dailyActivityPct}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-pgr-dim/50">
            {dailyActivityPct >= 100
              ? '✅ Daily rewards claimed! Come back tomorrow.'
              : `Complete ${dailyActivityMax - completedDailyCount} more mission(s) to claim daily crates.`}
          </p>
        </div>

        <div className="space-y-3">
          {dailyTasks.map((task) => (
            <div
              key={task.id}
              className={`rounded border p-4 transition-all ${
                task.claimed
                  ? 'border-green-500/20 bg-green-500/5 opacity-60'
                  : task.progress >= task.max
                  ? 'border-amber-500/20 bg-amber-500/5'
                  : 'border-pgr-border bg-pgr-darker/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-mono font-medium text-white">
                    {task.id === 'daily_login_bonus' ? 'Login Bonus' : task.description}
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden border border-pgr-border bg-pgr-darker">
                    <div
                      className={`h-full transition-all ${task.progress >= task.max ? 'bg-cyan-400' : 'bg-violet-600'}`}
                      style={{ width: `${Math.min(100, (task.progress / task.max) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-pgr-dim">{task.progress}/{task.max}</p>
                  <p className="mt-0.5 text-[10px] text-pgr-dim/50">+30 Manager EXP on claim</p>
                </div>
                <button
                  onClick={() => claimDailyTask(task.id)}
                  disabled={task.progress < task.max || task.claimed}
                  className="ml-4 rounded border border-amber-400 bg-amber-400/10 px-4 py-2 text-sm font-mono font-medium text-amber-400 hover:bg-amber-400 hover:text-pgr-dark disabled:opacity-40 transition-all"
                >
                  {task.claimed ? 'Claimed ✓' : 'Claim'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {allDailyClaimed && !allDailyBonusClaimed && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => claimDailyBonus()}
              className="rounded border border-cyan-400 bg-cyan-400/10 px-6 py-2 text-sm font-mono font-bold text-cyan-400 hover:bg-cyan-400 hover:text-pgr-dark transition-all"
            >
              🎫 Claim Daily Bonus (1 Moveset Ticket)
            </button>
          </div>
        )}
        {allDailyBonusClaimed && (
          <p className="mt-4 text-center text-sm text-green-400 font-mono">
            ✅ Daily bonus claimed! Come back tomorrow.
          </p>
        )}
      </div>

      {/* ─── WEEKLY TASKS ─── */}
      <div className="rounded border border-pgr-border bg-pgr-card/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono font-bold text-white">WEEKLY TASKS</h2>
          <span className="text-sm text-cyan-400 font-mono">
            Reward: 250 Eclipse Energy each (+1000 Eclipse Energy for all) + Bonus: 2 Moveset Tickets
          </span>
        </div>

        <div className="space-y-3">
          {weeklyTasks.map((task) => (
            <div
              key={task.id}
              className={`rounded border p-4 transition-all ${
                task.claimed
                  ? 'border-green-500/20 bg-green-500/5 opacity-60'
                  : task.progress >= task.max
                  ? 'border-amber-500/20 bg-amber-500/5'
                  : 'border-pgr-border bg-pgr-darker/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-mono font-medium text-white">{task.description}</p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden border border-pgr-border bg-pgr-darker">
                    <div
                      className={`h-full transition-all ${task.progress >= task.max ? 'bg-cyan-400' : 'bg-violet-600'}`}
                      style={{ width: `${Math.min(100, (task.progress / task.max) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-pgr-dim">
                    {task.id === 'weekly_reception_score'
                      ? `${task.progress.toLocaleString()}/${task.max.toLocaleString()}`
                      : `${task.progress}/${task.max}`}
                  </p>
                  <p className="mt-0.5 text-[10px] text-pgr-dim/50">+200 Manager EXP on claim</p>
                </div>
                <button
                  onClick={() => claimWeeklyTask(task.id)}
                  disabled={task.progress < task.max || task.claimed}
                  className="ml-4 rounded border border-amber-400 bg-amber-400/10 px-4 py-2 text-sm font-mono font-medium text-amber-400 hover:bg-amber-400 hover:text-pgr-dark disabled:opacity-40 transition-all"
                >
                  {task.claimed ? 'Claimed ✓' : 'Claim'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {allWeeklyClaimed && !allWeeklyBonusClaimed && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => claimWeeklyBonus()}
              className="rounded border border-cyan-400 bg-cyan-400/10 px-6 py-2 text-sm font-mono font-bold text-cyan-400 hover:bg-cyan-400 hover:text-pgr-dark transition-all"
            >
              🎫 Claim Weekly Bonus (2 Moveset Tickets)
            </button>
          </div>
        )}
        {allWeeklyBonusClaimed && (
          <p className="mt-4 text-center text-sm text-green-400 font-mono">
            ✅ Weekly bonus claimed! Come back next week.
          </p>
        )}
      </div>

      {/* ─── Weapon Shard Exchange ─── */}
      <div className="rounded border border-amber-500/20 bg-amber-500/5 p-6">
        <h3 className="text-sm font-mono font-bold text-amber-400 mb-3">
          🛠️ WEAPON SHARD EXCHANGE
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-pgr-dim">
          <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3">
            <p className="font-medium text-white">2★ Weapon Shards</p>
            <p className="mt-1">
              Obtained from: <span className="text-green-300">Daily Weapon Crates (2×50/day)</span>
            </p>
            <p className="mt-0.5">
              Exchange: <span className="text-amber-300">1,000 shards</span> for a random 2★ weapon
            </p>
            <p className="mt-0.5 text-[10px] text-pgr-dim/50">
              Scrapping a 2★ weapon gives <span className="text-pgr-dim">150 shards</span>
            </p>
          </div>
          <div className="rounded border border-pgr-border bg-pgr-darker/30 p-3">
            <p className="font-medium text-white">3★ Weapon Shards</p>
            <p className="mt-1">
              Obtained from: <span className="text-amber-300">Scrapping 3★ weapons only</span>
            </p>
            <p className="mt-0.5">
              Exchange: <span className="text-amber-300">1,000 shards</span> for a random 3★ weapon
            </p>
            <p className="mt-0.5 text-[10px] text-pgr-dim/50">
              Scrapping a 3★ weapon gives <span className="text-pgr-dim">150 shards</span>
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2 text-[10px] text-pgr-dim/50 border-t border-pgr-border pt-3">
          <span>💡 You can obtain 2★ weapons from gacha or exchange shards.</span>
        </div>
      </div>

      {/* ─── Admin Panel ─── */}
      {isAdmin && (
        <div className="rounded border border-amber-500/30 bg-amber-500/5 p-4">
          <details>
            <summary className="cursor-pointer text-sm text-amber-400 font-mono font-semibold hover:text-amber-300">
              ⚙️ ADMIN RESOURCE PANEL
            </summary>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => addEnkephalin(1750)}
                className="rounded border border-yellow-500/30 bg-yellow-500/5 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-500 hover:text-pgr-dark transition-all"
              >
                +1,750 Eclipse Energy
              </button>
              <button
                onClick={() => addManagerExp(1000)}
                className="rounded border border-violet-500/30 bg-violet-500/5 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-500 hover:text-pgr-dark transition-all"
              >
                +1,000 Manager EXP
              </button>
              <button
                onClick={() => {
                  const store = useGameStore.getState();
                  if (store.addWeaponShards2Star) store.addWeaponShards2Star(100);
                  if (store.addWeaponShards3Star) store.addWeaponShards3Star(100);
                }}
                className="rounded border border-green-500/30 bg-green-500/5 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500 hover:text-pgr-dark transition-all"
              >
                +100 2★/3★ Shards
              </button>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

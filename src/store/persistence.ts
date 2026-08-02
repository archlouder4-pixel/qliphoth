// Per-user game state persistence using localStorage
import useGameStore from './gameStore';
import { identities } from '../data/identities';

const STATE_KEY_PREFIX = 'qliphoth_state_';

export function saveStateForUser(userId: string): void {
  const state = useGameStore.getState();
  const sanitizedOwnedIdentities = Array.isArray(state.ownedIdentities)
    ? state.ownedIdentities.filter((o: any) => identities.some(i => i.id === o?.identityId))
    : [];
  const persistable = {
    enkephalin: state.enkephalin,
    weaponFragments: state.weaponFragments,
    threads: state.threads,
    managerLevel: state.managerLevel,
    managerExp: state.managerExp,
    ownedIdentities: sanitizedOwnedIdentities,
    ownedWeapons: state.ownedWeapons,
    equippedGifts: state.equippedGifts,
    expSerum: state.expSerum,
    expSerumM: state.expSerumM,
    expSerumL: state.expSerumL,
    expSerumXL: state.expSerumXL,
    weaponParts: state.weaponParts,
    syncEnhancementMats: state.syncEnhancementMats,
    syncSerumMats: state.syncSerumMats,
    lowTierMats: state.lowTierMats,
    currentChapter: state.currentChapter,
    dailyTasks: state.dailyTasks,
    weeklyTasks: state.weeklyTasks,
    lastDailyReset: state.lastDailyReset,
    lastWeeklyReset: state.lastWeeklyReset,
    allDailyBonusClaimed: state.allDailyBonusClaimed,
    allWeeklyBonusClaimed: state.allWeeklyBonusClaimed,
    competitiveScore: state.competitiveScore,
    competitivePlayed: state.competitivePlayed,
    crRegion: state.crRegion,
    crRegionLocked: state.crRegionLocked,
    crWeek: state.crWeek,
    crZoneScores: state.crZoneScores,
    crCompletedZones: state.crCompletedZones,
    crMerit: state.crMerit,
    crReputation: state.crReputation,
    crSquad: state.crSquad,
    seenTutorials: state.seenTutorials,
    seenTutorialSteps: state.seenTutorialSteps,
    purchasedShards: state.purchasedShards,
    shardInventory: state.shardInventory,
    ssrInverseMaterial: state.ssrInverseMaterial,
    srInverseMaterial: state.srInverseMaterial,
    banners: state.banners,
    team: state.team,
    leaderIndex: state.leaderIndex,
  };
  try {
    localStorage.setItem(STATE_KEY_PREFIX + userId, JSON.stringify(persistable));
  } catch (err) {
    console.warn('Failed to save game state', err);
  }
}

export function loadStateForUser(userId: string): boolean {
  try {
    const raw = localStorage.getItem(STATE_KEY_PREFIX + userId);
    if (!raw) return false;
    const data = JSON.parse(raw);

    // Backfill seenTutorials for old saves (if missing)
    if (!data.seenTutorials) data.seenTutorials = [];
    if (!data.seenTutorialSteps) data.seenTutorialSteps = [];
    if (!data.purchasedShards) data.purchasedShards = {};
    if (!data.shardInventory) data.shardInventory = {};
    if (data.ssrInverseMaterial === undefined) data.ssrInverseMaterial = 0;
    if (data.srInverseMaterial === undefined) data.srInverseMaterial = 0;

    // Ensure pendingTutorialKey is null on load to avoid sticking
    data.pendingTutorialKey = null;
    data.pendingTutorialSequence = null;
    data.currentTutorialStep = null;

    // ─── Sanitize ownedIdentities ────────────────────────────────────
    // This per-user save is the LAST thing written into the store on
    // load (it overwrites whatever zustand's own persist middleware
    // already rehydrated), so any stale/removed identity ids here
    // (e.g. a leftover 'rover_eclipse' from before the roster was
    // trimmed down to Arthur) need to be caught here too, or they'll
    // silently clobber the fix every single load.
    if (Array.isArray(data.ownedIdentities)) {
      data.ownedIdentities = data.ownedIdentities.filter((o: any) =>
        identities.some(i => i.id === o?.identityId)
      );
    } else {
      data.ownedIdentities = [];
    }
    if (!data.ownedIdentities.some((o: any) => o.identityId === 'arthur_excalibur')) {
      data.ownedIdentities.push({
        identityId: 'arthur_excalibur',
        rank: 0,
        level: 1,
        exp: 0,
        shards: 0,
        skillLevels: [1, 1, 1, 1],
      });
    }
    if (Array.isArray(data.team)) {
      data.team = data.team.filter((id: string) => identities.some(i => i.id === id));
      if (data.team.length === 0) data.team = ['arthur_excalibur'];
    }

    useGameStore.getState().loadState(data);
    return true;
  } catch (err) {
    console.warn('Failed to load game state', err);
    return false;
  }
}

export function clearStateForUser(userId: string): void {
  localStorage.removeItem(STATE_KEY_PREFIX + userId);
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let currentUserId: string | null = null;

export function startAutoSave(userId: string): () => void {
  currentUserId = userId;
  const unsub = useGameStore.subscribe(() => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (currentUserId) saveStateForUser(currentUserId);
    }, 500);
  });
  return () => {
    unsub();
    if (saveTimer) clearTimeout(saveTimer);
    currentUserId = null;
  };
}
// App.tsx – with Movesets tab, Blood Lunacy, and Global Chat
import { useEffect, useState } from 'react';
import useGameStore, { TAB_UNLOCK_LEVELS, TAB_UNLOCK_LABELS } from './store/gameStore';
import StoryView from './components/StoryView';
import GachaView from './components/GachaView';
import IdentityView from './components/IdentityView';
import DailyWeeklyView from './components/DailyWeeklyView';
import CompetitiveReception from './components/CompetitiveReception';
import EgoGiftShop from './components/EgoGiftShop';
import WeaponView from './components/WeaponView';
import ShardShopView from './components/ShardShopView';
import LoginScreen from './components/LoginScreen';
import TutorialOverlay from './components/TutorialOverlay';
import NoticeOverlay from './components/NoticeOverlay';
import { useAuth } from './auth/AuthContext';
import { getDisplayName, setGuestCustomName } from './auth/discord';
import { setGuestName } from './api/competitiveApi';
import { loadStateForUser, startAutoSave, saveStateForUser } from './store/persistence';
import { tabHasTutorial, getTabTutorialSteps } from './data/tutorial';
import { identities } from './data/identities';

import DepartmentView from './components/DepartmentView';
import ExplorationView from './components/ExplorationView';
import ReceptionMode from './components/ReceptionMode';
import MovesetTab from './components/MovesetTab';

// ✅ Import GlobalChat (will be rendered globally)
import GlobalChat from './components/GlobalChat';

type Tab = 'story' | 'gacha' | 'identities' | 'weapons' | 'ego-gifts' | 'daily' | 'competitive' | 'shardShop' | 'department' | 'exploration' | 'duel' | 'movesets';

const TAB_UNLOCK_KEY: Partial<Record<Tab, keyof typeof TAB_UNLOCK_LEVELS>> = {
  gacha: 'gacha',
  identities: 'identities',
  weapons: 'weapons',
  'ego-gifts': 'egoGifts',
  daily: 'missions',
  competitive: 'competitive',
  department: 'department',
  exploration: 'exploration',
  duel: 'duel',
  movesets: 'movesets',
};

const TAB_TUTORIAL_KEY: Partial<Record<Tab, string>> = {
  daily: 'missions',
  gacha: 'gacha',
  identities: 'identities',
  weapons: 'weapons',
  'ego-gifts': 'egoGifts',
  competitive: 'competitive',
  shardShop: 'shardShop',
  department: 'department',
  exploration: 'exploration',
  duel: 'duel',
  movesets: 'movesets',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('story');
  const {
    enkephalin,
    weaponFragments,
    threads,
    managerLevel,
    managerExp,
    pendingTutorialKey,
    dismissTutorial,
    seenTutorials,
    currentTutorialStep,
    pendingTutorialSequence,
    startTutorialSequence,
    completeTutorialSequence,
    initializeAdmin,
    ownedIdentities,
    duel,
    startDuel,
    endDuel,
    updateDuelScore,
    updateDuelLives,
    recordDuelResult,
  } = useGameStore();
  const { user, setUser, logout, loading } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showNotice, setShowNotice] = useState(false);

  const safeOwned = Array.isArray(ownedIdentities) ? ownedIdentities : [];
  const maxRankIdentities = safeOwned.filter(o => o.rank >= 8);
  const hasMaxRankSSR = maxRankIdentities.some(o =>
    identities.find(i => i.id === o.identityId)?.rarity === 'SSR'
  );
  const hasMaxRankSR = maxRankIdentities.some(o =>
    identities.find(i => i.id === o.identityId)?.rarity === 'SR'
  );
  const showShardShop = user?.isAdmin ? true : (hasMaxRankSSR || hasMaxRankSR);

  const validIdentityIds = identities.map(i => i.id);
  const filteredOwnedIds = safeOwned
    .map(o => o.identityId)
    .filter(id => validIdentityIds.includes(id));
  const duelAvailableIds = filteredOwnedIds.length > 0 ? filteredOwnedIds : ['arthur_excalibur'];

  useEffect(() => {
    if (!user) return;
    loadStateForUser(user.id);
    const stop = startAutoSave(user.id);
    if (user.isAdmin) initializeAdmin();
    return () => {
      saveStateForUser(user.id);
      stop();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user || user.isAdmin) return;
    if (pendingTutorialSequence || currentTutorialStep) return;
    const allTabs: Tab[] = ['daily', 'gacha', 'identities', 'weapons', 'ego-gifts', 'competitive', 'department', 'exploration', 'duel', 'movesets'];
    if (showShardShop) allTabs.push('shardShop');

    for (const tab of allTabs) {
      const key = TAB_TUTORIAL_KEY[tab];
      if (!key) continue;
      const unlockKey = TAB_UNLOCK_KEY[tab];
      if (unlockKey) {
        const requiredLevel = TAB_UNLOCK_LEVELS[unlockKey];
        if (managerLevel < requiredLevel) continue;
      }
      if (tabHasTutorial(key)) {
        const steps = getTabTutorialSteps(key);
        const allSeen = steps.every(id => seenTutorials.includes(id));
        if (!allSeen) {
          startTutorialSequence(key);
          break;
        }
      }
    }
  }, [managerLevel, user, seenTutorials, pendingTutorialSequence, currentTutorialStep, showShardShop]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const tab = e.detail;
      if (tab === 'gacha') setActiveTab('gacha');
      setShowNotice(false);
    };
    window.addEventListener('navigate-to-tab', handler as EventListener);
    return () => window.removeEventListener('navigate-to-tab', handler as EventListener);
  }, []);

  useEffect(() => {
    if (!user) return;
    const dismissed = localStorage.getItem('qliphoth_notice_dismissed');
    if (dismissed !== 'true') {
      setShowNotice(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-slate-950 to-gray-900 text-gray-400">
        <span className="animate-pulse text-violet-400">INITIALIZING QLIPHOTH...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'story', label: 'STORY', icon: '📖' },
    { id: 'gacha', label: 'EXTRACTION', icon: '🎰' },
    { id: 'identities', label: 'MANIFEST', icon: '🌀' },
    { id: 'weapons', label: 'ARSENAL', icon: '⚔️' },
    { id: 'ego-gifts', label: 'SIGIL RELICS', icon: '✨' },
    { id: 'daily', label: 'MISSIONS', icon: '📋' },
    { id: 'competitive', label: 'SEFIROTH ASCENT', icon: '🔮' },
    { id: 'department', label: 'DEPARTMENT', icon: '🏛️' },
    { id: 'exploration', label: 'EXPLORATION', icon: '🗺️' },
    { id: 'duel', label: 'DUEL', icon: '⚔️' },
    { id: 'movesets', label: 'MOVESETS', icon: '📚' },
  ];

  if (showShardShop) {
    tabs.push({ id: 'shardShop', label: 'SHARD SHOP', icon: '🔄' });
  }

  const MAX_MANAGER_LEVEL = 80;
  const isMaxLevel = managerLevel >= MAX_MANAGER_LEVEL;
  const expToLevel = isMaxLevel ? 1 : managerLevel * 100;
  const displayName = getDisplayName(user);
  const avatarUrl = user.avatar && !user.isMock
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : null;

  const saveCustomName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty');
      return;
    }
    setNameSaving(true);
    setNameError(null);

    const updatedUser = setGuestCustomName(user, trimmed);
    setUser(updatedUser);
    setEditingName(false);

    try {
      await setGuestName(user.id, trimmed);
    } catch (err: any) {
      console.warn('Failed to sync guest name with backend:', err);
    } finally {
      setNameSaving(false);
    }
  };

  const isTabLocked = (tab: Tab): boolean => {
    if (user.isAdmin) return false;
    if (tab === 'shardShop') return false;
    const unlockKey = TAB_UNLOCK_KEY[tab];
    if (!unlockKey) return false;
    const requiredLevel = TAB_UNLOCK_LEVELS[unlockKey];
    return managerLevel < requiredLevel;
  };

  const handleTabChange = (tab: Tab) => {
    if (isTabLocked(tab)) return;
    setActiveTab(tab);
    if (!currentTutorialStep && !pendingTutorialSequence && !user.isAdmin) {
      const key = TAB_TUTORIAL_KEY[tab];
      if (key && tabHasTutorial(key)) {
        const steps = getTabTutorialSteps(key);
        const allSeen = steps.every(id => seenTutorials.includes(id));
        if (!allSeen) {
          startTutorialSequence(key);
        }
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'story': return <StoryView />;
      case 'gacha': return <GachaView />;
      case 'identities': return <IdentityView />;
      case 'weapons': return <WeaponView />;
      case 'ego-gifts': return <EgoGiftShop />;
      case 'daily': return <DailyWeeklyView />;
      case 'competitive': return <CompetitiveReception />;
      case 'shardShop': return <ShardShopView />;
      case 'department': return <DepartmentView />;
      case 'exploration': return <ExplorationView />;
      case 'duel':
        return (
          <ReceptionMode
            onExit={() => setActiveTab('story')}
            availableIdentities={duelAvailableIds}
            initialScore={duel?.score ?? 0}
            initialLives={duel?.lives ?? 5}
            onDuelUpdate={(score, lives) => {
              updateDuelScore(score);
              updateDuelLives(lives);
            }}
            onDuelResult={(result) => recordDuelResult(result)}
          />
        );
      case 'movesets':
        return <MovesetTab />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-950 to-gray-900 text-gray-100">
      {showNotice && <NoticeOverlay onClose={() => setShowNotice(false)} />}
      {currentTutorialStep && !user.isAdmin && (
        <TutorialOverlay stepId={currentTutorialStep} onComplete={completeTutorialSequence} />
      )}

      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl text-cyan-400">🌑</span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-white truncate">QLIPHOTH: ECLIPSE PROTOCOL</h1>
              <p className="text-xs text-gray-500">
                Manager Lv.{managerLevel}
                {isMaxLevel ? ' (MAX)' : ` / ${MAX_MANAGER_LEVEL}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center gap-1 rounded-lg bg-gray-800 px-2 py-1" title="Eclipse Energy">
              <span className="text-yellow-400">⚡</span>
              <span className="font-mono text-xs font-semibold text-yellow-300">
                {enkephalin.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-gray-800 px-2 py-1" title="Forge Shards">
              <span className="text-blue-400">💠</span>
              <span className="font-mono text-xs font-semibold text-blue-300">
                {weaponFragments.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-gray-800 px-2 py-1" title="Sigil Strands">
              <span className="text-purple-400">🧵</span>
              <span className="font-mono text-xs font-semibold text-purple-300">
                {threads.toLocaleString()}
              </span>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-gray-500">EXP</span>
              <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all" style={{ width: `${(managerExp / expToLevel) * 100}%` }} />
              </div>
            </div>

            <button
              onClick={() => setShowNotice(true)}
              className="flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-2.5 py-1 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-all"
              title="View Events & Announcements"
            >
              <span className="text-sm">📢</span>
              <span className="hidden sm:inline">Notice</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                  user.isAdmin
                    ? 'bg-amber-700/30 border border-amber-500/30 text-amber-300'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <span>{user.isAdmin ? '🛡️' : '👤'}</span>
                )}
                <span className="truncate max-w-[80px]">{displayName}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-700 bg-gray-900 shadow-xl z-50">
                  <div className="p-3 border-b border-gray-800">
                    <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">ID: {user.id}</p>
                    {user.isAdmin && <span className="text-xs text-amber-400 font-bold">⭐ ADMIN</span>}
                    {user.isMock && <span className="ml-1 text-xs text-gray-500">(mock)</span>}
                  </div>

                  {user.isGuest && (
                    <div className="p-3 border-b border-gray-800">
                      {!editingName ? (
                        <button
                          onClick={() => {
                            setNameInput(displayName);
                            setEditingName(true);
                            setNameError(null);
                          }}
                          className="w-full text-left text-xs text-violet-400 hover:text-violet-300"
                        >
                          ✏️ Change display name
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              value={nameInput}
                              onChange={(e) => setNameInput(e.target.value)}
                              maxLength={24}
                              placeholder="Display name"
                              className="flex-1 min-w-0 rounded bg-gray-800 border border-gray-700 px-2 py-1 text-xs text-white focus:outline-none focus:border-violet-500 h-8"
                            />
                            <button
                              onClick={saveCustomName}
                              disabled={nameSaving}
                              className="rounded bg-violet-700 hover:bg-violet-600 disabled:opacity-50 px-3 py-1 text-xs font-medium text-white h-8 flex items-center"
                            >
                              {nameSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingName(false);
                                setNameError(null);
                              }}
                              className="rounded bg-gray-800 hover:bg-gray-700 px-3 py-1 text-xs text-gray-300 h-8 flex items-center"
                            >
                              Cancel
                            </button>
                          </div>
                          {nameError && <p className="mt-1 text-xs text-rose-400">{nameError}</p>}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-gray-800 rounded-b-lg"
                  >
                    SIGN OUT
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-[57px] z-40 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl overflow-x-auto px-4">
          <div className="flex gap-0.5">
            {tabs.map((tab) => {
              const unlockKey = TAB_UNLOCK_KEY[tab.id];
              const requiredLevel = unlockKey ? TAB_UNLOCK_LEVELS[unlockKey] : null;
              const isLocked = isTabLocked(tab.id);
              const key = TAB_TUTORIAL_KEY[tab.id];
              const hasTutorial = key && tabHasTutorial(key);
              const steps = hasTutorial ? getTabTutorialSteps(key) : [];
              const allSeen = steps.every(id => seenTutorials.includes(id));
              const isTutorialUnseen = hasTutorial && !isLocked && !allSeen && !user.isAdmin;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  disabled={isLocked}
                  className={`flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-xs font-mono tracking-wider transition-all ${
                    activeTab === tab.id
                      ? 'border-b-2 border-violet-500 text-violet-300'
                      : isLocked
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-500 hover:text-gray-300 hover:border-b-2 hover:border-gray-700'
                  }`}
                >
                  <span className={isLocked ? 'opacity-40' : ''}>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isLocked && (
                    <span className="text-[10px] text-gray-600">🔒{requiredLevel}</span>
                  )}
                  {isTutorialUnseen && (
                    <span className="text-[10px] text-violet-400 animate-pulse">●</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {(() => {
          const unlockKey = TAB_UNLOCK_KEY[activeTab as Tab];
          const requiredLevel = unlockKey ? TAB_UNLOCK_LEVELS[unlockKey] : null;
          if (!user.isAdmin && requiredLevel !== null && managerLevel < requiredLevel) {
            const tabMeta = tabs.find((t) => t.id === activeTab);
            return (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="text-6xl opacity-40">🔒</span>
                <h2 className="mt-4 text-xl font-mono font-bold text-white">
                  {tabMeta?.label} LOCKED
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                  Reach Manager Level {requiredLevel} to unlock.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Current: {managerLevel} / {requiredLevel}
                </p>
              </div>
            );
          }
          return renderTabContent();
        })()}
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600 font-mono tracking-wider">
        QLIPHOTH: ECLIPSE PROTOCOL — v1.5.0 "CHAOS AWAKENS" — Signed in as {displayName}{user.isAdmin && ' · ADMIN'}
      </footer>

      {/* ✅ Global Chat – always visible, fixed position */}
      <GlobalChat />

      {!user.isAdmin && pendingTutorialKey && TAB_UNLOCK_LABELS[pendingTutorialKey as keyof typeof TAB_UNLOCK_LABELS] && !currentTutorialStep && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-w-sm w-full rounded-lg border border-violet-500/30 bg-gray-900 p-6 shadow-glow-violet">
            <span className="text-5xl block text-center">🌟</span>
            <h2 className="mt-3 text-xl font-mono font-bold text-center text-white">
              {TAB_UNLOCK_LABELS[pendingTutorialKey as keyof typeof TAB_UNLOCK_LABELS].title}
            </h2>
            <p className="mt-2 text-sm text-gray-400 text-center">
              {TAB_UNLOCK_LABELS[pendingTutorialKey as keyof typeof TAB_UNLOCK_LABELS].description}
            </p>
            <button
              onClick={dismissTutorial}
              className="mt-6 w-full rounded-lg border border-violet-400 bg-violet-400/10 py-2 font-mono text-sm font-bold text-violet-400 hover:bg-violet-400 hover:text-gray-900 transition-all"
            >
              CONFIRM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

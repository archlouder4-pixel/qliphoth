import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getStoredUser, processOAuthCallback, clearUser, type DiscordUser } from './discord';
import { syncPlayer } from '../api/competitiveApi';

interface AuthContextValue {
  user: DiscordUser | null;
  setUser: (u: DiscordUser | null) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  logout: () => {},
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

// Push this user's identity to the competitive backend so it has a player
// record before any region-lock or score-submit calls. Best-effort — if the
// backend is unreachable, the game continues to work locally as before.
function syncUserToBackend(u: DiscordUser) {
  syncPlayer({
    userId: u.id,
    isGuest: !!u.isGuest,
    discordUsername: u.isGuest ? undefined : u.username,
    discordGlobalName: u.isGuest ? undefined : u.global_name,
    avatar: u.avatar,
  }).catch(err => console.warn('Backend player sync failed (continuing offline):', err));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = (u: DiscordUser | null) => {
    setUserState(u);
    if (u) syncUserToBackend(u);
  };

  useEffect(() => {
    // Check for OAuth callback first
    (async () => {
      if (window.location.hash.includes('access_token')) {
        const u = await processOAuthCallback();
        if (u) {
          setUserState(u);
          syncUserToBackend(u);
          setLoading(false);
          return;
        }
      }
      // Otherwise load stored user
      const stored = getStoredUser();
      if (stored) {
        setUserState(stored);
        syncUserToBackend(stored);
      }
      setLoading(false);
    })();
  }, []);

  const logout = () => {
    clearUser();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
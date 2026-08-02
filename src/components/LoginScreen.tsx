import { useAuth } from '../auth/AuthContext';
import { buildAuthUrl, mockLoginAdmin, mockLoginGuest, getStoredUser, DISCORD_CLIENT_ID } from '../auth/discord';

export default function LoginScreen() {
  const { setUser } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const adminParam = urlParams.has('admin');
  const storedUser = getStoredUser();
  const showAdminMock = adminParam || storedUser?.isAdmin === true;

  // Discord OAuth is only configured if the client ID has been replaced
  const isDiscordConfigured = (DISCORD_CLIENT_ID as string) !== '1234567890123456789' && (DISCORD_CLIENT_ID as string).length > 10;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-slate-950 to-gray-900 p-6">
      <div className="max-w-md w-full rounded-2xl border border-gray-700 bg-gray-900/80 p-8 shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-6xl">🌑</span>
          <h1 className="mt-3 text-2xl font-bold text-white">Qliphoth: Eclipse Protocol</h1>
          <p className="mt-2 text-sm text-gray-400">Sign in to save your progress across devices</p>
        </div>

        <div className="space-y-3">
          {isDiscordConfigured ? (
            <a
              href={buildAuthUrl()}
              className="block w-full rounded-xl bg-[#5865F2] hover:bg-[#4752c4] py-3 text-center font-semibold text-white transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Sign in with Discord
              </span>
            </a>
          ) : (
            <div className="rounded-xl bg-gray-800/50 border border-dashed border-gray-700 px-4 py-3 text-center">
              <p className="text-sm text-gray-400">🔒 Discord login not configured</p>
              <p className="mt-1 text-xs text-gray-600">Replace DISCORD_CLIENT_ID in src/auth/discord.ts and register your domain as a Discord OAuth redirect.</p>
            </div>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-gray-900 px-2 text-gray-500">or test without Discord</span></div>
          </div>

          {showAdminMock && (
            <button
              onClick={() => setUser(mockLoginAdmin())}
              className="w-full rounded-xl bg-amber-700 hover:bg-amber-600 py-3 font-semibold text-white"
            >
              🛡️ Login as Admin (Mock)
            </button>
          )}
          <button
            onClick={() => setUser(mockLoginGuest())}
            className="w-full rounded-xl bg-gray-700 hover:bg-gray-600 py-3 font-semibold text-white"
          >
            👤 Continue as Guest
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500 space-y-2">
          <p className="text-center">Guest progress is saved locally per browser. Discord login enables cross-device saves.</p>
          {!isDiscordConfigured && (
            <details className="bg-gray-800/30 rounded p-2 text-left">
              <summary className="cursor-pointer text-violet-400">How to enable Discord login →</summary>
              <ol className="mt-2 space-y-1 list-decimal list-inside text-gray-400">
                <li>Create a Discord app at <span className="text-violet-400">discord.com/developers</span></li>
                <li>Copy the <span className="text-violet-400">Application ID</span></li>
                <li>Paste into <code className="text-amber-400">DISCORD_CLIENT_ID</code> in <code className="text-amber-400">src/auth/discord.ts</code></li>
                <li>In Discord app → OAuth2 → Redirects, add: <span className="text-amber-400">{window.location.origin + window.location.pathname}</span></li>
                <li>Rebuild & redeploy</li>
              </ol>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

// Discord OAuth2 (Implicit Grant flow) helper
// For production: register a Discord app at https://discord.com/developers/applications
// Set the Redirect URI to your app's URL and replace DISCORD_CLIENT_ID below

// Discord application's client ID
export const DISCORD_CLIENT_ID = '1519097317616128231';

export const ADMIN_DISCORD_ID = ['953964672917336074', '1475575814727929916'];

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
  isAdmin: boolean;
  isMock?: boolean;
  isGuest?: boolean;     // true for guest accounts (random id, no real Discord login)
  customName?: string;   // guest-only editable display name; ignored for real Discord users
}

const STORAGE_KEY_USER = 'qliphoth_user';

// The name to actually display for this user, anywhere in the UI.
// Discord accounts: always their Discord name (never overridable).
// Guests: their custom name if set, else "Guest Player".
export function getDisplayName(user: DiscordUser): string {
  if (user.isGuest) return user.customName || user.global_name || 'Guest Player';
  return user.global_name || user.username;
}

// Update (and persist) a guest's custom display name. No-op for non-guest accounts.
export function setGuestCustomName(user: DiscordUser, name: string): DiscordUser {
  if (!user.isGuest) return user;
  const trimmed = name.trim().slice(0, 24);
  const updated: DiscordUser = { ...user, customName: trimmed || undefined };
  storeUser(updated);
  return updated;
}

export function getStoredUser(): DiscordUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeUser(user: DiscordUser): void {
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEY_USER);
}

export function getRedirectUri(): string {
  return window.location.origin + window.location.pathname;
}

export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'token',
    scope: 'identify',
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function processOAuthCallback(): Promise<DiscordUser | null> {
  // Token is returned in URL fragment after redirect
  const hash = window.location.hash.substring(1);
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (!accessToken) return null;

  try {
    const res = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Discord API error');
    const data = await res.json();
    const user: DiscordUser = {
      id: data.id,
      username: data.username,
      global_name: data.global_name,
      avatar: data.avatar,
      isAdmin: data.id === ADMIN_DISCORD_ID,
      isGuest: false,
    };
    storeUser(user);
    // Clear hash
    window.history.replaceState(null, '', window.location.pathname);
    return user;
  } catch (err) {
    console.error('Discord auth failed', err);
    return null;
  }
}

// Mock login — for testing without Discord OAuth (admin)
export function mockLoginAdmin(): DiscordUser {
  const user: DiscordUser = {
    id: ADMIN_DISCORD_ID,
    username: 'Admin',
    global_name: 'Admin Tester',
    isAdmin: true,
    isMock: true,
    isGuest: false,
  };
  storeUser(user);
  return user;
}

// Mock login as a guest player (random ID, persists across sessions in this browser)
export function mockLoginGuest(): DiscordUser {
  let guestId = localStorage.getItem('qliphoth_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('qliphoth_guest_id', guestId);
  }
  // Preserve a previously-set custom name if this guest has logged in before.
  const previous = getStoredUser();
  const previousCustomName = previous?.id === guestId ? previous.customName : undefined;
  const user: DiscordUser = {
    id: guestId,
    username: 'Guest',
    global_name: 'Guest Player',
    isAdmin: false,
    isMock: true,
    isGuest: true,
    customName: previousCustomName,
  };
  storeUser(user);
  return user;
}
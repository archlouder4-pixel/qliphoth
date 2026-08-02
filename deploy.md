# Deploying Qliphoth: Eclipse Protocol

This project builds to a **single self-contained HTML file** (`dist/index.html`) using `vite-plugin-singlefile`. No backend needed — everything runs in the browser with localStorage for saves.

## Quick Deploy

### Build
```bash
npm install
npm run build
```
This produces `dist/index.html` with everything inlined (JS, CSS, assets).

### Deploy options

#### Cloudflare Pages (recommended)
1. Push this project to a GitHub repo
2. Go to https://pages.cloudflare.com → **Create a project** → connect GitHub
3. Build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Save and Deploy. You'll get a URL like `https://your-app.pages.dev`

#### Netlify Drop (no Git needed)
1. Run `npm run build`
2. Go to https://app.netlify.com/drop
3. Drag the `dist` folder onto the page
4. Done — you get a `*.netlify.app` URL

#### Vercel
```bash
npm install -g vercel
vercel
```
Follow the prompts.

#### GitHub Pages
1. Run `npm run build`
2. Push `dist/index.html` to a branch named `gh-pages`
3. In repo Settings → Pages, select that branch
4. Available at `https://yourname.github.io/repo-name/`

---

## Enabling Discord Login

After deploying, the Discord OAuth button won't work until you configure it:

### 1. Create a Discord app
- Go to https://discord.com/developers/applications
- Click **New Application** → name it (e.g., "Qliphoth")
- Copy the **Application ID** (this is your Client ID)

### 2. Register your redirect URL
- In the Discord app dashboard → **OAuth2** tab
- Under **Redirects**, add the **exact URL** where your site is deployed
  - Example: `https://qliphoth.pages.dev/`
  - The trailing slash matters
- Save changes

### 3. Update the code
- Open `src/auth/discord.ts`
- Replace the placeholder:
  ```ts
  export const DISCORD_CLIENT_ID = 'YOUR_APPLICATION_ID_HERE';
  ```

### 4. Rebuild and redeploy
- `npm run build`
- Upload the new `dist/index.html` to your host
- Done — Discord login now works

---

## Admin Access

The admin Discord ID is hardcoded as `953964672917336074` in `src/auth/discord.ts`. To change:

```ts
export const ADMIN_DISCORD_ID = 'YOUR_DISCORD_USER_ID';
```

(Get your Discord User ID via Discord Settings → Advanced → Developer Mode → right-click your name → Copy ID.)

The "Login as Admin (Mock)" button is hidden on the login screen unless:
- The URL has `?admin` query parameter (e.g., `https://yoursite.com/?admin`)
- localStorage already has an admin session

This way regular players never see the admin button.

---

## How Saves Work

Each user's game state is saved to `localStorage` keyed by their Discord user ID (`qliphoth_state_<id>`). Auto-saves debounce every 500ms.

**Limitations:**
- Saves only exist on the browser they were created in
- Clearing browser data deletes the save
- No cloud sync between devices unless you add a backend

If you want **true cross-device cloud saves**, you'd need a backend (Firebase, Supabase, or your own server) — the current code uses localStorage only.

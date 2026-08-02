# Qliphoth Backend (Cloudflare Workers + D1)

Stores real player identities and competitive scores so "My Bracket" and
"Points Ranking" in the game can show actual players instead of generated NPCs.

## One-time setup

```bash
npm install
npx wrangler login
```

### 1. Create the D1 database

```bash
npx wrangler d1 create qliphoth-db
```

This prints a `database_id`. Copy it into `wrangler.json`, replacing
`REPLACE_WITH_YOUR_DATABASE_ID`.

### 2. Initialize the schema

```bash
npm run db:init
```

(Use `npm run db:init:local` first if you want to test locally with `wrangler dev` before touching the remote DB.)

### 3. Set your allowed origin

In `wrangler.json`, set `vars.ALLOWED_ORIGIN` to the exact URL of your deployed
frontend (e.g. `https://qliphoth.pages.dev`), no trailing slash. This is required —
without it, the browser will block the frontend's requests to this API (CORS).

### 4. Deploy

```bash
npm run deploy
```

Wrangler will print your Worker's URL, e.g. `https://qliphoth-backend.<your-subdomain>.workers.dev`.

## Wire up the frontend

In the main game project, set this Worker URL as the API base — see
`src/api/competitiveApi.ts` (`API_BASE` constant) in the frontend repo.

## API

All endpoints are JSON. None require an auth header — the same trust model as
the existing Discord OAuth implicit-grant flow (client-reported identity is
trusted as-is). This means scores can theoretically be spoofed by a motivated
client, same as the current localStorage-only setup, just now visible to
other players. Basic validation (ID format, score ceiling, region lock) is in
place to block obviously bogus writes, but this is not designed to resist a
determined attacker.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/player/sync` | Upsert player identity on login |
| POST | `/api/player/region` | Lock in region (one-time, fails if already set) |
| POST | `/api/player/name` | Guest-only display name change |
| POST | `/api/score/submit` | Submit/update a zone score for the current week |
| GET | `/api/bracket?region=&week=&squad=` | Real players in a squad bracket |
| GET | `/api/ranking?region=&week=&userId=` | Top 50 + requesting player's rank |

### Request/response shapes

**POST /api/player/sync**
```json
{ "userId": "953964672917336074", "isGuest": false, "discordUsername": "name", "discordGlobalName": "Display Name", "avatar": "abc123hash" }
→ { "ok": true }
```

**POST /api/player/region**
```json
{ "userId": "...", "region": "NA" }
→ { "ok": true, "region": "NA" }
```
Returns 409 if region is already locked.

**POST /api/player/name** (guest accounts only)
```json
{ "userId": "guest_xyz", "name": "MyNickname" }
→ { "ok": true, "name": "MyNickname" }
```
Returns 403 if called for a non-guest account.

**POST /api/score/submit**
```json
{ "userId": "...", "region": "NA", "week": 202625, "zone": "Fire", "score": 84210, "squad": "Amateur", "merit": 40, "reputation": 1 }
→ { "ok": true }
```
Keeps the max score per (user, region, week, zone) — submitting a lower score than the existing best is a no-op.

**GET /api/bracket?region=NA&week=202625&squad=Amateur**
```json
{ "region": "NA", "week": 202625, "squad": "Amateur", "entries": [
  { "rank": 1, "userId": "...", "name": "PlayerName", "score": 412300, "isGuest": false }
]}
```
Only includes players who have actually submitted a score that week/region — no padding, no NPCs. Can be an empty array.

**GET /api/ranking?region=NA&week=202625&userId=...**
```json
{ "region": "NA", "week": 202625, "total": 134, "top": [ /* up to 50 entries, same shape as bracket */ ],
  "playerEntry": { "rank": 57, "userId": "...", "name": "...", "score": 12000, "isGuest": false, "percentile": "58%" } }
```
`playerEntry` is `null` if the requesting player hasn't submitted a score this week.

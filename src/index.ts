// src/index.ts
import { Hono } from 'hono';
import { DepartmentRoom } from './durableObjects/DepartmentRoom';
import { ReceptionRoom } from './durableObjects/ReceptionRoom';
import { CompetitiveRoom } from './durableObjects/CompetitiveRoom';
import { ExplorationRoom } from './durableObjects/ExplorationRoom';
import { GlobalChat } from './durableObjects/GlobalChat';

// ─── Export Durable Objects ────────────────────────────────────
export { DepartmentRoom, ReceptionRoom, CompetitiveRoom, ExplorationRoom, GlobalChat };

type Env = {
  DEPARTMENT_ROOM: DurableObjectNamespace;
  RECEPTION_ROOM: DurableObjectNamespace;
  COMPETITIVE_ROOM: DurableObjectNamespace;
  EXPLORATION_ROOM: DurableObjectNamespace;
  GLOBAL_CHAT: DurableObjectNamespace;
  DB: D1Database; // optional, if you have D1
};

const app = new Hono<{ Bindings: Env }>();

// ─── Room endpoints ────────────────────────────────────────────
app.get('/room/:type/:roomId', async (c) => {
  const type = c.req.param('type');
  const roomId = c.req.param('roomId');

  let namespace: DurableObjectNamespace | undefined;
  switch (type) {
    case 'department':
      namespace = c.env.DEPARTMENT_ROOM;
      break;
    case 'reception':
      namespace = c.env.RECEPTION_ROOM;
      break;
    case 'competitive':
      namespace = c.env.COMPETITIVE_ROOM;
      break;
    case 'exploration':
      namespace = c.env.EXPLORATION_ROOM;
      break;
    default:
      return new Response('Invalid room type', { status: 400 });
  }

  const id = namespace.idFromName(roomId);
  const stub = namespace.get(id);
  return stub.fetch(c.req.raw);
});

// ─── Global Chat ───────────────────────────────────────────────
app.get('/global', async (c) => {
  const id = c.env.GLOBAL_CHAT.idFromName('global');
  const stub = c.env.GLOBAL_CHAT.get(id);
  return stub.fetch(c.req.raw);
});

// ─── Competitive / Sync Stub Endpoints ────────────────────────
// These are used by the frontend competitive API.
// They return success to avoid 404 errors while offline mode handles actual persistence.

app.post('/api/sync', async (c) => {
  // Frontend syncs player data (score, region, etc.)
  // We just acknowledge to avoid 404.
  return c.json({ success: true, message: 'Sync accepted (stub)' });
});

app.post('/api/region', async (c) => {
  // Frontend sets the player region.
  // If you want to persist, you could use D1 here.
  return c.json({ success: true });
});

app.post('/api/score', async (c) => {
  // Frontend submits a score.
  return c.json({ success: true });
});

app.post('/api/bracket', async (c) => {
  // For fetching bracket data – we can return mock or forward to CompetitiveRoom?
  // We'll return a stub.
  return c.json({ entries: [] });
});

app.post('/api/ranking', async (c) => {
  return c.json({ top: [], playerEntry: null });
});

// You can add any other endpoints that might be called by the frontend.
// For example, if it calls /api/leaderboard, /api/player, etc.

// ─── Health Check ──────────────────────────────────────────────
app.get('/health', (c) => c.text('OK'));

// ─── Fallback 404 ──────────────────────────────────────────────
app.all('*', (c) => c.text('Not found', 404));

export default app;

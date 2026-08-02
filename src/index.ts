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
  DB: D1Database;
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

// ─── Player Sync Endpoints ─────────────────────────────────────

// This is the specific route the frontend calls:
app.post('/api/player/sync', async (c) => {
  // Return a sample player object so the sync succeeds.
  // In a real implementation, you'd save the data to D1.
  return c.json({
    success: true,
    player: {
      id: 'current_user',
      name: 'Player',
      score: 12500,
      lives: 5,
      wins: 10,
      losses: 3,
      region: 'NA',
      squad: 'Amateur',
      merit: 50,
      reputation: 1,
    },
  });
});

// ─── Other Competitive / Sync Stub Endpoints ─────────────────
app.post('/api/sync', async (c) => {
  return c.json({ success: true, message: 'Sync accepted (stub)' });
});

app.post('/api/region', async (c) => {
  return c.json({ success: true });
});

app.post('/api/score', async (c) => {
  return c.json({ success: true });
});

app.post('/api/bracket', async (c) => {
  // Sample bracket data
  const sampleBracket = [
    { rank: 1, userId: 'user_1', name: 'PlayerOne', score: 12500, isGuest: false },
    { rank: 2, userId: 'user_2', name: 'ShadowStrike', score: 11200, isGuest: false },
    { rank: 3, userId: 'user_3', name: 'LunarBlade', score: 9800, isGuest: false },
    { rank: 4, userId: 'user_4', name: 'CrimsonReaper', score: 8700, isGuest: false },
    { rank: 5, userId: 'user_5', name: 'EclipseSage', score: 7600, isGuest: false },
    { rank: 6, userId: 'user_6', name: 'VoidWalker', score: 6500, isGuest: false },
    { rank: 7, userId: 'user_7', name: 'Dawnbreaker', score: 5400, isGuest: false },
    { rank: 8, userId: 'user_8', name: 'Frostbite', score: 4300, isGuest: false },
    { rank: 9, userId: 'user_9', name: 'Nightshade', score: 3200, isGuest: false },
    { rank: 10, userId: 'user_10', name: 'StellarForge', score: 2100, isGuest: false },
  ];
  return c.json({ entries: sampleBracket });
});

app.post('/api/ranking', async (c) => {
  const sampleTop = [
    { rank: 1, userId: 'user_1', name: 'PlayerOne', score: 12500, percentile: 'Top 1%' },
    { rank: 2, userId: 'user_2', name: 'ShadowStrike', score: 11200, percentile: 'Top 2%' },
    { rank: 3, userId: 'user_3', name: 'LunarBlade', score: 9800, percentile: 'Top 3%' },
    { rank: 4, userId: 'user_4', name: 'CrimsonReaper', score: 8700, percentile: 'Top 5%' },
    { rank: 5, userId: 'user_5', name: 'EclipseSage', score: 7600, percentile: 'Top 7%' },
  ];
  const samplePlayer = {
    rank: 3,
    userId: 'current_user',
    name: 'You',
    score: 9800,
    isGuest: false,
    percentile: 'Top 3%',
  };
  return c.json({ top: sampleTop, playerEntry: samplePlayer });
});

// ─── Health Check ──────────────────────────────────────────────
app.get('/health', (c) => c.text('OK'));

// ─── Fallback 404 ──────────────────────────────────────────────
app.all('*', (c) => c.text('Not found', 404));

export default app;

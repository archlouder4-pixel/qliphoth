import { Hono } from 'hono';
import { DepartmentRoom } from './durableObjects/DepartmentRoom';
import { ReceptionRoom } from './durableObjects/ReceptionRoom';
import { CompetitiveRoom } from './durableObjects/CompetitiveRoom';
import { ExplorationRoom } from './durableObjects/ExplorationRoom';
import { GlobalChat } from './durableObjects/GlobalChat';

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
    case 'department': namespace = c.env.DEPARTMENT_ROOM; break;
    case 'reception': namespace = c.env.RECEPTION_ROOM; break;
    case 'competitive': namespace = c.env.COMPETITIVE_ROOM; break;
    case 'exploration': namespace = c.env.EXPLORATION_ROOM; break;
    default: return new Response('Invalid room type', { status: 400 });
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

// ─── Player Sync Stub ──────────────────────────────────────────
app.post('/api/player/sync', async (c) => {
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

// ─── Other Competitive API stubs ──────────────────────────────
app.post('/api/sync', async (c) => c.json({ success: true }));
app.post('/api/region', async (c) => c.json({ success: true }));
app.post('/api/score', async (c) => c.json({ success: true }));

app.post('/api/bracket', async (c) => {
  return c.json({
    entries: [
      { rank: 1, userId: 'user_1', name: 'PlayerOne', score: 12500, isGuest: false },
      { rank: 2, userId: 'user_2', name: 'ShadowStrike', score: 11200, isGuest: false },
      // ... more mock entries
    ]
  });
});

app.post('/api/ranking', async (c) => {
  return c.json({
    top: [
      { rank: 1, userId: 'user_1', name: 'PlayerOne', score: 12500, percentile: 'Top 1%' },
      { rank: 2, userId: 'user_2', name: 'ShadowStrike', score: 11200, percentile: 'Top 2%' },
    ],
    playerEntry: { rank: 3, userId: 'current_user', name: 'You', score: 9800, isGuest: false, percentile: 'Top 3%' }
  });
});

// ─── Health ────────────────────────────────────────────────────
app.get('/health', (c) => c.text('OK'));

// ─── Catch-all ─────────────────────────────────────────────────
app.all('*', (c) => c.text('Not found', 404));

export default app;

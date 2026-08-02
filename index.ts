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

app.get('/health', (c) => c.text('OK'));

export default app;
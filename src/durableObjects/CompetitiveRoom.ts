import { DurableObject } from 'cloudflare:workers';
import { CompetitiveRoomState } from '../types';
import { SQUAD_INFO, getSquadByPoints } from '../data/competitive';

export class CompetitiveRoom extends DurableObject {
  private state: CompetitiveRoomState;
  private storageKey = 'competitiveState';

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.state = {
      players: [],
      hostId: null,
      currentWeek: 1,
      zoneScores: {},
      completedZones: [],
      merit: 0,
      reputation: 0,
      squad: 'Beginner',
      region: '',
    };
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<CompetitiveRoomState>(this.storageKey);
      if (stored) this.state = stored;
    });
  }

  private async saveState() {
    await this.ctx.storage.put(this.storageKey, this.state);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === '/state') {
      return Response.json(this.state);
    }

    if (url.pathname === '/submitScore' && request.method === 'POST') {
      const body = await request.json() as any;
      const { zone, score } = body;
      this.state.zoneScores[zone] = Math.max(this.state.zoneScores[zone] || 0, score);
      if (!this.state.completedZones.includes(zone)) {
        this.state.completedZones.push(zone);
        this.state.merit = Math.min(100, this.state.merit + 10);
        if (this.state.completedZones.length === 3) {
          this.state.reputation = Math.min(2, this.state.reputation + 1);
        }
      }
      const totalPoints = Object.values(this.state.zoneScores).reduce((a, b) => a + b, 0);
      this.state.squad = getSquadByPoints(totalPoints);
      await this.saveState();
      return Response.json({ success: true });
    }

    if (url.pathname === '/getBracket') {
      // Generate bracket entries based on state
      const entries = this.generateBracket();
      return Response.json({ entries });
    }

    if (url.pathname === '/getRanking') {
      const ranking = this.generateRanking();
      return Response.json(ranking);
    }

    return new Response('Not found', { status: 404 });
  }

  private generateBracket() {
    // In production, this would read from a database. For demo, we generate mock entries.
    const entries = [];
    const names = ['PlayerA', 'PlayerB', 'PlayerC', 'PlayerD', 'PlayerE', 'PlayerF', 'PlayerG', 'PlayerH', 'PlayerI', 'PlayerJ'];
    for (let i = 0; i < 10; i++) {
      const score = Math.floor(Math.random() * 10000) + 500;
      entries.push({
        rank: i + 1,
        userId: `user_${i}`,
        name: names[i % names.length],
        score: score,
        isGuest: true,
      });
    }
    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);
    entries.forEach((e, i) => e.rank = i + 1);
    return entries;
  }

  private generateRanking() {
    // Similar mock data
    const top = this.generateBracket().slice(0, 5);
    const playerEntry = {
      rank: 3,
      userId: 'current_user',
      name: 'You',
      score: 5000,
      isGuest: false,
      percentile: 'Top 5%',
    };
    return { top, playerEntry };
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
    // Handle actions like promoteSquad, consumeReputation, etc.
    if (data.type === 'promoteSquad') {
      if (this.state.squad === 'Expert' && this.state.merit >= 100) {
        this.state.squad = 'Professional';
        this.state.merit = 0;
        await this.saveState();
        this.broadcastState();
        ws.send(JSON.stringify({ type: 'promoteSuccess', squad: this.state.squad }));
      }
    }
    if (data.type === 'consumeReputation') {
      if (this.state.reputation > 0) {
        this.state.reputation -= 1;
        // Lock squad – we'll just store a flag
        await this.saveState();
        this.broadcastState();
        ws.send(JSON.stringify({ type: 'consumeSuccess' }));
      }
    }
  }

  private broadcastState() {
    for (const [ws, _] of this.ctx.getWebSockets()) {
      ws.send(JSON.stringify({ type: 'stateUpdate', state: this.state }));
    }
  }
}
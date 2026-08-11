// src/durableObjects/GlobalChat.ts
import { DurableObject } from 'cloudflare:workers';

export interface ChatMessage {
  user: string;
  text: string;
  timestamp: number;
}

export class GlobalChat extends DurableObject {
  private messages: ChatMessage[] = [];
  private maxMessages = 100;
  private storageKey = 'chatMessages';

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    // Load persisted messages on instantiation
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<ChatMessage[]>(this.storageKey);
      if (stored && stored.length > 0) {
        this.messages = stored;
      }
    });
  }

  private async saveMessages() {
    await this.ctx.storage.put(this.storageKey, this.messages);
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);

      // Send recent messages to the new client
      for (const msg of this.messages) {
        server.send(JSON.stringify({ type: 'chat', ...msg }));
      }

      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response('Not found', { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));

    if (data.type === 'chat') {
      const msg: ChatMessage = {
        user: data.user || 'Anonymous',
        text: data.text || '',
        timestamp: Date.now(),
      };
      this.messages.push(msg);
      if (this.messages.length > this.maxMessages) {
        this.messages = this.messages.slice(-this.maxMessages);
      }

      // ✅ Persist to storage so history survives hibernation
      await this.saveMessages();

      // ✅ Broadcast to all connected WebSockets (fixed: direct iteration)
      const payload = JSON.stringify({ type: 'chat', ...msg });
      for (const otherWs of this.ctx.getWebSockets()) {
        otherWs.send(payload);
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    // No cleanup needed – messages remain in storage
  }
}

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

      // ✅ Send history as a single batch (type: 'history')
      if (this.messages.length > 0) {
        server.send(JSON.stringify({
          type: 'history',
          messages: this.messages,
        }));
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

      await this.saveMessages();

      // Broadcast to all connected clients
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

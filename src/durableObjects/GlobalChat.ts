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
      // Broadcast to all connected clients
      for (const [otherWs, _] of this.ctx.getWebSockets()) {
        otherWs.send(JSON.stringify({ type: 'chat', ...msg }));
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    // No cleanup needed
  }
}
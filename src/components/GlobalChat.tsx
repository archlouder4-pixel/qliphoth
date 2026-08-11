// src/components/GlobalChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../store/gameStore';
import { useAuth } from '../auth/AuthContext';
import { getDisplayName } from '../auth/discord';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://qliphoth-backend.archlouder4.workers.dev';

export default function GlobalChat() {
  const { user } = useAuth();
  const { chatMessages, chatUnread, chatOpen, addChatMessage, markChatRead, toggleChat, setChatOpen } = useGameStore();
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const lastMessageTimestampRef = useRef<number>(0);

  // ─── Connect WebSocket ──────────────────────────────────────────────
  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const wsUrl = SERVER_URL.replace(/^https?:\/\//, '');
    const ws = new WebSocket(`wss://${wsUrl}/global`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Global chat connected');
      setIsConnected(true);
      setReconnectAttempts(0);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'history') {
          // ✅ History batch – add messages without incrementing unread
          const newMessages = data.messages || [];
          for (const msg of newMessages) {
            // Skip if already in store (prevent duplicates)
            const exists = chatMessages.some(m => m.timestamp === msg.timestamp && m.user === msg.user && m.text === msg.text);
            if (!exists) {
              // Add without incrementing unread
              useGameStore.setState((state) => ({
                chatMessages: [...state.chatMessages, msg].slice(-100),
              }));
            }
          }
          // Update last timestamp
          if (newMessages.length > 0) {
            const last = newMessages[newMessages.length - 1];
            lastMessageTimestampRef.current = last.timestamp;
          }
        } else if (data.type === 'chat') {
          // ✅ Real‑time new message – increment unread if chat is closed
          const msg = { user: data.user, text: data.text, timestamp: data.timestamp };
          // Deduplicate by timestamp
          const exists = chatMessages.some(m => m.timestamp === msg.timestamp && m.user === msg.user && m.text === msg.text);
          if (!exists) {
            addChatMessage(msg);
          }
        }
      } catch (err) {
        console.error('Failed to parse chat message:', err);
      }
    };

    ws.onclose = () => {
      console.log('Global chat closed, reconnecting...');
      setIsConnected(false);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts));
      reconnectTimeoutRef.current = setTimeout(() => {
        setReconnectAttempts(prev => prev + 1);
        connectWebSocket();
      }, delay);
    };

    ws.onerror = (err) => {
      console.error('Chat WebSocket error:', err);
    };
  };

  // ─── Disconnect ──────────────────────────────────────────────────────
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // ─── Send message ────────────────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim() || !isConnected) return;
    wsRef.current?.send(JSON.stringify({
      type: 'chat',
      user: getDisplayName(user),
      text: input.trim(),
    }));
    setInput('');
  };

  // ─── Auto-scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ─── Mark read when chat opens ──────────────────────────────────────
  useEffect(() => {
    if (chatOpen && chatUnread > 0) {
      markChatRead();
    }
  }, [chatOpen]);

  // ─── Connect on mount ──────────────────────────────────────────────
  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
  }, []);

  // ─── Reconnect on visibility change ────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !wsRef.current) {
        connectWebSocket();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* ─── Toggle Button with Badge ──────────────────────────────── */}
      <button
        onClick={toggleChat}
        className="relative bg-cyan-600 hover:bg-cyan-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
      >
        <span className="text-xl">💬</span>
        {chatUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {chatUnread > 99 ? '99+' : chatUnread}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900" />
        )}
        {isConnected && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
        )}
      </button>

      {/* ─── Chat Panel ──────────────────────────────────────────────── */}
      {chatOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[400px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800/50">
            <span className="text-sm font-bold text-cyan-400">
              💬 Global Chat
              {!isConnected && <span className="ml-2 text-xs text-red-400">(disconnected)</span>}
            </span>
            <button
              onClick={() => setChatOpen(false)}
              className="text-gray-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-4">No messages yet. Say hello! 👋</p>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="text-cyan-400 font-bold">{msg.user}:</span>
                  <span className="text-gray-300 ml-2 break-words">{msg.text}</span>
                  <span className="text-[10px] text-gray-500 ml-2">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-700 p-2 flex gap-2 bg-gray-800/30">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isConnected ? 'Type a message...' : 'Reconnecting...'}
              disabled={!isConnected}
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-400 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!isConnected || !input.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-sm transition"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

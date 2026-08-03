// src/components/GlobalChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getDisplayName } from '../auth/discord';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://qliphoth-backend.archlouder4.workers.dev';

interface ChatMessage {
  user: string;
  text: string;
  timestamp: number;
}

export default function GlobalChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    const wsUrl = SERVER_URL.replace(/^https?:\/\//, '');
    const ws = new WebSocket(`wss://${wsUrl}/global`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Global chat connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          // Previously this appended via `setMessages(prev => [...])` and
          // then separately checked `if (messages.length > 50)` to trim —
          // but `messages` there was the value captured when `connect()`
          // was first called at mount (this handler is bound once), so it
          // was permanently 0 and the 50-message cap never actually
          // triggered. Do the append AND the cap in one functional update
          // so it's always based on the real current list.
          setMessages(prev => [...prev, { user: data.user, text: data.text, timestamp: data.timestamp }].slice(-50));
        }
      } catch (err) {
        console.error('Chat parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('Global chat closed, reconnecting...');
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
    };

    ws.onerror = (err) => {
      console.error('Chat WebSocket error:', err);
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('Chat not connected.');
      return;
    }
    wsRef.current.send(JSON.stringify({
      type: 'chat',
      user: user ? getDisplayName(user) : 'Guest',
      text: input.trim(),
    }));
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') sendMessage();
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const displayName = user ? getDisplayName(user) : 'Guest';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-cyan-500 text-white shadow-lg hover:bg-cyan-600 transition flex items-center justify-center text-2xl"
        title="Global Chat"
      >
        💬
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <span className="text-sm font-bold text-cyan-400">💬 Global Chat</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-sm">
            {messages.length === 0 && (
              <p className="text-gray-500 text-center text-xs">No messages yet. Be the first!</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="border-b border-gray-800 pb-1">
                <span className="text-cyan-400 font-bold">{msg.user}</span>
                <span className="text-gray-500 text-xs ml-2">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                <p className="text-gray-300 break-words">{msg.text}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-2 bg-gray-800 border-t border-gray-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Chat as ${displayName}`}
              className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={sendMessage}
              className="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition text-sm"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// src/components/NotificationToast.tsx
import React from 'react';
import useGameStore from '../store/gameStore';

export default function NotificationToast() {
  const { notifications, removeNotification } = useGameStore();
  if (notifications.length === 0) return null;
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2 pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`pointer-events-auto px-6 py-3 rounded-lg shadow-2xl text-white font-bold text-center max-w-md mx-auto transition-all duration-500 ${
            notif.type === 'success' ? 'bg-green-600' :
            notif.type === 'warning' ? 'bg-amber-600' :
            notif.type === 'danger' ? 'bg-red-600' :
            'bg-blue-600'
          }`}
          style={{ animation: 'slideDown 0.3s ease-out' }}
        >
          {notif.message}
          <button
            onClick={() => removeNotification(notif.id)}
            className="ml-4 text-white/80 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

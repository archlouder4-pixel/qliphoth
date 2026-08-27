// src/components/MeltdownTimer.tsx
import React, { useState, useEffect } from 'react';

interface MeltdownTimerProps {
  expiry: number | null;
}

export default function MeltdownTimer({ expiry }: MeltdownTimerProps) {
  if (!expiry) return null;

  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((expiry - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiry]);

  return (
    <span className={`text-sm font-mono ${timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>
      {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
    </span>
  );
}

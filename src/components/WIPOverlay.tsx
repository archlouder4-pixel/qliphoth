// components/WIPOverlay.tsx
import React from 'react';

interface WIPOverlayProps {
  blocked: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export function WIPOverlay({
  blocked,
  children,
  message = '🚧 Work in Progress',
  className = '',
}: WIPOverlayProps) {
  if (!blocked) return <>{children}</>;

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none opacity-40 blur-sm select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg z-10">
        <div className="text-center p-6 max-w-md animate-pulse">
          <div className="text-6xl mb-4">🛠️</div>
          <h2 className="text-2xl font-mono font-bold text-amber-400 tracking-wider">
            {message}
          </h2>
          <p className="text-sm text-gray-300 mt-2 font-mono">
            This feature is currently under development.<br />
            Please check back later.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
// ui.tsx – Shared UI components used by DepartmentView (and possibly others)
import React from 'react';

interface TacticalPanelProps {
  variant?: 'default' | 'accent' | 'primary';
  header?: string;
  children: React.ReactNode;
  className?: string;
}

export const TacticalPanel: React.FC<TacticalPanelProps> = ({
  variant = 'default',
  header,
  children,
  className = '',
}) => {
  const borderColor = variant === 'accent' ? 'border-cyan-500/30' : variant === 'primary' ? 'border-amber-500/30' : 'border-gray-700';
  const bgColor = variant === 'accent' ? 'bg-cyan-950/30' : variant === 'primary' ? 'bg-amber-950/30' : 'bg-gray-900/50';
  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-4 ${className}`}>
      {header && <h3 className="text-sm font-mono font-semibold text-gray-300 mb-3">{header}</h3>}
      {children}
    </div>
  );
};

interface TacticalButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({
  variant = 'primary',
  onClick,
  children,
  className = '',
  disabled = false,
}) => {
  const variantClasses = {
    primary: 'border-cyan-400 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20',
    secondary: 'border-gray-600 bg-gray-700/30 text-gray-300 hover:bg-gray-700/50',
    danger: 'border-rose-400 bg-rose-400/10 text-rose-400 hover:bg-rose-400/20',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded border font-mono text-sm transition-all ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

interface TacticalProgressProps {
  value: number;
  max: number;
  label?: string;
  className?: string;
}

export const TacticalProgress: React.FC<TacticalProgressProps> = ({
  value,
  max,
  label,
  className = '',
}) => {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div className={`mt-2 ${className}`}>
      {label && <span className="text-xs text-gray-400">{label}</span>}
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-gray-500">{value} / {max}</span>
    </div>
  );
};
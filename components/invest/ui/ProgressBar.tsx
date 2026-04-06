'use client';

interface ProgressBarProps {
  value: number;       // 0–100
  label?: string;
  color?: string;
  height?: string;
  showPercent?: boolean;
}

export function ProgressBar({ value, label, color = 'bg-gold/80', height = 'h-2', showPercent = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between mb-1">
          {label && <span className="font-pixel text-[9px] text-[var(--text-muted)]">{label}</span>}
          {showPercent && <span className="font-pixel text-[9px] text-[var(--text-muted)]">{pct}%</span>}
        </div>
      )}
      <div className={`${height} bg-black/50 rounded overflow-hidden`}>
        <div
          className={`${height} ${color} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

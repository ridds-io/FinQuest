'use client';

interface ProgressBarProps {
  value: number;          // 0–100
  label?: string;
  color?: string;         // tailwind bg class, e.g. 'bg-blue-400'
  showPercent?: boolean;
}

export function ProgressBar({ value, label, color = 'bg-gold', showPercent = false }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      {(label || showPercent) && (
        <div className="flex justify-between items-center">
          {label && <span className="font-pixel text-[9px] text-[var(--text-muted)]">{label}</span>}
          {showPercent && <span className="font-pixel text-[9px] text-[var(--text-muted)]">{clamped}%</span>}
        </div>
      )}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

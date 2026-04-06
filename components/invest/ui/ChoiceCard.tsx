'use client';

interface ChoiceCardProps {
  label: string;
  description?: string;
  badge?: string;          // e.g. "Low Risk", "High Return"
  badgeColor?: string;     // tailwind text colour class
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function ChoiceCard({ label, description, badge, badgeColor = 'text-gold', selected = false, disabled = false, onClick }: ChoiceCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'w-full text-left p-4 rounded-lg border-2 transition-all duration-150',
        selected
          ? 'border-green-500 bg-green-500/15 shadow-lg shadow-green-500/10'
          : disabled
            ? 'border-white/10 bg-white/3 opacity-40 cursor-not-allowed'
            : 'border-white/15 bg-white/5 hover:border-gold/50 hover:bg-white/10',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {selected && <span className="text-green-400 text-xs">✓</span>}
            <span className="font-pixel text-xs text-[var(--text)]">{label}</span>
          </div>
          {description && (
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
          )}
        </div>
        {badge && (
          <span className={`font-pixel text-[9px] ${badgeColor} bg-black/30 px-2 py-0.5 rounded flex-shrink-0`}>
            {badge}
          </span>
        )}
      </div>
    </button>
  );
}

'use client';

interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  unit?: string;
  color?: string;          // e.g. '#3b82f6'
  disabled?: boolean;
}

export function Slider({ label, value, min = 0, max = 100, step = 1, onChange, unit = '%', color = '#FFD700', disabled = false }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="font-pixel text-[9px] text-[var(--text-muted)] uppercase">{label}</span>
        <span className="font-pixel text-xs text-gold">{value}{unit}</span>
      </div>
      <div className="relative">
        <div className="h-2 bg-black/50 rounded overflow-hidden">
          <div
            className="h-full rounded transition-all duration-150"
            style={{ width: `${pct}%`, background: color, opacity: disabled ? 0.4 : 1 }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
      </div>
    </div>
  );
}

'use client';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'take' | 'reject';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: Variant;
  className?: string;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:   'bg-gold text-[var(--dark)] hover:-translate-y-0.5 active:translate-y-0',
  secondary: 'bg-blue-600 text-white hover:-translate-y-0.5 active:translate-y-0',
  danger:    'bg-red-500/20 text-red-200 border border-red-500/40 hover:bg-red-500/30',
  ghost:     'bg-white/10 border border-white/20 text-[var(--text)] hover:border-gold/50 hover:text-gold',
  take:      'bg-green-600/80 text-white border border-green-400/50 hover:bg-green-500 hover:-translate-y-0.5',
  reject:    'bg-red-600/80 text-white border border-red-400/50 hover:bg-red-500 hover:-translate-y-0.5',
};

export function Button({ children, onClick, disabled = false, variant = 'primary', className = '', fullWidth = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'font-pixel text-xs px-4 py-2 rounded transition-all duration-150',
        VARIANT_STYLES[variant],
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

'use client';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ title, onClose, children, maxWidth = 'max-w-2xl' }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[220] p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className={`bg-[var(--dark2)] border-2 border-[var(--panel-border)] rounded-lg w-full ${maxWidth} max-h-[95vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--panel-border)] sticky top-0 bg-[var(--dark2)] z-10 flex-shrink-0">
          <span className="font-pixel text-gold text-sm">{title}</span>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-red-400 text-xl ml-4">✕</button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

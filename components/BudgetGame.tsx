'use client';

import { useEffect, useRef, useState } from 'react';

interface BudgetGameProps {
  onClose: () => void;
  onComplete: (score: number, xp: number, gold: number) => void;
}

type Category = 'needs' | 'wants' | 'savings' | 'pool';

interface Expense {
  id: string;
  icon: string;
  name: string;
  amount: number;
  correct: Category;
  description: string;
}

const HARDCODED_EXPENSES: Expense[] = [
  { id: 'rent',      icon: '🏠', name: 'PG Rent',       amount: 5000, correct: 'needs',   description: 'Monthly Pune PG' },
  { id: 'groceries', icon: '🛒', name: 'Groceries',     amount: 2000, correct: 'needs',   description: 'Weekly supplies' },
  { id: 'mobile',    icon: '📱', name: 'Mobile Bill',   amount: 299,  correct: 'needs',   description: 'Jio recharge' },
  { id: 'bus',       icon: '🚌', name: 'Bus/Ola',       amount: 800,  correct: 'needs',   description: 'Daily commute' },
  { id: 'textbooks', icon: '📚', name: 'Textbooks',     amount: 600,  correct: 'needs',   description: 'Sem materials' },
  { id: 'chai',      icon: '☕', name: 'Daily Chai',    amount: 600,  correct: 'wants',   description: '₹20/day × 30' },
  { id: 'ott',       icon: '🎬', name: 'Netflix/OTT',  amount: 499,  correct: 'wants',   description: 'Entertainment' },
  { id: 'dining',    icon: '🍕', name: 'Eating Out',    amount: 800,  correct: 'wants',   description: 'Weekend treats' },
  { id: 'gaming',    icon: '🎮', name: 'Game Credits',  amount: 300,  correct: 'wants',   description: 'Battle passes' },
  { id: 'gym',       icon: '💪', name: 'Gym Fee',       amount: 500,  correct: 'wants',   description: 'Campus gym' },
  { id: 'sip',       icon: '📈', name: 'SIP Fund',      amount: 2000, correct: 'savings', description: 'Monthly invest' },
  { id: 'emergency', icon: '🚨', name: 'Emergency',     amount: 1000, correct: 'savings', description: 'Safety buffer' },
];

const TOTAL_INCOME = 15000;
const TARGETS = { needs: 7500, wants: 4500, savings: 3000 };
const LABELS = {
  needs:   { label: 'NEEDS',   pct: '50%', color: 'border-red-400/50',   bg: 'bg-red-500/10',   text: 'text-red-400',   bar: 'bg-red-400' },
  wants:   { label: 'WANTS',   pct: '30%', color: 'border-blue-400/50',  bg: 'bg-blue-500/10',  text: 'text-blue-300',  bar: 'bg-blue-400' },
  savings: { label: 'SAVINGS', pct: '20%', color: 'border-green-400/50', bg: 'bg-green-500/10', text: 'text-green-400', bar: 'bg-green-400' },
};

export function BudgetGame({ onClose, onComplete }: BudgetGameProps) {
  const [expenses, setExpenses] = useState<Expense[]>(HARDCODED_EXPENSES);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [placed, setPlaced] = useState<Record<string, Category>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Category | null>(null);
  const [result, setResult] = useState<{
    correct: number; total: number; xp: number; gold: number; feedback: string[];
  } | null>(null);
  const [showHint, setShowHint] = useState<string | null>(null);
  const dragSrc = useRef<Category | 'pool'>('pool');

  useEffect(() => {
    fetch('/api/generate-expenses')
      .then(r => r.json())
      .then((data) => {
        if (data.expenses && Array.isArray(data.expenses) && data.expenses.length === 12) {
          setExpenses(data.expenses);
        }
      })
      .catch(() => {}) // silently fall back to hardcoded
      .finally(() => setLoadingExpenses(false));
  }, []);

  // ── totals per category ──
  const totals = { needs: 0, wants: 0, savings: 0 };
  Object.entries(placed).forEach(([id, cat]) => {
    if (cat !== 'pool') {
      const exp = expenses.find(e => e.id === id);
      if (exp) totals[cat] += exp.amount;
    }
  });

  const poolItems = expenses.filter(e => !placed[e.id] || placed[e.id] === 'pool');
  const catItems = (cat: Category) =>
    expenses.filter(e => placed[e.id] === cat);

  // ── drag handlers ──
  const onDragStart = (id: string, from: Category | 'pool') => {
    setDragId(id);
    dragSrc.current = from;
  };

  const onDrop = (e: React.DragEvent, to: Category | 'pool') => {
    e.preventDefault();
    if (!dragId) return;
    setPlaced(prev => ({ ...prev, [dragId]: to }));
    setDragId(null);
    setDragOver(null);
  };

  // ── touch drag (mobile) ──
  const onTouchDrop = (id: string, to: Category) => {
    setPlaced(prev => ({ ...prev, [id]: to }));
  };

  // ── check results ──
  const checkBudget = () => {
    let correct = 0;
    const feedback: string[] = [];
    expenses.forEach(exp => {
      if (placed[exp.id] === exp.correct) {
        correct++;
      } else if (placed[exp.id] && placed[exp.id] !== 'pool') {
        feedback.push(`${exp.icon} ${exp.name} → should be ${exp.correct.toUpperCase()}`);
      }
    });
    const pct = Math.round((correct / expenses.length) * 100);
    const xp = Math.round((correct / expenses.length) * 120);
    const gold = xp * 2;
    setResult({ correct, total: expenses.length, xp, gold, feedback });
  };

  const reset = () => {
    setPlaced({});
    setResult(null);
  };

  // ── progress bar fill ──
  const fillPct = (cat: 'needs' | 'wants' | 'savings') =>
    Math.min(100, Math.round((totals[cat] / TARGETS[cat]) * 100));

  const overBudget = (cat: 'needs' | 'wants' | 'savings') => totals[cat] > TARGETS[cat];

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[200] p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--dark2)] border-2 border-[var(--panel-border)] rounded-lg w-full max-w-3xl max-h-[95vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--panel-border)] sticky top-0 bg-[var(--dark2)] z-10">
          <div>
            <div className="font-pixel text-gold text-sm">🛒 Market — 50/30/20 Budget</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              Monthly income: <span className="text-gold font-semibold">₹{TOTAL_INCOME.toLocaleString('en-IN')}</span>
              {' · '}Drag expenses into the right bucket
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-red-400 text-xl ml-4">✕</button>
        </div>

        {!result ? (
          <div className="p-4 space-y-4">
            {loadingExpenses && (
              <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                <div className="font-pixel text-[10px] text-[var(--text-muted)] text-center">
                  Generating your budget...
                </div>
              </div>
            )}
            {/* Goal bar */}
            <div className="bg-[var(--panel)] rounded-lg p-3 border border-[var(--panel-border)]">
              <div className="font-pixel text-[10px] text-gold mb-2 text-center">
                GOAL: Save ₹{TARGETS.savings.toLocaleString('en-IN')} this month
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['needs', 'wants', 'savings'] as const).map(cat => {
                  const cfg = LABELS[cat];
                  const over = overBudget(cat);
                  return (
                    <div key={cat} className="text-center">
                      <div className={`font-pixel text-[9px] mb-1 ${cfg.text}`}>
                        {cfg.label} {cfg.pct}
                      </div>
                      <div className="h-2 bg-black/50 rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all duration-300 ${over ? 'bg-red-500' : cfg.bar}`}
                          style={{ width: `${fillPct(cat)}%` }}
                        />
                      </div>
                      <div className={`font-pixel text-[9px] mt-1 ${over ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                        ₹{totals[cat].toLocaleString('en-IN')} / ₹{TARGETS[cat].toLocaleString('en-IN')}
                        {over && ' ⚠️'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drop zones */}
            <div className="grid grid-cols-3 gap-3">
              {(['needs', 'wants', 'savings'] as const).map(cat => {
                const cfg = LABELS[cat];
                const items = catItems(cat);
                const isOver = dragOver === cat;
                return (
                  <div
                    key={cat}
                    onDragOver={e => { e.preventDefault(); setDragOver(cat); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={e => onDrop(e, cat)}
                    className={`rounded-lg border-2 border-dashed min-h-[120px] p-2 transition-all ${
                      isOver
                        ? 'border-gold bg-gold/10 scale-[1.02]'
                        : `${cfg.color} ${cfg.bg}`
                    }`}
                  >
                    <div className={`font-pixel text-[10px] text-center mb-2 ${cfg.text}`}>
                      {cfg.label}
                      <span className="text-[var(--text-muted)] ml-1">{cfg.pct}</span>
                    </div>
                    <div className="space-y-1.5">
                      {items.map(exp => (
                        <ExpenseChip
                          key={exp.id}
                          exp={exp}
                          from={cat}
                          onDragStart={onDragStart}
                          onReturn={() => setPlaced(prev => ({ ...prev, [exp.id]: 'pool' }))}
                          showHint={showHint === exp.id}
                        />
                      ))}
                      {items.length === 0 && (
                        <div className="text-center text-[var(--text-muted)] text-xs py-4 opacity-50">
                          drop here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expense pool */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver('pool'); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => onDrop(e, 'pool')}
              className={`rounded-lg border border-white/15 p-3 transition-all ${
                dragOver === 'pool' ? 'border-white/40 bg-white/5' : 'bg-black/20'
              }`}
            >
              <div className="font-pixel text-[10px] text-[var(--text-muted)] mb-2">
                📦 EXPENSES TO CATEGORIZE ({poolItems.length} remaining)
              </div>
              <div className="flex flex-wrap gap-2">
                {poolItems.map(exp => (
                  <ExpenseChip
                    key={exp.id}
                    exp={exp}
                    from="pool"
                    onDragStart={onDragStart}
                    onReturn={null}
                    showHint={showHint === exp.id}
                  />
                ))}
                {poolItems.length === 0 && (
                  <div className="text-xs text-green-400 font-pixel py-2">
                    ✅ All expenses categorized!
                  </div>
                )}
              </div>
            </div>

            {/* Mobile tap-to-assign (for touch devices) */}
            {poolItems.length > 0 && (
              <div className="sm:hidden bg-black/30 rounded-lg p-3 border border-white/10">
                <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-2">
                  📱 TAP AN EXPENSE THEN TAP A BUCKET
                </div>
                <MobilePlacer
                  poolItems={poolItems}
                  onPlace={onTouchDrop}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center flex-wrap pt-2">
              <button
                onClick={checkBudget}
                disabled={poolItems.length > 0}
                className="font-pixel text-xs bg-green-600 text-white px-5 py-2.5 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-500 transition"
              >
                {poolItems.length > 0
                  ? `✓ DONE (${poolItems.length} left)`
                  : '✓ CHECK BUDGET'}
              </button>
              <button
                onClick={reset}
                className="font-pixel text-xs bg-red-500/20 text-red-300 border border-red-500/40 px-5 py-2.5 rounded hover:bg-red-500/30 transition"
              >
                ↺ RESET
              </button>
              <button
                onClick={() => setShowHint(showHint ? null : expenses[0]?.id ?? null)}
                className="font-pixel text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40 px-5 py-2.5 rounded hover:bg-blue-500/30 transition"
              >
                ? HINT
              </button>
            </div>
          </div>
        ) : (
          /* Results screen */
          <ResultScreen
            result={result}
            onRetry={reset}
            onContinue={() => {
              onComplete(result.correct, result.xp, result.gold);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Expense chip component ──
function ExpenseChip({
  exp, from, onDragStart, onReturn, showHint
}: {
  exp: Expense;
  from: Category | 'pool';
  onDragStart: (id: string, from: Category | 'pool') => void;
  onReturn: (() => void) | null;
  showHint: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(exp.id, from)}
      className="group flex items-center gap-1.5 bg-white/8 border border-white/15 rounded px-2 py-1.5 cursor-grab active:cursor-grabbing hover:border-gold/60 hover:bg-white/12 transition-all select-none"
      title={exp.description}
    >
      <span className="text-base leading-none">{exp.icon}</span>
      <div className="min-w-0">
        <div className="font-pixel text-[9px] text-[var(--text)] leading-tight truncate max-w-[70px]">
          {exp.name}
        </div>
        <div className="font-pixel text-[9px] text-gold leading-tight">
          ₹{exp.amount.toLocaleString('en-IN')}
        </div>
      </div>
      {onReturn && (
        <button
          onClick={onReturn}
          className="ml-auto text-[var(--text-muted)] hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          title="Return to pool"
        >
          ×
        </button>
      )}
      {showHint && (
        <div className="absolute -top-6 left-0 bg-black/90 border border-gold/40 text-gold font-pixel text-[8px] px-2 py-1 rounded whitespace-nowrap z-20">
          {exp.correct.toUpperCase()}
        </div>
      )}
    </div>
  );
}

// ── Mobile placer (tap-to-assign) ──
function MobilePlacer({
  poolItems, onPlace
}: {
  poolItems: Expense[];
  onPlace: (id: string, cat: Category) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {poolItems.map(exp => (
          <button
            key={exp.id}
            onClick={() => setSelected(selected === exp.id ? null : exp.id)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded border text-xs transition ${
              selected === exp.id
                ? 'border-gold bg-gold/15 text-gold'
                : 'border-white/20 bg-white/5 text-[var(--text)]'
            }`}
          >
            {exp.icon} {exp.name} <span className="text-[var(--text-muted)]">₹{exp.amount}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="flex gap-2">
          <span className="font-pixel text-[9px] text-[var(--text-muted)] self-center">Move to →</span>
          {(['needs', 'wants', 'savings'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => { onPlace(selected, cat); setSelected(null); }}
              className={`font-pixel text-[9px] px-3 py-1.5 rounded border transition ${LABELS[cat].color} ${LABELS[cat].bg} ${LABELS[cat].text}`}
            >
              {LABELS[cat].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Results screen ──
function ResultScreen({
  result, onRetry, onContinue
}: {
  result: { correct: number; total: number; xp: number; gold: number; feedback: string[] };
  onRetry: () => void;
  onContinue: () => void;
}) {
  const pct = Math.round((result.correct / result.total) * 100);
  const grade =
    pct >= 90 ? { label: '🏆 Budget Master!', color: 'text-gold' } :
    pct >= 70 ? { label: '👍 Good Effort!',   color: 'text-green-400' } :
    pct >= 50 ? { label: '📚 Keep Practicing', color: 'text-blue-300' } :
                { label: '💸 Needs Work',      color: 'text-red-400' };

  return (
    <div className="p-6 space-y-5">
      <div className="text-center">
        <div className={`font-pixel text-lg mb-2 ${grade.color}`}>{grade.label}</div>
        <div className="font-pixel text-3xl text-white mb-1">{pct}%</div>
        <div className="text-sm text-[var(--text-muted)]">
          {result.correct} / {result.total} expenses correctly categorized
        </div>
      </div>

      {/* Rewards */}
      <div className="flex gap-3 justify-center">
        <div className="text-center px-4 py-2 bg-blue-500/15 border border-blue-500/30 rounded">
          <div className="font-pixel text-xs text-blue-300">XP EARNED</div>
          <div className="font-pixel text-lg text-blue-200">+{result.xp}</div>
        </div>
        <div className="text-center px-4 py-2 bg-gold/10 border border-gold/30 rounded">
          <div className="font-pixel text-xs text-gold">GOLD EARNED</div>
          <div className="font-pixel text-lg text-gold">+₹{result.gold}</div>
        </div>
      </div>

      {/* What you got wrong */}
      {result.feedback.length > 0 && (
        <div className="bg-black/30 rounded-lg p-4 border border-white/10">
          <div className="font-pixel text-[10px] text-[var(--text-muted)] mb-2">CORRECTIONS:</div>
          <div className="space-y-1">
            {result.feedback.map((f, i) => (
              <div key={i} className="text-sm text-[var(--text)]">{f}</div>
            ))}
          </div>
        </div>
      )}

      {/* 50/30/20 reminder */}
      <div className="bg-green-500/8 border border-green-500/20 rounded-lg p-4 text-sm text-[var(--text-muted)] leading-relaxed">
        <span className="text-green-400 font-semibold">50/30/20 for ₹15,000/month: </span>
        ₹7,500 on needs (rent, groceries, transport) · ₹4,500 on wants (chai, OTT, dining) · ₹3,000 to savings (SIP, emergency fund).
        These are guidelines — adjust based on your situation.
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={onRetry}
          className="font-pixel text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40 px-5 py-2.5 rounded hover:bg-blue-500/30 transition"
        >
          ↺ TRY AGAIN
        </button>
        <button
          onClick={onContinue}
          className="font-pixel text-xs bg-green-600 text-white px-5 py-2.5 rounded hover:bg-green-500 transition"
        >
          ✓ CONTINUE →
        </button>
      </div>
    </div>
  );
}
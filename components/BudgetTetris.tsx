'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Category = 'needs' | 'wants' | 'savings';

interface ExpenseTemplate {
  id: string;
  icon: string;
  name: string; // <= 12 chars for clean UI
  baseAmount: number; // baseline around 15,000 monthly income
  correct: Category;
  description: string;
}

const EXPENSE_TEMPLATES: ExpenseTemplate[] = [
  { id: 'rent', icon: '🏠', name: 'PG Rent', baseAmount: 5000, correct: 'needs', description: 'Monthly PG' },
  { id: 'groceries', icon: '🛒', name: 'Groceries', baseAmount: 2000, correct: 'needs', description: 'Weekly food' },
  { id: 'mobile', icon: '📱', name: 'Mobile Bill', baseAmount: 300, correct: 'needs', description: 'Recharge' },
  { id: 'bus', icon: '🚌', name: 'Bus/Auto', baseAmount: 800, correct: 'needs', description: 'Commute' },
  { id: 'textbooks', icon: '📚', name: 'Textbooks', baseAmount: 600, correct: 'needs', description: 'Books' },

  { id: 'chai', icon: '☕', name: 'Daily Chai', baseAmount: 600, correct: 'wants', description: 'Campus chai' },
  { id: 'ott', icon: '🎬', name: 'OTT Apps', baseAmount: 499, correct: 'wants', description: 'Streaming' },
  { id: 'dining', icon: '🍕', name: 'Eating Out', baseAmount: 800, correct: 'wants', description: 'Food outs' },
  { id: 'gaming', icon: '🎮', name: 'Game Credits', baseAmount: 300, correct: 'wants', description: 'In-app' },
  { id: 'gym', icon: '💪', name: 'Gym Fee', baseAmount: 500, correct: 'wants', description: 'Gym' },

  { id: 'sip', icon: '📈', name: 'SIP Fund', baseAmount: 2000, correct: 'savings', description: 'Investment' },
  { id: 'emergency', icon: '🚨', name: 'Emergency', baseAmount: 1000, correct: 'savings', description: 'Safety net' },
];

const CATEGORY_TO_INDEX: Record<Category, number> = {
  needs: 0,
  wants: 1,
  savings: 2,
};

const CATEGORY_META: Record<
  Category,
  { fill: string; progress: string; label: string; dim: string; }
> = {
  needs: { fill: 'bg-red-500', progress: 'bg-red-400', label: 'NEEDS', dim: 'bg-red-500/15' },
  wants: { fill: 'bg-blue-500', progress: 'bg-blue-400', label: 'WANTS', dim: 'bg-blue-500/15' },
  savings: { fill: 'bg-green-500', progress: 'bg-green-400', label: 'SAVINGS', dim: 'bg-green-500/15' },
};

const ROWS = 12;

type PlacedBlock = {
  templateId: string;
  icon: string;
  name: string;
  amount: number;
  correct: Category;
};

type CurrentBlock = PlacedBlock;

export interface BudgetTetrisProps {
  onClose: () => void;
  onGameOver: (score: number, correctPlacements: number, totalBlocks: number) => void;
  monthlyIncome: number;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function pickWeighted<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function scaleAmount(base: number, income: number) {
  const factor = income / 15000;
  return clampInt(base * factor, 80, 1000000);
}

export function BudgetTetris({ onClose, onGameOver, monthlyIncome }: BudgetTetrisProps) {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [correctPlacements, setCorrectPlacements] = useState(0);
  const [totalPlacedBlocks, setTotalPlacedBlocks] = useState(0);

  const targets = useMemo(() => {
    const needs = Math.round(monthlyIncome * 0.5);
    const wants = Math.round(monthlyIncome * 0.3);
    const savings = Math.round(monthlyIncome * 0.2);
    return { needs, wants, savings };
  }, [monthlyIncome]);

  const [used, setUsed] = useState<{ needs: number; wants: number; savings: number }>({
    needs: 0,
    wants: 0,
    savings: 0,
  });

  const remaining = {
    needs: Math.max(0, targets.needs - used.needs),
    wants: Math.max(0, targets.wants - used.wants),
    savings: Math.max(0, targets.savings - used.savings),
  };

  const totalRemaining = remaining.needs + remaining.wants + remaining.savings;

  const [stacks, setStacks] = useState<Array<PlacedBlock[]>>([[], [], []]);
  const [current, setCurrent] = useState<CurrentBlock | null>(null);
  const [fallY, setFallY] = useState(0); // 0..stackHeight
  const [activeCol, setActiveCol] = useState<number>(1); // start in WANTS

  const [speedMs, setSpeedMs] = useState(2000);
  const blocksSinceSpeedUp = useRef(0);

  const [skipsLeft, setSkipsLeft] = useState(2);
  const [consecutiveSkips, setConsecutiveSkips] = useState(0);

  const [flash, setFlash] = useState<{ kind: 'correct' | 'wrong'; key: number } | null>(null);
  const flashTimer = useRef<number | null>(null);

  const playAreaRef = useRef<HTMLDivElement | null>(null);

  const generateBlock = useCallback((): CurrentBlock => {
    // Choose a template and scale its amount based on income.
    // This keeps blocks meaningfully related to the student's income level.
    const template = pickWeighted(EXPENSE_TEMPLATES);
    const amount = scaleAmount(template.baseAmount, monthlyIncome);
    return {
      templateId: template.id,
      icon: template.icon,
      name: template.name,
      amount,
      correct: template.correct,
    };
  }, [monthlyIncome]);

  const endGame = useCallback((finalScore: number, finalCorrect: number, totalBlocks: number) => {
    // Bonus when all budgets end within 10% of their target.
    const needsOk = Math.abs(targets.needs - used.needs) <= targets.needs * 0.1;
    const wantsOk = Math.abs(targets.wants - used.wants) <= targets.wants * 0.1;
    const savingsOk = Math.abs(targets.savings - used.savings) <= targets.savings * 0.1;

    const bonus = needsOk && wantsOk && savingsOk ? 50 : 0;
    const final = finalScore + bonus;
    onGameOver(final, finalCorrect, totalBlocks);
    setRunning(false);
  }, [onGameOver, targets, used]);

  const placeBlock = useCallback(() => {
    if (!current) return;

    const col = activeCol;
    const chosenCategory = (col === 0 ? 'needs' : col === 1 ? 'wants' : 'savings') as Category;
    const correctCategory = current.correct;
    const isCorrect = chosenCategory === correctCategory;

    const stackHeight = stacks[col]?.length ?? 0;
    if (stackHeight >= ROWS) {
      endGame(score, correctPlacements, totalPlacedBlocks);
      return;
    }

    setStacks((prev) => {
      const next = [...prev];
      next[col] = [...next[col], current];
      return next;
    });

    setUsed((prev) => {
      const nextUsed = { ...prev, [chosenCategory]: prev[chosenCategory] + current.amount };
      // Determine end condition based on remaining budget.
      if (totalRemaining - current.amount <= 0) {
        // Fire flash quickly but end the game next tick to let UI show the placement.
      }
      return nextUsed;
    });

    setTotalPlacedBlocks((n) => n + 1);

    setScore((prev) => prev + (isCorrect ? 10 : -5));
    if (isCorrect) setCorrectPlacements((c) => c + 1);

    setFlash({ kind: isCorrect ? 'correct' : 'wrong', key: Date.now() });
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 320);

    // Reset skip mechanic after a successful placement attempt.
    setConsecutiveSkips(0);
    setSkipsLeft(2);

    // Advance speed every 5 placed blocks (moderate difficulty).
    blocksSinceSpeedUp.current += 1;
    if (blocksSinceSpeedUp.current % 5 === 0) {
      setSpeedMs((ms) => Math.max(650, Math.round(ms * 0.85)));
    }

    setCurrent(null);
    setFallY(0);
    // Next block spawn on next render frame.
  }, [
    activeCol,
    correctPlacements,
    current,
    endGame,
    score,
    stacks,
    totalPlacedBlocks,
    totalRemaining,
  ]);

  const spawnNext = useCallback(() => {
    setCurrent(generateBlock());
    setFallY(0);
    setActiveCol(1);
  }, [generateBlock]);

  // Game loop: fall current block to stack height.
  useEffect(() => {
    if (!running || !current) return;
    const col = activeCol;
    const stackHeight = stacks[col]?.length ?? 0;
    if (stackHeight === 0 && fallY === 0 && speedMs < 650) {
      // keep eslint happy; no-op
    }

    const t = window.setTimeout(() => {
      const nextFallY = fallY + 1;
      if (nextFallY >= stackHeight) {
        // Place when it reaches bottom of current stack.
        setFallY(stackHeight);
        placeBlock();
      } else {
        setFallY(nextFallY);
      }
    }, speedMs);

    return () => window.clearTimeout(t);
  }, [activeCol, current, fallY, placeBlock, running, speedMs, stacks]);

  // Spawn initial block.
  useEffect(() => {
    if (!running) return;
    if (current) return;
    // Budget depleted check.
    if (totalRemaining <= 0) {
      endGame(score, correctPlacements, totalPlacedBlocks);
      return;
    }
    spawnNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, current]);

  // Re-check budget depletion when used changes after placement.
  useEffect(() => {
    if (!running) return;
    if (totalRemaining <= 0) {
      endGame(score, correctPlacements, totalPlacedBlocks);
    }
  }, [running, totalRemaining, endGame, score, correctPlacements, totalPlacedBlocks]);

  const handleMove = useCallback((dir: -1 | 1) => {
    if (!running || !current) return;
    setActiveCol((c) => Math.max(0, Math.min(2, c + dir)));
  }, [current, running]);

  const handleDrop = useCallback(() => {
    if (!running || !current) return;
    const col = activeCol;
    const stackHeight = stacks[col]?.length ?? 0;
    setFallY(stackHeight);
    placeBlock();
  }, [activeCol, current, placeBlock, running, stacks]);

  const handleSkip = useCallback(() => {
    if (!running || !current) return;
    if (consecutiveSkips >= 2) return;
    // Skip: remove block, no budget change.
    setConsecutiveSkips((n) => n + 1);
    setSkipsLeft((left) => Math.max(0, left - 1));
    setCurrent(null);
    setFallY(0);
    setFlash({ kind: 'wrong', key: Date.now() }); // subtle cue
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 160);
  }, [consecutiveSkips, current, running]);

  const start = useCallback(() => {
    setRunning(true);
    setScore(0);
    setCorrectPlacements(0);
    setTotalPlacedBlocks(0);
    setUsed({ needs: 0, wants: 0, savings: 0 });
    setStacks([[], [], []]);
    setCurrent(null);
    setFallY(0);
    setSpeedMs(2000);
    blocksSinceSpeedUp.current = 0;
    setSkipsLeft(2);
    setConsecutiveSkips(0);
  }, []);

  // Keyboard controls.
  useEffect(() => {
    if (!running) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleMove(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleMove(1);
      } else if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleDrop();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDrop, handleMove, handleSkip, running]);

  const stop = useCallback(() => {
    setRunning(false);
    setCurrent(null);
    setFallY(0);
  }, []);

  // Prevent accidental scroll zoom on mobile while playing.
  useEffect(() => {
    if (!running) return;
    const onTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => document.removeEventListener('touchmove', onTouchMove);
  }, [running]);

  const CategoryProgressBar = ({ cat }: { cat: Category }) => {
    const target = cat === 'needs' ? targets.needs : cat === 'wants' ? targets.wants : targets.savings;
    const val = used[cat];
    const pct = target <= 0 ? 0 : Math.min(100, Math.round((val / target) * 100));
    const over = val > target;
    const meta = CATEGORY_META[cat];
    return (
      <div className="flex items-center gap-3">
        <div className="w-[66px] font-pixel text-[9px] text-[var(--text-muted)]">{meta.label}</div>
        <div className="flex-1 h-2 bg-black/40 rounded overflow-hidden border border-white/10">
          <div
            className={`h-full transition-all ${over ? 'bg-red-500' : meta.progress}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={`w-[92px] text-right font-pixel text-[9px] ${over ? 'text-red-300' : 'text-gold'}`}>
          {val.toLocaleString('en-IN')} / {target.toLocaleString('en-IN')}
        </div>
      </div>
    );
  };

  const getStackCellAt = (col: number, row: number) => {
    // row 0 is bottom for display mapping.
    const stack = stacks[col];
    const idxFromTop = stack.length - 1 - row;
    if (idxFromTop < 0 || idxFromTop >= stack.length) return null;
    return stack[idxFromTop] ?? null;
  };

  const renderBoard = () => {
    const currentCategory = current ? current.correct : 'needs';
    const currentRowFromBottom = Math.min(ROWS - 1, Math.max(0, fallY));
    return (
      <div
        ref={playAreaRef}
        className="relative w-full max-w-[520px] mx-auto h-[264px]"
      >
        <div className="absolute inset-0 bg-black/30 rounded-lg border-2 border-[var(--panel-border)]" />
        {/* columns */}
        <div className="absolute inset-0 grid grid-cols-3">
          {[0, 1, 2].map((col) => (
            <div key={col} className="relative border-l border-white/5 last:border-r border-r border-white/5">
              <div className="absolute inset-0 grid grid-rows-12">
                {Array.from({ length: ROWS }).map((_, rowIdx) => {
                  const block = getStackCellAt(col, ROWS - 1 - rowIdx);
                  const isActive = current && col === activeCol && currentRowFromBottom === ROWS - 1 - rowIdx;
                  const opacity = flash ? 0.65 : 1;
                  const fillClass = block
                    ? CATEGORY_META[block.correct].fill
                    : isActive
                      ? CATEGORY_META[currentCategory].fill
                      : '';
                  const border =
                    flash && current && col === activeCol
                      ? flash.kind === 'correct'
                        ? 'border-green-300/60'
                        : 'border-red-300/60'
                      : 'border-transparent';
                  return (
                    <div
                      // eslint-disable-next-line react/no-array-index-key
                      key={rowIdx}
                      className={`w-full h-[22px] ${block ? '' : ''} flex items-center justify-center transition-all`}
                    >
                      {block && (
                        <div
                          className={`w-[14px] h-[14px] rounded-sm border border-white/15 ${fillClass}`}
                          title={`${block.name} • ₹${block.amount.toLocaleString('en-IN')}`}
                          style={{ opacity }}
                        />
                      )}
                      {isActive && (
                        <div
                          className={`w-[14px] h-[14px] rounded-sm border border-white/15 ${fillClass}`}
                          title={`${current?.name ?? ''} • ₹${current?.amount.toLocaleString('en-IN') ?? ''}`}
                          style={{ opacity }}
                        />
                      )}
                      <div className={`absolute inset-0 border ${border} pointer-events-none`} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Column headers */}
        <div className="absolute -top-6 left-0 right-0 flex">
          {[0, 1, 2].map((i) => {
            const cat = i === 0 ? 'needs' : i === 1 ? 'wants' : 'savings';
            const meta = CATEGORY_META[cat as Category];
            return (
              <div key={i} className={`w-1/3 text-center font-pixel text-[10px] ${meta.color}`}>
                {meta.label}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[250] p-4"
      onClick={() => {
        stop();
        onClose();
      }}
    >
      <div
        className="bg-[var(--dark2)] border-2 border-[var(--panel-border)] rounded-lg w-full max-w-[860px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-[var(--panel-border)]">
          <span className="font-pixel text-gold text-xs">🧱 Budget Tetris — Expense Pressure!</span>
          <button
            onClick={() => {
              stop();
              onClose();
            }}
            className="text-[var(--text-muted)] hover:text-red-500 text-xl"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Budget progress */}
          <div className="space-y-2 bg-black/25 border border-white/10 rounded-lg p-3">
            <CategoryProgressBar cat="needs" />
            <CategoryProgressBar cat="wants" />
            <CategoryProgressBar cat="savings" />
          </div>

          {renderBoard()}

          {/* Info + controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="font-pixel text-[10px] text-[var(--text-muted)] mb-1">NEXT BLOCK</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl">{current?.icon ?? '🧩'}</div>
                <div className="min-w-0">
                  <div className="font-pixel text-[9px] text-[var(--text)] leading-tight truncate">
                    {current?.name ?? 'Press START'}
                  </div>
                  <div className="font-pixel text-[9px] text-gold">
                    {current ? `₹${current.amount.toLocaleString('en-IN')}` : '—'}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex gap-3">
                <div className="font-pixel text-[9px] text-[var(--text-muted)]">SCORE</div>
                <div className="font-pixel text-[12px] text-gold">{score.toLocaleString('en-IN')}</div>
              </div>
              <div className="mt-2 font-pixel text-[9px] text-[var(--text-muted)]">
                SKIP [S]: {Math.max(0, 2 - consecutiveSkips)} remaining
              </div>
            </div>

            <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="font-pixel text-[10px] text-[var(--text-muted)] mb-2">CONTROLS</div>
              <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                <span className="font-pixel text-[10px] text-gold">← →</span> Move column ·{' '}
                <span className="font-pixel text-[10px] text-gold">↓/SPACE</span> Drop ·{' '}
                <span className="font-pixel text-[10px] text-gold">S</span> Skip (2×)
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                {!running && (
                  <button
                    onClick={start}
                    type="button"
                    className="font-pixel text-xs bg-green-600 text-white px-5 py-2 rounded hover:bg-green-500 transition"
                  >
                    ▶ START
                  </button>
                )}
                {running && (
                  <button
                    onClick={() => {
                      stop();
                      onClose();
                    }}
                    type="button"
                    className="font-pixel text-xs bg-red-500/25 text-red-200 border border-red-500/40 px-4 py-2 rounded hover:bg-red-500/30 transition"
                  >
                    ✕ EXIT
                  </button>
                )}
                <div className="hidden sm:block ml-auto font-pixel text-[9px] text-[var(--text-muted)]">
                  {Math.max(0, ROWS - (stacks[activeCol]?.length ?? 0))} spaces left in column
                </div>
              </div>

              <div className="sm:hidden mt-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => handleMove(-1)}
                    className="w-12 h-12 bg-white/10 border border-white/30 rounded font-pixel text-[10px] text-white/90 hover:bg-white/15"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDrop()}
                    className="w-12 h-12 bg-white/10 border border-white/30 rounded font-pixel text-[10px] text-white/90 hover:bg-white/15"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(1)}
                    className="w-12 h-12 bg-white/10 border border-white/30 rounded font-pixel text-[10px] text-white/90 hover:bg-white/15"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={consecutiveSkips >= 2}
                    className="w-12 h-12 bg-white/10 border border-white/30 rounded font-pixel text-[10px] text-white/90 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/15"
                  >
                    SKIP
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-[var(--text-muted)] font-pixel">
            Blocks fall automatically. Correct placements help you keep your budget balanced.
          </div>
        </div>
      </div>
    </div>
  );
}


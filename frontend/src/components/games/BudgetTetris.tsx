'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
type Category = 'needs' | 'wants' | 'savings';

interface Expense {
  icon: string;
  name: string;
  amount: number;
  category: Category;
}

export interface BudgetTetrisProps {
  onClose: () => void;
  onGameOver: (score: number, correctPlacements: number, totalBlocks: number) => void;
  monthlyIncome: number;
}

// ── Constants ──────────────────────────────────────────────────────────────
const COLS = 10;
const ROWS = 20;
const CELL = 28; // px per cell
const CANVAS_W = COLS * CELL;
const CANVAS_H = ROWS * CELL;

// Bottom 3 rows are the "sorting zone" — colour-coded columns
const ZONE_ROW = ROWS - 3; // blocks that land here get auto-sorted

// Column ranges for each category (10 cols split into 3 zones)
const ZONES: Record<Category, [number, number]> = {
  needs: [0, 3],   // cols 0-3
  wants: [3, 7],   // cols 3-6
  savings: [7, 10],  // cols 7-9
};

const ZONE_COLORS: Record<Category, string> = {
  needs: '#ef4444',
  wants: '#3b82f6',
  savings: '#22c55e',
};

const ZONE_LABELS: Record<Category, string> = {
  needs: 'NEEDS',
  wants: 'WANTS',
  savings: 'SAVINGS',
};

// Tetromino shapes (each is array of [row, col] offsets from pivot)
const SHAPES: number[][][] = [
  [[0, 0], [0, 1], [0, 2], [0, 3]],           // I
  [[0, 0], [0, 1], [1, 0], [1, 1]],           // O
  [[0, 1], [1, 0], [1, 1], [1, 2]],           // T
  [[0, 0], [1, 0], [1, 1], [1, 2]],           // J
  [[0, 2], [1, 0], [1, 1], [1, 2]],           // L
  [[0, 0], [0, 1], [1, 1], [1, 2]],           // S
  [[0, 1], [0, 2], [1, 0], [1, 1]],           // Z
];

const PIECE_COLORS = ['#06b6d4', '#f59e0b', '#a855f7', '#f97316', '#ec4899', '#10b981', '#6366f1'];

const EXPENSES: Expense[] = [
  { icon: '🏠', name: 'PG Rent', amount: 5000, category: 'needs' },
  { icon: '🛒', name: 'Groceries', amount: 2000, category: 'needs' },
  { icon: '📱', name: 'Mobile Bill', amount: 300, category: 'needs' },
  { icon: '🚌', name: 'Bus/Auto', amount: 800, category: 'needs' },
  { icon: '📚', name: 'Textbooks', amount: 600, category: 'needs' },
  { icon: '☕', name: 'Daily Chai', amount: 600, category: 'wants' },
  { icon: '🎬', name: 'OTT Apps', amount: 499, category: 'wants' },
  { icon: '🍕', name: 'Eating Out', amount: 800, category: 'wants' },
  { icon: '🎮', name: 'Game Credits', amount: 300, category: 'wants' },
  { icon: '💪', name: 'Gym Fee', amount: 500, category: 'wants' },
  { icon: '📈', name: 'SIP Fund', amount: 2000, category: 'savings' },
  { icon: '🚨', name: 'Emergency', amount: 1000, category: 'savings' },
  { icon: '🏦', name: 'FD Deposit', amount: 1500, category: 'savings' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function randInt(n: number) { return Math.floor(Math.random() * n); }
function pickExpense(): Expense { return EXPENSES[randInt(EXPENSES.length)]; }
function pickShape(): { cells: number[][]; color: string } {
  const i = randInt(SHAPES.length);
  return { cells: SHAPES[i], color: PIECE_COLORS[i] };
}

function rotate(cells: number[][]): number[][] {
  // 90° clockwise: [r,c] → [c, maxR-r]
  const maxR = Math.max(...cells.map(([r]) => r));
  return cells.map(([r, c]) => [c, maxR - r]);
}

function collides(
  cells: number[][],
  pr: number, pc: number,
  board: (string | null)[][]
): boolean {
  for (const [dr, dc] of cells) {
    const r = pr + dr, c = pc + dc;
    if (r >= ROWS || c < 0 || c >= COLS) return true;
    if (r >= 0 && board[r][c] !== null) return true;
  }
  return false;
}

function emptyBoard(): (string | null)[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// Returns new board + lines cleared
function lockAndClear(
  board: (string | null)[][],
  cells: number[][], pr: number, pc: number, color: string
): { board: (string | null)[][]; cleared: number } {
  const next = board.map((row) => [...row]);
  for (const [dr, dc] of cells) {
    const r = pr + dr, c = pc + dc;
    if (r >= 0) next[r][c] = color;
  }
  const kept = next.filter((row) => row.some((v) => v === null));
  const cleared = ROWS - kept.length;
  const newBoard = [
    ...Array.from({ length: cleared }, () => Array(COLS).fill(null) as (string | null)[]),
    ...kept,
  ];
  return { board: newBoard, cleared };
}

// Determine which zone a piece lands in based on its average column
function landingZone(cells: number[][], pc: number): Category {
  const avgCol = cells.reduce((s, [, dc]) => s + pc + dc, 0) / cells.length;
  if (avgCol < ZONES.wants[0]) return 'needs';
  if (avgCol < ZONES.savings[0]) return 'wants';
  return 'savings';
}

// ── Component ──────────────────────────────────────────────────────────────
export function BudgetTetris({ onClose, onGameOver, monthlyIncome }: BudgetTetrisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game state in refs so the RAF loop always sees fresh values
  const boardRef = useRef<(string | null)[][]>(emptyBoard());
  const cellsRef = useRef<number[][]>([]);
  const colorRef = useRef<string>('#fff');
  const prRef = useRef(0);   // piece row
  const pcRef = useRef(0);   // piece col
  const expenseRef = useRef<Expense>(pickExpense());
  const nextExpRef = useRef<Expense>(pickExpense());
  const nextShapeRef = useRef(pickShape());
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const dropIntervalRef = useRef(800); // ms
  const lastDropRef = useRef(0);
  const runningRef = useRef(false);
  const rafRef = useRef<number>(0);

  // React state for UI panels only (not the canvas)
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentExp, setCurrentExp] = useState<Expense>(expenseRef.current);
  const [nextExp, setNextExp] = useState<Expense>(nextExpRef.current);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const targets = {
    needs: Math.round(monthlyIncome * 0.5),
    wants: Math.round(monthlyIncome * 0.3),
    savings: Math.round(monthlyIncome * 0.2),
  };
  const usedRef = useRef({ needs: 0, wants: 0, savings: 0 });
  const [used, setUsed] = useState({ needs: 0, wants: 0, savings: 0 });

  // ── Spawn ────────────────────────────────────────────────────────────────
  const spawnPiece = useCallback(() => {
    const { cells, color } = nextShapeRef.current;
    const exp = nextExpRef.current;
    const startCol = Math.floor((COLS - 4) / 2);
    const startRow = 0;

    if (collides(cells, startRow, startCol, boardRef.current)) {
      // Game over
      runningRef.current = false;
      setGameOver(true);
      onGameOver(scoreRef.current, correctRef.current, totalRef.current);
      return;
    }

    cellsRef.current = cells;
    colorRef.current = color;
    prRef.current = startRow;
    pcRef.current = startCol;
    expenseRef.current = exp;
    setCurrentExp(exp);

    // Prepare next
    nextShapeRef.current = pickShape();
    nextExpRef.current = pickExpense();
    setNextExp(nextExpRef.current);
  }, [onGameOver]);

  // ── Lock piece ───────────────────────────────────────────────────────────
  const lockPiece = useCallback(() => {
    const { board: newBoard, cleared } = lockAndClear(
      boardRef.current, cellsRef.current, prRef.current, pcRef.current, colorRef.current
    );
    boardRef.current = newBoard;

    // Scoring
    const zone = landingZone(cellsRef.current, pcRef.current);
    const exp = expenseRef.current;
    const ok = zone === exp.category;
    const pts = ok ? (cleared > 0 ? 100 + cleared * 50 : 50) : -20;

    scoreRef.current += pts;
    totalRef.current += 1;
    linesRef.current += cleared;
    if (ok) correctRef.current += 1;

    usedRef.current = { ...usedRef.current, [zone]: usedRef.current[zone] + exp.amount };
    setUsed({ ...usedRef.current });

    // Level up every 5 lines
    const newLevel = Math.floor(linesRef.current / 5) + 1;
    levelRef.current = newLevel;
    dropIntervalRef.current = Math.max(150, 800 - (newLevel - 1) * 80);

    setScore(scoreRef.current);
    setLines(linesRef.current);
    setLevel(newLevel);
    setCorrect(correctRef.current);
    setTotal(totalRef.current);

    // Feedback toast
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({
      text: ok
        ? `✓ ${exp.icon} ${exp.name} → ${ZONE_LABELS[exp.category]}!`
        : `✗ ${exp.icon} ${exp.name} belongs in ${ZONE_LABELS[exp.category]}`,
      ok,
    });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 1800);

    spawnPiece();
  }, [spawnPiece]);

  // ── Move helpers ─────────────────────────────────────────────────────────
  const tryMove = useCallback((dr: number, dc: number) => {
    const nr = prRef.current + dr;
    const nc = pcRef.current + dc;
    if (!collides(cellsRef.current, nr, nc, boardRef.current)) {
      prRef.current = nr;
      pcRef.current = nc;
      return true;
    }
    return false;
  }, []);

  const tryRotate = useCallback(() => {
    const rotated = rotate(cellsRef.current);
    if (!collides(rotated, prRef.current, pcRef.current, boardRef.current)) {
      cellsRef.current = rotated;
    }
  }, []);

  const hardDrop = useCallback(() => {
    while (tryMove(1, 0)) { }
    lockPiece();
  }, [tryMove, lockPiece]);

  // ── Draw ─────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Zone column backgrounds — full height
    const zoneEntries = Object.entries(ZONES) as [Category, [number, number]][];
    for (const [cat, [c0, c1]] of zoneEntries) {
      const w = (c1 - c0) * CELL;
      const x = c0 * CELL;
      // Full-height tint
      ctx.fillStyle = ZONE_COLORS[cat] + '30';
      ctx.fillRect(x, 0, w, CANVAS_H);
      // Extra emphasis on the bottom sorting zone
      ctx.fillStyle = ZONE_COLORS[cat] + '50';
      ctx.fillRect(x, ZONE_ROW * CELL, w, 3 * CELL);
      // Sorting zone border
      ctx.strokeStyle = ZONE_COLORS[cat] + 'aa';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, ZONE_ROW * CELL + 0.75, w - 1.5, 3 * CELL - 1.5);
    }

    // Grid lines (drawn after zone tints so they sit on top)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r < ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(CANVAS_W, r * CELL); ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, CANVAS_H); ctx.stroke();
    }

    // Zone labels at bottom
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    for (const [cat, [c0, c1]] of zoneEntries) {
      ctx.fillStyle = ZONE_COLORS[cat];
      ctx.fillText(ZONE_LABELS[cat], ((c0 + c1) / 2) * CELL, (ZONE_ROW + 1.5) * CELL);
    }

    // Placed blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = boardRef.current[r][c];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, 4);
      }
    }

    // Ghost piece (drop preview)
    let ghostRow = prRef.current;
    while (!collides(cellsRef.current, ghostRow + 1, pcRef.current, boardRef.current)) ghostRow++;
    if (ghostRow !== prRef.current) {
      ctx.fillStyle = colorRef.current + '33';
      for (const [dr, dc] of cellsRef.current) {
        const r = ghostRow + dr, c = pcRef.current + dc;
        if (r >= 0) ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
      }
    }

    // Active piece
    ctx.fillStyle = colorRef.current;
    for (const [dr, dc] of cellsRef.current) {
      const r = prRef.current + dr, c = pcRef.current + dc;
      if (r >= 0) {
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, 4);
        ctx.fillStyle = colorRef.current;
      }
    }

    // Expense label on active piece (center cell)
    if (cellsRef.current.length > 0) {
      const midCell = cellsRef.current[Math.floor(cellsRef.current.length / 2)];
      const lr = prRef.current + midCell[0];
      const lc = pcRef.current + midCell[1];
      if (lr >= 0) {
        ctx.font = '13px serif';
        ctx.textAlign = 'center';
        ctx.fillText(expenseRef.current.icon, lc * CELL + CELL / 2, lr * CELL + CELL / 2 + 5);
      }
    }
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────
  const loop = useCallback((ts: number) => {
    if (!runningRef.current) return;
    if (ts - lastDropRef.current > dropIntervalRef.current) {
      lastDropRef.current = ts;
      if (!tryMove(1, 0)) lockPiece();
    }
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, lockPiece, tryMove]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!runningRef.current) return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); tryMove(0, -1); break;
        case 'ArrowRight': e.preventDefault(); tryMove(0, 1); break;
        case 'ArrowDown': e.preventDefault(); if (!tryMove(1, 0)) lockPiece(); break;
        case 'ArrowUp': e.preventDefault(); tryRotate(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tryMove, tryRotate, hardDrop, lockPiece]);

  // ── Start ─────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    boardRef.current = emptyBoard();
    scoreRef.current = 0;
    correctRef.current = 0;
    totalRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    dropIntervalRef.current = 800;
    lastDropRef.current = 0;
    usedRef.current = { needs: 0, wants: 0, savings: 0 };
    nextShapeRef.current = pickShape();
    nextExpRef.current = pickExpense();
    runningRef.current = true;

    setScore(0); setLines(0); setLevel(1); setCorrect(0); setTotal(0);
    setUsed({ needs: 0, wants: 0, savings: 0 });
    setGameOver(false); setStarted(true); setFeedback(null);

    spawnPiece();
    rafRef.current = requestAnimationFrame(loop);
  }, [spawnPiece, loop]);

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  const pct = (cat: Category) => Math.min(100, Math.round((used[cat] / targets[cat]) * 100));

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[250] p-2"
      onClick={() => { runningRef.current = false; onClose(); }}>
      <div className="bg-[#0d1117] border-2 border-[rgba(255,215,0,0.3)] rounded-xl w-full max-w-[780px] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-white/10">
          <span className="font-pixel text-gold text-xs">🧱 Budget Tetris — Sort your expenses!</span>
          <button onClick={() => { runningRef.current = false; onClose(); }}
            className="text-[var(--text-muted)] hover:text-red-400 text-xl">✕</button>
        </div>

        <div className="flex gap-3 p-3">
          {/* Canvas */}
          <div className="relative flex-shrink-0">
            <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
              className="block rounded border border-white/10" />
            {!started && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded">
                <div className="font-pixel text-gold text-sm mb-2">BUDGET TETRIS</div>
                <div className="text-xs text-[var(--text-muted)] text-center mb-4 px-4 leading-relaxed">
                  Sort falling expense blocks into the correct zone.<br />
                  <span className="text-red-400">NEEDS</span> · <span className="text-blue-400">WANTS</span> · <span className="text-green-400">SAVINGS</span>
                </div>
                <button onClick={startGame}
                  className="font-pixel text-xs bg-gold text-[#0d1117] px-6 py-2 rounded hover:-translate-y-0.5 transition">
                  ▶ START
                </button>
              </div>
            )}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded">
                <div className="font-pixel text-gold text-sm mb-1">GAME OVER</div>
                <div className="font-pixel text-xs text-white mb-1">Score: {score}</div>
                <div className="font-pixel text-xs text-green-400 mb-3">{correct}/{total} correct</div>
                <button onClick={startGame}
                  className="font-pixel text-xs bg-gold text-[#0d1117] px-5 py-2 rounded hover:-translate-y-0.5 transition">
                  ▶ PLAY AGAIN
                </button>
              </div>
            )}
            {/* Feedback toast */}
            {feedback && (
              <div className={`absolute top-2 left-1/2 -translate-x-1/2 font-pixel text-[10px] px-3 py-1.5 rounded shadow-lg whitespace-nowrap z-10 ${feedback.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                {feedback.text}
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Current expense */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-2">CURRENT BLOCK</div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{currentExp.icon}</span>
                <div>
                  <div className="font-pixel text-[10px] text-white">{currentExp.name}</div>
                  <div className="font-pixel text-[9px] text-gold">₹{currentExp.amount.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div className={`font-pixel text-[9px] px-2 py-0.5 rounded inline-block`}
                style={{ background: ZONE_COLORS[currentExp.category] + '33', color: ZONE_COLORS[currentExp.category] }}>
                → {ZONE_LABELS[currentExp.category]}
              </div>
            </div>

            {/* Next expense */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-2">NEXT</div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{nextExp.icon}</span>
                <div>
                  <div className="font-pixel text-[9px] text-white">{nextExp.name}</div>
                  <div className="font-pixel text-[9px] text-gold">₹{nextExp.amount.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-1">
              <div className="flex justify-between font-pixel text-[9px]">
                <span className="text-[var(--text-muted)]">SCORE</span><span className="text-gold">{score}</span>
              </div>
              <div className="flex justify-between font-pixel text-[9px]">
                <span className="text-[var(--text-muted)]">LINES</span><span className="text-white">{lines}</span>
              </div>
              <div className="flex justify-between font-pixel text-[9px]">
                <span className="text-[var(--text-muted)]">LEVEL</span><span className="text-white">{level}</span>
              </div>
              <div className="flex justify-between font-pixel text-[9px]">
                <span className="text-[var(--text-muted)]">CORRECT</span>
                <span className="text-green-400">{correct}/{total}</span>
              </div>
            </div>

            {/* Budget progress */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
              <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-1">50/30/20 BUDGET</div>
              {(['needs', 'wants', 'savings'] as Category[]).map((cat) => (
                <div key={cat}>
                  <div className="flex justify-between font-pixel text-[8px] mb-0.5">
                    <span style={{ color: ZONE_COLORS[cat] }}>{ZONE_LABELS[cat]}</span>
                    <span className="text-[var(--text-muted)]">₹{used[cat].toLocaleString('en-IN')} / ₹{targets[cat].toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-1.5 bg-black/40 rounded overflow-hidden">
                    <div className="h-full rounded transition-all" style={{ width: `${pct(cat)}%`, background: ZONE_COLORS[cat] }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-2">CONTROLS</div>
              <div className="space-y-0.5 font-pixel text-[8px] text-[var(--text-muted)]">
                <div><span className="text-gold">← →</span> Move</div>
                <div><span className="text-gold">↑</span> Rotate</div>
                <div><span className="text-gold">↓</span> Soft drop</div>
                <div><span className="text-gold">SPACE</span> Hard drop</div>
              </div>
              {/* Mobile buttons */}
              <div className="mt-3 grid grid-cols-4 gap-1 sm:hidden">
                {[['←', -1, 0], ['↑', 0, 0], ['→', 1, 0], ['↓', 0, 1]].map(([label, dc, dr]) => (
                  <button key={label as string}
                    onTouchStart={(e) => { e.preventDefault(); if (label === '↑') tryRotate(); else if (label === '↓') { if (!tryMove(1, 0)) lockPiece(); } else tryMove(0, dc as number); }}
                    className="h-9 bg-white/10 border border-white/20 rounded font-pixel text-[10px] text-white">
                    {label as string}
                  </button>
                ))}
              </div>
              <button
                onTouchStart={(e) => { e.preventDefault(); hardDrop(); }}
                className="mt-1 w-full h-8 bg-gold/20 border border-gold/40 rounded font-pixel text-[9px] text-gold sm:hidden">
                SPACE (drop)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

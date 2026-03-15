'use client';

import { useEffect, useRef, useState } from 'react';

type PieceDef = {
  shape: number[][];
  color: string;
  label: string;
  amt: number;
  cat: 'needs' | 'wants' | 'savings';
};

const COLS = 10;
const ROWS = 20;
const SIZE = 20;

const PIECES: PieceDef[] = [
  { shape: [[1, 1, 1, 1]], color: '#ef5350', label: 'RENT', amt: 5000, cat: 'needs' },
  { shape: [[1, 1], [1, 1]], color: '#42a5f5', label: 'OTT', amt: 499, cat: 'wants' },
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#66bb6a', label: 'SIP', amt: 2000, cat: 'savings' },
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#ffa726', label: 'CHAI', amt: 600, cat: 'wants' },
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#ab47bc', label: 'BUS', amt: 800, cat: 'needs' },
  { shape: [[1, 0], [1, 1], [0, 1]], color: '#26c6da', label: 'BOOK', amt: 600, cat: 'needs' },
  { shape: [[1, 1, 1], [1, 0, 0]], color: '#d4e157', label: 'GROC', amt: 2000, cat: 'needs' },
];

type Cell = null | { color: string; label: string; cat: PieceDef['cat']; amt: number };

type Props = {
  onClose: () => void;
  onGameOver?: (score: number, lines: number) => void;
};

export function BudgetTetris({ onClose, onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [risk, setRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const dropIntervalRef = useRef(800);
  const boardRef = useRef<Cell[][]>(
    Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null)),
  );
  const curPieceRef = useRef<
    | (PieceDef & {
        x: number;
        y: number;
        shape: number[][];
      })
    | null
  >(null);
  const nextPieceRef = useRef<PieceDef | null>(null);
  const needsAmtRef = useRef(0);
  const wantsAmtRef = useRef(0);
  const savingsAmtRef = useRef(0);

  const randPiece = (): PieceDef & { x: number; y: number; shape: number[][] } => {
    const p = PIECES[Math.floor(Math.random() * PIECES.length)];
    const shapeCopy = p.shape.map((row) => [...row]);
    return {
      ...p,
      shape: shapeCopy,
      x: Math.floor(COLS / 2) - Math.floor(shapeCopy[0].length / 2),
      y: 0,
    };
  };

  const collide = (
    piece: { x: number; y: number; shape: number[][] },
    ox = 0,
    oy = 0,
    shapeOverride?: number[][],
  ) => {
    const shape = shapeOverride ?? piece.shape;
    const board = boardRef.current;
    for (let r = 0; r < shape.length; r += 1) {
      for (let c = 0; c < shape[r].length; c += 1) {
        if (!shape[r][c]) continue;
        const nx = piece.x + c + ox;
        const ny = piece.y + r + oy;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  };

  const hardDraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const board = boardRef.current;
    const cur = curPieceRef.current;

    ctx.fillStyle = '#050d18';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r += 1) {
      ctx.beginPath();
      ctx.moveTo(0, r * SIZE);
      ctx.lineTo(COLS * SIZE, r * SIZE);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c += 1) {
      ctx.beginPath();
      ctx.moveTo(c * SIZE, 0);
      ctx.lineTo(c * SIZE, ROWS * SIZE);
      ctx.stroke();
    }
    board.forEach((row, r) =>
      row.forEach((cell, c) => {
        if (!cell) return;
        drawCell(ctx, c, r, cell.color, cell.label);
      }),
    );
    if (cur) {
      // ghost
      const ghost = {
        x: cur.x,
        y: cur.y,
        shape: cur.shape.map((row) => [...row]),
      };
      while (!collide(ghost, 0, 1)) {
        ghost.y += 1;
      }
      ghost.shape.forEach((row, r) =>
        row.forEach((v, c) => {
          if (!v) return;
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect((ghost.x + c) * SIZE + 1, (ghost.y + r) * SIZE + 1, SIZE - 2, SIZE - 2);
        }),
      );

      cur.shape.forEach((row, r) =>
        row.forEach((v, c) => {
          if (!v) return;
          drawCell(ctx, cur.x + c, cur.y + r, cur.color, cur.label);
        }),
      );
    }
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BUDGET TETRIS', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#81C784';
      ctx.font = '10px monospace';
      ctx.fillText('Press START', canvas.width / 2, canvas.height / 2 + 5);
      ctx.fillStyle = '#a0926e';
      ctx.font = '9px monospace';
      ctx.fillText('Clear lines = Save money!', canvas.width / 2, canvas.height / 2 + 25);
    }
  };

  const drawCell = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    label: string,
  ) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * SIZE + 1, y * SIZE + 1, SIZE - 2, SIZE - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x * SIZE + 1, y * SIZE + 1, SIZE - 2, 3);
    ctx.fillRect(x * SIZE + 1, y * SIZE + 1, 3, SIZE - 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x * SIZE + SIZE - 3, y * SIZE + 1, 2, SIZE - 2);
    ctx.fillRect(x * SIZE + 1, y * SIZE + SIZE - 3, SIZE - 2, 2);
    if (SIZE >= 18 && label) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label.substring(0, 4), x * SIZE + SIZE / 2, y * SIZE + SIZE / 2 + 2);
    }
  };

  const drawNext = () => {
    const canvas = nextRef.current;
    const next = nextPieceRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#050d18';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!next) return;
    const s = next.shape;
    const bs = 14;
    const ox = Math.floor((4 - s[0].length) / 2);
    const oy = Math.floor((4 - s.length) / 2);
    s.forEach((row, r) =>
      row.forEach((v, c) => {
        if (!v) return;
        ctx.fillStyle = next.color;
        ctx.fillRect((ox + c) * bs + 5, (oy + r) * bs + 5, bs - 1, bs - 1);
      }),
    );
    ctx.fillStyle = '#a0926e';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(next.label, 40, 72);
  };

  const updateUi = () => {
    const totalLines = lines;
    if (totalLines < 3) setRisk('LOW');
    else if (totalLines < 8) setRisk('MEDIUM');
    else setRisk('HIGH');
  };

  const lockPiece = () => {
    const cur = curPieceRef.current;
    if (!cur) return;
    const board = boardRef.current;
    cur.shape.forEach((row, r) =>
      row.forEach((v, c) => {
        if (!v) return;
        const y = cur.y + r;
        const x = cur.x + c;
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
          board[y][x] = { color: cur.color, label: cur.label, cat: cur.cat, amt: cur.amt };
        }
      }),
    );
    if (cur.cat === 'needs') needsAmtRef.current += cur.amt;
    else if (cur.cat === 'wants') wantsAmtRef.current += cur.amt;
    else savingsAmtRef.current += cur.amt;
  };

  const clearLines = () => {
    const board = boardRef.current;
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r -= 1) {
      if (board[r].every((c) => c !== null)) {
        board.splice(r, 1);
        board.unshift(Array<Cell>(COLS).fill(null));
        cleared += 1;
        r += 1;
      }
    }
    if (cleared > 0) {
      setLines((prev) => prev + cleared);
      setScore((prev) => prev + cleared * 500);
      dropIntervalRef.current = Math.max(200, 800 - Math.floor((lines + cleared) / 3) * 80);
    }
  };

  const spawn = () => {
    const next = nextPieceRef.current ?? PIECES[0];
    const cur = {
      ...next,
      shape: next.shape.map((row) => [...row]),
      x: Math.floor(COLS / 2) - Math.floor(next.shape[0].length / 2),
      y: 0,
    };
    curPieceRef.current = cur;
    nextPieceRef.current = randPiece();
    drawNext();
    if (collide(cur)) {
      // game over
      setRunning(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
      onGameOver?.(score, lines);
      // draw overlay
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgba(0,0,0,0.75)';
          ctx.fillRect(0, (ROWS * SIZE) / 2 - 30, COLS * SIZE, 60);
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('GAME OVER', (COLS * SIZE) / 2, (ROWS * SIZE) / 2 - 8);
          ctx.fillStyle = '#81C784';
          ctx.font = '11px monospace';
          ctx.fillText(`Score: ₹${score}`, (COLS * SIZE) / 2, (ROWS * SIZE) / 2 + 12);
        }
      }
    }
  };

  const moveDown = () => {
    const cur = curPieceRef.current;
    if (!cur) return false;
    if (collide(cur, 0, 1)) return false;
    cur.y += 1;
    return true;
  };

  const loop = (time: number) => {
    if (!running || paused) return;
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;
    if (delta > dropIntervalRef.current) {
      lastTimeRef.current = time;
      if (!moveDown()) {
        lockPiece();
        clearLines();
        updateUi();
        spawn();
      }
    }
    hardDraw();
    animRef.current = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running) return;
    boardRef.current = Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
    needsAmtRef.current = 0;
    wantsAmtRef.current = 0;
    savingsAmtRef.current = 0;
    setScore(0);
    setLines(0);
    setRisk('LOW');
    dropIntervalRef.current = 800;
    lastTimeRef.current = 0;
    nextPieceRef.current = randPiece();
    spawn();
    setRunning(true);
    setPaused(false);
    animRef.current = requestAnimationFrame(loop);
  };

  const pause = () => {
    if (!running) return;
    setPaused((p) => !p);
    if (paused) {
      lastTimeRef.current = 0;
      animRef.current = requestAnimationFrame(loop);
    }
  };

  const stop = () => {
    setRunning(false);
    setPaused(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  };

  const handleKey = (dir: 'left' | 'right' | 'down' | 'up' | 'drop') => {
    if (!running || paused) return;
    const cur = curPieceRef.current;
    if (!cur) return;
    if (dir === 'left' && !collide(cur, -1, 0)) cur.x -= 1;
    if (dir === 'right' && !collide(cur, 1, 0)) cur.x += 1;
    if (dir === 'down') {
      if (!moveDown()) {
        lockPiece();
        clearLines();
        updateUi();
        spawn();
      }
    }
    if (dir === 'up') {
      const s = cur.shape;
      const rotated = s[0].map((_, i) => s.map((row) => row[i]).reverse());
      if (!collide(cur, 0, 0, rotated)) cur.shape = rotated;
    }
    if (dir === 'drop') {
      while (moveDown()) {
        // fall
      }
      lockPiece();
      clearLines();
      updateUi();
      spawn();
    }
    hardDraw();
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!running) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleKey('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleKey('right');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleKey('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleKey('up');
      } else if (e.key === ' ') {
        e.preventDefault();
        handleKey('drop');
      }
    };
    window.addEventListener('keydown', handleKeydown);
    hardDraw();
    drawNext();
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, paused]);

  useEffect(() => {
    updateUi();
  }, [lines]);

  const riskColor =
    risk === 'LOW' ? 'text-emerald-400' : risk === 'MEDIUM' ? 'text-amber-300' : 'text-red-400';

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[250] p-4"
      onClick={() => {
        stop();
        onClose();
      }}
    >
      <div
        className="bg-[var(--dark2)] border-2 border-[var(--panel-border)] rounded max-w-[700px] w-full max-h-[90vh] overflow-y-auto"
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
          >
            ✕
          </button>
        </div>
        <div className="flex flex-wrap gap-4 p-4">
          <div className="flex flex-col items-center gap-2">
            <canvas
              ref={canvasRef}
              className="border-2 border-[var(--panel-border)]"
              width={COLS * SIZE}
              height={ROWS * SIZE}
            />
            <div className="flex gap-2">
              <button
                onClick={start}
                className="font-pixel text-xs bg-green-600 text-white px-3 py-1.5 rounded"
              >
                ▶ START
              </button>
              <button
                onClick={pause}
                className="font-pixel text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-3 py-1.5 rounded"
              >
                ⏸ PAUSE
              </button>
              <button
                onClick={start}
                className="font-pixel text-xs bg-red-500/25 text-red-300 border border-red-500/40 px-3 py-1.5 rounded"
              >
                ↺ RESTART
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 mt-2 sm:hidden">
              <div className="flex justify-center">
                <button
                  onClick={() => handleKey('up')}
                  className="w-10 h-10 bg-white/10 border border-white/30 rounded text-lg"
                >
                  ↻
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleKey('left')}
                  className="w-10 h-10 bg-white/10 border border-white/30 rounded text-lg"
                >
                  ◀
                </button>
                <button
                  onClick={() => handleKey('down')}
                  className="w-10 h-10 bg-white/10 border border-white/30 rounded text-lg"
                >
                  ▼
                </button>
                <button
                  onClick={() => handleKey('right')}
                  className="w-10 h-10 bg-white/10 border border-white/30 rounded text-lg"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-[200px] space-y-3">
            <div className="bg-white/5 border border-gold/30 rounded p-3 text-center">
              <div className="font-pixel text-xs text-[var(--text-muted)] mb-1">SAVINGS SCORE</div>
              <div className="font-pixel text-lg text-gold">₹{score.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/35 rounded p-3 text-center">
              <div className="font-pixel text-xs text-[var(--text-muted)] mb-1">
                OVERSPEND RISK
              </div>
              <div className={`font-pixel text-sm ${riskColor}`}>{risk}</div>
            </div>
            <div className="bg-white/5 border border-white/20 rounded p-3">
              <div className="font-pixel text-xs text-[var(--text-muted)] mb-1">NEXT EXPENSE</div>
              <canvas
                ref={nextRef}
                className="block mx-auto"
                width={80}
                height={80}
              />
            </div>
            <div className="bg-green-500/10 border border-green-500/25 rounded p-3">
              <div className="font-pixel text-xs text-[var(--green-light)] mb-2">
                ₹ MONTHLY BUDGET
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[var(--text-muted)]">Needs</span>
                  <div className="flex-1 h-1.5 bg-black/40 rounded overflow-hidden">
                    <div
                      className="h-full bg-red-400"
                      style={{
                        width: `${Math.min(100, (needsAmtRef.current / 15000) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-pixel text-[10px] text-gold">
                    ₹{needsAmtRef.current.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[var(--text-muted)]">Wants</span>
                  <div className="flex-1 h-1.5 bg-black/40 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-400"
                      style={{
                        width: `${Math.min(100, (wantsAmtRef.current / 4500) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-pixel text-[10px] text-gold">
                    ₹{wantsAmtRef.current.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[var(--text-muted)]">Savings</span>
                  <div className="flex-1 h-1.5 bg-black/40 rounded overflow-hidden">
                    <div
                      className="h-full bg-green-400"
                      style={{
                        width: `${Math.min(100, (savingsAmtRef.current / 3000) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-16 text-right font-pixel text-[10px] text-gold">
                    ₹{savingsAmtRef.current.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-white/15 rounded p-3 text-xs text-[var(--text-muted)] leading-relaxed">
              <div className="font-pixel text-[10px] mb-1">CONTROLS</div>
              <div>
                <span className="font-pixel text-[10px] text-gold">← →</span> Move block ·{' '}
                <span className="font-pixel text-[10px] text-gold">↑</span> Rotate ·{' '}
                <span className="font-pixel text-[10px] text-gold">↓</span> Soft drop ·{' '}
                <span className="font-pixel text-[10px] text-gold">Space</span> Hard drop
              </div>
              <div className="mt-2">
                Clear lines = clear debt. Each cleared row = <span className="text-gold">+₹500</span>{' '}
                saved in your virtual budget.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


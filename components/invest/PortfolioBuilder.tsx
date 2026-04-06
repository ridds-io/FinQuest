'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/invest/ui/Modal';
import { Slider } from '@/components/invest/ui/Slider';
import { Button } from '@/components/invest/ui/Button';
import { ProgressBar } from '@/components/invest/ui/ProgressBar';

// ─── Asset Config ─────────────────────────────────────────────────────────────

type Asset = {
  key: string;
  label: string;
  emoji: string;
  color: string;         // hex for slider
  barColor: string;      // tailwind class for progress bar
  baseReturn: number;    // % per event
  riskFactor: number;    // 0–1, how much an event affects it
};

const ASSETS: Asset[] = [
  { key: 'stocks',   label: 'Stocks (NIFTY)',  emoji: '📈', color: '#3b82f6', barColor: 'bg-blue-400',   baseReturn: 12, riskFactor: 1.0 },
  { key: 'mf',       label: 'Mutual Funds',    emoji: '🏦', color: '#22c55e', barColor: 'bg-green-400',  baseReturn: 10, riskFactor: 0.7 },
  { key: 'gold',     label: 'Gold',            emoji: '🥇', color: '#f59e0b', barColor: 'bg-yellow-400', baseReturn: 6,  riskFactor: 0.2 },
  { key: 'fd',       label: 'Fixed Deposit',   emoji: '🏛️', color: '#8b5cf6', barColor: 'bg-violet-400', baseReturn: 6.5, riskFactor: 0.0 },
];

type MarketEvent = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  multipliers: Record<string, number>;  // multiplier on base return per asset key
};

const MARKET_EVENTS: MarketEvent[] = [
  {
    id: 'bull',
    name: 'Bull Run! 🐂',
    emoji: '🚀',
    description: 'Markets are soaring! Tech and finance stocks lead the charge. Equities surge.',
    multipliers: { stocks: 2.5, mf: 2.0, gold: 0.5, fd: 1.0 },
  },
  {
    id: 'crash',
    name: 'Market Crash 📉',
    emoji: '💥',
    description: 'Global recession fears trigger a sell-off. Equities tank, gold shines as safe haven.',
    multipliers: { stocks: -1.5, mf: -1.0, gold: 2.0, fd: 1.0 },
  },
  {
    id: 'sideways',
    name: 'Sideways Market',
    emoji: '➡️',
    description: 'Markets drift sideways. No big moves. Consistent assets deliver steady returns.',
    multipliers: { stocks: 0.8, mf: 1.0, gold: 1.0, fd: 1.2 },
  },
  {
    id: 'inflation',
    name: 'Inflation Spike!',
    emoji: '🔥',
    description: 'Inflation rises sharply. FD real returns turn negative. Gold hedges well. Equities mixed.',
    multipliers: { stocks: 1.2, mf: 1.0, gold: 1.8, fd: 0.3 },
  },
  {
    id: 'rate_cut',
    name: 'RBI Rate Cut! ✂️',
    emoji: '🎉',
    description: 'RBI cuts interest rates to boost growth. Equities and bonds rally. FD rates fall.',
    multipliers: { stocks: 2.0, mf: 1.5, gold: 0.8, fd: 0.7 },
  },
];

const TOTAL_BUDGET = 10000;

type Phase = 'allocating' | 'event' | 'result';

interface PortfolioBuilderProps {
  onClose: () => void;
  onComplete: (xp: number, gold: number) => void;
}

export function PortfolioBuilder({ onClose, onComplete }: PortfolioBuilderProps) {
  // allocation[key] = % (0–100), must total ≤ 100
  const [allocation, setAllocation] = useState<Record<string, number>>({
    stocks: 25, mf: 25, gold: 25, fd: 25,
  });
  const [phase, setPhase] = useState<Phase>('allocating');
  const [event, setEvent] = useState<MarketEvent | null>(null);
  const [returns, setReturns] = useState<Record<string, number>>({});

  const totalAllocated = useMemo(() => Object.values(allocation).reduce((a, b) => a + b, 0), [allocation]);

  const diversificationScore = useMemo(() => {
    // Score 0–100: higher when spread is even across all 4 assets
    // Penalised when one asset dominates (>60%)
    const values = ASSETS.map((a) => allocation[a.key]);
    const maxVal = Math.max(...values);
    const nonZeroCount = values.filter((v) => v > 0).length;
    const evenBonus = nonZeroCount >= 3 ? 20 : 0;
    const domainPenalty = maxVal > 60 ? (maxVal - 60) * 1.5 : 0;
    const base = Math.round((1 - Math.abs(totalAllocated - 100) / 100) * 80);
    return Math.max(0, Math.min(100, base + evenBonus - domainPenalty));
  }, [allocation, totalAllocated]);

  const updateAllocation = (key: string, val: number) => {
    const rest = totalAllocated - allocation[key];
    const capped = Math.min(val, 100 - rest);
    setAllocation((prev) => ({ ...prev, [key]: capped }));
  };

  const simulate = () => {
    // Pick a random market event
    const ev = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    setEvent(ev);
    // Compute returns per asset
    const r: Record<string, number> = {};
    ASSETS.forEach((a) => {
      const investedAmount = (allocation[a.key] / 100) * TOTAL_BUDGET;
      const rawReturn = a.baseReturn * (ev.multipliers[a.key] ?? 1.0);
      r[a.key] = Math.round((investedAmount * rawReturn) / 100);
    });
    setReturns(r);
    setPhase('event');
    setTimeout(() => setPhase('result'), 1500);
  };

  const totalReturn = Object.values(returns).reduce((a, b) => a + b, 0);
  const finalValue = TOTAL_BUDGET + totalReturn;
  const xpEarned = Math.round(diversificationScore);
  const goldEarned = Math.round(diversificationScore * 3);

  return (
    <Modal title="🏗️ Portfolio Builder" onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-5 space-y-5">

        {phase === 'allocating' && (
          <>
            <div className="bg-black/30 border border-white/10 rounded-lg p-4">
              <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-1">YOUR VIRTUAL BUDGET</div>
              <div className="font-pixel text-xl text-gold">₹{TOTAL_BUDGET.toLocaleString('en-IN')}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Allocate across 4 asset classes. Total must = 100%.</div>
            </div>

            {/* Sliders */}
            <div className="space-y-5">
              {ASSETS.map((a) => (
                <div key={a.key} className="bg-black/20 border border-white/10 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{a.emoji}</span>
                    <div>
                      <div className="font-pixel text-xs text-[var(--text)]">{a.label}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Base return: ~{a.baseReturn}%/yr · Risk factor: {a.riskFactor === 0 ? 'None' : a.riskFactor >= 0.8 ? 'High' : 'Medium'}</div>
                    </div>
                    <div className="ml-auto font-pixel text-xs text-[var(--text-muted)]">
                      ₹{Math.round((allocation[a.key] / 100) * TOTAL_BUDGET).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <Slider
                    label={a.label}
                    value={allocation[a.key]}
                    min={0}
                    max={100}
                    step={5}
                    onChange={(v) => updateAllocation(a.key, v)}
                    unit="%"
                    color={a.color}
                  />
                </div>
              ))}
            </div>

            {/* Total + Diversification */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg p-3 border text-center ${totalAllocated === 100 ? 'bg-green-900/20 border-green-500/30' : totalAllocated > 100 ? 'bg-red-900/20 border-red-500/30' : 'bg-black/30 border-white/10'}`}>
                <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-1">TOTAL ALLOCATED</div>
                <div className={`font-pixel text-lg ${totalAllocated === 100 ? 'text-green-300' : totalAllocated > 100 ? 'text-red-300' : 'text-gold'}`}>
                  {totalAllocated}%
                </div>
              </div>
              <div className="bg-black/30 border border-white/10 rounded-lg p-3 text-center">
                <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-1">DIVERSIFICATION</div>
                <div className="font-pixel text-lg text-blue-300">{diversificationScore}/100</div>
              </div>
            </div>
            <ProgressBar value={diversificationScore} label="Diversification Score" color="bg-blue-400" showPercent />

            <Button
              onClick={simulate}
              disabled={totalAllocated !== 100}
              variant="secondary"
              fullWidth
            >
              Simulate Market Event →
            </Button>
            {totalAllocated !== 100 && (
              <div className="font-pixel text-[9px] text-red-300 text-center">
                Total must equal 100% (currently {totalAllocated}%)
              </div>
            )}
          </>
        )}

        {phase === 'event' && event && (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-bounce">{event.emoji}</div>
            <div className="font-pixel text-gold text-base text-center">{event.name}</div>
            <div className="text-sm text-[var(--text-muted)] text-center max-w-xs">{event.description}</div>
          </div>
        )}

        {phase === 'result' && event && (
          <div className="space-y-4">
            <div className="bg-black/30 border border-white/10 rounded-lg p-4">
              <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-2">EVENT: {event.name}</div>
              <p className="text-xs text-[var(--text)] leading-relaxed">{event.description}</p>
            </div>

            {/* Per-asset results */}
            <div className="space-y-2">
              {ASSETS.map((a) => {
                const r = returns[a.key] ?? 0;
                return (
                  <div key={a.key} className="flex items-center justify-between bg-black/20 border border-white/10 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{a.emoji}</span>
                      <span className="font-pixel text-[10px] text-[var(--text)]">{a.label}</span>
                      <span className="font-pixel text-[9px] text-[var(--text-muted)]">({allocation[a.key]}%)</span>
                    </div>
                    <span className={`font-pixel text-xs ${r >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {r >= 0 ? '+' : ''}₹{r.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/30 border border-white/10 rounded-lg p-3 text-center">
                <div className="font-pixel text-[8px] text-[var(--text-muted)] mb-1">INVESTED</div>
                <div className="font-pixel text-sm text-[var(--text)]">₹{TOTAL_BUDGET.toLocaleString('en-IN')}</div>
              </div>
              <div className={`rounded-lg p-3 border text-center ${totalReturn >= 0 ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                <div className="font-pixel text-[8px] text-[var(--text-muted)] mb-1">RETURN</div>
                <div className={`font-pixel text-sm ${totalReturn >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {totalReturn >= 0 ? '+' : ''}₹{totalReturn.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-black/30 border border-white/10 rounded-lg p-3 text-center">
                <div className="font-pixel text-[8px] text-[var(--text-muted)] mb-1">DIVERSIF.</div>
                <div className="font-pixel text-sm text-blue-300">{diversificationScore}/100</div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-4">
              <div className="font-pixel text-[9px] text-blue-300 mb-1">💡 Lesson</div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {diversificationScore >= 70
                  ? 'Excellent diversification! A well-balanced portfolio cushions losses during market events and captures gains from multiple sectors.'
                  : diversificationScore >= 40
                  ? 'Decent spread! Try to distribute more evenly next time — no single asset should dominate.'
                  : 'Your portfolio was too concentrated. During market events, one bad asset can tank your whole portfolio. Spread your risk!'}
              </p>
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => { onComplete(xpEarned, goldEarned); onClose(); }} variant="primary">
                Claim +{xpEarned} XP →
              </Button>
              <Button onClick={() => { setPhase('allocating'); setEvent(null); setReturns({}); }} variant="ghost">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

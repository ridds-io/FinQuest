'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/invest/ui/Modal';
import { Slider } from '@/components/invest/ui/Slider';
import { Button } from '@/components/invest/ui/Button';
import { ProgressBar } from '@/components/invest/ui/ProgressBar';

// ─── Simulation Config ────────────────────────────────────────────────────────

const TOTAL_MONTHS = 12;
const ANNUAL_RETURN = 0.12;   // 12% p.a. base
const MONTHLY_RATE   = ANNUAL_RETURN / 12;

type RandomEvent = {
  month: number;
  id: string;
  name: string;
  emoji: string;
  description: string;
  impact: number;    // multiplier on that month's value, e.g. 0.85 = −15%
  penalty?: number;  // extra gold lost (for early withdrawal)
};

// Events fire at fixed months during the simulation
const POSSIBLE_EVENTS: Omit<RandomEvent, 'month'>[] = [
  {
    id: 'crash',
    name: 'Market Crash 📉',
    emoji: '💥',
    description: 'Global sell-off hits! Your portfolio drops 15% this month.',
    impact: 0.85,
  },
  {
    id: 'rally',
    name: 'Rally! 🚀',
    emoji: '🎉',
    description: 'Markets surge on positive economic news! Your SIP benefits.',
    impact: 1.20,
  },
  {
    id: 'withdrawal',
    name: 'Early Withdrawal Temptation',
    emoji: '⚠️',
    description: 'You were tempted to withdraw early and paid a 2% exit load penalty.',
    impact: 0.98,
    penalty: 200,
  },
  {
    id: 'dividend',
    name: 'Dividend Reinvested!',
    emoji: '💸',
    description: 'Fund declares a dividend. It\'s reinvested, boosting your units.',
    impact: 1.05,
  },
];

type Phase = 'setup' | 'running' | 'done';

interface SipSimulatorProps {
  onClose: () => void;
  onComplete: (xp: number, gold: number) => void;
}

export function SipSimulator({ onClose, onComplete }: SipSimulatorProps) {
  const [sipAmount, setSipAmount] = useState(2000);
  const [phase, setPhase] = useState<Phase>('setup');
  const [monthlyData, setMonthlyData] = useState<
    Array<{ month: number; invested: number; value: number; event?: RandomEvent }>
  >([]);

  // Pre-assign events randomly on mount or when we run
  const events = useMemo<RandomEvent[]>(() => {
    const e1 = POSSIBLE_EVENTS[Math.floor(Math.random() * POSSIBLE_EVENTS.length)];
    let e2 = POSSIBLE_EVENTS[Math.floor(Math.random() * POSSIBLE_EVENTS.length)];
    if (e2.id === e1.id) e2 = POSSIBLE_EVENTS[(POSSIBLE_EVENTS.indexOf(e1) + 1) % POSSIBLE_EVENTS.length];
    return [
      { ...e1, month: 4 },
      { ...e2, month: 9 },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSimulation = () => {
    const data: typeof monthlyData = [];
    let value = 0;
    let totalInvested = 0;
    const eventMap = Object.fromEntries(events.map((e) => [e.month, e]));

    for (let m = 1; m <= TOTAL_MONTHS; m++) {
      // SIP contribution this month
      value += sipAmount;
      totalInvested += sipAmount;
      // Monthly growth
      value *= (1 + MONTHLY_RATE);
      // Apply event if any
      const ev = eventMap[m] as RandomEvent | undefined;
      if (ev) {
        value *= ev.impact;
      }
      data.push({ month: m, invested: totalInvested, value: Math.round(value), event: ev });
    }
    setMonthlyData(data);
    setPhase('done');
  };

  const finalValue  = monthlyData.at(-1)?.value ?? 0;
  const totalInvested = sipAmount * TOTAL_MONTHS;
  const gainLoss    = finalValue - totalInvested;
  const returnPct   = totalInvested > 0 ? ((gainLoss / totalInvested) * 100).toFixed(1) : '0.0';
  const xpEarned    = gainLoss >= 0 ? Math.min(200, 80 + Math.round(gainLoss / 50)) : 40;
  const goldEarned  = Math.max(0, Math.round(gainLoss / 10));

  // Bar chart scaling
  const maxVal = Math.max(...monthlyData.map((d) => d.value), totalInvested, 1);

  return (
    <Modal title="📅 SIP Simulator — 12-Month Run" onClose={onClose} maxWidth="max-w-2xl">
      <div className="p-5 space-y-5">

        {phase === 'setup' && (
          <>
            <div className="bg-[rgba(34,197,94,0.08)] border border-green-500/20 rounded-lg p-4">
              <div className="font-pixel text-[9px] text-green-300 mb-2">WHAT IS A SIP?</div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                A Systematic Investment Plan (SIP) lets you invest a fixed amount every month into a mutual fund. 
                Compounding and rupee cost averaging work together to grow your wealth over time.
              </p>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-lg p-4 space-y-4">
              <Slider
                label="Monthly SIP Amount"
                value={sipAmount}
                min={500}
                max={5000}
                step={500}
                onChange={setSipAmount}
                unit=""
                color="#22c55e"
              />
              <div className="font-pixel text-sm text-gold text-center">₹{sipAmount.toLocaleString('en-IN')}/month</div>
            </div>

            {/* Projection preview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 border border-white/10 rounded-lg p-3 text-center">
                <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-1">TOTAL INVESTED</div>
                <div className="font-pixel text-sm text-[var(--text)]">₹{(sipAmount * TOTAL_MONTHS).toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-3 text-center">
                <div className="font-pixel text-[9px] text-green-200 mb-1">EST. VALUE @ 12%</div>
                <div className="font-pixel text-sm text-green-300">
                  ₹{Math.round(sipAmount * ((Math.pow(1 + MONTHLY_RATE, TOTAL_MONTHS) - 1) / MONTHLY_RATE) * (1 + MONTHLY_RATE)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-lg p-3">
              <div className="font-pixel text-[9px] text-yellow-300 mb-1">⚠️ RANDOM EVENTS</div>
              <p className="text-xs text-[var(--text-muted)]">
                Two random market events will occur during your 12-month run. Stay the course!
              </p>
            </div>

            <Button onClick={runSimulation} variant="secondary" fullWidth>
              🚀 Start 12-Month SIP
            </Button>
          </>
        )}

        {phase === 'done' && (
          <>
            {/* Bar Chart */}
            <div className="bg-black/30 border border-white/10 rounded-lg p-4">
              <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-3">PORTFOLIO VALUE — MONTH BY MONTH</div>
              <div className="flex items-end gap-1 h-32">
                {monthlyData.map((d) => {
                  const heightPct = (d.value / maxVal) * 100;
                  const investedPct = (d.invested / maxVal) * 100;
                  const hasEvent = !!d.event;
                  return (
                    <div key={d.month} className="flex flex-col items-center flex-1 group relative" title={`Month ${d.month}: ₹${d.value.toLocaleString('en-IN')}`}>
                      {hasEvent && (
                        <span className="text-[8px] mb-0.5">{d.event!.emoji}</span>
                      )}
                      <div className="w-full flex flex-col-reverse" style={{ height: '100px' }}>
                        {/* Invested (base) */}
                        <div
                          className="w-full bg-white/15 rounded-sm"
                          style={{ height: `${investedPct}%` }}
                        />
                        {/* Value above invested */}
                        <div
                          className="w-full rounded-sm"
                          style={{
                            height: `${Math.max(0, heightPct - investedPct)}%`,
                            background: d.value >= d.invested ? '#22c55e' : '#ef4444',
                          }}
                        />
                      </div>
                      <div className="font-pixel text-[7px] text-[var(--text-muted)] mt-0.5">{d.month}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white/20 rounded-sm" /><span className="font-pixel text-[8px] text-[var(--text-muted)]">Invested</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded-sm" /><span className="font-pixel text-[8px] text-[var(--text-muted)]">Gain</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded-sm" /><span className="font-pixel text-[8px] text-[var(--text-muted)]">Loss</span></div>
              </div>
            </div>

            {/* Events log */}
            <div className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="bg-yellow-500/10 border border-yellow-500/25 rounded-lg p-3">
                  <div className="font-pixel text-[9px] text-yellow-200 mb-1">Month {ev.month} — {ev.name}</div>
                  <p className="text-xs text-[var(--text-muted)]">{ev.description}</p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-black/30 border border-white/10 rounded-lg p-3 text-center">
                <div className="font-pixel text-[8px] text-[var(--text-muted)] mb-1">INVESTED</div>
                <div className="font-pixel text-sm">₹{totalInvested.toLocaleString('en-IN')}</div>
              </div>
              <div className={`rounded-lg p-3 border text-center ${gainLoss >= 0 ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                <div className="font-pixel text-[8px] text-[var(--text-muted)] mb-1">FINAL VALUE</div>
                <div className={`font-pixel text-sm ${gainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>₹{finalValue.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-3 text-center">
                <div className="font-pixel text-[8px] text-[var(--text-muted)] mb-1">RETURN</div>
                <div className={`font-pixel text-sm ${gainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {gainLoss >= 0 ? '+' : ''}{returnPct}%
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-4">
              <div className="font-pixel text-[9px] text-blue-300 mb-1">💡 Compounding Lesson</div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Even with market events, your consistent ₹{sipAmount.toLocaleString('en-IN')}/month SIP{' '}
                {gainLoss >= 0
                  ? 'generated positive returns! This is rupee cost averaging in action — you buy more units when prices are cheap.'
                  : 'was impacted by events this time. But over a 10-year horizon, even crashy months smooth out into strong growth.'}
              </p>
            </div>

            <ProgressBar value={Math.max(0, Math.min(100, Number(returnPct) + 50))} label="Return vs Benchmark" color={gainLoss >= 0 ? 'bg-green-400' : 'bg-red-400'} showPercent />

            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => { onComplete(xpEarned, goldEarned); onClose(); }} variant="primary">
                Claim +{xpEarned} XP →
              </Button>
              <Button onClick={() => { setPhase('setup'); setMonthlyData([]); }} variant="ghost">
                Run Again
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

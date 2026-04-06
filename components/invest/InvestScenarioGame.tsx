'use client';

import { useState } from 'react';
import { Modal } from '@/components/invest/ui/Modal';
import { ChoiceCard } from '@/components/invest/ui/ChoiceCard';
import { Button } from '@/components/invest/ui/Button';
import { ProgressBar } from '@/components/invest/ui/ProgressBar';

// ─── Scenario Data ────────────────────────────────────────────────────────────
// Each scenario has 3 choices; one is "best", one is "ok", one is "risky".

type Choice = {
  label: string;
  description: string;
  badge: string;
  badgeColor: string;
  returnPct: number;    // simulated return %
  riskLevel: 'Low' | 'Medium' | 'High';
  feedback: string;
  xp: number;
};

type Scenario = {
  id: string;
  context: string;
  amount: number;
  question: string;
  choices: Choice[];
};

const SCENARIOS: Scenario[] = [
  {
    id: 's1',
    context: "You've saved ₹5,000 this month after all expenses. You want to put it to work.",
    amount: 5000,
    question: 'Where do you invest your ₹5,000?',
    choices: [
      {
        label: 'NIFTY 50 Index Fund (SIP)',
        description: 'Invest in India\'s top 50 companies automatically each month.',
        badge: 'Recommended',
        badgeColor: 'text-green-300',
        returnPct: 12,
        riskLevel: 'Medium',
        feedback: 'Great choice! Index funds are ideal for beginners — low cost, market returns, and automatic diversification.',
        xp: 100,
      },
      {
        label: 'Random penny stock tip from friend',
        description: 'Your friend says this stock will 10x in 3 months.',
        badge: 'Very Risky',
        badgeColor: 'text-red-300',
        returnPct: -40,
        riskLevel: 'High',
        feedback: 'Ouch! Stock tips from friends are rarely based on research. Most penny stocks are highly speculative and can wipe out your capital.',
        xp: 20,
      },
      {
        label: 'Keep in Savings Account',
        description: 'Safe, but your bank gives only 3.5% interest per year.',
        badge: 'Safe but slow',
        badgeColor: 'text-yellow-200',
        returnPct: 3.5,
        riskLevel: 'Low',
        feedback: 'Safe choice! But savings accounts barely beat inflation (~6%). Over time your money loses real value. Consider a better option next time.',
        xp: 50,
      },
    ],
  },
  {
    id: 's2',
    context: 'Your internship just paid ₹8,000. You have 6 months until you need it for fees.',
    amount: 8000,
    question: 'Where do you park this money for 6 months?',
    choices: [
      {
        label: 'Liquid Mutual Fund',
        description: 'Low risk, redeemable anytime, earns ~6–7% annually.',
        badge: 'Best for short-term',
        badgeColor: 'text-green-300',
        returnPct: 7,
        riskLevel: 'Low',
        feedback: 'Excellent! Liquid funds are the go-to for short-term parking. Better than savings accounts, low risk, and easily redeemable.',
        xp: 100,
      },
      {
        label: 'Crypto (Bitcoin)',
        description: 'High volatility. Could double or halve in 6 months.',
        badge: 'Very Risky',
        badgeColor: 'text-red-300',
        returnPct: -30,
        riskLevel: 'High',
        feedback: 'For money you NEED in 6 months, crypto is far too volatile. You could easily lose 50%+ and not have enough for your fees.',
        xp: 15,
      },
      {
        label: '6-month Fixed Deposit',
        description: 'Locks money for 6 months, earns ~6.5% p.a.',
        badge: 'Good option',
        badgeColor: 'text-blue-300',
        returnPct: 6.5,
        riskLevel: 'Low',
        feedback: 'Solid choice! FD is safe and matches your timeline. The only downside is premature withdrawal penalties — plan carefully.',
        xp: 80,
      },
    ],
  },
  {
    id: 's3',
    context: 'You receive ₹15,000 as a Diwali gift from your parents.',
    amount: 15000,
    question: 'You want to build wealth. What do you do?',
    choices: [
      {
        label: 'Split: 60% Index Fund + 40% Gold ETF',
        description: 'Diversified across equities and a safe-haven asset.',
        badge: 'Diversified',
        badgeColor: 'text-green-300',
        returnPct: 10,
        riskLevel: 'Medium',
        feedback: 'Smart diversification! Gold balances equity risk. This is a textbook beginner portfolio — well done.',
        xp: 120,
      },
      {
        label: 'All in on a single mid-cap stock',
        description: 'Going all-in on one company that "looks promising".',
        badge: 'Undiversified',
        badgeColor: 'text-red-300',
        returnPct: -20,
        riskLevel: 'High',
        feedback: 'Putting everything in one stock is called concentration risk. If the company falls, you lose everything. Never put all eggs in one basket.',
        xp: 20,
      },
      {
        label: 'PPF (Public Provident Fund)',
        description: '15-year lock-in, 7.1% tax-free interest from the government.',
        badge: 'Tax-free, long-term',
        badgeColor: 'text-blue-300',
        returnPct: 7.1,
        riskLevel: 'Low',
        feedback: 'Great for long-term wealth and tax saving! The 15-year lock-in is a commitment though — make sure this is truly money you won\'t need urgently.',
        xp: 90,
      },
    ],
  },
  {
    id: 's4',
    context: 'You have ₹2,000/month extra. You want to start investing small.',
    amount: 2000,
    question: 'What\'s the smartest move as a beginner?',
    choices: [
      {
        label: 'Start a ₹2,000/month SIP in an index fund',
        description: 'Invest consistently every month, let compounding do the work.',
        badge: 'Best habit',
        badgeColor: 'text-green-300',
        returnPct: 12,
        riskLevel: 'Medium',
        feedback: 'This is THE golden habit. ₹2,000/month for 10 years at 12% grows to ₹4.6 lakhs. Consistency beats timing every time!',
        xp: 120,
      },
      {
        label: 'Wait until you have ₹50,000 to invest "properly"',
        description: 'Save up first, then invest a large sum at once.',
        badge: 'Timing mistake',
        badgeColor: 'text-red-300',
        returnPct: 0,
        riskLevel: 'Low',
        feedback: 'Waiting is a common mistake! You lose months of compounding. Starting with ₹500 is better than waiting for ₹50,000. Time in market > timing the market.',
        xp: 10,
      },
      {
        label: 'Use it to buy US stocks (Nasdaq ETF)',
        description: 'Invest in global tech companies via an international ETF.',
        badge: 'Global exposure',
        badgeColor: 'text-blue-300',
        returnPct: 14,
        riskLevel: 'Medium',
        feedback: 'Solid for global diversification! USD exposure can be a hedge against rupee depreciation. Slightly higher fees than domestic funds, but a smart long-term play.',
        xp: 90,
      },
    ],
  },
  {
    id: 's5',
    context: 'Market crash alert! Your ₹20,000 portfolio just dropped 25% in value.',
    amount: 20000,
    question: 'What do you do?',
    choices: [
      {
        label: 'Stay calm, continue SIP — or buy more',
        description: 'Markets recover. Crashes are actually opportunities to buy cheap.',
        badge: 'Long-term thinking',
        badgeColor: 'text-green-300',
        returnPct: 15,
        riskLevel: 'Medium',
        feedback: 'Brilliant mindset! Every market crash has been followed by a recovery. Staying invested (or buying more) during crashes is how long-term wealth is built.',
        xp: 130,
      },
      {
        label: 'Panic sell everything immediately',
        description: 'Cut your losses now before it drops further.',
        badge: 'Panic trap',
        badgeColor: 'text-red-300',
        returnPct: -25,
        riskLevel: 'High',
        feedback: 'This is the most common mistake! Selling in a panic locks in your losses permanently. Markets have ALWAYS recovered historically. Patience is your biggest asset.',
        xp: 5,
      },
      {
        label: 'Pause SIP and wait for it to "stabilize"',
        description: 'Stop investing until the market settles down.',
        badge: 'Missed opportunity',
        badgeColor: 'text-yellow-200',
        returnPct: 0,
        riskLevel: 'Low',
        feedback: 'This feels safe but costs you. Pausing during a crash means missing the cheapest prices. "Stabilize" usually means prices are back up again.',
        xp: 30,
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

type Phase = 'choosing' | 'result' | 'summary';

interface InvestScenarioGameProps {
  onClose: () => void;
  onComplete: (xp: number, gold: number) => void;
}

export function InvestScenarioGame({ onClose, onComplete }: InvestScenarioGameProps) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('choosing');
  const [totalXp, setTotalXp] = useState(0);
  const [bestCount, setBestCount] = useState(0);

  const scenario = SCENARIOS[idx];
  const choice = selected !== null ? scenario.choices[selected] : null;
  const progress = Math.round(((idx + (phase === 'summary' ? 1 : 0)) / SCENARIOS.length) * 100);

  const handleChoose = (i: number) => {
    if (phase !== 'choosing') return;
    setSelected(i);
    setPhase('result');
    const c = scenario.choices[i];
    setTotalXp((t) => t + c.xp);
    if (c.xp >= 100) setBestCount((b) => b + 1);
  };

  const handleNext = () => {
    const next = idx + 1;
    if (next >= SCENARIOS.length) {
      setPhase('summary');
    } else {
      setIdx(next);
      setSelected(null);
      setPhase('choosing');
    }
  };

  const handleFinish = () => {
    const gold = Math.min(500, totalXp * 2);
    onComplete(totalXp, gold);
    onClose();
  };

  return (
    <Modal title="📈 Investment Scenario Game" onClose={onClose}>
      <div className="p-5 space-y-4">
        {/* Progress */}
        <ProgressBar value={progress} label={`Scenario ${Math.min(idx + 1, SCENARIOS.length)} / ${SCENARIOS.length}`} showPercent />

        {phase === 'summary' ? (
          /* ── Summary Screen ── */
          <div className="space-y-5">
            <div className="text-center">
              <div className="text-4xl mb-2">
                {bestCount >= 4 ? '🏆' : bestCount >= 2 ? '🥈' : '🎯'}
              </div>
              <div className="font-pixel text-gold text-base mb-1">Session Complete!</div>
              <div className="text-sm text-[var(--text-muted)]">
                You made {bestCount} optimal choice{bestCount !== 1 ? 's' : ''} out of {SCENARIOS.length}.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-4 text-center">
                <div className="font-pixel text-[9px] text-blue-200 mb-1">XP EARNED</div>
                <div className="font-pixel text-xl text-blue-100">+{totalXp}</div>
              </div>
              <div className="bg-gold/10 border border-gold/25 rounded-lg p-4 text-center">
                <div className="font-pixel text-[9px] text-gold mb-1">GOLD EARNED</div>
                <div className="font-pixel text-xl text-yellow-200">+₹{Math.min(500, totalXp * 2)}</div>
              </div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-4 text-sm text-[var(--text-muted)] leading-relaxed">
              <span className="font-pixel text-gold text-xs block mb-1">💡 Key Lesson</span>
              The best investors don't chase returns — they manage risk, diversify, and stay consistent. Time in market always beats timing the market.
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleFinish} variant="primary">Claim Rewards →</Button>
              <Button onClick={onClose} variant="ghost">Close</Button>
            </div>
          </div>
        ) : (
          /* ── Active Game ── */
          <div className="space-y-4">
            {/* Context Card */}
            <div className="bg-[rgba(59,130,246,0.08)] border border-blue-500/20 rounded-lg p-4">
              <div className="font-pixel text-[9px] text-blue-300 mb-2">SITUATION</div>
              <p className="text-sm text-[var(--text)] leading-relaxed">{scenario.context}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-pixel text-[9px] text-[var(--text-muted)]">AMOUNT AT STAKE:</span>
                <span className="font-pixel text-sm text-gold">₹{scenario.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="font-pixel text-[10px] text-[var(--text-muted)]">{scenario.question}</div>

            {/* Choices */}
            <div className="space-y-2">
              {scenario.choices.map((c, i) => (
                <ChoiceCard
                  key={i}
                  label={c.label}
                  description={phase === 'choosing' ? c.description : undefined}
                  badge={c.badge}
                  badgeColor={c.badgeColor}
                  selected={selected === i}
                  disabled={phase === 'result' && selected !== i}
                  onClick={() => handleChoose(i)}
                />
              ))}
            </div>

            {/* Result Panel */}
            {phase === 'result' && choice && (
              <div className={`rounded-lg p-4 border ${choice.xp >= 100 ? 'bg-green-900/20 border-green-500/30' : choice.xp <= 20 ? 'bg-red-900/20 border-red-500/30' : 'bg-yellow-900/20 border-yellow-500/30'}`}>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <div className="font-pixel text-[8px] text-[var(--text-muted)] mb-1">RETURN</div>
                    <div className={`font-pixel text-sm ${choice.returnPct >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {choice.returnPct >= 0 ? '+' : ''}{choice.returnPct}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-pixel text-[8px] text-[var(--text-muted)] mb-1">RISK</div>
                    <div className={`font-pixel text-sm ${choice.riskLevel === 'Low' ? 'text-green-300' : choice.riskLevel === 'High' ? 'text-red-300' : 'text-yellow-300'}`}>
                      {choice.riskLevel}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-pixel text-[8px] text-[var(--text-muted)] mb-1">XP</div>
                    <div className="font-pixel text-sm text-blue-300">+{choice.xp}</div>
                  </div>
                </div>
                <p className="text-xs text-[var(--text)] leading-relaxed">{choice.feedback}</p>
              </div>
            )}

            {phase === 'result' && (
              <div className="flex justify-end">
                <Button onClick={handleNext} variant="secondary">
                  {idx + 1 < SCENARIOS.length ? 'Next Scenario →' : 'See Results →'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

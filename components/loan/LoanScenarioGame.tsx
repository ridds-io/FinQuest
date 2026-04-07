'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/loan/ui/Modal';
import { Button } from '@/components/loan/ui/Button';
import { ProgressBar } from '@/components/loan/ui/ProgressBar';
import {
  LOAN_SCENARIOS,
  calculateEMI,
  totalInterestPaid,
  type LoanScenario,
  type LoanDecision,
} from '@/lib/loanUtils';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'choosing' | 'result' | 'summary';

interface Props {
  onClose: () => void;
  onComplete: (xp: number, gold: number) => void;
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('en-IN');
}

// ─── Loan Info Card ───────────────────────────────────────────────────────────
function LoanCard({ scenario }: { scenario: LoanScenario }) {
  const emi = useMemo(
    () => calculateEMI(scenario.amount, scenario.annualRatePct, scenario.tenureMonths),
    [scenario],
  );
  const interest = useMemo(
    () => totalInterestPaid(emi, scenario.tenureMonths, scenario.amount),
    [emi, scenario],
  );
  const totalPayable = scenario.amount + interest;
  const years = Math.floor(scenario.tenureMonths / 12);
  const months = scenario.tenureMonths % 12;

  return (
    <div className="bg-[rgba(59,130,246,0.07)] border border-blue-500/20 rounded-xl p-4 space-y-3">
      {/* Purpose header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{scenario.purposeEmoji}</span>
        <div>
          <div className="font-pixel text-[9px] text-blue-300 uppercase tracking-wider mb-0.5">Loan Purpose</div>
          <div className="text-sm text-[var(--text)] font-medium">{scenario.purpose}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="PRINCIPAL" value={`₹${fmt(scenario.amount)}`} color="text-gold" />
        <Stat label="INTEREST RATE" value={`${scenario.annualRatePct}% p.a.`} color="text-orange-300" />
        <Stat
          label="TENURE"
          value={years > 0 ? `${years}yr${months > 0 ? ` ${months}mo` : ''}` : `${months} months`}
          color="text-blue-300"
        />
        <Stat label="MONTHLY EMI" value={`₹${fmt(emi)}`} color="text-green-300" />
      </div>

      {/* Total cost */}
      <div className="flex justify-between items-center bg-black/30 rounded-lg px-3 py-2">
        <span className="font-pixel text-[8px] text-[var(--text-muted)]">TOTAL PAYABLE (Principal + Interest)</span>
        <span className="font-pixel text-xs text-red-300">₹{fmt(totalPayable)}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-center">
      <div className="font-pixel text-[7px] text-[var(--text-muted)] mb-1">{label}</div>
      <div className={`font-pixel text-xs ${color}`}>{value}</div>
    </div>
  );
}

// ─── Decision Buttons ─────────────────────────────────────────────────────────
function DecisionButtons({
  onDecide,
  disabled,
}: {
  onDecide: (d: LoanDecision) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        disabled={disabled}
        onClick={() => onDecide('take')}
        className="group flex flex-col items-center gap-2 bg-green-900/30 border-2 border-green-500/40 hover:border-green-400 hover:bg-green-900/50 rounded-xl p-4 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
      >
        <span className="text-3xl group-hover:scale-110 transition-transform">✅</span>
        <span className="font-pixel text-[11px] text-green-300">TAKE LOAN</span>
        <span className="text-xs text-[var(--text-muted)] text-center leading-snug">I accept this loan</span>
      </button>
      <button
        disabled={disabled}
        onClick={() => onDecide('reject')}
        className="group flex flex-col items-center gap-2 bg-red-900/30 border-2 border-red-500/40 hover:border-red-400 hover:bg-red-900/50 rounded-xl p-4 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
      >
        <span className="text-3xl group-hover:scale-110 transition-transform">❌</span>
        <span className="font-pixel text-[11px] text-red-300">REJECT LOAN</span>
        <span className="text-xs text-[var(--text-muted)] text-center leading-snug">I refuse this offer</span>
      </button>
    </div>
  );
}

// ─── Result Panel ─────────────────────────────────────────────────────────────
function ResultPanel({
  scenario,
  decision,
  xpEarned,
}: {
  scenario: LoanScenario;
  decision: LoanDecision;
  xpEarned: number;
}) {
  const isCorrect = decision === scenario.correctDecision;
  const feedbackText = isCorrect ? scenario.feedback.correct : scenario.feedback.wrong;

  return (
    <div
      className={`rounded-xl border-2 p-4 space-y-3 ${
        isCorrect
          ? 'bg-green-900/20 border-green-500/40'
          : 'bg-red-900/20 border-red-500/40'
      }`}
    >
      {/* Verdict */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{isCorrect ? '🎉' : '💡'}</span>
        <div>
          <div className={`font-pixel text-sm ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
            {isCorrect ? 'Correct Decision!' : 'Not quite right'}
          </div>
          <div className="font-pixel text-[9px] text-[var(--text-muted)]">
            Best choice was: <span className="text-gold uppercase">{scenario.correctDecision} loan</span>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="font-pixel text-[8px] text-[var(--text-muted)]">XP EARNED</div>
          <div className="font-pixel text-sm text-blue-300">+{xpEarned}</div>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-xs text-[var(--text)] leading-relaxed">{feedbackText}</p>

      {/* Penny tip */}
      <div className="bg-[rgba(10,15,30,0.8)] border border-blue-400/30 rounded-lg p-3 flex gap-3 items-start">
        <span className="text-xl flex-shrink-0">🐱</span>
        <div>
          <div className="font-pixel text-[8px] text-blue-400 mb-1">PENNY SAYS</div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">
            "{scenario.feedback.pennyTip}"
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Game Component ──────────────────────────────────────────────────────
export function LoanScenarioGame({ onClose, onComplete }: Props) {
  // Shuffle scenarios for variety each session
  const scenarios = useMemo(
    () => [...LOAN_SCENARIOS].sort(() => Math.random() - 0.5).slice(0, 5),
    [],
  );

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('choosing');
  const [decision, setDecision] = useState<LoanDecision | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const scenario = scenarios[idx];
  const progress = Math.round(((idx + (phase === 'summary' ? 1 : 0)) / scenarios.length) * 100);

  const handleDecide = (d: LoanDecision) => {
    if (phase !== 'choosing') return;
    setDecision(d);
    setPhase('result');
    const isCorrect = d === scenario.correctDecision;
    const xp = isCorrect ? scenario.xp.correct : scenario.xp.wrong;
    setTotalXp((t) => t + xp);
    if (isCorrect) setCorrectCount((c) => c + 1);
  };

  const handleNext = () => {
    const next = idx + 1;
    if (next >= scenarios.length) {
      setPhase('summary');
    } else {
      setIdx(next);
      setDecision(null);
      setPhase('choosing');
    }
  };

  const handleFinish = () => {
    const gold = Math.min(600, totalXp * 2);
    onComplete(totalXp, gold);
    onClose();
  };

  return (
    <Modal title="⚖️ Debt Decision — Take or Reject?" onClose={onClose}>
      <div className="p-5 space-y-4">
        <ProgressBar
          value={progress}
          label={`Scenario ${Math.min(idx + 1, scenarios.length)} / ${scenarios.length}`}
          color="bg-blue-500"
          showPercent
        />

        {/* ── SUMMARY SCREEN ── */}
        {phase === 'summary' ? (
          <div className="space-y-5">
            <div className="text-center py-4">
              <div className="text-5xl mb-3">
                {correctCount >= 4 ? '🏆' : correctCount >= 2 ? '🥈' : '📚'}
              </div>
              <div className="font-pixel text-gold text-base mb-1">Session Complete!</div>
              <div className="text-sm text-[var(--text-muted)]">
                You made {correctCount} correct decision{correctCount !== 1 ? 's' : ''} out of{' '}
                {scenarios.length}.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-4 text-center">
                <div className="font-pixel text-[9px] text-blue-200 mb-1">XP EARNED</div>
                <div className="font-pixel text-xl text-blue-100">+{totalXp}</div>
              </div>
              <div className="bg-gold/10 border border-gold/25 rounded-lg p-4 text-center">
                <div className="font-pixel text-[9px] text-gold mb-1">GOLD EARNED</div>
                <div className="font-pixel text-xl text-yellow-200">+₹{Math.min(600, totalXp * 2)}</div>
              </div>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-lg p-4 text-sm text-[var(--text-muted)] leading-relaxed">
              <span className="font-pixel text-gold text-xs block mb-1">💡 Key Lesson</span>
              Good debt builds your future (education, business, home). Bad debt funds consumption
              (luxury, vacations, gadgets). Always ask: "Will this loan make me better off in the
              long run?"
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={handleFinish} variant="primary">
                Claim Rewards →
              </Button>
              <Button onClick={onClose} variant="ghost">
                Close
              </Button>
            </div>
          </div>
        ) : (
          /* ── ACTIVE GAME ── */
          <div className="space-y-4">
            {/* Context */}
            <div className="bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl p-4">
              <div className="font-pixel text-[9px] text-[var(--text-muted)] uppercase mb-2">
                📋 Situation
              </div>
              <p className="text-sm text-[var(--text)] leading-relaxed">{scenario.context}</p>
            </div>

            {/* Loan card */}
            <LoanCard scenario={scenario} />

            {/* Choice or result */}
            {phase === 'choosing' && (
              <DecisionButtons onDecide={handleDecide} disabled={false} />
            )}

            {phase === 'result' && decision && (
              <>
                <ResultPanel
                  scenario={scenario}
                  decision={decision}
                  xpEarned={
                    decision === scenario.correctDecision
                      ? scenario.xp.correct
                      : scenario.xp.wrong
                  }
                />
                <div className="flex justify-end">
                  <Button onClick={handleNext} variant="secondary">
                    {idx + 1 < scenarios.length ? 'Next Scenario →' : 'See Results →'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

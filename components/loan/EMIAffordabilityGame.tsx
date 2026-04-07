'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/loan/ui/Modal';
import { Button } from '@/components/loan/ui/Button';
import { ProgressBar } from '@/components/loan/ui/ProgressBar';
import {
  EMI_SCENARIOS,
  calculateEMI,
  isAffordable,
  emiToIncomeRatio,
  totalInterestPaid,
} from '@/lib/loanUtils';

// ─── Types ────────────────────────────────────────────────────────────────────
type AffordabilityDecision = 'affordable' | 'not-affordable';
type Phase = 'choosing' | 'result' | 'summary';

interface Props {
  onClose: () => void;
  onComplete: (xp: number, gold: number) => void;
}

function fmt(n: number) {
  return n.toLocaleString('en-IN');
}

// ─── EMI Breakdown Visual ─────────────────────────────────────────────────────
function EMIBreakdown({
  amount,
  annualRatePct,
  tenureMonths,
  monthlyIncome,
}: {
  amount: number;
  annualRatePct: number;
  tenureMonths: number;
  monthlyIncome: number;
}) {
  const emi = useMemo(
    () => calculateEMI(amount, annualRatePct, tenureMonths),
    [amount, annualRatePct, tenureMonths],
  );
  const interest = useMemo(
    () => totalInterestPaid(emi, tenureMonths, amount),
    [emi, tenureMonths, amount],
  );
  const ratio = emiToIncomeRatio(monthlyIncome, emi);
  const affordable = isAffordable(monthlyIncome, emi);
  const years = Math.floor(tenureMonths / 12);
  const months = tenureMonths % 12;

  // Percentage bars for visual comparison
  const emiBarWidth = Math.min(100, ratio);
  const remainingBarWidth = Math.max(0, 100 - ratio);

  return (
    <div className="space-y-3">
      {/* Loan details grid */}
      <div className="grid grid-cols-3 gap-2">
        <StatCell label="LOAN AMOUNT" value={`₹${fmt(amount)}`} color="text-[var(--text)]" />
        <StatCell label="INTEREST RATE" value={`${annualRatePct}% p.a.`} color="text-orange-300" />
        <StatCell
          label="TENURE"
          value={years > 0 ? `${years}yr${months > 0 ? ` ${months}mo` : ''}` : `${months}mo`}
          color="text-blue-300"
        />
      </div>

      {/* EMI highlight */}
      <div className="bg-[rgba(59,130,246,0.1)] border-2 border-blue-500/40 rounded-xl p-4 text-center">
        <div className="font-pixel text-[9px] text-blue-300 mb-1">CALCULATED MONTHLY EMI</div>
        <div className="font-pixel text-2xl text-blue-100">₹{fmt(emi)}</div>
        <div className="font-pixel text-[8px] text-[var(--text-muted)] mt-1">
          Total payable: ₹{fmt(amount + interest)} (₹{fmt(interest)} interest)
        </div>
      </div>

      {/* Income vs EMI visual */}
      <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="font-pixel text-[8px] text-[var(--text-muted)] mb-0.5">MONTHLY INCOME</div>
            <div className="font-pixel text-sm text-green-300">₹{fmt(monthlyIncome)}</div>
          </div>
          <div className="text-right">
            <div className="font-pixel text-[8px] text-[var(--text-muted)] mb-0.5">EMI / INCOME</div>
            <div
              className={`font-pixel text-sm ${
                ratio <= 30
                  ? 'text-green-300'
                  : ratio <= 40
                  ? 'text-yellow-300'
                  : 'text-red-300'
              }`}
            >
              {ratio}%
            </div>
          </div>
        </div>

        {/* Stacked income bar */}
        <div className="h-6 bg-white/10 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-700 ${
              ratio <= 30 ? 'bg-green-500' : ratio <= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${emiBarWidth}%` }}
          />
          <div className="h-full bg-white/20" style={{ width: `${remainingBarWidth}%` }} />
        </div>

        <div className="flex justify-between font-pixel text-[7px] text-[var(--text-muted)]">
          <span>EMI: {ratio}%</span>
          <span className="text-white/40">⬅ 40% RULE ➡</span>
          <span>Remaining: {Math.max(0, 100 - ratio)}%</span>
        </div>

        {/* 40% marker */}
        <div className="relative h-1">
          <div
            className="absolute top-0 h-4 w-0.5 bg-yellow-400 -translate-y-2"
            style={{ left: '40%' }}
          />
          <div
            className="absolute font-pixel text-[7px] text-yellow-400 -translate-x-1/2 -translate-y-5"
            style={{ left: '40%' }}
          >
            40%
          </div>
        </div>
      </div>

      {/* Rule reminder */}
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg px-3 py-2">
        <span className="font-pixel text-[8px] text-yellow-300">
          📏 RULE: EMI should not exceed 40% of monthly income
        </span>
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-black/20 border border-white/10 rounded-lg px-2 py-2 text-center">
      <div className="font-pixel text-[7px] text-[var(--text-muted)] mb-1">{label}</div>
      <div className={`font-pixel text-[10px] ${color}`}>{value}</div>
    </div>
  );
}

// ─── Affordability Decision Buttons ──────────────────────────────────────────
function AffordabilityButtons({
  onDecide,
  disabled,
}: {
  onDecide: (d: AffordabilityDecision) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        disabled={disabled}
        onClick={() => onDecide('affordable')}
        className="group flex flex-col items-center gap-2 bg-green-900/30 border-2 border-green-500/40 hover:border-green-400 hover:bg-green-900/50 rounded-xl p-4 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
      >
        <span className="text-3xl group-hover:scale-110 transition-transform">✅</span>
        <span className="font-pixel text-[11px] text-green-300">AFFORDABLE</span>
        <span className="text-[10px] text-[var(--text-muted)] text-center">I can manage this EMI</span>
      </button>
      <button
        disabled={disabled}
        onClick={() => onDecide('not-affordable')}
        className="group flex flex-col items-center gap-2 bg-red-900/30 border-2 border-red-500/40 hover:border-red-400 hover:bg-red-900/50 rounded-xl p-4 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none"
      >
        <span className="text-3xl group-hover:scale-110 transition-transform">🚫</span>
        <span className="font-pixel text-[11px] text-red-300">NOT AFFORDABLE</span>
        <span className="text-[10px] text-[var(--text-muted)] text-center">EMI is too high</span>
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
  scenario: (typeof EMI_SCENARIOS)[0];
  decision: AffordabilityDecision;
  xpEarned: number;
}) {
  const emi = calculateEMI(scenario.amount, scenario.annualRatePct, scenario.tenureMonths);
  const actuallyAffordable = isAffordable(scenario.monthlyIncome, emi);
  const playerSaidAffordable = decision === 'affordable';
  const isCorrect = playerSaidAffordable === actuallyAffordable;
  const feedbackText =
    playerSaidAffordable
      ? scenario.feedback.affordable
      : scenario.feedback.notAffordable;

  return (
    <div
      className={`rounded-xl border-2 p-4 space-y-3 ${
        isCorrect
          ? 'bg-green-900/20 border-green-500/40'
          : 'bg-red-900/20 border-red-500/40'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{isCorrect ? '🎉' : '💡'}</span>
        <div>
          <div className={`font-pixel text-sm ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
            {isCorrect ? 'Correct!' : 'Not quite'}
          </div>
          <div className="font-pixel text-[9px] text-[var(--text-muted)]">
            This loan is actually:{' '}
            <span className={`${actuallyAffordable ? 'text-green-300' : 'text-red-300'} uppercase`}>
              {actuallyAffordable ? '✅ Affordable' : '🚫 Not Affordable'}
            </span>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="font-pixel text-[8px] text-[var(--text-muted)]">XP</div>
          <div className="font-pixel text-sm text-blue-300">+{xpEarned}</div>
        </div>
      </div>

      <p className="text-xs text-[var(--text)] leading-relaxed">{feedbackText}</p>

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
export function EMIAffordabilityGame({ onClose, onComplete }: Props) {
  const scenarios = useMemo(
    () => [...EMI_SCENARIOS].sort(() => Math.random() - 0.5),
    [],
  );

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('choosing');
  const [decision, setDecision] = useState<AffordabilityDecision | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const scenario = scenarios[idx];
  const emi = useMemo(
    () => calculateEMI(scenario.amount, scenario.annualRatePct, scenario.tenureMonths),
    [scenario],
  );
  const actuallyAffordable = isAffordable(scenario.monthlyIncome, emi);
  const progress = Math.round(((idx + (phase === 'summary' ? 1 : 0)) / scenarios.length) * 100);

  const handleDecide = (d: AffordabilityDecision) => {
    if (phase !== 'choosing') return;
    setDecision(d);
    setPhase('result');
    const playerCorrect = (d === 'affordable') === actuallyAffordable;
    const xp = playerCorrect ? 100 : 20;
    setTotalXp((t) => t + xp);
    if (playerCorrect) setCorrectCount((c) => c + 1);
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
    const gold = Math.min(500, totalXp * 2);
    onComplete(totalXp, gold);
    onClose();
  };

  return (
    <Modal title="📊 EMI Affordability Challenge" onClose={onClose}>
      <div className="p-5 space-y-4">
        <ProgressBar
          value={progress}
          label={`Round ${Math.min(idx + 1, scenarios.length)} / ${scenarios.length}`}
          color="bg-yellow-500"
          showPercent
        />

        {/* ── SUMMARY ── */}
        {phase === 'summary' ? (
          <div className="space-y-5">
            <div className="text-center py-4">
              <div className="text-5xl mb-3">
                {correctCount >= 4 ? '🧠' : correctCount >= 2 ? '📊' : '📚'}
              </div>
              <div className="font-pixel text-gold text-base mb-1">EMI Master!</div>
              <div className="text-sm text-[var(--text-muted)]">
                {correctCount} / {scenarios.length} affordability calls were correct.
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
              <span className="font-pixel text-gold text-xs block mb-1">💡 EMI Golden Rule</span>
              Keep your total monthly EMIs under 40% of income. Ideally under 30% — the remaining
              60-70% should cover expenses, savings, and investments.
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
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{scenario.purposeEmoji}</span>
                <div className="font-pixel text-[9px] text-[var(--text-muted)] uppercase">Situation</div>
              </div>
              <p className="text-sm text-[var(--text)] leading-relaxed">{scenario.context}</p>
              <div className="mt-2 font-pixel text-[9px] text-[var(--text-muted)]">
                Loan for: <span className="text-[var(--text)]">{scenario.purpose}</span>
              </div>
            </div>

            {/* EMI Breakdown */}
            <EMIBreakdown
              amount={scenario.amount}
              annualRatePct={scenario.annualRatePct}
              tenureMonths={scenario.tenureMonths}
              monthlyIncome={scenario.monthlyIncome}
            />

            {/* Decision */}
            {phase === 'choosing' && (
              <>
                <div className="font-pixel text-[10px] text-center text-[var(--text-muted)]">
                  Is this EMI affordable on ₹{fmt(scenario.monthlyIncome)}/month income?
                </div>
                <AffordabilityButtons onDecide={handleDecide} disabled={false} />
              </>
            )}

            {phase === 'result' && decision && (
              <>
                <ResultPanel scenario={scenario} decision={decision} xpEarned={totalXp - (idx > 0 ? totalXp : 0)} />
                <div className="flex justify-end">
                  <Button onClick={handleNext} variant="secondary">
                    {idx + 1 < scenarios.length ? 'Next Round →' : 'See Results →'}
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

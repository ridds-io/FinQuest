'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/loan/ui/Modal';
import { Button } from '@/components/loan/ui/Button';
import { ProgressBar } from '@/components/loan/ui/ProgressBar';
import {
  DEBT_SCENARIOS,
  classifyDebt,
  type DebtType,
} from '@/lib/loanUtils';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'choosing' | 'result' | 'summary';

interface Props {
  onClose: () => void;
  onComplete: (xp: number, gold: number) => void;
}

function fmt(n: number) {
  return n.toLocaleString('en-IN');
}

// ─── Classification Buttons ───────────────────────────────────────────────────
const DEBT_CHOICES: { type: DebtType; emoji: string; label: string; sublabel: string; color: string; border: string; bg: string }[] = [
  {
    type: 'productive',
    emoji: '📈',
    label: 'PRODUCTIVE DEBT',
    sublabel: 'Builds value or income',
    color: 'text-green-300',
    border: 'border-green-500/50 hover:border-green-400',
    bg: 'bg-green-900/30 hover:bg-green-900/50',
  },
  {
    type: 'wasteful',
    emoji: '📉',
    label: 'WASTEFUL DEBT',
    sublabel: 'No lasting value',
    color: 'text-red-300',
    border: 'border-red-500/50 hover:border-red-400',
    bg: 'bg-red-900/30 hover:bg-red-900/50',
  },
];

function ClassificationButtons({
  onDecide,
  disabled,
  selected,
}: {
  onDecide: (t: DebtType) => void;
  disabled: boolean;
  selected: DebtType | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {DEBT_CHOICES.map((c) => {
        const isSelected = selected === c.type;
        const isDeselected = selected !== null && !isSelected;
        return (
          <button
            key={c.type}
            disabled={disabled}
            onClick={() => onDecide(c.type)}
            className={[
              'group flex flex-col items-center gap-2 rounded-xl p-5 transition-all duration-150 border-2',
              c.bg,
              c.border,
              isSelected ? 'ring-2 ring-white/30 scale-[1.02]' : '',
              isDeselected ? 'opacity-40 pointer-events-none' : '',
              disabled && !isSelected ? 'cursor-not-allowed opacity-40 pointer-events-none' : '',
            ].join(' ')}
          >
            <span
              className={`text-4xl transition-transform ${
                isSelected ? 'scale-110' : 'group-hover:scale-110'
              }`}
            >
              {c.emoji}
            </span>
            <span className={`font-pixel text-[11px] ${c.color}`}>{c.label}</span>
            <span className="text-[10px] text-[var(--text-muted)] text-center leading-snug">
              {c.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Result Panel ─────────────────────────────────────────────────────────────
function ResultPanel({
  scenario,
  decision,
  xpEarned,
}: {
  scenario: (typeof DEBT_SCENARIOS)[0];
  decision: DebtType;
  xpEarned: number;
}) {
  const isCorrect = decision === scenario.correctType;
  const correctInfo = classifyDebt(scenario.correctType);
  const decisionInfo = classifyDebt(decision);

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
        <div className="flex-1">
          <div className={`font-pixel text-sm ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
            {isCorrect ? 'Correct Classification!' : 'Wrong Classification'}
          </div>
          <div className="font-pixel text-[9px] text-[var(--text-muted)]">
            This is: {correctInfo.emoji}{' '}
            <span className="text-gold">{correctInfo.label}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-pixel text-[8px] text-[var(--text-muted)]">XP</div>
          <div className="font-pixel text-sm text-blue-300">+{xpEarned}</div>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-xs text-[var(--text)] leading-relaxed">{scenario.explanation}</p>

      {/* Classification badge */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-pixel ${
          scenario.correctType === 'productive'
            ? 'bg-green-900/30 border-green-500/40 text-green-300'
            : scenario.correctType === 'wasteful'
            ? 'bg-red-900/30 border-red-500/40 text-red-300'
            : 'bg-yellow-900/30 border-yellow-500/40 text-yellow-300'
        }`}
      >
        <span>{correctInfo.emoji}</span>
        <span>{correctInfo.label}</span>
      </div>

      {/* Penny tip */}
      <div className="bg-[rgba(10,15,30,0.8)] border border-blue-400/30 rounded-lg p-3 flex gap-3 items-start">
        <span className="text-xl flex-shrink-0">🐱</span>
        <div>
          <div className="font-pixel text-[8px] text-blue-400 mb-1">PENNY SAYS</div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">
            "{scenario.pennyTip}"
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Debt Scenario Card ───────────────────────────────────────────────────────
function ScenarioCard({ scenario }: { scenario: (typeof DEBT_SCENARIOS)[0] }) {
  return (
    <div className="bg-[rgba(255,200,0,0.05)] border border-gold/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{scenario.purposeEmoji}</span>
        <div>
          <div className="font-pixel text-[9px] text-gold uppercase tracking-wider mb-0.5">Loan Story</div>
          <div className="text-sm text-[var(--text)] font-medium">{scenario.title}</div>
        </div>
      </div>

      <p className="text-sm text-[var(--text)] leading-relaxed">{scenario.context}</p>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-center">
          <div className="font-pixel text-[7px] text-[var(--text-muted)] mb-1">LOAN TYPE</div>
          <div className="font-pixel text-[9px] text-[var(--text)]">{scenario.loanType}</div>
        </div>
        <div className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-center">
          <div className="font-pixel text-[7px] text-[var(--text-muted)] mb-1">AMOUNT</div>
          <div className="font-pixel text-[9px] text-gold">₹{fmt(scenario.amount)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Summary Screen ───────────────────────────────────────────────────────────
function SummaryScreen({
  correctCount,
  totalScenarios,
  totalXp,
  onFinish,
  onClose,
}: {
  correctCount: number;
  totalScenarios: number;
  totalXp: number;
  onFinish: () => void;
  onClose: () => void;
}) {
  const accuracy = Math.round((correctCount / totalScenarios) * 100);
  const goldEarned = Math.min(600, totalXp * 2);

  return (
    <div className="space-y-5">
      <div className="text-center py-4">
        <div className="text-5xl mb-3">
          {accuracy >= 80 ? '🏆' : accuracy >= 50 ? '🎯' : '📚'}
        </div>
        <div className="font-pixel text-gold text-base mb-1">Debt Analyst!</div>
        <div className="text-sm text-[var(--text-muted)]">
          {correctCount}/{totalScenarios} correct — {accuracy}% accuracy
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-4 text-center">
          <div className="font-pixel text-[9px] text-blue-200 mb-1">XP EARNED</div>
          <div className="font-pixel text-xl text-blue-100">+{totalXp}</div>
        </div>
        <div className="bg-gold/10 border border-gold/25 rounded-lg p-4 text-center">
          <div className="font-pixel text-[9px] text-gold mb-1">GOLD EARNED</div>
          <div className="font-pixel text-xl text-yellow-200">+₹{goldEarned}</div>
        </div>
      </div>

      {/* Quick reference */}
      <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-2">
        <div className="font-pixel text-[9px] text-gold mb-2">💡 Quick Reference</div>
        {[
          { emoji: '📈', label: 'Productive Debt', examples: 'Education · Business · Home' },
          { emoji: '📉', label: 'Wasteful Debt', examples: 'Gadgets · Vacation · Events' },
        ].map((item) => (
          <div key={item.emoji} className="flex items-center gap-2">
            <span className="text-lg">{item.emoji}</span>
            <div>
              <div className="font-pixel text-[9px] text-[var(--text)]">{item.label}</div>
              <div className="font-pixel text-[7px] text-[var(--text-muted)]">{item.examples}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <Button onClick={onFinish} variant="primary">
          Claim Rewards →
        </Button>
        <Button onClick={onClose} variant="ghost">
          Close
        </Button>
      </div>
    </div>
  );
}

// ─── Main Game Component ──────────────────────────────────────────────────────
export function DebtClassifierGame({ onClose, onComplete }: Props) {
  const scenarios = useMemo(
    () => [...DEBT_SCENARIOS].sort(() => Math.random() - 0.5),
    [],
  );

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('choosing');
  const [selected, setSelected] = useState<DebtType | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lastXp, setLastXp] = useState(0);

  const scenario = scenarios[idx];
  const progress = Math.round(((idx + (phase === 'summary' ? 1 : 0)) / scenarios.length) * 100);

  const handleDecide = (type: DebtType) => {
    if (phase !== 'choosing') return;
    setSelected(type);
    setPhase('result');
    const isCorrect = type === scenario.correctType;
    const xp = isCorrect ? scenario.xp.correct : scenario.xp.wrong;
    setLastXp(xp);
    setTotalXp((t) => t + xp);
    if (isCorrect) setCorrectCount((c) => c + 1);
  };

  const handleNext = () => {
    const next = idx + 1;
    if (next >= scenarios.length) {
      setPhase('summary');
    } else {
      setIdx(next);
      setSelected(null);
      setPhase('choosing');
    }
  };

  const handleFinish = () => {
    const gold = Math.min(600, totalXp * 2);
    onComplete(totalXp, gold);
    onClose();
  };

  return (
    <Modal title="🔍 Debt Classifier — Productive or Wasteful?" onClose={onClose} maxWidth="max-w-xl">
      <div className="p-5 space-y-4">
        <ProgressBar
          value={progress}
          label={`Scenario ${Math.min(idx + 1, scenarios.length)} / ${scenarios.length}`}
          color="bg-purple-500"
          showPercent
        />

        {phase === 'summary' ? (
          <SummaryScreen
            correctCount={correctCount}
            totalScenarios={scenarios.length}
            totalXp={totalXp}
            onFinish={handleFinish}
            onClose={onClose}
          />
        ) : (
          <div className="space-y-4">
            {/* Scenario card */}
            <ScenarioCard scenario={scenario} />

            {/* Question */}
            <div className="text-center font-pixel text-[10px] text-[var(--text-muted)]">
              Classify this loan:
            </div>

            {/* Choice buttons */}
            <ClassificationButtons
              onDecide={handleDecide}
              disabled={phase === 'result'}
              selected={selected}
            />

            {/* Result */}
            {phase === 'result' && selected && (
              <>
                <ResultPanel scenario={scenario} decision={selected} xpEarned={lastXp} />
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

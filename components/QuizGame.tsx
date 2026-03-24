'use client';

import { useEffect, useMemo, useState } from 'react';

const QUIZ_QUESTIONS = [
  {
    q: 'You earn Rs 15,000/month. Under the 50/30/20 rule, how much goes to savings?',
    options: ['Rs 1,500', 'Rs 3,000', 'Rs 4,500', 'Rs 7,500'],
    correct: 1,
    explanation: '20% of Rs 15,000 = Rs 3,000. This goes into savings or investments.',
    topic: 'budgeting',
  },
  {
    q: 'Your Pune PG costs Rs 10,000/month. Your roommate wants to pay Rs 4,000 and you pay Rs 6,000 because their room is slightly bigger. Is this fair?',
    options: ['Yes, bigger room = more rent', 'No, equal split is always better', 'Only if agreed in writing before moving in', 'It depends on whose name is on the lease'],
    correct: 2,
    explanation: 'Any unequal arrangement should be documented. Verbal agreements cause disputes.',
    topic: 'roommates',
  },
  {
    q: 'Spotify Regular is Rs 119/month. Spotify Student is Rs 59/month. Over 4 years of college, how much does the student plan save?',
    options: ['Rs 720', 'Rs 1,440', 'Rs 2,880', 'Rs 5,712'],
    correct: 2,
    explanation: 'Rs 60 saved/month × 48 months = Rs 2,880. Always check for student pricing first.',
    topic: 'discounts',
  },
  {
    q: 'What does NoBroker actually save you on?',
    options: ['Monthly rent amount', 'Brokerage/agent fees', 'Security deposit', 'Electricity bills'],
    correct: 1,
    explanation: 'NoBroker eliminates the broker commission which is typically 1-2 months rent = Rs 10,000-20,000.',
    topic: 'housing',
  },
  {
    q: 'You buy one Rs 50 chai every day. How much is that per year?',
    options: ['Rs 6,000', 'Rs 12,000', 'Rs 18,250', 'Rs 24,000'],
    correct: 2,
    explanation: 'Rs 50 × 365 = Rs 18,250. That is nearly 2 months of rent for many Pune students.',
    topic: 'habits',
  },
  {
    q: 'Which of these is a NEED in the 50/30/20 framework?',
    options: ['Netflix subscription', 'Weekend movie with friends', 'Mobile phone recharge', 'Gaming credits'],
    correct: 2,
    explanation: 'Mobile recharge is a need — communication is essential. The others are wants.',
    topic: 'needs_vs_wants',
  },
  {
    q: 'Pay Yourself First means:',
    options: ['Spend on yourself before paying others', 'Move money to savings before spending anything else', 'Pay your highest expense first', 'Keep cash instead of using UPI'],
    correct: 1,
    explanation: 'Moving savings out first means you cannot accidentally spend it. It is the most effective savings habit.',
    topic: 'saving',
  },
  {
    q: 'Your education loan has a 10% annual interest rate. You have Rs 5,000 extra this month. Should you:',
    options: ['Spend it — you are young', 'Save it in a 4% savings account', 'Make a prepayment on the loan', 'Invest in crypto'],
    correct: 2,
    explanation: 'Prepaying a 10% loan is like earning a guaranteed 10% return — better than any savings account.',
    topic: 'loans',
  },
  {
    q: 'What is a SIP?',
    options: ['A type of UPI payment', 'Systematic Investment Plan — fixed monthly mutual fund investment', 'Student Insurance Plan', 'Supabase Integration Protocol'],
    correct: 1,
    explanation: 'SIP lets you invest a small fixed amount monthly. Starting with even Rs 500/month at age 20 beats Rs 5,000/month at age 30.',
    topic: 'investing',
  },
  {
    q: 'A negative budget variance means:',
    options: ['You earned more than expected', 'You spent less than planned', 'You spent more than planned or earned less', 'Your budget is negative'],
    correct: 2,
    explanation: 'Variance = Actual minus Budgeted. Negative variance means things cost more or paid less than planned.',
    topic: 'budgeting',
  },
];

type Question = typeof QUIZ_QUESTIONS[number];

function pickThree(): Question[] {
  const pool = [...QUIZ_QUESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

export function QuizGame({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (result: { correct: number; total: number; xpEarned: number; goldEarned: number; topicsToBrushUp: string[] }) => void;
}) {
  const questions = useMemo(() => pickThree(), []);
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongTopics, setWrongTopics] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const q = questions[i];
  const progressPct = Math.round(((i + (finished ? 1 : 0)) / questions.length) * 100);

  useEffect(() => {
    setSelected(null);
    setShowExplain(false);
  }, [i]);

  const answer = (optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
    const isCorrect = optIdx === q.correct;
    if (isCorrect) setCorrectCount((c) => c + 1);
    else setWrongTopics((m) => ({ ...m, [q.topic]: (m[q.topic] ?? 0) + 1 }));
    setShowExplain(true);
  };

  const next = () => {
    if (i + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setI((x) => x + 1);
  };

  const finish = () => {
    const total = questions.length;
    const xpEarned = 30 + correctCount * 40;
    const goldEarned = correctCount * 100;
    const topicsToBrushUp = Object.entries(wrongTopics)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
      .slice(0, 3);
    onComplete({ correct: correctCount, total, xpEarned, goldEarned, topicsToBrushUp });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[220] p-3 sm:p-6" onClick={onClose}>
      <div
        className="bg-[var(--dark2)] border-2 border-[var(--panel-border)] rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-[var(--panel-border)] sticky top-0 bg-[var(--dark2)] z-10">
          <div>
            <div className="font-pixel text-gold text-sm">🏛️ Central Plaza — Financial Quiz</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              3 questions · explanations included
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-red-400 text-xl ml-4">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Progress bar */}
          <div className="h-2 bg-black/50 rounded overflow-hidden">
            <div
              className="h-full bg-blue-400 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round(((i) / questions.length) * 100))}%` }}
            />
          </div>
          <div className="font-pixel text-[9px] text-[var(--text-muted)] text-center">
            Question {Math.min(i + 1, questions.length)} / {questions.length}
          </div>

          {!finished ? (
            <>
              <div className="bg-black/30 border border-white/10 rounded-lg p-4">
                <div className="text-sm text-[var(--text)] leading-relaxed">{q.q}</div>
              </div>

              <div className="grid gap-2">
                {q.options.map((opt, idx) => {
                  const isChosen = selected === idx;
                  const isCorrect = idx === q.correct;
                  const stateCls =
                    selected === null
                      ? 'border-white/15 hover:border-gold bg-white/5'
                      : isCorrect
                        ? 'border-green-500/40 bg-green-500/10 text-green-200'
                        : isChosen
                          ? 'border-red-500/40 bg-red-500/10 text-red-200'
                          : 'border-white/10 bg-white/5 opacity-70';
                  return (
                    <button
                      key={opt}
                      onClick={() => answer(idx)}
                      disabled={selected !== null}
                      className={`text-left p-3 rounded border transition ${stateCls}`}
                    >
                      <div className="text-sm">{opt}</div>
                    </button>
                  );
                })}
              </div>

              {showExplain && (
                <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-4">
                  <div className="font-pixel text-[10px] text-blue-200 mb-2">EXPLANATION</div>
                  <div className="text-sm text-[var(--text)] leading-relaxed">{q.explanation}</div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={next}
                      className="font-pixel text-xs bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 transition"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="font-pixel text-gold text-lg mb-2">Results</div>
                <div className="font-pixel text-3xl text-white">{correctCount} / {questions.length}</div>
                <div className="text-sm text-[var(--text-muted)] mt-1">Score for this run</div>
              </div>

              <div className="bg-black/30 border border-white/10 rounded-lg p-4">
                <div className="font-pixel text-[10px] text-[var(--text-muted)] mb-2">Topics to brush up on</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(wrongTopics).length === 0 ? (
                    <span className="font-pixel text-[10px] text-green-300">None — perfect run!</span>
                  ) : (
                    Object.entries(wrongTopics)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([t]) => (
                        <span key={t} className="font-pixel text-[9px] bg-yellow-500/10 border border-yellow-500/25 text-yellow-200 px-2 py-1 rounded">
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={finish}
                  className="font-pixel text-xs bg-gold text-[var(--dark)] px-6 py-2.5 rounded hover:-translate-y-1 transition"
                >
                  Claim XP →
                </button>
                <button
                  onClick={onClose}
                  className="font-pixel text-xs bg-white/10 border border-white/20 text-[var(--text)] px-6 py-2.5 rounded hover:border-gold/50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


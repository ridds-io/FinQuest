import { useEffect, useMemo, useRef } from 'react';

export type QuestStep = {
  label: string;
  done: boolean;
};

export type SidebarEntry =
  | { kind: 'quest'; id: string; title: string; steps: QuestStep[] }
  | { kind: 'tip'; id: string; text: string; icon?: string }
  | { kind: 'tutor'; id: string; text: string; timestamp: number };

export const QUEST_DEFINITIONS: SidebarEntry[] = [
  {
    kind: 'quest',
    id: 'q-budget-basics',
    title: 'Learn to Budget',
    steps: [
      { label: 'Open Budgeting City', done: false },
      { label: 'Complete the 50/30/20 drag-drop game', done: false },
      { label: 'Ask the AI Tutor one question', done: false },
    ],
  },
  {
    kind: 'quest',
    id: 'q-roommate',
    title: 'Roommate Dilemma',
    steps: [
      { label: 'Visit the Dorms', done: false },
      { label: 'Make a rent decision', done: false },
      { label: 'Reflect with AI Tutor', done: false },
    ],
  },
  {
    kind: 'quest',
    id: 'q-tetris',
    title: 'Budget Under Pressure',
    steps: [
      { label: 'Play Budget Tetris', done: false },
      { label: 'Clear at least 3 lines', done: false },
    ],
  },
];

export const INITIAL_TIPS: SidebarEntry[] = [
  { kind: 'tip', id: 'tip-1', text: 'Click on Budgeting City to start your first module.', icon: '💡' },
  { kind: 'tip', id: 'tip-2', text: 'The 50/30/20 rule: 50% needs, 30% wants, 20% savings.', icon: '🎯' },
  { kind: 'tip', id: 'tip-3', text: 'On ₹15k/month: ₹7,500 for needs, ₹4,500 for wants, ₹3,000 to save.', icon: '🇮🇳' },
  { kind: 'tip', id: 'tip-4', text: 'Daily ₹50 chai = ₹18,250/year. Small habits add up fast!', icon: '☕' },
  { kind: 'tip', id: 'tip-5', text: 'Ask the AI Tutor anytime — it will guide, not just tell.', icon: '🤖' },
];

export function makeTutorEntry(text: string): SidebarEntry {
  const trimmed = text.length > 120 ? `${text.slice(0, 117)}...` : text;
  return {
    kind: 'tutor',
    id: `tutor-${Date.now()}`,
    text: trimmed,
    timestamp: Date.now(),
  };
}

type QuestSidebarProps = {
  entries: SidebarEntry[];
  questsDone: number;
  onAskTutor: (q: string) => void;
};

export function QuestSidebar({ entries, questsDone, onAskTutor }: QuestSidebarProps) {
  const tutorRef = useRef<HTMLDivElement | null>(null);

  const tutorEntries = useMemo(
    () => entries.filter((e) => e.kind === 'tutor') as Extract<SidebarEntry, { kind: 'tutor' }>[],
    [entries],
  );

  useEffect(() => {
    if (tutorRef.current) {
      tutorRef.current.scrollTop = tutorRef.current.scrollHeight;
    }
  }, [tutorEntries.length]);

  const quests = entries.filter((e) => e.kind === 'quest') as Extract<SidebarEntry, { kind: 'quest' }>[];

  return (
    <aside className="hidden md:flex w-60 flex-col bg-[rgba(5,12,8,0.95)] border-r border-green-900/50 text-xs">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-green-900/60 flex items-center justify-between flex-shrink-0">
        <span className="font-pixel text-[10px] tracking-[0.12em] text-[var(--green-light)]">📜 QUESTS</span>
        <span className="font-pixel text-[9px] text-[var(--text-muted)] bg-black/30 px-1.5 py-0.5 rounded">{questsDone} done</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">

        {/* Active Quests */}
        <section>
          <div className="font-pixel text-[9px] text-yellow-400/80 mb-2 tracking-widest">ACTIVE QUESTS</div>
          <div className="space-y-2">
            {quests.map((q) => {
              const total = q.steps.length;
              const done = q.steps.filter((s) => s.done).length;
              const completed = done === total && total > 0;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return (
                <div
                  key={q.id}
                  className={`rounded-md border px-2.5 py-2 transition-all ${
                    completed
                      ? 'border-green-500/40 bg-green-500/8'
                      : 'border-yellow-500/25 bg-yellow-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-pixel text-[9px] leading-tight ${completed ? 'text-green-400' : 'text-yellow-300'}`}>
                      {completed ? '✅ ' : '⚔️ '}{q.title}
                    </span>
                    <span className="font-pixel text-[8px] text-[var(--text-muted)]">{done}/{total}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-black/40 rounded overflow-hidden mb-2">
                    <div
                      className={`h-full rounded transition-all duration-500 ${completed ? 'bg-green-400' : 'bg-yellow-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {/* Steps */}
                  <ul className="space-y-0.5">
                    {q.steps.map((s) => (
                      <li key={s.label} className="flex items-start gap-1.5">
                        <span className={`text-[9px] mt-0.5 flex-shrink-0 ${s.done ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>
                          {s.done ? '✓' : '○'}
                        </span>
                        <span className={`text-[10px] leading-snug ${s.done ? 'line-through text-green-300/60' : 'text-[var(--text-muted)]'}`}>
                          {s.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tutor Insights */}
        <section>
          <div className="font-pixel text-[9px] text-blue-400/80 mb-2 tracking-widest">TUTOR INSIGHTS</div>
          <div ref={tutorRef} className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
            {tutorEntries.length === 0 ? (
              <div className="text-[10px] text-[var(--text-muted)] italic px-1">
                Ask a question to see Penny's insights here.
              </div>
            ) : (
              tutorEntries.map((t) => (
                <div key={t.id} className="border border-blue-800/40 bg-blue-900/10 rounded-md px-2.5 py-2">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px]">🤖</span>
                    <span className="font-pixel text-[8px] text-blue-400/80">Penny · AI Tutor</span>
                  </div>
                  <p className="text-[10px] text-[var(--text)] leading-relaxed">{t.text}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Ask Tutor */}
        <section>
          <div className="font-pixel text-[9px] text-blue-400/80 mb-2 tracking-widest">ASK TUTOR</div>
          <div className="space-y-1">
            {[
              'What is the 50/30/20 rule?',
              'How do I split PG rent fairly?',
              'Why should I start a SIP now?',
              'How much chai am I wasting yearly?',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onAskTutor(q)}
                className="w-full text-left text-[10px] border border-blue-900/30 bg-blue-900/5 rounded px-2 py-1.5 text-[var(--text-muted)] hover:text-[var(--blue-light)] hover:border-blue-700/50 hover:bg-blue-900/15 transition-all leading-snug"
              >
                ↗ {q}
              </button>
            ))}
          </div>
        </section>

      </div>
    </aside>
  );
}
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
  {
    kind: 'tip',
    id: 'tip-3',
    text: 'On ₹15k/month: ₹7,500 for needs, ₹4,500 for wants, ₹3,000 to save.',
    icon: '🇮🇳',
  },
  {
    kind: 'tip',
    id: 'tip-4',
    text: 'Daily ₹50 chai = ₹18,250/year. Small habits add up fast!',
    icon: '☕',
  },
  {
    kind: 'tip',
    id: 'tip-5',
    text: 'Ask the AI Tutor anytime — it will guide, not just tell.',
    icon: '🤖',
  },
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
  const tips = entries.filter((e) => e.kind === 'tip') as Extract<SidebarEntry, { kind: 'tip' }>[];

  return (
    <aside className="hidden md:flex w-60 flex-col bg-[rgba(5,12,8,0.95)] border-r border-green-900/50 text-xs">
      <div className="px-3 py-2 border-b border-green-900/60 flex items-center justify-between">
        <div className="font-pixel text-[10px] tracking-[0.15em] text-[var(--green-light)]">
          📜 QUESTS &amp; TIPS
        </div>
        <div className="font-pixel text-[9px] text-[var(--text-muted)]">{questsDone} done</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <section>
          <div className="font-pixel text-[10px] text-yellow-400 mb-2">ACTIVE QUESTS</div>
          <div className="space-y-2">
            {quests.map((q) => {
              const total = q.steps.length;
              const done = q.steps.filter((s) => s.done).length;
              const completed = done === total && total > 0;
              return (
                <div
                  key={q.id}
                  className={`rounded border px-2 py-2 bg-yellow-500/5 ${
                    completed
                      ? 'border-green-500/40 text-green-400'
                      : 'border-yellow-500/30 text-yellow-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-pixel text-[10px]">
                      {completed ? '✅ ' : '⚔️ '}
                      {q.title}
                    </div>
                    <div className="font-pixel text-[9px] text-[var(--text-muted)]">
                      {done}/{total}
                    </div>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: total ? `${(done / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <ul className="space-y-0.5">
                    {q.steps.map((s) => (
                      <li
                        key={s.label}
                        className={`flex items-center gap-1 text-[10px] ${
                          s.done ? 'line-through text-green-300' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        <span>{s.done ? '✓' : '○'}</span>
                        <span>{s.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="font-pixel text-[10px] text-[var(--green-light)] mb-2">TIPS</div>
          <div className="space-y-2">
            {tips.map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-2 border border-green-900/40 bg-green-900/10 rounded px-2 py-1.5 text-[11px] text-[var(--text-muted)]"
              >
                <span className="mt-[1px]">{t.icon ?? '💡'}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="font-pixel text-[10px] text-blue-400 mb-2">TUTOR INSIGHTS</div>
          <div
            ref={tutorRef}
            className="space-y-1.5 max-h-40 overflow-y-auto pr-1"
          >
            {tutorEntries.map((t) => (
              <div
                key={t.id}
                className="border border-blue-800/40 bg-blue-900/10 rounded px-2 py-1.5"
              >
                <div className="font-pixel text-[9px] text-blue-300 mb-0.5">
                  🤖 Aryan · AI Tutor
                </div>
                <div className="text-[11px] text-[var(--text)]">{t.text}</div>
              </div>
            ))}
            {tutorEntries.length === 0 && (
              <div className="text-[10px] text-[var(--text-muted)]">
                Ask the AI Tutor a question to see reflections here.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="font-pixel text-[10px] text-blue-400 mb-2">ASK TUTOR</div>
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
                className="w-full text-left text-[10px] font-pixel border border-blue-900/40 bg-blue-900/5 rounded px-2 py-1 text-[var(--text-muted)] hover:text-[var(--blue-light)] hover:border-blue-800/50 hover:bg-blue-900/15 transition"
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


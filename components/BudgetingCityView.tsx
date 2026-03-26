'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  QuestSidebar,
  QUEST_DEFINITIONS,
  INITIAL_TIPS,
  makeTutorEntry,
  loadQuestSteps,
  saveQuestSteps,
  applyQuestSteps,
  type SidebarEntry,
} from '@/components/QuestSidebar';
import {
  loadState,
  saveState,
  getXpProgress,
  checkBadges,
  type GameState,
} from '@/lib/gameState';
import { useSupabase } from '@/components/SupabaseProvider';

const BudgetTetris = dynamic(
  () => import('@/components/BudgetTetris').then((m) => m.BudgetTetris),
  { ssr: false },
);
const BudgetGame = dynamic(() => import('@/components/BudgetGame').then((m) => m.BudgetGame), { ssr: false });
const CafeGame = dynamic(() => import('@/components/CafeGame').then((m) => m.CafeGame), { ssr: false });
const QuizGame = dynamic(() => import('@/components/QuizGame').then((m) => m.QuizGame), { ssr: false });

type DormScenario = {
  situation: string;
  character?: string;
  choices: string[];
  costs: number[];
  outcomes: Array<{ xp?: number; gold?: number; lesson?: string }>;
  explanations?: string[];
};

const FALLBACK: DormScenario = {
  situation: "Your roommate says they'll pay their share of the ₹10,000 PG rent next week via UPI. What do you do?",
  choices: ['Equal split ₹5k each. Decline Spotify.', 'Equal split after NoBroker discount — ~₹4,500 each'],
  costs: [5000, 4500],
  outcomes: [{ xp: 60, gold: 150 }, { xp: 100, gold: 300 }],
  explanations: [
    'Splitting equally is fair, but skipping extras keeps your budget tight and predictable.',
    'Negotiating a discount saves money upfront — a key budgeting skill.',
  ],
};

export default function BudgetingCityView() {
  const router = useRouter();
  const supabase = useSupabase();
  const [state, setState] = useState<GameState>(loadState);
  const [sidebarEntries, setSidebarEntries] = useState<SidebarEntry[]>(() =>
    applyQuestSteps([...QUEST_DEFINITIONS, ...INITIAL_TIPS], loadQuestSteps())
  );
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<null | 'cafe' | 'quiz'>(null);
  const [dormScenario, setDormScenario] = useState<DormScenario | null>(null);
  const [dormOutcome, setDormOutcome] = useState<{ title: string; text: string; xp: number; gold: number } | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [fetchingDorm, setFetchingDorm] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: string; content: string }>>([
    { role: 'ai', content: "Namaste! I'm your Socratic financial guide, Penny. What financial situation are you navigating today?" },
  ]);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorTips, setTutorTips] = useState<string[]>([]);

  const persist = useCallback(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    persist();
  }, [state, persist]);

  useEffect(() => { saveQuestSteps(sidebarEntries); }, [sidebarEntries]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const addTutorToSidebar = useCallback((text: string) => {
    setSidebarEntries((prev) => [...prev, makeTutorEntry(text)]);
  }, []);

  const extractTip = useCallback((text: string): string => {
    const first = text.split(/[.!?]/).map((s) => s.trim()).filter(Boolean)[0] ?? text.trim();
    const compact = first.length > 90 ? first.slice(0, 87) + '...' : first;
    return compact.length >= 15 ? compact : '';
  }, []);

  const markQuestStep = useCallback((questId: string, stepIndex: number) => {
    setSidebarEntries((prev) =>
      prev.map((e) => {
        if (e.kind !== 'quest' || e.id !== questId) return e;
        const steps = e.steps.map((s, i) => (i === stepIndex ? { ...s, done: true } : s));
        return { ...e, steps };
      }),
    );
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push('/login');
  };

  const fetchDormScenario = useCallback(async () => {
    if (fetchingDorm) return;
    setFetchingDorm(true);
    try {
      const res = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'budgeting_1',
          playerState: {
            gold: state.gold,
            level: state.level,
            avatar: state.avatar.type,
            financialProfile: state.financialProfile,
          },
        }),
      });
      const data = await res.json();
      if (data.situation) {
        setDormScenario({
          ...data,
          choices: (data.choices ?? []).slice(0, 2),
          costs: (data.costs ?? []).slice(0, 2),
          outcomes: (data.outcomes ?? []).slice(0, 2),
          explanations: (data.explanations ?? FALLBACK.explanations)?.slice(0, 2),
        });
      } else {
        setDormScenario(FALLBACK);
      }
    } catch {
      setDormScenario(FALLBACK);
    } finally {
      setFetchingDorm(false);
    }
  }, [fetchingDorm, state.gold, state.level, state.avatar.type, state.financialProfile]);

  const openDorms = useCallback(() => {
    setDormOutcome(null);
    setSelectedChoice(null);
    setDormScenario(null);
    fetchDormScenario();
    setModal('dorms');
    markQuestStep('q-roommate', 0);
  }, [fetchDormScenario, markQuestStep]);

  const dormChoice = useCallback((i: number) => {
    if (!dormScenario || selectedChoice !== null) return;
    setSelectedChoice(i);
    const cost = dormScenario.costs[i] ?? 0;
    const out = dormScenario.outcomes[i] ?? {};
    const xp = out.xp ?? 0;
    const gold = (out.gold ?? 0) - cost;
    setState((s) => {
      const newTotalXp = (s.totalXp ?? s.xp) + xp;
      const updated: GameState = {
        ...s,
        gold: Math.max(0, s.gold + gold),
        xp: s.xp + xp,
        totalXp: newTotalXp,
        questsDone: s.questsDone + 1,
        dilemmasCompleted: (s.dilemmasCompleted ?? 0) + 1,
        budgetProgress: Math.min(100, s.budgetProgress + 33),
      };
      updated.earnedBadges = checkBadges(updated);
      return updated;
    });
    setDormOutcome({
      title: `Option ${String.fromCharCode(65 + i)}`,
      text: dormScenario.explanations?.[i] ?? out.lesson ?? 'Consider asking the AI Tutor for more details!',
      xp,
      gold: out.gold ?? 0,
    });
    showToast(`+${xp} XP earned! 🎉`);
    markQuestStep('q-roommate', 1);
  }, [dormScenario, selectedChoice, showToast, markQuestStep]);

  const sendTutor = useCallback(async (prefill?: string) => {
    setTutorOpen(true);
    const msg = (prefill ?? tutorInput).trim();
    if (!msg || tutorLoading) return;
    setTutorInput('');
    setTutorMessages((m) => [...m, { role: 'user', content: msg }]);
    setTutorLoading(true);
    try {
      const res = await fetch('/api/rag-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: msg,
          gameState: { gold: state.gold, level: state.level, avatar: state.avatar, xp: state.xp, financialProfile: state.financialProfile },
          history: tutorMessages.slice(-6).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        }),
      });
      const data = await res.json();
      const reply: string = data.question || "I couldn't connect. Try again!";
      setTutorMessages((m) => [...m, { role: 'ai', content: reply }]);
      addTutorToSidebar(reply);
      const tip = extractTip(reply);
      if (tip) setTutorTips((prev) => [...prev.slice(-9), tip]);
      setState((s) => {
        const updated: GameState = { ...s, tutorQuestions: (s.tutorQuestions ?? 0) + 1 };
        updated.earnedBadges = checkBadges(updated);
        return updated;
      });
      markQuestStep('q-budget-basics', 2);
      markQuestStep('q-roommate', 2);
    } catch {
      setTutorMessages((m) => [...m, { role: 'ai', content: "I couldn't connect. What do you think the answer might be?" }]);
    }
    setTutorLoading(false);
  }, [tutorInput, tutorLoading, tutorMessages, state, addTutorToSidebar, extractTip, markQuestStep]);

  const handleAskTutorAboutDilemma = useCallback(() => {
    if (!dormScenario) return;
    const situation = dormScenario.situation;
    const choiceText = selectedChoice !== null ? dormScenario.choices[selectedChoice] : null;
    const explanation = selectedChoice !== null ? dormScenario.explanations?.[selectedChoice] : null;

    let prompt = `I just faced this financial dilemma: "${situation}"`;
    if (choiceText) prompt += `\n\nI chose: "${choiceText}"`;
    if (explanation) prompt += `\n\nThe explanation given was: "${explanation}"`;
    prompt += '\n\nCan you help me understand the deeper financial lesson here and what I should keep in mind for real life?';

    sendTutor(prompt);
  }, [dormScenario, selectedChoice, sendTutor]);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#16213e] overflow-hidden">
      <div className="flex-1 flex min-h-0">
        <QuestSidebar
          entries={sidebarEntries}
          tutorTips={tutorTips}
          questsDone={sidebarEntries.filter((e) => e.kind === 'quest' && e.steps.every((s) => s.done)).length}
          onAskTutor={(q) => sendTutor(q)}
        />
        <main className="flex-1 relative min-h-[500px] bg-[#2d5a2d] overflow-hidden">
          <div className="relative w-full h-full">
            <img
              src="/map/budgeting-city.png"
              alt="Budgeting City"
              className="absolute w-full h-full object-cover select-none z-0"
              draggable={false}
              style={{ imageRendering: 'pixelated' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <button
              onClick={() => router.push('/game/main_game')}
              className="absolute top-4 left-4 font-pixel text-xs bg-black/70 border border-gold/40 text-gold px-3 py-2 rounded z-30 hover:bg-black/90 cursor-pointer pointer-events-auto"
            >
              ← BACK
            </button>

            {/* MARKET — top-left building */}
            <div
              className="absolute cursor-pointer hover:-translate-y-1 rounded-lg border-2 border-transparent hover:border-yellow-400/50 transition-all flex items-end justify-center pb-1 z-10"
              style={{ left: '2%', top: '27%', width: '24%', height: '42%' }}
              onClick={() => setModal('market')}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">MARKET</span>
            </div>

            {/* DORMS — center apartment complex */}
            <div
              className="absolute cursor-pointer hover:-translate-y-1 rounded-lg border-2 border-transparent hover:border-yellow-400/50 transition-all flex items-end justify-center pb-1 z-10"
              style={{ left: '26%', top: '38%', width: '42%', height: '48%' }}
              onClick={openDorms}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">DORMS</span>
            </div>

            {/* UNIV. CAFE — bottom-right */}
            <div
              className="absolute cursor-pointer hover:-translate-y-1 rounded-lg border-2 border-transparent hover:border-yellow-400/50 transition-all flex items-end justify-center pb-1 z-10"
              style={{ left: '72%', top: '56%', width: '26%', height: '38%' }}
              onClick={() => setActiveGame('cafe')}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">UNIV. CAFÉ</span>
            </div>

            {/* CITY HALL / ASSESSMENT — top-right */}
            <div
              className="absolute cursor-pointer hover:-translate-y-1 rounded-lg border-2 border-transparent hover:border-yellow-400/50 transition-all flex items-end justify-center pb-1 z-10"
              style={{ left: '70%', top: '1%', width: '28%', height: '35%' }}
              onClick={() => setActiveGame('quiz')}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">ASSESSMENT</span>
            </div>
          </div>

          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute top-4 left-4 pointer-events-none">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(20,20,20,0.85)] rounded-lg p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <div className="w-12 h-12 bg-green-800 border-2 border-gray-600 rounded flex items-center justify-center text-2xl">{state.avatar.emoji}</div>
                <div>
                  <div className="font-pixel text-[9px] text-[var(--text)] uppercase mb-1">{state.username}, LV.{state.level ?? 1}</div>
                  <div className="flex gap-1 mb-1">
                    {Array.from({ length: 10 }).map((_, i) => <span key={i}>{((state.hp ?? 80) / 10) > i ? '❤️' : '🖤'}</span>)}
                  </div>
                  <div className="flex gap-1">
                    {(() => {
                      const { pct } = getXpProgress(state.totalXp ?? state.xp);
                      return Array.from({ length: 10 }).map((_, i) => (
                        <span key={i}>{(pct / 10) > i ? '💎' : '◇'}</span>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="font-pixel text-2xl text-white" style={{ textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                Budgeting City
              </div>
            </div>

            <div className="absolute top-4 right-4 pointer-events-auto">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-pixel text-[9px] text-[#FFD700] uppercase space-y-1">
                <div>🪙 {(state.gold ?? 0).toLocaleString('en-IN')}</div>
                <div>💎 {state.gems ?? 0} tokens</div>
                <div>📊 {state.budgetProgress ?? 0}% progress</div>
                <div>✅ {state.questsDone ?? 0} quests</div>
                <button onClick={handleLogout} className="mt-1 w-full font-pixel text-xs bg-white/10 border border-white/20 text-[var(--text)] px-3 py-1.5 rounded hover:border-red-400 hover:text-red-300 transition-all">
                  🚪 Logout
                </button>
              </div>
            </div>

            <div className="absolute top-28 right-4 z-20 pointer-events-none">
              <button
                onClick={() => setTutorOpen(true)}
                className="border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 pointer-events-auto hover:shadow-none hover:translate-y-[4px] transition-all"
              >
                <span>🐱</span>
                <span className="font-pixel text-[9px] text-green-400">PENNY</span>
              </button>
            </div>

            <div className="absolute bottom-4 right-4 pointer-events-auto">
              <div className="flex gap-2">
                {[
                  { label: 'MAP', icon: '🗺️', onClick: () => showToast('🗺️ Map — coming soon!') },
                  { label: 'INVENTORY', icon: '🎒', onClick: () => showToast('🎒 Inventory — coming soon!') },
                  { label: 'QUESTS', icon: '📜', onClick: () => setModal('budgeting-city') },
                  { label: 'MENU', icon: '☰', onClick: () => router.push('/') },
                ].map((btn) => (
                  <button key={btn.label} onClick={btn.onClick}
                    className="w-[52px] h-[52px] border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-pixel text-[8px] text-[var(--text-muted)] flex flex-col items-center justify-center gap-0.5 uppercase hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700] hover:shadow-none hover:translate-y-[4px] transition-all">
                    <span>{btn.icon}</span><span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal: Dorms */}
      {modal === 'dorms' && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[200] p-4" onClick={() => setModal(null)}>
          <div className="bg-[var(--dark2)] border-2 border-[var(--panel-border)] rounded max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-[var(--panel-border)]">
              <span className="font-pixel text-gold">🏠 Dorms — Financial Dilemma</span>
              <button onClick={() => setModal(null)} className="text-[var(--text-muted)] hover:text-red-500 text-xl">✕</button>
            </div>
            <div className="p-6">
              {fetchingDorm ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
                  <div className="font-pixel text-[10px] text-[var(--text-muted)]">Generating scenario...</div>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="font-pixel text-gold text-xs mb-2">{dormScenario?.character ?? 'Roommate Rahul'}:</div>
                    <p className="text-[var(--text)] text-sm leading-relaxed">
                      {dormScenario?.situation ?? 'Loading scenario...'}
                    </p>
                    <div className="font-pixel text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 rounded px-3 py-2 mt-3">
                      [DECISION REQUIRED: Consider fairness, financial risk, and long-term relationships.]
                    </div>
                  </div>

                  <div className="grid gap-3 mb-4">
                    {dormScenario?.choices?.map((choice, i) => {
                      const chosen = selectedChoice === i;
                      const unchosen = selectedChoice !== null && !chosen;
                      return (
                        <button
                          key={i}
                          onClick={() => dormChoice(i)}
                          disabled={selectedChoice !== null}
                          className={`text-left p-4 rounded border flex justify-between items-center transition-all ${chosen
                            ? 'border-green-500 bg-green-500/15'
                            : unchosen
                              ? 'border-white/10 bg-white/3 opacity-50'
                              : 'border-white/15 hover:border-gold bg-white/5'
                            }`}
                        >
                          <span className="font-pixel text-gold text-xs">
                            {chosen ? '✓ ' : ''}{choice}
                          </span>
                          <span className="text-sm text-[var(--text-muted)] flex-shrink-0 ml-2">
                            −₹{(dormScenario.costs[i] ?? 0).toLocaleString('en-IN')}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Outcome panel — shown after selection */}
                  {dormOutcome && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded p-4 mb-4">
                      <div className="font-pixel text-green-400 text-xs mb-2">✅ {dormOutcome.title} chosen</div>
                      <p className="text-sm text-[var(--text)] leading-relaxed mb-3">{dormOutcome.text}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="font-pixel text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded">+{dormOutcome.xp} XP</span>
                        {dormOutcome.gold > 0 && (
                          <span className="font-pixel text-xs bg-gold/20 text-gold px-2 py-1 rounded">+₹{dormOutcome.gold} Gold</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {dormOutcome && (
                      <>
                        <button
                          onClick={handleAskTutorAboutDilemma}
                          className="font-pixel text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-500 transition-colors"
                        >
                          🤖 Ask AI Tutor
                        </button>
                        <button
                          onClick={() => {
                            setDormOutcome(null);
                            setSelectedChoice(null);
                            setDormScenario(null);
                            fetchDormScenario();
                          }}
                          className="font-pixel text-xs bg-blue-500/20 text-blue-200 border border-blue-500/40 px-3 py-1.5 rounded"
                        >
                          ♻️ New Scenario
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setModal(null)}
                      className="font-pixel text-xs bg-gold/15 text-gold border border-gold/30 px-3 py-1.5 rounded"
                    >
                      ← Back to City
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Budget Tetris */}
      {modal === 'tetris' && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[200] p-4">
          <div className="bg-[var(--dark2)] border-2 border-[var(--panel-border)] rounded max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-[var(--panel-border)]">
              <span className="font-pixel text-gold">🎮 Budget Tetris - Monthly Income: ₹{(state?.financialProfile?.monthlyIncome ?? 15000).toLocaleString('en-IN')}</span>
              <button onClick={() => setModal(null)} className="text-[var(--text-muted)] hover:text-red-500 text-xl">✕</button>
            </div>
            <div className="flex-1 p-4">
              <BudgetTetris
                monthlyIncome={state?.financialProfile?.monthlyIncome ?? 15000}
                onClose={() => setModal(null)}
                onGameOver={(finalScore, clearedLines) => {
                  const xpEarned = Math.min(150, Math.floor(finalScore / 100));
                  if (xpEarned > 0 || clearedLines > 0) {
                    setState((s) => {
                      const newTotalXp = (s.totalXp ?? s.xp) + xpEarned;
                      const updated: GameState = {
                        ...s,
                        xp: s.xp + xpEarned,
                        totalXp: newTotalXp,
                        gold: s.gold + xpEarned * 2,
                        tetrisCorrect: (s.tetrisCorrect ?? 0) + clearedLines,
                        questsDone: s.questsDone + 1,
                        budgetProgress: Math.min(100, s.budgetProgress + 20),
                      };
                      updated.earnedBadges = checkBadges(updated);
                      return updated;
                    });
                    addTutorToSidebar(
                      `Budget Tetris: cleared ${clearedLines} line(s), saved virtual ₹${finalScore.toLocaleString('en-IN')}.`
                    );
                    if (clearedLines >= 3) {
                      markQuestStep('q-tetris', 0);
                      markQuestStep('q-tetris', 1);
                    }
                    showToast(`Game Over! Score: ₹${finalScore} · +${xpEarned} XP`);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {modal === 'market' && (
        <BudgetGame
          monthlyIncome={state.financialProfile?.monthlyIncome}
          onClose={() => setModal(null)}
          onComplete={(correct, xp, gold) => {
            setState((s) => {
              const newTotalXp = (s.totalXp ?? s.xp) + xp;
              const updated: GameState = {
                ...s,
                xp: s.xp + xp,
                totalXp: newTotalXp,
                gold: s.gold + gold,
                perfectBudgetGame: correct === 12 ? true : s.perfectBudgetGame,
                questsDone: s.questsDone + 1,
                budgetProgress: Math.min(100, s.budgetProgress + 33),
              };
              updated.earnedBadges = checkBadges(updated);
              return updated;
            });
            markQuestStep('q-budget-basics', 1);
            showToast(`+${xp} XP · +₹${gold} Gold 🎉`);
          }}
        />
      )}

      {activeGame === 'cafe' && (
        <CafeGame
          onClose={() => setActiveGame(null)}
          onComplete={(xpEarned) => {
            setState((s) => {
              const newTotalXp = (s.totalXp ?? s.xp) + xpEarned;
              const updated: GameState = {
                ...s,
                xp: s.xp + xpEarned,
                totalXp: newTotalXp,
                gold: s.gold + Math.floor(xpEarned * 2),
                cafeResists: (s.cafeResists ?? 0) + Math.floor(xpEarned / 10),
                questsDone: s.questsDone + 1,
                budgetProgress: Math.min(100, s.budgetProgress + 20),
              };
              updated.earnedBadges = checkBadges(updated);
              return updated;
            });
            showToast(`+${xpEarned} XP earned! ☕`);
          }}
        />
      )}

      {activeGame === 'quiz' && (
        <QuizGame
          onClose={() => setActiveGame(null)}
          onComplete={(result) => {
            setState((s) => {
              const newTotalXp = (s.totalXp ?? s.xp) + result.xpEarned;
              const updated: GameState = {
                ...s,
                xp: s.xp + result.xpEarned,
                totalXp: newTotalXp,
                gold: s.gold + result.goldEarned,
                quizCorrect: (s.quizCorrect ?? 0) + result.correct,
                questsDone: s.questsDone + 1,
                budgetProgress: Math.min(100, s.budgetProgress + 10),
              };
              updated.earnedBadges = checkBadges(updated);
              return updated;
            });
            showToast(`🏛️ Quiz complete! +${result.xpEarned} XP`);
          }}
        />
      )}

      {tutorOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-[rgba(5,15,35,0.97)] border-l-2 border-blue-500/50 z-[300] flex flex-col shadow-2xl">
          <div className="flex justify-between items-center p-4 border-b border-blue-500/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0a1a2e] border border-gold/40 rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src="/cat.png"
                  alt="Penny"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    (e.currentTarget.nextSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
                  }}
                />
                <span className="text-lg hidden">🐱</span>
              </div>
              <div>
                <div className="font-pixel text-[var(--blue-light)] text-xs">Penny</div>
                <div className="text-xs text-[var(--text-muted)]">Finance Cat · RAG + Groq</div>
              </div>
            </div>
            <button onClick={() => setTutorOpen(false)} className="text-[var(--text-muted)] hover:text-red-500 text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tutorMessages.map((m, i) => (
              <div key={i} className={`p-3 rounded text-sm ${m.role === 'user' ? 'bg-green/10 border border-green/20 ml-6' : 'bg-blue-500/15 border border-blue-500/25'}`}>
                <div className="font-pixel text-xs mb-1 opacity-70">{m.role === 'user' ? 'You' : 'AI Tutor'}</div>
                {m.content}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-blue-500/30">
            <div className="flex gap-2 mb-2 flex-wrap">
              {['50/30/20 rule for ₹15k', 'How to split rent fairly?', 'Why save before spending?', 'UPI payment risks'].map((q) => (
                <button key={q} onClick={() => sendTutor(q)} className="font-pixel text-[10px] bg-blue-500/15 text-[var(--blue-light)] border border-blue-500/35 px-2 py-1 rounded">{q}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendTutor()}
                placeholder="Ask anything about finance..."
                className="flex-1 bg-white/10 border border-white/20 text-[var(--text)] px-3 py-2 rounded text-sm outline-none focus:border-[var(--blue-light)]"
              />
              <button
                onClick={() => sendTutor()}
                disabled={tutorLoading}
                className="font-pixel text-xs bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {tutorLoading ? '…' : 'SEND →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 font-pixel text-xs bg-[var(--panel)] border border-[var(--panel-border)] text-gold px-6 py-3 rounded z-[500] animate-in fade-in duration-300">
          {toast}
        </div>
      )}
    </div>
  );
}
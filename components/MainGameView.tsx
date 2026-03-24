'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  QuestSidebar,
  QUEST_DEFINITIONS,
  INITIAL_TIPS,
  makeTutorEntry,
  type SidebarEntry,
} from '@/components/QuestSidebar';

const BudgetTetris = dynamic(
  () => import('@/components/BudgetTetris').then((m) => m.BudgetTetris),
  { ssr: false },
);
const BudgetGame = dynamic(() => import('@/components/BudgetGame').then((m) => m.BudgetGame), { ssr: false });
const CafeGame = dynamic(() => import('@/components/CafeGame').then((m) => m.CafeGame), { ssr: false });
const QuizGame = dynamic(() => import('@/components/QuizGame').then((m) => m.QuizGame), { ssr: false });

const AVATARS = [
  { emoji: '📚', name: 'Scholarship Grinder', gold: 500, stat: 'HIGH' },
  { emoji: '🎒', name: 'Loan Leveraged', gold: 2000, stat: '₹12L' },
  { emoji: '💼', name: 'Hustle Economy', gold: 800, stat: 'HIGH' },
  { emoji: '💎', name: 'Privilege Stack', gold: 15000, stat: 'LOW' },
  { emoji: '🌍', name: 'International Wildcard', gold: 3000, stat: 'MAX' },
];

const STORAGE_KEY = 'finquest_state';

function loadState(): {
  avatar: { emoji: string; name: string; type: string };
  username: string;
  gold: number;
  gems: number;
  level: number;
  xp: number;
  hp: number;
  questsDone: number;
  budgetProgress: number;
} {
  if (typeof window === 'undefined')
    return {
      avatar: { emoji: '🎒', name: 'NICK', type: 'Loan Leveraged' },
      username: 'ADVENTURER',
      gold: 15000,
      gems: 50,
      level: 1,
      xp: 25,
      hp: 80,
      questsDone: 0,
      budgetProgress: 0,
    };
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return {
    avatar: { emoji: '🎒', name: 'NICK', type: 'Loan Leveraged' },
    username: 'ADVENTURER',
    gold: 15000,
    gems: 50,
    level: 1,
    xp: 25,
    hp: 80,
    questsDone: 0,
    budgetProgress: 0,
  };
}

function saveState(state: ReturnType<typeof loadState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export default function MainGameView() {
  const router = useRouter();
  const [screen, setScreen] = useState<'welcome' | 'avatar' | 'game'>('welcome');
  const [state, setState] = useState(loadState);
  const [welcomeUsername, setWelcomeUsername] = useState(() => {
    try {
      const s = loadState();
      return s.username || '';
    } catch {
      return '';
    }
  });
  const [sidebarEntries, setSidebarEntries] = useState<SidebarEntry[]>([
    ...QUEST_DEFINITIONS,
    ...INITIAL_TIPS,
  ]);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<null | 'cafe' | 'quiz'>(null);
  const [dormScenario, setDormScenario] = useState<{
    situation: string;
    character?: string;
    choices: string[];
    costs: number[];
    outcomes: Array<{ xp?: number; gold?: number; debt?: number; lesson?: string }>;
  } | null>(null);
  const [dormOutcome, setDormOutcome] = useState<{ title: string; text: string; xp: number; gold: number } | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: string; content: string }>>([
    { role: 'ai', content: "Namaste! I'm your Socratic financial guide, Penny. What financial situation are you navigating today?" },
  ]);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  const hotbarActive = useRef(0);

  const persist = useCallback(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    persist();
  }, [state, persist]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const addTutorToSidebar = useCallback((text: string) => {
    setSidebarEntries((prev) => [...prev, makeTutorEntry(text)]);
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

  const updateGold = useCallback((delta: number) => {
    setState((s) => ({ ...s, gold: Math.max(0, s.gold + delta) }));
  }, []);

  const selectAvatar = (idx: number) => {
    const a = AVATARS[idx];
    setState((s) => ({
      ...s,
      avatar: { emoji: a.emoji, name: a.name.split(' ')[0].toUpperCase(), type: a.name },
      gold: a.gold,
    }));
  };

  const startGame = () => {
    setScreen('game');
  };

  const beginQuest = () => {
    const cleaned = welcomeUsername.trim();
    const username = cleaned ? cleaned.toUpperCase().slice(0, 14) : 'ADVENTURER';
    setState((s) => ({ ...s, username }));
    setScreen('avatar');
  };

  const handleLogout = async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const fetchDormScenario = async () => {
    try {
      const res = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'budgeting_1',
          playerState: { gold: state.gold, level: state.level, avatar: state.avatar.type },
        }),
      });
      const data = await res.json();
      if (data.situation) setDormScenario(data);
      else setDormScenario({
        situation:
          'Your roommate says they\'ll pay their share of the ₹10,000 PG rent next week via UPI. What do you do?',
        choices: [
          'Agree to split ₹6k/₹4k + Spotify — you pay ₹4,075/month',
          'Equal split ₹5k each. Decline Spotify.',
          'Equal split after NoBroker discount — ~₹4,500 each',
        ],
        costs: [4075, 5000, 4500],
        outcomes: [{}, { xp: 60, gold: 150 }, { xp: 100, gold: 300 }],
      });
    } catch {
      setDormScenario({
        situation: 'Your roommate says they\'ll pay their share of the ₹10,000 PG rent next week via UPI. What do you do?',
        choices: [
          'Agree to split ₹6k/₹4k + Spotify — you pay ₹4,075/month',
          'Equal split ₹5k each. Decline Spotify.',
          'Equal split after NoBroker discount — ~₹4,500 each',
        ],
        costs: [4075, 5000, 4500],
        outcomes: [{}, { xp: 60, gold: 150 }, { xp: 100, gold: 300 }],
      });
    }
  };

  const openDorms = () => {
    setDormOutcome(null);
    fetchDormScenario();
    setModal('dorms');
  };

  const openBudgetingCity = () => {
    markQuestStep('q-budget-basics', 0);
    router.push('/game/budgeting_city');
  };

  const openCafe = () => {
    setActiveGame('cafe');
  };

  const openQuiz = () => {
    setActiveGame('quiz');
  };

  const dormChoice = (i: number) => {
    if (!dormScenario) return;
    const cost = dormScenario.costs[i] ?? 0;
    const out = dormScenario.outcomes[i] ?? {};
    const xp = out.xp ?? 0;
    const gold = (out.gold ?? 0) - cost;
    setState((s) => ({
      ...s,
      gold: Math.max(0, s.gold + gold),
      xp: s.xp + xp,
      questsDone: s.questsDone + 1,
      budgetProgress: Math.min(100, s.budgetProgress + 33),
    }));
    setDormOutcome({
      title: `Option ${String.fromCharCode(65 + i)}`,
      text: out.lesson ?? 'You made a choice. Consider asking the AI Tutor why this matters for your budget!',
      xp,
      gold: out.gold ?? 0,
    });
    showToast(`+${xp} XP earned! 🎉`);
    markQuestStep('q-roommate', 1);
  };

  const sendTutor = async (prefill?: string) => {
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
          gameState: { gold: state.gold, level: state.level, avatar: state.avatar, xp: state.xp },
          history: tutorMessages
            .slice(-6)  // last 6 messages = 3 exchanges, enough context without bloating
            .map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content,
            })),
        }),
      });
      const data = await res.json();
      const reply = data.question || 'I couldn’t connect. Try again!';
      setTutorMessages((m) => [...m, { role: 'ai', content: reply }]);
      addTutorToSidebar(reply);
      markQuestStep('q-budget-basics', 2);
      markQuestStep('q-roommate', 2);
    } catch {
      setTutorMessages((m) => [
        ...m,
        {
          role: 'ai',
          content:
            "I couldn't connect. What do you think the answer might be based on what you know about money management?",
        },
      ]);
    }
    setTutorLoading(false);
  };

  if (screen === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#0a0e1a_0%,#0d2a1a_40%,#0a1a0a_100%)] relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(0,255,100,0.04) 31px, rgba(0,255,100,0.04) 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(0,255,100,0.04) 31px, rgba(0,255,100,0.04) 32px)',
          }}
        />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
          <div
            className="font-pixel text-4xl sm:text-5xl text-gold mb-3"
            style={{
              textShadow:
                '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            }}
          >
            FinQuest
          </div>
          <div className="font-pixel text-[11px] sm:text-xs text-[var(--text-muted)] mb-8">
            Welcome to FinQuest — A Monetary Odyssey
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full max-w-5xl mb-8">
            <div className="bg-black/30 border border-white/10 rounded-lg p-5">
              <div className="font-pixel text-gold text-xs mb-2">🎮 How to Play</div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Walk through an RPG city. Click buildings to enter financial scenarios. Make decisions. Learn by doing.
              </p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-5">
              <div className="font-pixel text-gold text-xs mb-2">🧠 What You'll Learn</div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Budgeting, saving, investing, loans — all through real Indian student situations like PG rent, UPI payments, chai habits.
              </p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-5">
              <div className="font-pixel text-gold text-xs mb-2">🏆 Your Goal</div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Complete quests, earn XP and Gold, unlock new city areas. Become financially literate before your first job.
              </p>
            </div>
          </div>

          <div className="w-full max-w-xl bg-black/30 border border-white/10 rounded-lg p-5">
            <label className="font-pixel text-xs text-[var(--text-muted)] block mb-2">Choose your username</label>
            <input
              type="text"
              value={welcomeUsername}
              onChange={(e) => setWelcomeUsername(e.target.value)}
              placeholder="e.g. SANJANA"
              className="w-full bg-white/10 border border-white/20 text-[var(--text)] px-3 py-2 rounded text-sm outline-none focus:border-gold"
              maxLength={14}
            />
            <button
              onClick={beginQuest}
              className="mt-4 w-full font-pixel text-sm bg-gold text-[var(--dark)] px-8 py-3 rounded shadow-lg hover:-translate-y-1 transition"
            >
              Begin Quest →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'avatar') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--dark)] p-6">
        <Link href="/" className="font-pixel text-xs text-[var(--text-muted)] border border-white/20 px-4 py-2 rounded mb-6 hover:text-gold hover:border-gold">
          ← Back
        </Link>
        <h1 className="font-pixel text-gold text-center mb-2">Choose Your Avatar</h1>
        <p className="text-[var(--text-muted)] text-center mb-8 max-w-lg">
          Your starting financial situation shapes your adventure. No judgment — every path teaches different lessons.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl w-full mb-8">
          {AVATARS.map((a, i) => (
            <button
              key={a.name}
              onClick={() => selectAvatar(i)}
              className={`p-6 rounded border-2 text-center transition ${
                state.avatar.type === a.name
                  ? 'border-gold bg-gold/10 shadow-lg shadow-gold/20'
                  : 'border-white/20 bg-white/5 hover:border-gold/50'
              }`}
            >
              <span className="text-4xl block mb-2">{a.emoji}</span>
              <div className="font-pixel text-xs text-gold mb-1">{a.name}</div>
              <div className="text-sm text-[var(--text-muted)]">Gold: {a.gold.toLocaleString('en-IN')}</div>
            </button>
          ))}
        </div>
        <button
          onClick={startGame}
          className="font-pixel text-sm bg-gold text-[var(--dark)] px-8 py-3 rounded shadow-lg hover:-translate-y-1"
        >
          ▶ Enter FinQuest World
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#16213e] overflow-hidden relative">
      <div className="flex-1 flex min-h-0">
        <QuestSidebar
          entries={sidebarEntries}
          questsDone={sidebarEntries.filter(
            (e) => e.kind === 'quest' && e.steps.every((s) => s.done),
          ).length}
          onAskTutor={(q) => {
            setTutorOpen(true);
            setTimeout(() => sendTutor(q), 100);
          }}
        />

        <main className="flex-1 relative min-h-[500px] bg-[#2d5a2d] overflow-hidden">
          <div className="relative w-full h-full">
            <img
              src="/assets/background.jpg"
              alt="FinQuest World Map"
              className="absolute w-full h-full object-cover select-none z-0"
              draggable={false}
              style={{ imageRendering: 'pixelated' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {/* Clickable hotspots with building images */}
            <div
              className="absolute cursor-pointer hover:-translate-y-1 transition-transform duration-300 z-10 flex items-end justify-center mix-blend-multiply"
              style={{ left: '12%', top: '42%', width: '20%', height: '28%' }}
              onClick={openBudgetingCity}
            >
              <img src="/assets/budgeting.png" alt="Budgeting City" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div
              className="absolute cursor-pointer hover:-translate-y-1 transition-transform duration-300 z-10 opacity-60 mix-blend-multiply"
              style={{ left: '55%', top: '8%', width: '22%', height: '35%' }}
              onClick={() => showToast('🔒 Complete Budgeting City to unlock Investment Tower!')}
            >
              <img src="/assets/mainasset.jpg" alt="Investment Tower" className="w-full h-full object-contain mix-blend-darken" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div
              className="absolute cursor-pointer hover:-translate-y-1 transition-transform duration-300 z-10 mix-blend-multiply"
              style={{ left: '35%', top: '28%', width: '18%', height: '22%' }}
              onClick={openQuiz}
            >
               <img src="/assets/budgetasset.png" alt="City Hall" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          </div>

          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(20,20,20,0.85)] rounded-lg p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <div className="w-12 h-12 bg-green-800 border-2 border-gray-600 rounded flex items-center justify-center text-2xl">
                  {state.avatar.emoji}
                </div>
                <div>
                  <div className="font-pixel text-[9px] text-[var(--text)] uppercase mb-1">
                    {state.username}, LV.{state.level}
                  </div>
                  <div className="flex gap-1 mb-1">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const filled = (state.hp / 10) > i;
                      return (
                        // eslint-disable-next-line react/no-array-index-key
                        <span key={i}>{filled ? '❤️' : '🖤'}</span>
                      );
                    })}
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const filled = ((state.xp % 100) / 10) > i;
                      return (
                        // eslint-disable-next-line react/no-array-index-key
                        <span key={i}>{filled ? '💎' : '◇'}</span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div
                className="font-pixel text-2xl text-white"
                style={{
                  textShadow:
                    '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                }}
              >
                FinQuest
              </div>
            </div>

            <div className="absolute top-4 right-4 z-20 pointer-events-none">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-pixel text-[9px] text-[#FFD700] uppercase space-y-1 pointer-events-auto">
                <div>🪙 COINS: {state.gold.toLocaleString('en-IN')}</div>
                <div>💎 TOKENS: {state.gems}</div>
                <button
                  onClick={handleLogout}
                  className="mt-1 w-full font-pixel text-xs bg-white/10 border border-white/20 text-[var(--text)] px-3 py-1.5 rounded hover:border-red-400 hover:text-red-300 transition-all"
                >
                  🚪 Logout
                </button>
              </div>
            </div>

            <div className="absolute top-28 right-4 z-20 pointer-events-none">
              <button
                onClick={() => setTutorOpen(true)}
                className="border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 pointer-events-auto hover:shadow-none hover:translate-y-[4px] transition-all"
              >
                <span>🤖</span>
                <span className="font-pixel text-[9px] text-green-400">AI TUTOR</span>
              </button>
            </div>

            <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
              <div className="flex flex-row gap-2 pointer-events-auto">
                {[
                  { label: 'MAP', icon: '🗺️', onClick: () => showToast('🗺️ Map — coming soon!') },
                  { label: 'INVENTORY', icon: '🎒', onClick: () => showToast('🎒 Inventory — coming soon!') },
                  { label: 'QUESTS', icon: '📜', onClick: () => setModal('budgeting-city') },
                  { label: 'MENU', icon: '☰', onClick: () => (window.location.href = '/') },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={btn.onClick}
                    className="w-[52px] h-[52px] border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-pixel text-[8px] text-[var(--text-muted)] flex flex-col items-center justify-center gap-0.5 uppercase hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700] hover:shadow-none hover:translate-y-[4px] transition-all"
                  >
                    <span>{btn.icon}</span>
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal: Budgeting City */}
      {modal === 'budgeting-city' && (
        <div className="fixed inset-0 z-[200]">
          <div className="relative w-full h-full bg-[#2d5a2d]">
            <img
              src="/map/budgeting-city.png"
              className="w-full h-full object-cover select-none"
              style={{ imageRendering: 'pixelated' }}
              draggable={false}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {/* Close button */}
            <button
              onClick={() => setModal(null)}
              className="absolute top-4 right-4 font-pixel text-xs bg-black/70 border border-gold/40 text-gold px-3 py-2 rounded z-10 hover:bg-black/90"
            >
              ✕ CLOSE
            </button>
            {/* Hotspots - positions match the mockup */}
            {/* DORMS */}
            <div
              className="absolute cursor-pointer hover:bg-yellow-400/20 rounded-lg border-2 border-transparent hover:border-yellow-400/50 transition-all flex items-end justify-center pb-1"
              style={{ left: '48%', top: '20%', width: '15%', height: '20%' }}
              onClick={() => { setModal(null); openDorms(); }}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">DORMS</span>
            </div>
            {/* MARKET */}
            <div
              className="absolute cursor-pointer hover:bg-yellow-400/20 rounded-lg border-2 border-transparent hover:border-yellow-400/50 transition-all flex items-end justify-center pb-1"
              style={{ left: '8%', top: '30%', width: '22%', height: '22%' }}
              onClick={() => { setModal(null); setModal('market'); }}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">MARKET</span>
            </div>
            {/* CAFE */}
            <div
              className="absolute cursor-pointer hover:bg-yellow-400/20 rounded-lg border-2 border-transparent hover:border-yellow-400/50 transition-all flex items-end justify-center pb-1"
              style={{ left: '55%', top: '42%', width: '18%', height: '22%' }}
              onClick={() => { setModal(null); openCafe(); }}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">UNIV. CAFÉ</span>
            </div>
            {/* CITY HALL */}
            <div
              className="absolute cursor-pointer hover:bg-yellow-400/20 rounded-lg border-2 border-transparent hover:border-yellow-400/50 transition-all flex items-end justify-center pb-1"
              style={{ left: '55%', top: '5%', width: '18%', height: '18%' }}
              onClick={() => { setModal(null); openQuiz(); }}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">CITY HALL</span>
            </div>
            {/* BUDGET TETRIS */}
            <div
              className="absolute cursor-pointer hover:bg-yellow-400/20 rounded-lg border-2 border-transparent hover:border-yellow-400/50 transition-all flex items-end justify-center pb-1"
              style={{ left: '25%', top: '55%', width: '15%', height: '18%' }}
              onClick={() => { setModal(null); setModal('tetris'); }}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">ARCADE</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dorms (Grok scenario) */}
      {modal === 'dorms' && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[200] p-4" onClick={() => setModal(null)}>
          <div className="bg-[var(--dark2)] border-2 border-[var(--panel-border)] rounded max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-[var(--panel-border)]">
              <span className="font-pixel text-gold">🏠 Dorms — Roommate Situation</span>
              <button onClick={() => setModal(null)} className="text-[var(--text-muted)] hover:text-red-500 text-xl">✕</button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="font-pixel text-gold text-xs mb-2">{dormScenario?.character ?? 'Roommate Rahul'}:</div>
                <p className="text-[var(--text)] text-sm leading-relaxed">
                  {dormScenario?.situation ?? 'Loading scenario from Grok...'}
                </p>
                <div className="font-pixel text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 rounded px-3 py-2 mt-3">
                  [DECISION REQUIRED: Consider fairness, financial risk, and long-term roommate relationship.]
                </div>
              </div>
              {!dormOutcome ? (
                <div className="grid gap-3">
                  {dormScenario?.choices?.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => dormChoice(i)}
                      className="text-left p-4 rounded border border-white/15 hover:border-gold bg-white/5 flex justify-between items-center"
                    >
                      <span className="font-pixel text-gold text-xs">{choice}</span>
                      <span className="text-sm text-[var(--text-muted)]">−₹{(dormScenario.costs[i] ?? 0).toLocaleString('en-IN')}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-green/10 border border-green/30 rounded p-4">
                  <div className="font-pixel text-[var(--green-light)] text-xs mb-2">✅ {dormOutcome.title}</div>
                  <p className="text-sm text-[var(--text)] mb-4">{dormOutcome.text}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="font-pixel text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded">+{dormOutcome.xp} XP</span>
                    {dormOutcome.gold > 0 && <span className="font-pixel text-xs bg-gold/20 text-gold px-2 py-1 rounded">+₹{dormOutcome.gold} Gold</span>}
                  </div>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <button onClick={() => sendTutor('Why is it risky to let my roommate delay UPI payment?')} className="font-pixel text-xs bg-green text-white px-3 py-1.5 rounded">
                      🤖 Ask AI Tutor
                    </button>
                    <button
                      onClick={() => {
                        setDormOutcome(null);
                        fetchDormScenario();
                      }}
                      className="font-pixel text-xs bg-blue-500/20 text-blue-200 border border-blue-500/40 px-3 py-1.5 rounded"
                    >
                      ♻️ New Scenario
                    </button>
                    <button onClick={() => setModal(null)} className="font-pixel text-xs bg-gold/15 text-gold border border-gold/30 px-3 py-1.5 rounded">
                      ← Back to City
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Budget Tetris */}
      {modal === 'tetris' && (
        <BudgetTetris
          onClose={() => setModal(null)}
          onGameOver={(finalScore, clearedLines) => {
            const xpEarned = Math.min(150, Math.floor(finalScore / 100));
            if (xpEarned > 0 || clearedLines > 0) {
              setState((s) => ({
                ...s,
                xp: s.xp + xpEarned,
                gold: s.gold + xpEarned * 2,
                questsDone: s.questsDone + 1,
                budgetProgress: Math.min(100, s.budgetProgress + 20),
              }));
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
      )}

      {modal === 'market' && (
        <BudgetGame
          onClose={() => setModal(null)}
          onComplete={(correct, xp, gold) => {
            setState(s => ({
              ...s,
              xp: s.xp + xp,
              gold: s.gold + gold,
              questsDone: s.questsDone + 1,
              budgetProgress: Math.min(100, s.budgetProgress + 33),
            }));
            markQuestStep('q-budget-basics', 1);
            showToast(`+${xp} XP · +₹${gold} Gold 🎉`);
          }}
        />
      )}

      {activeGame === 'cafe' && (
        <CafeGame
          onClose={() => setActiveGame(null)}
          onComplete={(xpEarned) => {
            setState((s) => ({
              ...s,
              xp: s.xp + xpEarned,
              gold: s.gold + Math.floor(xpEarned * 2),
              questsDone: s.questsDone + 1,
              budgetProgress: Math.min(100, s.budgetProgress + 20),
            }));
            showToast(`+${xpEarned} XP earned! ☕`);
          }}
        />
      )}

      {activeGame === 'quiz' && (
        <QuizGame
          onClose={() => setActiveGame(null)}
          onComplete={(result) => {
            setState((s) => ({
              ...s,
              xp: s.xp + result.xpEarned,
              gold: s.gold + result.goldEarned,
              questsDone: s.questsDone + 1,
              budgetProgress: Math.min(100, s.budgetProgress + 10),
            }));
            showToast(`🏛️ Quiz complete! +${result.xpEarned} XP`);
          }}
        />
      )}

      {tutorOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-[rgba(5,15,35,0.97)] border-l-2 border-blue-500/50 z-[300] flex flex-col shadow-2xl">
          <div className="flex justify-between items-center p-4 border-b border-blue-500/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">🤖</div>
              <div>
                <div className="font-pixel text-[var(--blue-light)] text-xs">Penny · AI Tutor</div>
                <div className="text-xs text-[var(--text-muted)]">Socratic Guide · RAG + Grok</div>
              </div>
            </div>
            <button onClick={() => setTutorOpen(false)} className="text-[var(--text-muted)] hover:text-red-500 text-xl">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tutorMessages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded text-sm ${
                  m.role === 'user' ? 'bg-green/10 border border-green/20 ml-6' : 'bg-blue-500/15 border border-blue-500/25'
                }`}
              >
                <div className="font-pixel text-xs mb-1 opacity-70">{m.role === 'user' ? 'You' : 'AI Tutor'}</div>
                {m.content}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-blue-500/30">
            <div className="flex gap-2 mb-2 flex-wrap">
              {['Why did I overspend?', '50/30/20 rule for ₹15k', 'Rent vs savings?', 'UPI limits'].map((q) => (
                <button key={q} onClick={() => sendTutor(q)} className="font-pixel text-[10px] bg-blue-500/15 text-[var(--blue-light)] border border-blue-500/35 px-2 py-1 rounded">
                  {q}
                </button>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 font-pixel text-xs bg-[var(--panel)] border border-[var(--panel-border)] text-gold px-6 py-3 rounded z-[500] animate-in fade-in duration-300">
          {toast}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  QuestSidebar,
  QUEST_DEFINITIONS,
  INITIAL_TIPS,
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

type FinancialProfile = {
  monthlyIncome: number;
  incomeLabel: string;
  livingSituation: string;
  primaryGoal: string;
  riskTolerance: string;
};

const INCOME_OPTIONS: Array<{ label: string; monthlyIncome: number }> = [
  { label: 'Under ₹5,000', monthlyIncome: 2500 },
  { label: '₹5,000-10,000', monthlyIncome: 7500 },
  { label: '₹10,000-15,000', monthlyIncome: 12500 },
  { label: '₹15,000-20,000', monthlyIncome: 17500 },
  { label: 'Above ₹20,000', monthlyIncome: 25000 },
];

const LIVING_OPTIONS = ['Living at Home', 'PG/Hostel', 'Rented Flat', 'College Dorms'] as const;
const GOAL_OPTIONS = ['Learn to Save', 'Manage Debt', 'Start Investing', 'General Literacy'] as const;
const RISK_OPTIONS = ['Conservative', 'Moderate', 'Aggressive'] as const;

const XP_THRESHOLDS = [0, 500, 1200, 2500, 4500, 7500, 11000, 15500, 21000, 28000] as const;

function getLevelFromTotalXp(totalXp: number): number {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i += 1) {
    if (totalXp >= XP_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(10, level);
}

function getXpProgress(totalXp: number) {
  const level = getLevelFromTotalXp(totalXp);
  const lower = XP_THRESHOLDS[level - 1];
  const upper = XP_THRESHOLDS[level] ?? lower;
  const xpIntoLevel = Math.max(0, totalXp - lower);
  const xpNeeded = Math.max(0, upper - lower);
  const pct = xpNeeded <= 0 ? 100 : Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100));
  return { level, xpIntoLevel, xpNeeded, pct };
}

function loadState(): {
  avatar: { emoji: string; name: string; type: string };
  username: string;
  financialProfile: FinancialProfile;
  gold: number;
  gems: number;
  level: number;
  xp: number;
  totalXp: number;
  earnedBadges: string[];
  perfectBudgetGame: boolean;
  tetrisCorrect: number;
  tutorQuestions: number;
  quizCorrect: number;
  cafeResists: number;
  dilemmasCompleted: number;
  consecutiveBest: number;
  streak_days: number;
  hp: number;
  questsDone: number;
  budgetProgress: number;
} {
  const defaults = {
    avatar: { emoji: '🎒', name: 'NICK', type: 'Loan Leveraged' },
    username: 'ADVENTURER',
    financialProfile: {
      monthlyIncome: 17500,
      incomeLabel: '₹15,000-20,000',
      livingSituation: 'Living at Home',
      primaryGoal: 'Learn to Save',
      riskTolerance: 'Conservative',
    },
    gold: 15000,
    gems: 50,
    level: 1,
    xp: 25,
    totalXp: 25,
    earnedBadges: [],
    perfectBudgetGame: false,
    tetrisCorrect: 0,
    tutorQuestions: 0,
    quizCorrect: 0,
    cafeResists: 0,
    dilemmasCompleted: 0,
    consecutiveBest: 0,
    streak_days: 0,
    hp: 80,
    questsDone: 0,
    budgetProgress: 0,
  };

  if (typeof window === 'undefined') return defaults;

  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const parsed = JSON.parse(s) as Partial<ReturnType<typeof loadState>> & { totalXp?: number };
      const totalXp = parsed.totalXp ?? parsed.xp ?? defaults.totalXp;
      return {
        ...defaults,
        ...parsed,
        gold: typeof parsed.gold === 'number' ? parsed.gold : defaults.gold,
        totalXp,
        gold: Number(parsed.gold) || defaults.gold,
        gems: Number(parsed.gems) || defaults.gems,
        level: Number(parsed.level) || defaults.level,
        xp: Number(parsed.xp) || defaults.xp,
        hp: Number(parsed.hp) || defaults.hp,
        questsDone: Number(parsed.questsDone) || 0,
        budgetProgress: Number(parsed.budgetProgress) || 0,
        financialProfile: {
          ...defaults.financialProfile,
          ...(parsed.financialProfile ?? {}),
        },
      };
    }
  } catch {
    // Corrupted localStorage — wipe it so the app doesn't keep crashing
    try { localStorage.removeItem(STORAGE_KEY); } catch { }
  }

  return defaults;
}

function saveState(state: ReturnType<typeof loadState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { }
}

// ── Penny Cat Tutor Intro ──────────────────────────────────────────────────
function PennyIntro({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const lines = [
    "Hey there! I'm Penny — your nerdy finance cat. 🐱",
    "Money can feel confusing, but don't worry — we'll figure it out together.",
    "Let's learn a few simple tricks to make your money work smarter.",
    "Explore the city, click on buildings, and make financial decisions.",
    "Every choice teaches you something real. Ready to begin? 🚀",
  ];

  const next = () => {
    if (step < lines.length - 1) setStep(s => s + 1);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center pb-8 px-4 pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-2xl bg-[rgba(5,10,25,0.97)] border-2 border-[var(--panel-border)] rounded-xl shadow-2xl p-5 flex gap-4 items-end"
        style={{ boxShadow: '0 0 40px rgba(255,215,0,0.15)' }}
      >
        {/* Cat avatar */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-16 h-16 rounded-full border-2 border-gold/50 overflow-hidden bg-[#0a1a2e] flex items-center justify-center">
            <img
              src="/cat.png"
              alt="Penny"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                (e.currentTarget.nextSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
              }}
            />
            <span className="text-3xl hidden">🐱</span>
          </div>
          <div className="font-pixel text-[8px] text-gold">PENNY</div>
        </div>

        {/* Dialogue */}
        <div className="flex-1 min-w-0">
          <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-2">Finance Tutor Cat</div>
          <div className="text-sm text-[var(--text)] leading-relaxed min-h-[2.5rem]">
            {lines[step]}
          </div>
          {/* Dots */}
          <div className="flex gap-1 mt-3">
            {lines.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? 'bg-gold' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex-shrink-0 flex flex-col gap-2">
          <button
            onClick={next}
            className="font-pixel text-[10px] bg-gold text-[var(--dark)] px-4 py-2 rounded hover:-translate-y-0.5 transition whitespace-nowrap"
          >
            {step < lines.length - 1 ? 'Next →' : "Let's Go! →"}
          </button>
          <button
            onClick={onClose}
            className="font-pixel text-[9px] text-[var(--text-muted)] hover:text-white transition text-center"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GameView() {
  const [screen, setScreen] = useState<'welcome' | 'avatar' | 'game'>('welcome');
  const [state, setState] = useState(loadState);
  const [welcomeUsername, setWelcomeUsername] = useState(() => {
    try {
      const s = loadState();
      return s.username && s.username !== 'ADVENTURER' ? s.username : '';
    } catch {
      return '';
    }
  });

  const [step1IncomeLabel, setStep1IncomeLabel] = useState<string>(() => {
    try {
      return loadState().financialProfile.incomeLabel;
    } catch {
      return INCOME_OPTIONS[3].label;
    }
  });
  const [step1LivingSituation, setStep1LivingSituation] = useState<string>(() => {
    try {
      return loadState().financialProfile.livingSituation;
    } catch {
      return LIVING_OPTIONS[0];
    }
  });
  const [step1PrimaryGoal, setStep1PrimaryGoal] = useState<string>(() => {
    try {
      return loadState().financialProfile.primaryGoal;
    } catch {
      return GOAL_OPTIONS[0];
    }
  });
  const [step1RiskTolerance, setStep1RiskTolerance] = useState<string>(() => {
    try {
      return loadState().financialProfile.riskTolerance;
    } catch {
      return RISK_OPTIONS[0];
    }
  });
  const [sidebarEntries, setSidebarEntries] = useState<SidebarEntry[]>([
    ...QUEST_DEFINITIONS,
    ...INITIAL_TIPS,
  ]);
  const [tutorTips, setTutorTips] = useState<string[]>([]);
  const [toast, setToast] = useState('');

  // Navigation: null = world map, 'budgeting-city' = submap, 'dorms'/'market'/'tetris' = quest modals
  const [modal, setModal] = useState<string | null>(null);
  // Active game (cafe/quiz) — rendered on top of everything
  const [activeGame, setActiveGame] = useState<null | 'cafe' | 'quiz'>(null);

  const [previousModal, setPreviousModal] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [debugHotspots, setDebugHotspots] = useState(false);

  // Penny intro — show once when entering game screen
  const [showPennyIntro, setShowPennyIntro] = useState(false);
  const pennyShownRef = useRef(false);

  const [dormScenario, setDormScenario] = useState<{
    situation: string;
    character?: string;
    choices: string[];
    costs: number[];
    outcomes: Array<{ xp?: number; gold?: number; debt?: number; lesson?: string }>;
  } | null>(null);
  const [dormOutcome, setDormOutcome] = useState<{ title: string; text: string; xp: number; gold: number } | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: string; content: string }>>([
    { role: 'ai', content: "Namaste! I'm your Socratic financial guide. What financial situation are you navigating today?" },
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

  // Show Penny intro once when entering game screen
  useEffect(() => {
    if (screen === 'game' && !pennyShownRef.current) {
      pennyShownRef.current = true;
      setTimeout(() => setShowPennyIntro(true), 600);
    }
  }, [screen]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  // Debug: toggle hotspot borders with Ctrl+D
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      if (e.key.toLowerCase() !== 'd') return;
      e.preventDefault();
      setDebugHotspots((v) => !v);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const lastLevelRef = useRef(state.level);
  useEffect(() => {
    if (state.level <= lastLevelRef.current) return;
    if (state.level === 5) showToast('⭐ Level Up to 5! 🌟 Investment Tower unlocked!');
    else if (state.level === 10) showToast('⭐ Level Up to 10! 🌟 Loan Bank unlocked!');
    else showToast(`⭐ Level Up! You are now Level ${state.level}.`);
    lastLevelRef.current = state.level;
  }, [state.level, showToast]);

  // Badges: check on every meaningful state change.
  useEffect(() => {
    const ALL_BADGES: Array<{
      id: string;
      icon: string;
      name: string;
      condition: (s: typeof state) => boolean;
    }> = [
        { id: 'first_quest', icon: '🎮', name: 'First Quest', condition: (s) => s.questsDone >= 1 },
        { id: 'budget_master', icon: '💰', name: 'Budget Master', condition: (s) => s.perfectBudgetGame === true },
        { id: 'tetris_3', icon: '🧱', name: 'Tetris Trainer', condition: (s) => s.tetrisCorrect >= 10 },
        { id: 'tutor_5', icon: '🤖', name: 'Tutor Seeker', condition: (s) => s.tutorQuestions >= 5 },
        { id: 'level_3', icon: '⭐', name: 'Level 3', condition: (s) => s.level >= 3 },
        { id: 'level_5', icon: '🌟', name: 'Level 5', condition: (s) => s.level >= 5 },
        { id: 'quiz_ace', icon: '🧠', name: 'Quiz Ace', condition: (s) => s.quizCorrect >= 5 },
        { id: 'saver', icon: '🏦', name: 'Saver', condition: (s) => s.cafeResists >= 10 },
        { id: 'dilemma_5', icon: '⚔️', name: 'Dilemma Starter', condition: (s) => s.dilemmasCompleted >= 5 },
        { id: 'dilemma_best', icon: '🏆', name: 'Best Streak', condition: (s) => s.consecutiveBest >= 3 },
        { id: 'streak_3', icon: '🔥', name: 'Streak 3', condition: (s) => s.streak_days >= 3 },
        { id: 'completionist', icon: '💎', name: 'Completionist', condition: (s) => s.budgetProgress >= 100 },
      ];

    const newlyUnlocked = ALL_BADGES.filter((b) => b.condition(state) && !state.earnedBadges.includes(b.id));
    if (newlyUnlocked.length === 0) return;

    const ids = newlyUnlocked.map((b) => b.id);
    setState((prev) => ({
      ...prev,
      earnedBadges: Array.from(new Set([...prev.earnedBadges, ...ids])),
    }));

    showToast(`🏅 ${newlyUnlocked[0].icon} Unlocked: ${newlyUnlocked[0].name}`);
  }, [state, showToast]);

  const extractTip = useCallback((text: string) => {
    // Extract a short “first-sentence” hint for the sidebar.
    const first = text.split('.').map((s) => s.trim()).filter(Boolean)[0] ?? text.trim();
    const compact = first.length > 100 ? `${first.slice(0, 97)}...` : first;
    return compact.length >= 20 ? compact : '';
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
    const cleaned = welcomeUsername.trim();
    const username = cleaned ? cleaned.toUpperCase().slice(0, 14) : 'ADVENTURER';
    setState((s) => ({ ...s, username }));
    setScreen('game');
  };

  const beginQuest = () => {
    const monthlyIncome =
      INCOME_OPTIONS.find((o) => o.label === step1IncomeLabel)?.monthlyIncome ?? INCOME_OPTIONS[3].monthlyIncome;

    const financialProfile: FinancialProfile = {
      monthlyIncome,
      incomeLabel: step1IncomeLabel,
      livingSituation: step1LivingSituation,
      primaryGoal: step1PrimaryGoal,
      riskTolerance: step1RiskTolerance,
    };

    setState((s) => ({ ...s, financialProfile }));
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
          playerState: {
            gold: state.gold,
            level: state.level,
            avatar: state.avatar.type,
            financialProfile: state.financialProfile,
          },
        }),
      });
      const data = await res.json();
      if (data.situation) setDormScenario(data);
      else setDormScenario({
        situation: "Your roommate says they'll pay their share of the ₹10,000 PG rent next week via UPI. What do you do?",
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
        situation: "Your roommate says they'll pay their share of the ₹10,000 PG rent next week via UPI. What do you do?",
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
    setSelectedChoice(null);
    fetchDormScenario();
    setPreviousModal('budgeting-city');
    setModal('dorms');
  };

  const openBudgetingCity = () => {
    setModal('budgeting-city');
    setPreviousModal(null);
    markQuestStep('q-budget-basics', 0);
  };

  // These open games ON TOP of the budgeting city submap
  const openCafe = () => {
    setPreviousModal('budgeting-city');
    setActiveGame('cafe');
  };

  const openQuiz = () => {
    setActiveGame('quiz');
  };

  const dormChoice = (i: number) => {
    if (!dormScenario) return;
    setSelectedChoice(i);
    const cost = dormScenario.costs[i] ?? 0;
    const out = dormScenario.outcomes[i] ?? {};
    const xp = out.xp ?? 0;
    const gold = (out.gold ?? 0) - cost;
    setState((s) => ({
      ...s,
      gold: Math.max(0, s.gold + gold),
      totalXp: s.totalXp + xp,
      xp: getXpProgress(s.totalXp + xp).xpIntoLevel,
      level: getXpProgress(s.totalXp + xp).level,
      questsDone: s.questsDone + 1,
      budgetProgress: Math.min(100, s.budgetProgress + 33),
      dilemmasCompleted: s.dilemmasCompleted + 1,
      consecutiveBest: xp === 100 ? s.consecutiveBest + 1 : 0,
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
          gameState: {
            gold: state.gold,
            level: state.level,
            avatar: state.avatar,
            xp: state.xp,
            financialProfile: state.financialProfile,
          },
          history: tutorMessages
            .slice(-6)
            .map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content,
            })),
        }),
      });
      const data = await res.json();
      const reply = data.question || "I couldn't connect. Try again!";
      setTutorMessages((m) => [...m, { role: 'ai', content: reply }]);
      setState((s) => ({ ...s, tutorQuestions: s.tutorQuestions + 1 }));
      const tip = extractTip(reply);
      if (tip) {
        setTutorTips((prev) => [...prev.slice(-4), tip]);
      }
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

  // ── WELCOME SCREEN ─────────────────────────────────────────────────────────
  if (screen === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#0a0e1a_0%,#0d2a1a_40%,#0a1a0a_100%)] relative overflow-hidden">
        {/* Pixel grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(0,255,100,0.04) 31px, rgba(0,255,100,0.04) 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(0,255,100,0.04) 31px, rgba(0,255,100,0.04) 32px)',
          }}
        />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
          {/* Logo */}
          <div
            className="font-pixel text-4xl sm:text-5xl text-gold mb-3"
            style={{
              textShadow:
                '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            }}
          >
            FinQuest
          </div>
          <div className="font-pixel text-[11px] sm:text-xs text-[var(--text-muted)] mb-8 text-center">
            Welcome to FinQuest — A Monetary Odyssey
          </div>

          {/* Onboarding Step Indicator */}
          <div className="w-full max-w-xl mb-8">
            <div className="font-pixel text-xs text-gold mb-2 text-center">Step 1 of 2</div>
            <div className="flex gap-2">
              <div className="flex-1 h-2 rounded bg-gold/35" />
              <div className="flex-1 h-2 rounded bg-white/10" />
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full max-w-5xl mb-8">
            <div className="bg-black/30 border border-white/10 rounded-lg p-5 hover:border-gold/30 transition-colors">
              <div className="font-pixel text-gold text-xs mb-3">🎮 How to Play</div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Walk through an RPG city. Click buildings to enter financial scenarios. Make decisions. Learn by doing.
              </p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-5 hover:border-gold/30 transition-colors">
              <div className="font-pixel text-gold text-xs mb-3">🧠 What You'll Learn</div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Budgeting, saving, investing, loans — all through real Indian student situations like PG rent, UPI payments, chai habits.
              </p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-5 hover:border-gold/30 transition-colors">
              <div className="font-pixel text-gold text-xs mb-3">🏆 Your Goal</div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Complete quests, earn XP and Gold, unlock new city areas. Become financially literate before your first job.
              </p>
            </div>
          </div>

          {/* Financial Profile (Step 1) */}
          <div className="w-full max-w-xl bg-[rgba(10,20,40,0.92)] border-2 border-[rgba(255,215,0,0.35)] rounded-lg p-5">
            <div className="font-pixel text-gold text-xs mb-3 text-center">⚔️ Your Financial Profile</div>
            <div className="space-y-4">
              <div>
                <label className="font-pixel text-[10px] text-[var(--text-muted)] block mb-2">Monthly Income</label>
                <select
                  value={step1IncomeLabel}
                  onChange={(e) => setStep1IncomeLabel(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-[var(--text)] px-3 py-2 rounded text-sm outline-none focus:border-gold transition-colors"
                >
                  {INCOME_OPTIONS.map((o) => (
                    <option key={o.label} value={o.label}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-pixel text-[10px] text-[var(--text-muted)] block mb-2">Living Situation</label>
                <select
                  value={step1LivingSituation}
                  onChange={(e) => setStep1LivingSituation(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-[var(--text)] px-3 py-2 rounded text-sm outline-none focus:border-gold transition-colors"
                >
                  {LIVING_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-pixel text-[10px] text-[var(--text-muted)] block mb-2">Primary Goal</label>
                <select
                  value={step1PrimaryGoal}
                  onChange={(e) => setStep1PrimaryGoal(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-[var(--text)] px-3 py-2 rounded text-sm outline-none focus:border-gold transition-colors"
                >
                  {GOAL_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-pixel text-[10px] text-[var(--text-muted)] block mb-2">Risk Tolerance</label>
                <select
                  value={step1RiskTolerance}
                  onChange={(e) => setStep1RiskTolerance(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-[var(--text)] px-3 py-2 rounded text-sm outline-none focus:border-gold transition-colors"
                >
                  {RISK_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={beginQuest}
                className="w-full font-pixel text-sm bg-gold text-[var(--dark)] px-8 py-3 rounded shadow-lg hover:-translate-y-1 transition-transform border border-gold/30"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── AVATAR SELECT SCREEN ───────────────────────────────────────────────────
  if (screen === 'avatar') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--dark)] p-6">
        <button
          onClick={() => setScreen('welcome')}
          className="font-pixel text-xs text-[var(--text-muted)] border border-white/20 px-4 py-2 rounded mb-6 hover:text-gold hover:border-gold transition-colors"
        >
          ← Back
        </button>
        <div className="w-full max-w-xl mb-4">
          <div className="font-pixel text-xs text-gold mb-2 text-center">Step 2 of 2</div>
          <div className="flex gap-2">
            <div className="flex-1 h-2 rounded bg-gold/35" />
            <div className="flex-1 h-2 rounded bg-gold/35" />
          </div>
        </div>
        <h1 className="font-pixel text-gold text-center mb-2">Choose Your Avatar</h1>
        <p className="text-[var(--text-muted)] text-center mb-8 max-w-lg">
          Your starting financial situation shapes your adventure. No judgment — every path teaches different lessons.
        </p>

        {/* Username (Step 2) */}
        <div className="w-full max-w-xl bg-black/30 border border-white/10 rounded-lg p-5 mb-8">
          <label className="font-pixel text-xs text-[var(--text-muted)] block mb-2">Choose your username</label>
          <input
            type="text"
            value={welcomeUsername}
            onChange={(e) => setWelcomeUsername(e.target.value)}
            placeholder="e.g. SANJANA"
            className="w-full bg-white/10 border border-white/20 text-[var(--text)] px-3 py-2 rounded text-sm outline-none focus:border-gold transition-colors"
            maxLength={14}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl w-full mb-8">
          {AVATARS.map((a, i) => (
            <button
              key={a.name}
              onClick={() => selectAvatar(i)}
              className={`p-6 rounded border-2 text-center transition-all ${state.avatar.type === a.name
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
          className="font-pixel text-sm bg-gold text-[var(--dark)] px-8 py-3 rounded shadow-lg hover:-translate-y-1 transition-transform"
        >
          ▶ Enter FinQuest World
        </button>
      </div>
    );
  }

  // ── GAME SCREEN ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col bg-[#16213e] overflow-hidden">
      {/* ── Penny Intro (Shows Once) ── */}
      {showPennyIntro && <PennyIntro onClose={() => setShowPennyIntro(false)} />}

      <div className="flex-1 flex min-h-0">
        <QuestSidebar
          entries={sidebarEntries}
          tutorTips={tutorTips}
          questsDone={sidebarEntries.filter(
            (e) => e.kind === 'quest' && e.steps.every((s) => s.done),
          ).length}
          onAskTutor={(q) => {
            setTutorOpen(true);
            setTimeout(() => sendTutor(q), 100);
          }}
        />

        {/* ── MAIN MAP AREA ── */}
        <main className="flex-1 relative min-h-[500px] bg-[#2d5a2d] overflow-hidden">
          {/* World map image + hotspots */}
          <div className="relative w-full h-full">
            <img
              src="/map/world-map.png"
              alt="FinQuest World Map"
              className={`w-full h-full object-cover select-none transition-opacity ${mapLoaded ? 'opacity-100' : 'opacity-0'}`}
              draggable={false}
              style={{ imageRendering: 'pixelated' }}
              onLoad={() => setMapLoaded(true)}
              onError={() => setMapLoaded(false)}
            />

            {/* Map fallback when world-map.png fails */}
            {!mapLoaded && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,100,0.25),transparent_55%),linear-gradient(180deg,#0a0e1a_0%,#0a1a0a_100%)] pointer-events-none">
                <div className="absolute" style={{ left: '8%', top: '40%' }}>
                  <div className="text-2xl">🏘️</div>
                  <div className="font-pixel text-[9px] text-white bg-black/60 px-2 py-1 rounded">Budgeting City</div>
                </div>
                <div className="absolute" style={{ left: '54%', top: '6%' }}>
                  <div className="text-2xl">🏗️</div>
                  <div className="font-pixel text-[9px] text-white bg-black/60 px-2 py-1 rounded">Investment Tower</div>
                </div>
                <div className="absolute" style={{ left: '33%', top: '28%' }}>
                  <div className="text-2xl">⛲</div>
                  <div className="font-pixel text-[9px] text-white bg-black/60 px-2 py-1 rounded">Central Plaza</div>
                </div>
                <div className="absolute" style={{ left: '58%', top: '52%' }}>
                  <div className="text-2xl">🏛️</div>
                  <div className="font-pixel text-[9px] text-white bg-black/60 px-2 py-1 rounded">Loan Bank</div>
                </div>
              </div>
            )}

            {/* ── HOTSPOT: Budgeting City ── */}
            <div
              className={`absolute cursor-pointer hover:bg-yellow-400/15 rounded-xl border-2 transition-all duration-200 flex items-end justify-center pb-2 ${debugHotspots ? 'border-red-500 bg-red-500/30' : 'border-transparent hover:border-yellow-400/40'
                }`}
              style={{ left: '8%', top: '40%', width: '24%', height: '35%' }}
              onClick={openBudgetingCity}
            >
              <span className="font-pixel text-[9px] text-white bg-black/60 px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                Budgeting City
              </span>
            </div>

            {/* ── HOTSPOT: Investment Tower (locked) ── */}
            <div
              className={`absolute cursor-pointer hover:bg-yellow-400/10 rounded-xl border-2 transition-all duration-200 opacity-60 ${debugHotspots ? 'border-red-500 bg-red-500/30 hover:bg-red-500/30' : 'border-transparent hover:border-yellow-400/20'
                }`}
              style={{ left: '54%', top: '6%', width: '24%', height: '40%' }}
              onClick={() => {
                if (state.level >= 5) {
                  showToast('🏗️ Investment Tower unlocked!');
                } else {
                  showToast(`🔒 Investment Tower unlocks at Level 5. You are Level ${state.level}.`);
                }
              }}
            />

            {/* ── HOTSPOT: Central Plaza (quiz) ── */}
            <div
              className={`absolute cursor-pointer hover:bg-yellow-400/15 rounded-xl border-2 transition-all duration-200 flex items-end justify-center pb-2 ${debugHotspots ? 'border-red-500 bg-red-500/30' : 'border-transparent hover:border-yellow-400/40'
                }`}
              style={{ left: '33%', top: '28%', width: '22%', height: '25%' }}
              onClick={openQuiz}
            >
              <span className="font-pixel text-[9px] text-white bg-black/60 px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                Central Plaza
              </span>
            </div>

            {/* ── HOTSPOT: Loan Bank (locked) ── */}
            <div
              className={`absolute cursor-pointer hover:bg-yellow-400/10 rounded-xl border-2 transition-all duration-200 opacity-60 ${debugHotspots ? 'border-red-500 bg-red-500/30 hover:bg-red-500/30' : 'border-transparent hover:border-yellow-400/20'
                }`}
              style={{ left: '58%', top: '52%', width: '22%', height: '32%' }}
              onClick={() => {
                if (state.level >= 10) {
                  showToast('🏛️ Loan Bank unlocked!');
                } else {
                  showToast(`🔒 Loan Bank unlocks at Level 10. You are Level ${state.level}.`);
                }
              }}
            />
          </div>

          {/* ── HUD OVERLAY (pointer-events-none wrapper, children opt-in) ── */}
          <div className="absolute inset-0 pointer-events-none z-10">

            {/* Player HUD — top left */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(20,20,20,0.85)] rounded-lg p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <div className="w-12 h-12 bg-green-800 border-2 border-gray-600 rounded flex items-center justify-center text-2xl">
                  {state.avatar.emoji}
                </div>
                <div>
                  <div className="font-pixel text-[9px] text-[var(--text)] uppercase mb-1">
                    {state.username || 'ADVENTURER'}, LV.{state.level}
                  </div>
                  <div className="flex gap-1 mb-1">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const filled = (state.hp / 10) > i;
                      return (
                        <span key={i}>{filled ? '❤️' : '🖤'}</span>
                      );
                    })}
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const filled = ((state.xp % 100) / 10) > i;
                      return (
                        <span key={i}>{filled ? '💎' : '◇'}</span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Title — top center */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div
                className="font-pixel text-3xl sm:text-4xl text-white"
                style={{
                  textShadow:
                    '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                }}
              >
                FinQuest
              </div>
            </div>

            {/* Gold / Gems / Logout — top right */}
            <div className="absolute top-4 right-4 z-20 pointer-events-auto">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-pixel text-[9px] text-[#FFD700] uppercase space-y-1">
                <div>🪙 COINS: {(state.gold ?? 0).toLocaleString('en-IN')}</div>
                <div>💎 TOKENS: {state.gems}</div>
                <button
                  onClick={handleLogout}
                  className="mt-1 w-full font-pixel text-xs bg-white/10 border border-white/20 text-[var(--text)] px-3 py-1.5 rounded hover:border-red-400 hover:text-red-300 transition-all"
                >
                  🚪 Logout
                </button>
              </div>
            </div>

            {/* AI Tutor button */}
            <div className="absolute top-28 right-4 z-20 pointer-events-auto">
              <button
                onClick={() => setTutorOpen(true)}
                className="border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 hover:shadow-none hover:translate-y-[4px] transition-all"
              >
                <span>🐱</span>
                <span className="font-pixel text-[9px] text-green-400">PENNY</span>
              </button>
            </div>

            {/* Hotbar — bottom right */}
            <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
              <div className="flex flex-row gap-2">
                {[
                  { label: 'MAP', icon: '🗺️', onClick: () => showToast('🗺️ You are on the World Map!') },
                  { label: 'INVENTORY', icon: '🎒', onClick: () => showToast('🎒 Inventory — coming soon!') },
                  { label: 'CITY', icon: '🏙️', onClick: openBudgetingCity },
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

      {/* ══════════════════════════════════════════════════════════════════════
          BUDGETING CITY SUBMAP — full screen overlay
          Navigation: world map → budgeting city → quest modal
      ══════════════════════════════════════════════════════════════════════ */}
      {modal === 'budgeting-city' && (
        <div className="fixed inset-0 z-[200]">
          <div className="relative w-full h-full bg-[#2d5a2d]">
            {/* Background image */}
            <img
              src="/map/budgeting-city.png"
              className="w-full h-full object-cover select-none"
              style={{ imageRendering: 'pixelated' }}
              draggable={false}
              alt="Budgeting City"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />

            {/* ── Back to World Map button ── */}
            <button
              onClick={() => setModal(null)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 font-pixel text-[9px] bg-black/70 border border-gold/40 text-gold px-4 py-2 rounded z-10 hover:bg-black/95 hover:border-gold/60 transition-all flex items-center gap-2"
            >
              ← Back to FinQuest World Map
            </button>

            {/* ── City title ── */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div
                className="font-pixel text-sm text-gold"
                style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000' }}
              >
                Budgeting City
              </div>
            </div>

            {/* ── Close / X button ── */}
            <button
              onClick={() => setModal(null)}
              className="absolute top-4 right-4 font-pixel text-xs bg-black/70 border border-gold/40 text-gold px-3 py-2 rounded z-10 hover:bg-black/90 transition-all"
            >
              ✕ CLOSE
            </button>

            {/* ── HOTSPOT: DORMS ── */}
            <div
              className={`absolute cursor-pointer hover:bg-yellow-400/20 rounded-lg border-2 transition-all flex items-end justify-center pb-1 ${debugHotspots ? 'border-red-500 bg-red-500/30 hover:bg-red-500/30' : 'border-transparent hover:border-yellow-400/50'
                }`}
              style={{ left: '46%', top: '18%', width: '18%', height: '22%' }}
              onClick={openDorms}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity">
                DORMS
              </span>
            </div>

            {/* ── HOTSPOT: MARKET (50/30/20 game) ── */}
            <div
              className={`absolute cursor-pointer hover:bg-yellow-400/20 rounded-lg border-2 transition-all flex items-end justify-center pb-1 ${debugHotspots ? 'border-red-500 bg-red-500/30 hover:bg-red-500/30' : 'border-transparent hover:border-yellow-400/50'
                }`}
              style={{ left: '8%', top: '28%', width: '26%', height: '28%' }}
              onClick={() => {
                setPreviousModal('budgeting-city');
                setModal('market');
              }}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity">
                MARKET
              </span>
            </div>

            {/* ── HOTSPOT: UNIV. CAFÉ ── */}
            <div
              className={`absolute cursor-pointer hover:bg-yellow-400/20 rounded-lg border-2 transition-all flex items-end justify-center pb-1 ${debugHotspots ? 'border-red-500 bg-red-500/30 hover:bg-red-500/30' : 'border-transparent hover:border-yellow-400/50'
                }`}
              style={{ left: '52%', top: '40%', width: '22%', height: '26%' }}
              onClick={openCafe}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity">
                UNIV. CAFÉ
              </span>
            </div>

            {/* ── HOTSPOT: CITY HALL (quiz) ── */}
            <div
              className={`absolute cursor-pointer hover:bg-yellow-400/20 rounded-lg border-2 transition-all flex items-end justify-center pb-1 ${debugHotspots ? 'border-red-500 bg-red-500/30 hover:bg-red-500/30' : 'border-transparent hover:border-yellow-400/50'
                }`}
              style={{ left: '52%', top: '4%', width: '22%', height: '18%' }}
              onClick={openQuiz}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity">
                CITY HALL
              </span>
            </div>

            {/* ── HOTSPOT: ARCADE (Budget Tetris) ── */}
            <div
              className="absolute cursor-pointer hover:bg-yellow-400/20 rounded-lg border-2 border-transparent hover:border-yellow-400/50 transition-all flex items-end justify-center pb-1"
              style={{ left: '25%', top: '55%', width: '15%', height: '18%' }}
              onClick={() => {
                setPreviousModal('budgeting-city');
                setModal('tetris');
              }}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity">
                ARCADE
              </span>
            </div>

            {/* ── Mini HUD inside submap ── */}
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
              <div className="border-2 border-[#1a1a1a] bg-[rgba(10,10,10,0.80)] px-3 py-2 rounded font-pixel text-[9px] text-gold space-y-0.5">
                <div>{state.avatar.emoji} {state.username || 'ADVENTURER'}</div>
                <div>🪙 {(state.gold ?? 0).toLocaleString('en-IN')} · LV.{state.level}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          QUEST MODALS — rendered above budgeting city (z-[250])
          Back button returns to budgeting city submap
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Modal: Dorms (AI scenario) */}
      {modal === 'dorms' && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-[250] p-4"
          onClick={() => { setModal(previousModal); setPreviousModal(null); }}
        >
          <div
            className="bg-[var(--dark2)] border-2 border-[var(--panel-border)] rounded max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-[var(--panel-border)]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setModal(previousModal); setPreviousModal(null); }}
                  className="font-pixel text-[9px] text-[var(--text-muted)] hover:text-gold transition-colors"
                >
                  ← City
                </button>
                <span className="font-pixel text-gold">🏠 Dorms — Financial Dilemma</span>
              </div>
              <button
                onClick={() => { setModal(previousModal); setPreviousModal(null); }}
                className="text-[var(--text-muted)] hover:text-red-500 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="font-pixel text-gold text-xs mb-2">
                  {dormScenario?.character ?? 'Roommate Rahul'}:
                </div>
                <p className="text-[var(--text)] text-sm leading-relaxed">
                  {dormScenario?.situation ?? 'Loading scenario...'}
                </p>
                <div className="font-pixel text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 rounded px-3 py-2 mt-3">
                  [DECISION REQUIRED: With {state.financialProfile.riskTolerance} risk tolerance, pick the choice that protects long-term cash flow.]
                </div>
              </div>
              <div className="grid gap-3">
                {dormScenario?.choices?.map((choice, i) => {
                  const selected = selectedChoice === i;
                  const disabled = selectedChoice !== null && !selected;
                  return (
                    <button
                      key={i}
                      disabled={disabled}
                      onClick={() => dormChoice(i)}
                      className={`text-left p-4 rounded border transition-colors flex justify-between items-center ${selected
                        ? 'border-green-500/60 bg-green-500/10'
                        : disabled
                          ? 'border-white/10 bg-white/5 opacity-60 cursor-not-allowed'
                          : 'border-white/15 hover:border-gold bg-white/5'
                        }`}
                    >
                      <span className="font-pixel text-gold text-xs">{choice}</span>
                      <span className="text-sm text-[var(--text-muted)]">
                        −₹{(dormScenario.costs[i] ?? 0).toLocaleString('en-IN')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {dormOutcome && selectedChoice !== null && (
                <div className="bg-green/10 border border-green/30 rounded p-4 mt-4">
                  <div className="font-pixel text-[var(--green-light)] text-xs mb-2">
                    ✅ {dormOutcome.title}
                  </div>
                  <p className="text-sm text-[var(--text)] mb-4">{dormOutcome.text}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="font-pixel text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded">
                      +{dormOutcome.xp} XP
                    </span>
                    {dormOutcome.gold > 0 && (
                      <span className="font-pixel text-xs bg-gold/20 text-gold px-2 py-1 rounded">
                        +₹{dormOutcome.gold} Gold
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 flex-wrap">
                    <button
                      onClick={() => {
                        const situationSummary = (dormScenario?.situation ?? '').slice(0, 180);
                        const chosenOption = dormScenario?.choices?.[selectedChoice] ?? '';
                        sendTutor(
                          `Scenario: "${situationSummary}". I chose: "${chosenOption}". Was this the best financial decision? What should I consider next time?`,
                        );
                      }}
                      className="font-pixel text-xs bg-green text-white px-3 py-1.5 rounded"
                    >
                      🤖 Ask Penny About This
                    </button>

                    <button
                      onClick={() => {
                        setDormOutcome(null);
                        setSelectedChoice(null);
                        fetchDormScenario();
                      }}
                      className="font-pixel text-xs bg-blue-500/20 text-blue-200 border border-blue-500/40 px-3 py-1.5 rounded"
                    >
                      ♻️ New Scenario
                    </button>

                    <button
                      onClick={() => { setModal(previousModal); setPreviousModal(null); }}
                      className="font-pixel text-xs bg-gold/15 text-gold border border-gold/30 px-3 py-1.5 rounded"
                    >
                      ← Back to Budgeting City
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: BudgetGame (Market) */}
      {modal === 'market' && (
        <BudgetGame
          onClose={() => { setModal(previousModal); setPreviousModal(null); }}
          onComplete={(score, xpEarned, goldEarned) => {
            setState((s) => ({
              ...s,
              totalXp: s.totalXp + xpEarned,
              xp: getXpProgress(s.totalXp + xpEarned).xpIntoLevel,
              level: getXpProgress(s.totalXp + xpEarned).level,
              gold: s.gold + goldEarned,
              budgetProgress: Math.min(100, s.budgetProgress + 34),
              perfectBudgetGame: s.perfectBudgetGame || score >= 12,
            }));
            showToast(`+${xpEarned} XP, +₹${goldEarned} earned in the Market! 🛒`);
            markQuestStep('q-budget-basics', 1);
            setModal(previousModal);
            setPreviousModal(null);
          }}
        />
      )}

      {/* Modal: Budget Tetris */}
      {modal === 'tetris' && (
        <BudgetTetris
          onClose={() => { setModal(previousModal); setPreviousModal(null); }}
          monthlyIncome={state.financialProfile.monthlyIncome ?? 15000}
          onGameOver={(finalScore, correctPlacements, totalBlocks) => {
            const xpEarned = correctPlacements; // 1 XP per correct placement
            if (xpEarned > 0) {
              setState((s) => ({
                ...s,
                totalXp: s.totalXp + xpEarned,
                xp: getXpProgress(s.totalXp + xpEarned).xpIntoLevel,
                level: getXpProgress(s.totalXp + xpEarned).level,
                gold: s.gold + xpEarned * 2,
                questsDone: s.questsDone + 1,
                budgetProgress: Math.min(100, s.budgetProgress + 20),
                tetrisCorrect: s.tetrisCorrect + correctPlacements,
              }));
              if (correctPlacements >= 3) {
                markQuestStep('q-tetris', 0);
                markQuestStep('q-tetris', 1);
              }
              showToast(`Game Over! Score: ₹${finalScore} · +${xpEarned} XP`);
            }
          }}
        />
      )}

      {/* Modal: Market — 50/30/20 Budget Game */}
      {modal === 'market' && (
        <BudgetGame
          onClose={() => setModal('budgeting-city')}
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

      {/* Active game: Café — renders above everything including budgeting city */}
      {activeGame === 'cafe' && (
        <CafeGame
          onClose={() => setActiveGame(null)}
          onComplete={(xpEarned) => {
            const resistApprox = Math.max(0, Math.round(xpEarned / 15));
            const xpAdjusted = resistApprox * 15;
            setState((s) => ({
              ...s,
              totalXp: s.totalXp + xpAdjusted,
              xp: getXpProgress(s.totalXp + xpAdjusted).xpIntoLevel,
              level: getXpProgress(s.totalXp + xpAdjusted).level,
              gold: s.gold + Math.floor(xpEarned * 2),
              questsDone: s.questsDone + 1,
              budgetProgress: Math.min(100, s.budgetProgress + 20),
              cafeResists: s.cafeResists + resistApprox,
            }));
            showToast(`+${xpAdjusted} XP earned! ☕`);
          }}
        />
      )}

      {/* Active game: Quiz — renders above everything including budgeting city */}
      {activeGame === 'quiz' && (
        <QuizGame
          onClose={() => setActiveGame(null)}
          onComplete={(result) => {
            const xpAdjusted = result.correct * 50;
            setState((s) => ({
              ...s,
              totalXp: s.totalXp + xpAdjusted,
              xp: getXpProgress(s.totalXp + xpAdjusted).xpIntoLevel,
              level: getXpProgress(s.totalXp + xpAdjusted).level,
              gold: s.gold + result.goldEarned,
              questsDone: s.questsDone + 1,
              budgetProgress: Math.min(100, s.budgetProgress + 10),
              quizCorrect: s.quizCorrect + result.correct,
            }));
            showToast(`🏛️ Quiz complete! +${xpAdjusted} XP`);
          }}
        />
      )}

      {/* ── AI Tutor Panel ── */}
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
            <button
              onClick={() => setTutorOpen(false)}
              className="text-[var(--text-muted)] hover:text-red-500 text-xl"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tutorMessages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded text-sm ${m.role === 'user'
                  ? 'bg-green/10 border border-green/20 ml-6'
                  : 'bg-blue-500/15 border border-blue-500/25'
                  }`}
              >
                <div className="font-pixel text-xs mb-1 opacity-70">
                  {m.role === 'user' ? 'You' : 'Penny 🐱'}
                </div>
                {m.content}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-blue-500/30">
            <div className="flex gap-2 mb-2 flex-wrap">
              {['Why did I overspend?', '50/30/20 rule for ₹15k', 'Rent vs savings?', 'UPI limits'].map((q) => (
                <button
                  key={q}
                  onClick={() => sendTutor(q)}
                  className="font-pixel text-[10px] bg-blue-500/15 text-[var(--blue-light)] border border-blue-500/35 px-2 py-1 rounded"
                >
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

      {/* ── Penny Cat Intro ── */}
      {showPennyIntro && (
        <PennyIntro onClose={() => setShowPennyIntro(false)} />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 font-pixel text-xs bg-[var(--panel)] border border-[var(--panel-border)] text-gold px-6 py-3 rounded z-[500] animate-in fade-in duration-300">
          {toast}
        </div>
      )}
    </div>
  );
}

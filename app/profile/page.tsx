'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { INCOME_OPTIONS, LIVING_OPTIONS, GOAL_OPTIONS, RISK_OPTIONS, STORAGE_KEY as GAME_STORAGE_KEY } from '@/lib/gameState';

const STORAGE_KEY = 'finquest_state';

type FinancialProfile = {
  monthlyIncome: number;
  incomeLabel: string;
  livingSituation: string;
  primaryGoal: string;
  riskTolerance: string;
};

type GameProfileState = {
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
  tokens?: number;
};

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
  const lower = XP_THRESHOLDS[level - 1] ?? 0;
  const upper = XP_THRESHOLDS[level] ?? lower;
  const xpIntoLevel = Math.max(0, totalXp - lower);
  const xpNeeded = Math.max(0, upper - lower);
  const pct = xpNeeded <= 0 ? 100 : Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100));
  return { level, xpIntoLevel, xpNeeded, pct };
}

type BadgeDef = { id: string; icon: string; name: string; description: string };

const ALL_BADGES: BadgeDef[] = [
  { id: 'first_quest', icon: '🎮', name: 'First Quest', description: 'Complete your first quest step set.' },
  { id: 'budget_master', icon: '💰', name: 'Budget Master', description: 'Achieve perfect Budget Game results.' },
  { id: 'tetris_3', icon: '🧱', name: 'Tetris Trainer', description: 'Place correctly enough to earn 10+ Tetris correct placements.' },
  { id: 'tutor_5', icon: '🤖', name: 'Tutor Seeker', description: 'Ask Penny (5+) questions.' },
  { id: 'level_3', icon: '⭐', name: 'Level 3', description: 'Reach Level 3.' },
  { id: 'level_5', icon: '🌟', name: 'Level 5', description: 'Reach Level 5.' },
  { id: 'quiz_ace', icon: '🧠', name: 'Quiz Ace', description: 'Answer 5+ quiz questions correctly.' },
  { id: 'saver', icon: '🏦', name: 'Saver', description: 'Earn 10+ Cafe resist XP.' },
  { id: 'dilemma_5', icon: '⚔️', name: 'Dilemma Starter', description: 'Complete 5+ financial dilemmas.' },
  { id: 'dilemma_best', icon: '🏆', name: 'Best Streak', description: 'Pick the best choice 3 times in a row.' },
  { id: 'streak_3', icon: '🔥', name: 'Streak 3', description: 'Maintain a streak day counter of 3+ (if tracked).' },
  { id: 'completionist', icon: '💎', name: 'Completionist', description: 'Reach 100% budget completion progress.' },
];

function loadState(): GameProfileState {
  const defaults: GameProfileState = {
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
    tokens: 0,
  };

  try {
    if (typeof window === 'undefined') return defaults;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<GameProfileState>;

    return {
      ...defaults,
      ...parsed,
      financialProfile: { ...defaults.financialProfile, ...(parsed.financialProfile ?? {}) },
      earnedBadges: Array.isArray(parsed.earnedBadges) ? parsed.earnedBadges : [],
      totalXp: typeof parsed.totalXp === 'number' ? parsed.totalXp : typeof parsed.xp === 'number' ? parsed.xp : defaults.totalXp,
    };
  } catch {
    return defaults;
  }
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center font-pixel text-gold">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  const backPath = from === 'budgeting_city'
    ? '/game/budgeting_city'
    : from === 'main_game'
      ? '/game/main_game'
      : from === 'game'
        ? '/game'
        : '/game/main_game';

  const [profile, setProfile] = useState<GameProfileState>(() => loadState());
  const [editingProfile, setEditingProfile] = useState(false);
  const [editIncome, setEditIncome] = useState('');
  const [editLiving, setEditLiving] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editRisk, setEditRisk] = useState('');

  useEffect(() => {
    setProfile(loadState());
  }, []);

  const derived = useMemo(() => getXpProgress(profile.totalXp), [profile.totalXp]);
  const effectiveLevel = derived.level;

  const startEditing = () => {
    setEditIncome(profile.financialProfile.incomeLabel);
    setEditLiving(profile.financialProfile.livingSituation);
    setEditGoal(profile.financialProfile.primaryGoal);
    setEditRisk(profile.financialProfile.riskTolerance);
    setEditingProfile(true);
  };

  const saveProfile = () => {
    const incomeOpt = INCOME_OPTIONS.find(o => o.label === editIncome) ?? INCOME_OPTIONS[2];
    const updated: GameProfileState = {
      ...profile,
      financialProfile: {
        monthlyIncome: incomeOpt.monthlyIncome,
        incomeLabel: editIncome,
        livingSituation: editLiving,
        primaryGoal: editGoal,
        riskTolerance: editRisk,
      },
    };
    try {
      localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(updated));
    } catch { /* storage unavailable */ }
    setProfile(updated);
    setEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] to-[#0a1a0a] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(backPath)}
            className="font-pixel text-xs bg-white/10 border border-white/20 text-[var(--text-muted)] px-4 py-2 rounded hover:border-gold/50 hover:text-gold transition-all"
          >
            ← Back to {from === 'budgeting_city' ? 'Budgeting City' : from === 'game' ? 'Game' : 'World Map'}
          </button>
        </div>
        <div className="flex items-start justify-between gap-6 flex-col sm:flex-row">
          <div className="w-full sm:w-[360px]">
            <div className="bg-[rgba(10,20,40,0.70)] border-2 border-[rgba(255,215,0,0.25)] rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded bg-green-800 border-2 border-gray-600 flex items-center justify-center text-3xl">
                  {profile.avatar.emoji}
                </div>
                <div>
                  <div className="font-pixel text-[#FFD700] text-sm uppercase">{profile.username || profile.avatar.name}</div>
                  <div className="font-pixel text-[9px] text-[var(--text-muted)] mt-0.5">Class: {profile.avatar.name}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="font-pixel text-[10px] text-[#FFD700] uppercase">
                  Level {effectiveLevel}
                  <span className="text-[var(--text-muted)] ml-2">
                    ({derived.xpIntoLevel}/{derived.xpNeeded} XP)
                  </span>
                </div>
                <div className="mt-2 h-2 bg-black/40 border border-white/10 rounded overflow-hidden">
                  <div className="h-full bg-gold/80" style={{ width: `${derived.pct}%` }} />
                </div>
                <div className="font-pixel text-[9px] text-[var(--text-muted)] mt-2">
                  Total XP: {profile.totalXp.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-pixel text-[#FFD700] text-[10px] uppercase">Your Financial Profile</div>
                  {!editingProfile && (
                    <button
                      onClick={startEditing}
                      className="font-pixel text-[9px] bg-white/10 border border-white/20 text-[var(--text-muted)] px-2 py-1 rounded hover:border-gold/50 hover:text-gold transition"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingProfile ? (
                  <div className="space-y-3">
                    <div>
                      <label className="font-pixel text-[9px] text-[var(--text-muted)] block mb-1">Monthly Income</label>
                      <select value={editIncome} onChange={e => setEditIncome(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 text-[var(--text)] px-2 py-1.5 rounded text-xs outline-none focus:border-gold">
                        {INCOME_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-pixel text-[9px] text-[var(--text-muted)] block mb-1">Living Situation</label>
                      <select value={editLiving} onChange={e => setEditLiving(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 text-[var(--text)] px-2 py-1.5 rounded text-xs outline-none focus:border-gold">
                        {LIVING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-pixel text-[9px] text-[var(--text-muted)] block mb-1">Primary Goal</label>
                      <select value={editGoal} onChange={e => setEditGoal(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 text-[var(--text)] px-2 py-1.5 rounded text-xs outline-none focus:border-gold">
                        {GOAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-pixel text-[9px] text-[var(--text-muted)] block mb-1">Risk Tolerance</label>
                      <select value={editRisk} onChange={e => setEditRisk(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 text-[var(--text)] px-2 py-1.5 rounded text-xs outline-none focus:border-gold">
                        {RISK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={saveProfile}
                        className="flex-1 font-pixel text-xs bg-gold text-[var(--dark)] py-1.5 rounded hover:-translate-y-0.5 transition">
                        Save
                      </button>
                      <button onClick={() => setEditingProfile(false)}
                        className="flex-1 font-pixel text-xs bg-white/10 border border-white/20 text-[var(--text)] py-1.5 rounded hover:border-red-400/50 hover:text-red-300 transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-[11px]">
                    <div className="font-pixel text-[9px] text-[var(--text-muted)]">Monthly Income</div>
                    <div className="font-pixel text-sm text-[var(--text)]">₹{profile.financialProfile.monthlyIncome.toLocaleString('en-IN')}</div>

                    <div className="font-pixel text-[9px] text-[var(--text-muted)] mt-2">Living Situation</div>
                    <div className="font-pixel text-sm text-[var(--text)]">{profile.financialProfile.livingSituation}</div>

                    <div className="font-pixel text-[9px] text-[var(--text-muted)] mt-2">Primary Goal</div>
                    <div className="font-pixel text-sm text-[var(--text)]">{profile.financialProfile.primaryGoal}</div>

                    <div className="font-pixel text-[9px] text-[var(--text-muted)] mt-2">Risk Tolerance</div>
                    <div className="font-pixel text-sm text-[var(--text)]">{profile.financialProfile.riskTolerance}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="bg-[rgba(5,12,8,0.55)] border-2 border-white/10 rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between gap-4">
                <div className="font-pixel text-[#FFD700] text-xs uppercase">🏅 Badges</div>
                <div className="font-pixel text-[9px] text-[var(--text-muted)]">
                  {profile.earnedBadges.length}/{ALL_BADGES.length} earned
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {ALL_BADGES.map((b) => {
                  const earned = profile.earnedBadges.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      title={`${b.name}: ${b.description}`}
                      className={[
                        'rounded-lg border-2 p-3',
                        'transition-all cursor-default',
                        earned ? 'border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]' : 'border-white/10 bg-white/5 text-[var(--text-muted)] opacity-60 grayscale',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-pixel text-sm">{b.icon}</div>
                        <div className="font-pixel text-[9px]">{earned ? '✓' : '🔒'}</div>
                      </div>
                      <div className="font-pixel text-[9px] text-[var(--text)] mt-2">{b.name}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 text-[11px] text-[var(--text-muted)] font-pixel text-[9px]">
                Tip: hover badges to see their descriptions.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-[var(--text-muted)] text-[10px] font-pixel">
          Progress updates unlock new badges as you play.
        </div>
      </div>
    </div>
  );
}


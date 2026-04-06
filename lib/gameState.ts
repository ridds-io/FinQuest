// Shared game state — single source of truth for all game views.

export const STORAGE_KEY = 'finquest_state';

export const XP_THRESHOLDS = [0, 500, 1200, 2500, 4500, 7500, 11000, 15500, 21000, 28000] as const;

export type FinancialProfile = {
  monthlyIncome: number;
  incomeLabel: string;
  livingSituation: string;
  primaryGoal: string;
  riskTolerance: string;
};

export const AVATARS = [
  { emoji: '📚', name: 'Scholarship Grinder', gold: 500,   stat: 'HIGH' },
  { emoji: '🎒', name: 'Loan Leveraged',       gold: 2000,  stat: '₹12L' },
  { emoji: '💼', name: 'Hustle Economy',        gold: 800,   stat: 'HIGH' },
  { emoji: '💎', name: 'Privilege Stack',        gold: 15000, stat: 'LOW'  },
  { emoji: '🌍', name: 'International Wildcard', gold: 3000,  stat: 'MAX'  },
];

export const INCOME_OPTIONS: Array<{ label: string; monthlyIncome: number }> = [
  { label: 'Under ₹5,000',      monthlyIncome: 2500  },
  { label: '₹5,000-10,000',     monthlyIncome: 7500  },
  { label: '₹10,000-15,000',    monthlyIncome: 12500 },
  { label: '₹15,000-20,000',    monthlyIncome: 17500 },
  { label: 'Above ₹20,000',     monthlyIncome: 25000 },
];

export const LIVING_OPTIONS = ['Living at Home', 'PG/Hostel', 'Rented Flat', 'College Dorms'] as const;
export const GOAL_OPTIONS   = ['Learn to Save', 'Manage Debt', 'Start Investing', 'General Literacy'] as const;
export const RISK_OPTIONS   = ['Conservative', 'Moderate', 'Aggressive'] as const;

export type GameState = {
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
  // Invest City progress
  investScenariosDone: number;
  portfolioBuilds: number;
  sipSessions: number;
  investProgress: number; // 0–100
};

const DEFAULT_FINANCIAL_PROFILE: FinancialProfile = {
  monthlyIncome: 15000,
  incomeLabel: '₹10,000-15,000',
  livingSituation: 'PG/Hostel',
  primaryGoal: 'General Literacy',
  riskTolerance: 'Moderate',
};

const DEFAULT_STATE: GameState = {
  avatar: { emoji: '🎒', name: 'NICK', type: 'Loan Leveraged' },
  username: 'ADVENTURER',
  financialProfile: DEFAULT_FINANCIAL_PROFILE,
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
  // Invest City
  investScenariosDone: 0,
  portfolioBuilds: 0,
  sipSessions: 0,
  investProgress: 0,
};

export function loadState(): GameState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<GameState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      gold: typeof parsed.gold === 'number' ? parsed.gold : DEFAULT_STATE.gold,
      financialProfile: { ...DEFAULT_FINANCIAL_PROFILE, ...(parsed.financialProfile ?? {}) },
      earnedBadges: Array.isArray(parsed.earnedBadges) ? parsed.earnedBadges : [],
      // Migrate: if totalXp is missing, seed it from xp so profile levels don't reset
      totalXp: typeof parsed.totalXp === 'number' ? parsed.totalXp : typeof parsed.xp === 'number' ? parsed.xp : DEFAULT_STATE.totalXp,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* storage full or unavailable */ }
}

export function getLevelFromTotalXp(totalXp: number): number {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (totalXp >= XP_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(10, level);
}

export function getXpProgress(totalXp: number) {
  const level = getLevelFromTotalXp(totalXp);
  const lower = XP_THRESHOLDS[level - 1] ?? 0;
  const upper = XP_THRESHOLDS[level] ?? lower;
  const xpIntoLevel = Math.max(0, totalXp - lower);
  const xpNeeded    = Math.max(0, upper - lower);
  const pct = xpNeeded <= 0 ? 100 : Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100));
  return { level, xpIntoLevel, xpNeeded, pct };
}

/** Returns the updated earnedBadges array after checking all badge conditions. */
export function checkBadges(state: GameState): string[] {
  const earned = new Set(state.earnedBadges ?? []);
  const level  = getLevelFromTotalXp(state.totalXp ?? state.xp);

  if ((state.questsDone ?? 0) >= 1)              earned.add('first_quest');
  if (state.perfectBudgetGame)                   earned.add('budget_master');
  if ((state.tetrisCorrect ?? 0) >= 10)          earned.add('tetris_3');
  if ((state.tutorQuestions ?? 0) >= 5)          earned.add('tutor_5');
  if (level >= 3)                                earned.add('level_3');
  if (level >= 5)                                earned.add('level_5');
  if ((state.quizCorrect ?? 0) >= 5)             earned.add('quiz_ace');
  if ((state.cafeResists ?? 0) >= 10)            earned.add('saver');
  if ((state.dilemmasCompleted ?? 0) >= 5)       earned.add('dilemma_5');
  if ((state.consecutiveBest ?? 0) >= 3)         earned.add('dilemma_best');
  if ((state.streak_days ?? 0) >= 3)             earned.add('streak_3');
  if ((state.budgetProgress ?? 0) >= 100)        earned.add('completionist');

  return Array.from(earned);
}

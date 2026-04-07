'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  QuestSidebar,
  QUEST_DEFINITIONS,
  INITIAL_TIPS,
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
import { PennyAssistant } from '@/components/PennyAssistant';

// ── Lazy-load games (no SSR) ──────────────────────────────────────────────────
const LoanScenarioGame = dynamic(
  () => import('@/components/loan/LoanScenarioGame').then((m) => m.LoanScenarioGame),
  { ssr: false },
);
const EMIAffordabilityGame = dynamic(
  () => import('@/components/loan/EMIAffordabilityGame').then((m) => m.EMIAffordabilityGame),
  { ssr: false },
);
const DebtClassifierGame = dynamic(
  () => import('@/components/loan/DebtClassifierGame').then((m) => m.DebtClassifierGame),
  { ssr: false },
);

type ActiveGame = null | 'decision' | 'emi' | 'classifier';

export default function LoanCityView() {
  const router = useRouter();
  const [state, setState] = useState<GameState>(loadState);
  const [sidebarEntries, setSidebarEntries] = useState<SidebarEntry[]>(() =>
    applyQuestSteps([...QUEST_DEFINITIONS, ...INITIAL_TIPS], loadQuestSteps())
  );
  const [toast, setToast] = useState('');
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [pennyOpen, setPennyOpen] = useState(false);

  const persist = useCallback(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    persist();
  }, [state, persist]);

  useEffect(() => { saveQuestSteps(sidebarEntries); }, [sidebarEntries]);

  useEffect(() => {
    const seen = localStorage.getItem('finquest_penny_seen_loan') === 'true';
    if (!seen) {
      setTimeout(() => setPennyOpen(true), 1500);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const handleGameComplete = useCallback(
    (xp: number, gold: number, gameKey: ActiveGame) => {
      setState((s) => {
        const newTotalXp = (s.totalXp ?? s.xp) + xp;
        const updated: GameState = {
          ...s,
          xp: (s.xp ?? 0) + xp,
          totalXp: newTotalXp,
          gold: (s.gold ?? 0) + gold,
          questsDone: (s.questsDone ?? 0) + 1,
          loanProgress: Math.min(100, (s.loanProgress ?? 0) + 20),
          loanScenariosDone: gameKey === 'decision' ? (s.loanScenariosDone ?? 0) + 1 : s.loanScenariosDone ?? 0,
          emiChallengesDone: gameKey === 'emi' ? (s.emiChallengesDone ?? 0) + 1 : s.emiChallengesDone ?? 0,
          debtClassificationsDone: gameKey === 'classifier' ? (s.debtClassificationsDone ?? 0) + 1 : s.debtClassificationsDone ?? 0,
        };
        updated.earnedBadges = checkBadges(updated);
        return updated;
      });
      showToast(`+${xp} XP · +₹${gold} Gold 🎉`);
    },
    [showToast]
  );

  const { pct: xpPct } = getXpProgress(state.totalXp ?? state.xp);

  const GAMES: Array<{
    key: ActiveGame;
    label: string;
    emoji: string;
    description: string;
    style: React.CSSProperties;
    borderHover: string;
  }> = [
    {
      key: 'decision',
      label: 'Debt Decision',
      emoji: '⚖️',
      description: 'Good vs Bad Debt',
      style: { left: '7%', top: '15%', width: '24%', height: '43%' },
      borderHover: 'hover:border-blue-400/50',
    },
    {
      key: 'emi',
      label: 'EMI Challenge',
      emoji: '📊',
      description: 'Is it affordable?',
      style: { left: '35%', top: '28%', width: '33%', height: '52%' },
      borderHover: 'hover:border-yellow-400/50',
    },
    {
      key: 'classifier',
      label: 'Debt Classifier',
      emoji: '🔍',
      description: 'Productive vs Wasteful',
      style: { left: '67%', top: '8%', width: '27%', height: '76%' },
      borderHover: 'hover:border-green-400/50',
    },
  ];

  return (
    <div className="fixed inset-0 flex flex-col bg-[#16213e] overflow-hidden">
      <div className="flex-1 flex min-h-0">
        <QuestSidebar
          entries={sidebarEntries}
          tutorTips={[]}
          questsDone={0}
          onAskTutor={() => {}}
        />
        <main className="flex-1 relative min-h-[500px] bg-[#1a1a2e] overflow-hidden">
          <div className="relative w-full h-full">
            <img
              src="/map/loan-city.png"
              alt="Loan City"
              className="absolute w-full h-full object-cover select-none z-0"
              draggable={false}
              style={{ imageRendering: 'pixelated' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            
            {/* BACK BUTTON */}
            <button
              onClick={() => router.push('/game/main_game')}
              className="absolute top-4 left-4 font-pixel text-xs bg-black/70 border border-gold/40 text-gold px-3 py-2 rounded z-30 hover:bg-black/90 cursor-pointer pointer-events-auto"
            >
              ← BACK TO WORLD
            </button>

            {/* INTERACTIVE HOTSPOTS */}
            {GAMES.map((g) => (
              <div
                key={g.key}
                className={`absolute cursor-pointer rounded-xl border-2 border-transparent ${g.borderHover} hover:bg-white/5 transition-all duration-200 flex flex-col items-center justify-end pb-3 z-10 group`}
                style={g.style}
                onClick={() => setActiveGame(g.key)}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/80 rounded-lg px-2 py-1.5 text-center backdrop-blur-sm pointer-events-none">
                  <div className="text-lg mb-0.5">{g.emoji}</div>
                  <div className="font-pixel text-[8px] text-white leading-tight uppercase">{g.label}</div>
                  <div className="font-pixel text-[7px] text-[var(--text-muted)]">{g.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute top-4 left-4 pointer-events-none">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(20,20,20,0.85)] rounded-lg p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <div className="w-12 h-12 bg-blue-900 border-2 border-gray-600 rounded flex items-center justify-center text-2xl">{state.avatar.emoji}</div>
                <div>
                  <div className="font-pixel text-[9px] text-[var(--text)] uppercase mb-1">{state.username}, LV.{state.level ?? 1}</div>
                  <div className="flex gap-1 mb-1">
                    {Array.from({ length: 10 }).map((_, i) => <span key={i}>{((state.hp ?? 80) / 10) > i ? '❤️' : '🖤'}</span>)}
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => <span key={i}>{(xpPct / 10) > i ? '💎' : '◇'}</span>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="font-pixel text-2xl text-white" style={{ textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                Loan City
              </div>
            </div>

            <div className="absolute top-4 right-4 pointer-events-auto">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-pixel text-[9px] text-[#FFD700] uppercase space-y-1">
                <div>🪙 {(state.gold ?? 0).toLocaleString('en-IN')}</div>
                <div>📊 {state.loanProgress ?? 0}% progress</div>
                <button onClick={() => router.push('/profile?from=loan_city')} className="mt-1 w-full font-pixel text-xs bg-white/10 border border-white/20 text-[var(--text)] px-3 py-1.5 rounded hover:border-gold/50 hover:text-gold transition-all">
                  👤 Profile
                </button>
              </div>
            </div>

            <div className="absolute top-28 right-4 z-20 pointer-events-none">
              <button
                onClick={() => setPennyOpen(true)}
                className="border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 pointer-events-auto hover:shadow-none hover:translate-y-[4px] transition-all"
              >
                <span>🐱</span>
                <span className="font-pixel text-[9px] text-green-400">PENNY</span>
              </button>
            </div>
            
            <div className="absolute bottom-4 left-4 pointer-events-auto">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(20,20,20,0.85)] rounded-lg p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="font-pixel text-[10px] text-blue-400 mb-1">CITY STATS</div>
                <div className="font-pixel text-[8px] text-white">Interest Rates: 8.5% - 14%</div>
                <div className="font-pixel text-[8px] text-white">Avg. Credit Score: 720</div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ACTIVE GAMES */}
      {activeGame === 'decision' && (
        <LoanScenarioGame
          onClose={() => setActiveGame(null)}
          onComplete={(xp, gold) => handleGameComplete(xp, gold, 'decision')}
        />
      )}

      {activeGame === 'emi' && (
        <EMIAffordabilityGame
          onClose={() => setActiveGame(null)}
          onComplete={(xp, gold) => handleGameComplete(xp, gold, 'emi')}
        />
      )}

      {activeGame === 'classifier' && (
        <DebtClassifierGame
          onClose={() => setActiveGame(null)}
          onComplete={(xp, gold) => handleGameComplete(xp, gold, 'classifier')}
        />
      )}

      <PennyAssistant
        scene="loan"
        isOpen={pennyOpen}
        onClose={() => setPennyOpen(false)}
      />

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 font-pixel text-xs bg-[var(--panel)] border border-[var(--panel-border)] text-gold px-6 py-3 rounded z-[500] animate-in fade-in duration-300">
          {toast}
        </div>
      )}
    </div>
  );
}

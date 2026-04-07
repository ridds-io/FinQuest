'use client';

import { useEffect, useState, useCallback } from 'react';
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

export default function LoanCityView() {
  const router = useRouter();
  const [state, setState] = useState<GameState>(loadState);
  const [sidebarEntries, setSidebarEntries] = useState<SidebarEntry[]>(() =>
    applyQuestSteps([...QUEST_DEFINITIONS, ...INITIAL_TIPS], loadQuestSteps())
  );
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<string | null>(null);
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

            {/* DEBT DECISION (Left building) */}
            <div
              className="absolute cursor-pointer hover:-translate-y-1 rounded-lg border-2 border-transparent hover:border-blue-400/50 transition-all flex items-end justify-center pb-1 z-10"
              style={{ left: '7%', top: '15%', width: '24%', height: '43%' }}
              onClick={() => showToast('⚖️ Debt Decision: Choose the right loan structure.')}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">DEBT DECISION</span>
            </div>

            {/* EMI AFFORDABILITY CHALLENGE (Center complex) */}
            <div
              className="absolute cursor-pointer hover:-translate-y-1 rounded-lg border-2 border-transparent hover:border-yellow-400/50 transition-all flex items-end justify-center pb-1 z-10"
              style={{ left: '35%', top: '28%', width: '33%', height: '52%' }}
              onClick={() => showToast('📊 EMI Affordability Challenge: Can you handle the monthly payments?')}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">EMI CHALLENGE</span>
            </div>

            {/* GROWTH THINKING (Right building) */}
            <div
              className="absolute cursor-pointer hover:-translate-y-1 rounded-lg border-2 border-transparent hover:border-green-400/50 transition-all flex items-end justify-center pb-1 z-10"
              style={{ left: '67%', top: '8%', width: '27%', height: '76%' }}
              onClick={() => showToast('🚀 Growth Thinking: Using loans to leverage your future.')}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">GROWTH THINKING</span>
            </div>
          </div>

          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute top-4 left-4 pointer-events-none">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(20,20,20,0.85)] rounded-lg p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <div className="w-12 h-12 bg-blue-900 border-2 border-gray-600 rounded flex items-center justify-center text-2xl">{state.avatar.emoji}</div>
                <div>
                  <div className="font-pixel text-[9px] text-[var(--text)] uppercase mb-1">{state.username}, LV.{state.level ?? 1}</div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => <span key={i}>{((state.hp ?? 80) / 10) > i ? '❤️' : '🖤'}</span>)}
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
                <div>📊 {state.questsDone ?? 0} quests</div>
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

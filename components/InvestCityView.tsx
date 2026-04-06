'use client';

import { useEffect, useState, useCallback } from 'react';
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

export default function InvestCityView() {
  const router = useRouter();
  const [state, setState] = useState<GameState>(loadState);
  const [sidebarEntries, setSidebarEntries] = useState<SidebarEntry[]>(() =>
    applyQuestSteps([...QUEST_DEFINITIONS, ...INITIAL_TIPS], loadQuestSteps())
  );
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<string | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: string; content: string }>>([
    { role: 'ai', content: "Namaste! I'm Penny, your financial guide here in Investment City. What would you like to explore first?" },
  ]);
  const [tutorInput, setTutorInput] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorTips, setTutorTips] = useState<string[]>([]);

  const persist = useCallback(() => { saveState(state); }, [state]);
  useEffect(() => { persist(); }, [state, persist]);
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

  const sendTutor = useCallback(async (prefill?: string, mode: 'tutor' | 'dilemma_feedback' = 'tutor') => {
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
          mode,
          history: tutorMessages.slice(-6).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        }),
      });
      const data = await res.json();
      const reply: string = data.question || "I couldn't connect. Try again!";
      setTutorMessages((m) => [...m, { role: 'ai', content: reply }]);
      addTutorToSidebar(reply);
      const tip = extractTip(reply);
      if (tip) setTutorTips((prev) => [...prev.slice(-9), tip]);
    } catch {
      setTutorMessages((m) => [...m, { role: 'ai', content: "I couldn't connect. What do you think the answer might be?" }]);
    }
    setTutorLoading(false);
  }, [tutorInput, tutorLoading, tutorMessages, state, addTutorToSidebar, extractTip]);

  const awardXpAndGold = (amount: number, source: string) => {
     setState((s) => {
        const newTotalXp = (s.totalXp ?? s.xp) + amount;
        const updated: GameState = {
           ...s,
           xp: s.xp + amount,
           totalXp: newTotalXp,
           gold: s.gold + amount,
        };
        updated.earnedBadges = checkBadges(updated);
        return updated;
     });
     showToast(`+${amount} XP | +₹${amount} Gold from ${source}! 🎉`);
     setModal(null);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#16213e] overflow-hidden">
      <div className="flex-1 flex min-h-0">
        <QuestSidebar
          entries={sidebarEntries}
          tutorTips={tutorTips}
          questsDone={sidebarEntries.filter((e) => e.kind === 'quest' && e.steps.every((s) => s.done)).length}
          onAskTutor={(q) => sendTutor(q)}
        />
        <main className="flex-1 relative min-h-[500px] bg-[#10243e] overflow-hidden">
          <div className="relative w-full h-full">
            <img
              src="/map/invest-city.png"
              alt="Invest City"
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

            {/* Placeholder Hotspots */}
            <div
              className="absolute cursor-pointer hover:-translate-y-1 rounded-lg border-2 border-transparent hover:border-blue-400/50 transition-all flex items-end justify-center pb-1 z-10"
              style={{ left: '10%', top: '30%', width: '20%', height: '30%' }}
              onClick={() => setModal('stocks')}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">STOCK MARKET</span>
            </div>

            <div
              className="absolute cursor-pointer hover:-translate-y-1 rounded-lg border-2 border-transparent hover:border-green-400/50 transition-all flex items-end justify-center pb-1 z-10"
              style={{ left: '40%', top: '40%', width: '25%', height: '35%' }}
              onClick={() => setModal('mutual_funds')}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">MUTUAL FUNDS</span>
            </div>

            <div
              className="absolute cursor-pointer hover:-translate-y-1 rounded-lg border-2 border-transparent hover:border-red-400/50 transition-all flex items-end justify-center pb-1 z-10"
              style={{ left: '70%', top: '25%', width: '22%', height: '28%' }}
              onClick={() => setModal('real_estate')}
            >
              <span className="font-pixel text-[8px] text-white bg-black/70 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100">REAL ESTATE</span>
            </div>
          </div>

          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="font-pixel text-2xl text-white" style={{ textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                Investment City
              </div>
            </div>

            <div className="absolute top-4 right-4 pointer-events-auto">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-pixel text-[9px] text-[#FFD700] uppercase space-y-1">
                <div>🪙 {(state.gold ?? 0).toLocaleString('en-IN')}</div>
                <div>💎 {state.gems ?? 0} tokens</div>
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
          </div>
        </main>
      </div>

       {/* Modals for Games */}
      {modal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[200] p-4" onClick={() => setModal(null)}>
          <div className="bg-[var(--dark2)] border-2 border-[var(--panel-border)] rounded max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-[var(--panel-border)]">
              <span className="font-pixel text-gold">
                   {modal === 'stocks' && '📈 Stock Market Simulator'}
                   {modal === 'mutual_funds' && '🏦 Mutual Funds Demo'}
                   {modal === 'real_estate' && '🏘️ Real Estate Investment'}
              </span>
              <button onClick={() => setModal(null)} className="text-[var(--text-muted)] hover:text-red-500 text-xl">✕</button>
            </div>
            <div className="p-6">
                <p className="text-[var(--text)] mb-6 text-sm">
                   Welcome to the {modal.replace('_', ' ')} center. This mini-game is currently under construction. Come back later to multiply your wealth!
                </p>
                <button
                   onClick={() => awardXpAndGold(50, modal.replace('_', ' '))}
                   className="font-pixel text-xs bg-gold text-black px-4 py-2 rounded hover:translate-y-[-2px] transition-transform"
                >
                   Collect 50 XP (Early Investor Bonus)
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutor Panel */}
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
              {['What is a stock?', 'Are mutual funds safe?', 'Should I invest in real estate?'].map((q) => (
                <button key={q} onClick={() => sendTutor(q)} className="font-pixel text-[10px] bg-blue-500/15 text-[var(--blue-light)] border border-blue-500/35 px-2 py-1 rounded">{q}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tutorInput}
                onChange={(e) => setTutorInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendTutor()}
                placeholder="Ask about investments..."
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

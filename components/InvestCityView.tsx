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

// ── Lazy-load games (no SSR) ──────────────────────────────────────────────────
const InvestScenarioGame = dynamic(
  () => import('@/components/invest/InvestScenarioGame').then((m) => m.InvestScenarioGame),
  { ssr: false },
);
const PortfolioBuilder = dynamic(
  () => import('@/components/invest/PortfolioBuilder').then((m) => m.PortfolioBuilder),
  { ssr: false },
);
const SipSimulator = dynamic(
  () => import('@/components/invest/SipSimulator').then((m) => m.SipSimulator),
  { ssr: false },
);

type ActiveGame = null | 'scenario' | 'portfolio' | 'sip';

// ─────────────────────────────────────────────────────────────────────────────

export default function InvestCityView() {
  const router = useRouter();
  const [state, setState] = useState<GameState>(loadState);
  const [sidebarEntries, setSidebarEntries] = useState<SidebarEntry[]>(() =>
    applyQuestSteps([...QUEST_DEFINITIONS, ...INITIAL_TIPS], loadQuestSteps()),
  );
  const [toast, setToast] = useState('');
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: 'ai',
      content:
        "Namaste! I'm Penny, your investment guide. Ready to explore stocks, portfolios, and SIPs? Ask me anything!",
    },
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

  const sendTutor = useCallback(
    async (prefill?: string) => {
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
            mode: 'tutor',
            history: tutorMessages
              .slice(-6)
              .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
          }),
        });
        const data = await res.json();
        const reply: string = data.question || "I couldn't connect. Try again!";
        setTutorMessages((m) => [...m, { role: 'ai', content: reply }]);
        addTutorToSidebar(reply);
        const tip = extractTip(reply);
        if (tip) setTutorTips((prev) => [...prev.slice(-9), tip]);
      } catch {
        setTutorMessages((m) => [
          ...m,
          { role: 'ai', content: "I couldn't connect. What do you think the answer might be?" },
        ]);
      }
      setTutorLoading(false);
    },
    [tutorInput, tutorLoading, tutorMessages, state, addTutorToSidebar, extractTip],
  );

  // Shared onComplete handler — receives XP + Gold from any game
  const handleGameComplete = useCallback(
    (xp: number, gold: number, gameKey: 'scenario' | 'portfolio' | 'sip') => {
      setState((s) => {
        const newTotalXp = (s.totalXp ?? s.xp) + xp;
        const updated: GameState = {
          ...s,
          xp: s.xp + xp,
          totalXp: newTotalXp,
          gold: s.gold + gold,
          questsDone: s.questsDone + 1,
          investProgress: Math.min(100, (s.investProgress ?? 0) + 20),
          investScenariosDone: gameKey === 'scenario' ? (s.investScenariosDone ?? 0) + 1 : s.investScenariosDone ?? 0,
          portfolioBuilds: gameKey === 'portfolio' ? (s.portfolioBuilds ?? 0) + 1 : s.portfolioBuilds ?? 0,
          sipSessions: gameKey === 'sip' ? (s.sipSessions ?? 0) + 1 : s.sipSessions ?? 0,
        };
        updated.earnedBadges = checkBadges(updated);
        return updated;
      });
      showToast(`+${xp} XP · +₹${gold} Gold 🎉`);
    },
    [showToast],
  );

  const { pct: xpPct } = getXpProgress(state.totalXp ?? state.xp);

  // ─── Game cards config (drives hotspot positions + label) ──────────────────
  const GAMES: Array<{
    key: ActiveGame;
    label: string;
    emoji: string;
    description: string;
    style: React.CSSProperties;
    borderHover: string;
  }> = [
    {
      key: 'scenario',
      label: 'Stock Market',
      emoji: '📈',
      description: 'Scenario dilemmas',
      style: { left: '6%', top: '28%', width: '22%', height: '32%' },
      borderHover: 'hover:border-blue-400/60',
    },
    {
      key: 'portfolio',
      label: 'Portfolio Builder',
      emoji: '🏗️',
      description: 'Allocate & simulate',
      style: { left: '37%', top: '38%', width: '26%', height: '36%' },
      borderHover: 'hover:border-green-400/60',
    },
    {
      key: 'sip',
      label: 'SIP Simulator',
      emoji: '📅',
      description: '12-month SIP run',
      style: { left: '68%', top: '22%', width: '24%', height: '30%' },
      borderHover: 'hover:border-yellow-400/60',
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col bg-[#16213e] overflow-hidden">
      <div className="flex-1 flex min-h-0">
        <QuestSidebar
          entries={sidebarEntries}
          tutorTips={tutorTips}
          questsDone={sidebarEntries.filter((e) => e.kind === 'quest' && e.steps.every((s) => s.done)).length}
          onAskTutor={(q) => sendTutor(q)}
        />

        <main className="flex-1 relative min-h-[500px] bg-[#0d1b3e] overflow-hidden">
          {/* Background map */}
          <div className="relative w-full h-full">
            <img
              src="/map/invest-city.png"
              alt="Investment City"
              className="absolute w-full h-full object-cover select-none z-0"
              draggable={false}
              style={{ imageRendering: 'pixelated' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />

            {/* Back button */}
            <button
              onClick={() => router.push('/game/main_game')}
              className="absolute top-4 left-4 font-pixel text-xs bg-black/70 border border-gold/40 text-gold px-3 py-2 rounded z-30 hover:bg-black/90 cursor-pointer pointer-events-auto"
            >
              ← BACK
            </button>

            {/* ── Interactive Hotspots ─────────────────────────────────────── */}
            {GAMES.map((g) => (
              <div
                key={g.key}
                className={`absolute cursor-pointer rounded-xl border-2 border-transparent ${g.borderHover} hover:bg-white/5 transition-all duration-200 flex flex-col items-center justify-end pb-3 z-10 group`}
                style={g.style}
                onClick={() => setActiveGame(g.key)}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/80 rounded-lg px-2 py-1.5 text-center backdrop-blur-sm">
                  <div className="text-lg mb-0.5">{g.emoji}</div>
                  <div className="font-pixel text-[8px] text-white leading-tight">{g.label}</div>
                  <div className="font-pixel text-[7px] text-[var(--text-muted)]">{g.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── HUD overlay ───────────────────────────────────────────────── */}
          <div className="absolute inset-0 pointer-events-none z-20">
            {/* Title */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div
                className="font-pixel text-2xl text-white"
                style={{ textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
              >
                Investment City
              </div>
            </div>

            {/* Player HUD — top-left */}
            <div className="absolute top-4 left-4 pointer-events-none">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(20,20,20,0.85)] rounded-lg p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                <div className="w-12 h-12 bg-blue-900 border-2 border-blue-600 rounded flex items-center justify-center text-2xl">
                  {state.avatar.emoji}
                </div>
                <div>
                  <div className="font-pixel text-[9px] text-[var(--text)] uppercase mb-1">
                    {state.username}, LV.{state.level ?? 1}
                  </div>
                  <div className="flex gap-1 mb-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span key={i}>{((state.hp ?? 80) / 10) > i ? '❤️' : '🖤'}</span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span key={i}>{(xpPct / 10) > i ? '💎' : '◇'}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats — top-right */}
            <div className="absolute top-4 right-4 pointer-events-auto">
              <div className="border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-pixel text-[9px] text-[#FFD700] uppercase space-y-1">
                <div>🪙 {(state.gold ?? 0).toLocaleString('en-IN')}</div>
                <div>💎 {state.gems ?? 0} tokens</div>
                <div>📊 {state.investProgress ?? 0}% invest</div>
              </div>
            </div>

            {/* Penny — AI Tutor button */}
            <div className="absolute top-28 right-4 z-20 pointer-events-none">
              <button
                onClick={() => setTutorOpen(true)}
                className="border-4 border-[#1a1a1a] bg-[rgba(10,10,10,0.85)] px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 pointer-events-auto hover:shadow-none hover:translate-y-[4px] transition-all"
              >
                <span>🐱</span>
                <span className="font-pixel text-[9px] text-green-400">PENNY</span>
              </button>
            </div>

            {/* Bottom game launcher buttons */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
              <div className="flex gap-3">
                {GAMES.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => setActiveGame(g.key)}
                    className="flex flex-col items-center gap-1 border-2 border-[#1a1a1a] bg-[rgba(10,10,10,0.9)] px-4 py-2.5 shadow-[3px_3px_0_rgba(0,0,0,1)] font-pixel text-[8px] text-[var(--text-muted)] hover:bg-[rgba(255,215,0,0.12)] hover:text-[#FFD700] hover:shadow-none hover:translate-y-[3px] transition-all rounded"
                  >
                    <span className="text-base">{g.emoji}</span>
                    <span className="uppercase leading-tight text-center">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Active Games ──────────────────────────────────────────────────── */}
      {activeGame === 'scenario' && (
        <InvestScenarioGame
          onClose={() => setActiveGame(null)}
          onComplete={(xp, gold) => handleGameComplete(xp, gold, 'scenario')}
        />
      )}

      {activeGame === 'portfolio' && (
        <PortfolioBuilder
          onClose={() => setActiveGame(null)}
          onComplete={(xp, gold) => handleGameComplete(xp, gold, 'portfolio')}
        />
      )}

      {activeGame === 'sip' && (
        <SipSimulator
          onClose={() => setActiveGame(null)}
          onComplete={(xp, gold) => handleGameComplete(xp, gold, 'sip')}
        />
      )}

      {/* ── AI Tutor Panel ────────────────────────────────────────────────── */}
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
                <div className="text-xs text-[var(--text-muted)]">Finance Cat · Investment Guide</div>
              </div>
            </div>
            <button onClick={() => setTutorOpen(false)} className="text-[var(--text-muted)] hover:text-red-500 text-xl">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tutorMessages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded text-sm ${m.role === 'user' ? 'bg-green/10 border border-green/20 ml-6' : 'bg-blue-500/15 border border-blue-500/25'}`}
              >
                <div className="font-pixel text-xs mb-1 opacity-70">{m.role === 'user' ? 'You' : 'Penny'}</div>
                {m.content}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-blue-500/30">
            <div className="flex gap-2 mb-2 flex-wrap">
              {[
                'What is an index fund?',
                'How does SIP compounding work?',
                'Is crypto a good investment?',
                'What is diversification?',
              ].map((q) => (
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

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 font-pixel text-xs bg-[var(--panel)] border border-[var(--panel-border)] text-gold px-6 py-3 rounded z-[500] animate-in fade-in duration-300">
          {toast}
        </div>
      )}
    </div>
  );
}

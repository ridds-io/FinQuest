'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false });

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

export default function GameView() {
  const [screen, setScreen] = useState<'avatar' | 'game'>('avatar');
  const [state, setState] = useState(loadState);
  const [chatLog, setChatLog] = useState<Array<{ type: string; text: string }>>([
    { type: 'quest', text: 'Learn to Budget! (0/3 tips)' },
    { type: 'tip', text: 'Track every expense.' },
    { type: 'ai', text: 'Click a building to start a module!' },
  ]);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<string | null>(null);
  const [dormScenario, setDormScenario] = useState<{
    situation: string;
    choices: string[];
    costs: number[];
    outcomes: Array<{ xp?: number; gold?: number; debt?: number }>;
  } | null>(null);
  const [dormOutcome, setDormOutcome] = useState<{ title: string; text: string; xp: number; gold: number } | null>(null);
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

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const addChat = useCallback((type: string, text: string) => {
    setChatLog((prev) => [...prev.slice(-19), { type, text }]);
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
    addChat('quest', `You are ${state.avatar.name} — ${state.avatar.type}. Start your adventure!`);
    addChat('tip', 'Click Budgeting City to begin your first module!');
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
      text: 'You made a choice. Consider asking the AI Tutor why this matters for your budget!',
      xp,
      gold: out.gold ?? 0,
    });
    showToast(`+${xp} XP earned! 🎉`);
    addChat('ai', 'Ask the AI Tutor: "Why is it risky to let my roommate delay UPI payment?"');
  };

  const sendTutor = async (prefill?: string) => {
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
          },
        }),
      });
      const data = await res.json();
      const reply = data.question || 'I couldn’t connect. Try again!';
      setTutorMessages((m) => [...m, { role: 'ai', content: reply }]);
      addChat('ai', reply.substring(0, 60) + '...');
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
    <div className="min-h-screen flex flex-col bg-[#16213e]">
      {/* HUD */}
      <header className="sticky top-0 z-50 flex items-center justify-between flex-wrap gap-2 bg-[var(--panel)] border-b-2 border-[var(--panel-border)] px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border-2 border-gold rounded flex items-center justify-center text-xl bg-black/50">
            {state.avatar.emoji}
          </div>
          <div>
            <div className="font-pixel text-gold text-xs">{state.avatar.name}, LV.{state.level}</div>
            <div className="flex gap-1">
              <div className="w-20 h-1.5 bg-black/50 rounded overflow-hidden">
                <div className="h-full bg-[var(--hp-red)]" style={{ width: `${state.hp}%` }} />
              </div>
              <div className="w-20 h-1.5 bg-black/50 rounded overflow-hidden">
                <div className="h-full bg-[var(--xp-blue)]" style={{ width: `${state.xp % 100}%` }} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-pixel text-gold text-sm">🪙 {state.gold.toLocaleString('en-IN')}</span>
          <span className="font-pixel text-emerald-300 text-sm">💎 {state.gems}</span>
          <span className="hidden sm:inline font-pixel text-xs bg-yellow-500/10 border border-yellow-500/30 px-2 py-1 rounded">
            ⚔️ Quest: Learn to Budget! ({state.questsDone}/3)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTutorOpen(true)}
            className="font-pixel text-xs bg-green/20 border border-green/50 text-[var(--green-light)] px-3 py-1.5 rounded hover:bg-green/30"
          >
            🤖 AI Tutor
          </button>
          <Link href="/profile" className="font-pixel text-xs bg-white/10 border border-white/20 text-[var(--text)] px-3 py-1.5 rounded hover:border-gold hover:text-gold">
            👤 Profile
          </Link>
          <Link href="/" className="font-pixel text-xs bg-white/10 border border-white/20 text-[var(--text)] px-3 py-1.5 rounded hover:border-gold hover:text-gold">
            🏠 Home
          </Link>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Chat log - hidden on small */}
        <aside className="hidden md:flex w-56 flex-col bg-[rgba(5,15,10,0.92)] border-r border-green/30">
          <div className="font-pixel text-xs text-[var(--green-light)] p-3 border-b border-green/20">📋 CHATS</div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {chatLog.map((m, i) => (
              <div
                key={i}
                className={`text-xs rounded px-2 py-1 ${
                  m.type === 'quest' ? 'text-yellow-400 bg-yellow-500/10 border-l-2 border-yellow-500' :
                  m.type === 'tip' ? 'text-[var(--green-light)] bg-green/10 border-l-2 border-green' :
                  'text-[var(--blue-light)] bg-blue-500/10 border-l-2 border-blue-400'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
        </aside>

        {/* World + Phaser */}
        <main className="flex-1 relative min-h-[500px] bg-[#2d5a2d]">
          <GameCanvas />
          {/* Zone overlays - clickable */}
          <div className="absolute inset-0 pointer-events-none sm:pointer-events-auto">
            <div className="absolute left-[8%] top-[18%] w-36 h-40 sm:w-44 sm:h-44 flex flex-col items-center justify-end pb-2 rounded border-2 border-gold/30 hover:border-gold hover:bg-gold/10 cursor-pointer transition pointer-events-auto"
              onClick={() => setModal('budgeting-city')}
            >
              <span className="text-4xl drop-shadow">🏘️</span>
              <span className="font-pixel text-[10px] text-white bg-black/50 px-2 py-1 rounded mt-1">Budgeting City</span>
            </div>
            <div className="absolute right-[8%] top-[10%] w-32 h-44 flex flex-col items-center justify-end pb-2 rounded border-2 border-gold/20 opacity-70 cursor-pointer pointer-events-auto"
              onClick={() => showToast('🔒 Unlock Investment Tower by completing Budgeting City!')}
            >
              <span className="text-4xl">🏗️</span>
              <span className="font-pixel text-[10px] text-white bg-black/50 px-2 py-1 rounded mt-1">Investment Tower</span>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-[35%] w-32 h-32 flex flex-col items-center justify-end pb-2 rounded border-2 border-gold/30 hover:border-gold hover:bg-gold/10 cursor-pointer transition pointer-events-auto"
              onClick={() => showToast('Central Plaza — Quiz coming soon!')}
            >
              <span className="text-4xl">⛲</span>
              <span className="font-pixel text-[10px] text-white bg-black/50 px-2 py-1 rounded mt-1">Central Plaza</span>
            </div>
          </div>
        </main>
      </div>

      {/* Hotbar */}
      <footer className="flex items-center justify-between flex-wrap gap-2 bg-[var(--panel)] border-t-2 border-[var(--panel-border)] px-4 py-2">
        <div className="flex gap-2">
          {['📊 Budget', '🏷️ Discount', '📱 Expenses', '🏦 Savings', '🧭 Quests'].map((label, i) => (
            <button
              key={label}
              onClick={() => { hotbarActive.current = i; }}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded border-2 text-lg transition ${
                hotbarActive.current === i ? 'border-gold bg-gold/15 shadow-lg shadow-gold/20' : 'border-white/20 bg-black/50 hover:border-gold/50'
              }`}
            >
              <span className="text-xs font-pixel text-[var(--text-muted)] hidden sm:block">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => showToast('🗺️ Map — coming soon!')} className="font-pixel text-xs bg-blue-500/20 text-blue-200 border border-blue-500/40 px-3 py-1.5 rounded">🗺️ MAP</button>
          <button onClick={() => showToast('🎒 Inventory — coming soon!')} className="font-pixel text-xs bg-amber-500/20 text-amber-200 border border-amber-500/40 px-3 py-1.5 rounded">🎒 INVENTORY</button>
          <button onClick={() => setModal('budgeting-city')} className="font-pixel text-xs bg-green/20 text-[var(--green-light)] border border-green/40 px-3 py-1.5 rounded">📜 QUESTS</button>
          <Link href="/" className="font-pixel text-xs bg-gray-500/20 text-gray-300 border border-gray-500/40 px-3 py-1.5 rounded">☰ MENU</Link>
        </div>
      </footer>

      {/* Modal: Budgeting City */}
      {modal === 'budgeting-city' && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[200] p-4" onClick={() => setModal(null)}>
          <div className="bg-[var(--dark2)] border-2 border-[var(--panel-border)] rounded max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-[var(--panel-border)]">
              <span className="font-pixel text-gold">🏘️ Budgeting City</span>
              <button onClick={() => setModal(null)} className="text-[var(--text-muted)] hover:text-red-500 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-[var(--text-muted)] text-sm">Where do you want to go?</p>
              <button onClick={() => { setModal(null); showToast('Budget Tetris — coming in next update!'); }} className="w-full text-left p-4 rounded border border-white/15 hover:border-gold bg-white/5">
                <div className="font-pixel text-gold text-xs">🧱 BUDGET TETRIS</div>
                <div className="text-sm text-[var(--text-muted)]">Falling expense blocks · Catch income, dodge overspending</div>
              </button>
              <button onClick={() => { setModal(null); openDorms(); }} className="w-full text-left p-4 rounded border border-white/15 hover:border-gold bg-white/5">
                <div className="font-pixel text-gold text-xs">🏠 DORMS — Roommate Rent Chat</div>
                <div className="text-sm text-[var(--text-muted)]">Split rent, handle UPI drama · Grok-generated scenario</div>
              </button>
              <button onClick={() => { setModal(null); showToast('Market 50/30/20 — coming soon!'); }} className="w-full text-left p-4 rounded border border-white/15 hover:border-gold bg-white/5">
                <div className="font-pixel text-gold text-xs">🛒 MARKET — 50/30/20</div>
                <div className="text-sm text-[var(--text-muted)]">Drag & drop your ₹15k budget</div>
              </button>
              <button onClick={() => { setModal(null); showToast('Univ. Café — coming soon!'); }} className="w-full text-left p-4 rounded border border-white/15 hover:border-gold bg-white/5">
                <div className="font-pixel text-gold text-xs">☕ UNIV. CAFÉ</div>
                <div className="text-sm text-[var(--text-muted)]">Expense tracking, UPI chai bills</div>
              </button>
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
                <div className="font-pixel text-gold text-xs mb-2">Roommate Rahul:</div>
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
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => sendTutor('Why is it risky to let my roommate delay UPI payment?')} className="font-pixel text-xs bg-green text-white px-3 py-1.5 rounded">
                      🤖 Ask AI Tutor
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

      {/* AI Tutor panel */}
      {tutorOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-[rgba(5,15,35,0.97)] border-l-2 border-blue-500/50 z-[300] flex flex-col shadow-2xl">
          <div className="flex justify-between items-center p-4 border-b border-blue-500/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">🤖</div>
              <div>
                <div className="font-pixel text-[var(--blue-light)] text-xs">AI Tutor</div>
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

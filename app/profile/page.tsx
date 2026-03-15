'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'finquest_state';

function loadState() {
  if (typeof window === 'undefined')
    return {
      avatar: { emoji: '🎒', name: 'NICK', type: 'Loan Leveraged' },
      gold: 15000,
      gems: 50,
      level: 1,
      xp: 250,
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
    xp: 250,
    questsDone: 0,
    budgetProgress: 0,
  };
}

const BADGES = [
  { id: 'first', icon: '🎮', name: 'First Quest', earned: true },
  { id: 'budget', icon: '💰', name: 'Budget Master', earned: false },
  { id: 'investor', icon: '📈', name: 'Investor', earned: false },
  { id: 'debt', icon: '🏦', name: 'Debt Slayer', earned: false },
  { id: 'streak', icon: '⚡', name: 'Streak 7', earned: false },
  { id: 'quiz', icon: '🧠', name: 'Quiz Ace', earned: false },
];

export default function ProfilePage() {
  const [state, setState] = useState(loadState());

  useEffect(() => {
    setState(loadState());
  }, []);

  const xpForLevel = 1000;
  const xpInLevel = state.xp % xpForLevel;
  const xpPct = Math.min(100, (xpInLevel / xpForLevel) * 100);

  return (
    <div className="min-h-screen bg-[var(--dark)] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/game"
          className="inline-block font-pixel text-xs text-[var(--text-muted)] border border-white/20 px-4 py-2 rounded mb-6 hover:text-gold hover:border-gold transition"
        >
          ← Back to Game
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: avatar + stats + achievements */}
          <div className="space-y-4">
            <div className="bg-white/5 border border-gold/20 rounded-lg p-6">
              <div className="text-6xl text-center mb-4">{state.avatar.emoji}</div>
              <div className="font-pixel text-gold text-center text-sm mb-1">{state.avatar.name}</div>
              <div className="font-pixel text-xs text-[var(--text-muted)] text-center mb-6">
                Level {state.level} · {state.avatar.type}
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Gold', value: `₹${state.gold.toLocaleString('en-IN')}` },
                  { label: 'Gems', value: state.gems },
                  { label: 'XP', value: `${state.xp % xpForLevel} / ${xpForLevel}` },
                  { label: 'Streak', value: '3 days 🔥' },
                  { label: 'Quests Done', value: state.questsDone },
                  { label: 'Avatar Type', value: state.avatar.type },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-sm border-b border-white/5 py-1">
                    <span className="text-[var(--text-muted)]">{row.label}</span>
                    <span className="font-pixel text-xs text-gold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-gold/20 rounded-lg p-6">
              <div className="font-pixel text-sm text-[var(--text)] mb-4">🏆 Achievements</div>
              <div className="grid grid-cols-3 gap-2">
                {BADGES.map((b) => (
                  <div
                    key={b.id}
                    className={`p-3 rounded text-center border ${
                      b.earned ? 'border-gold/40 bg-gold/10' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{b.icon}</span>
                    <div className={`font-pixel text-[10px] ${b.earned ? 'text-gold' : 'text-[var(--text-muted)]'}`}>
                      {b.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: module progress + 50/30/20 */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white/5 border border-gold/20 rounded-lg p-6">
              <div className="font-pixel text-sm text-[var(--text)] mb-4">📚 Module Progress</div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-[var(--text-muted)] mb-1">
                    <span>🏘️ Budgeting City</span>
                    <span>{state.budgetProgress}%</span>
                  </div>
                  <div className="h-2 bg-black/40 rounded overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded"
                      style={{ width: `${state.budgetProgress}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-[var(--text-muted)] mb-1">
                    <span>🏗️ Investment Tower</span>
                    <span>0% — Locked</span>
                  </div>
                  <div className="h-2 bg-black/40 rounded overflow-hidden">
                    <div className="h-full bg-gray-600 rounded w-0" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-[var(--text-muted)] mb-1">
                    <span>🏛️ Loan Bank</span>
                    <span>0% — Locked</span>
                  </div>
                  <div className="h-2 bg-black/40 rounded overflow-hidden">
                    <div className="h-full bg-gray-600 rounded w-0" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/5 border border-gold/20 rounded-lg p-6">
              <div className="font-pixel text-sm text-[var(--text)] mb-4">💡 50/30/20 Budget Health</div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 rounded bg-red-500/10 border border-red-500/30">
                  <div className="font-pixel text-lg text-red-400">35%</div>
                  <div className="font-pixel text-[10px] text-[var(--text-muted)] mt-1">NEEDS</div>
                </div>
                <div className="text-center p-4 rounded bg-blue-500/10 border border-blue-500/30">
                  <div className="font-pixel text-lg text-blue-300">15%</div>
                  <div className="font-pixel text-[10px] text-[var(--text-muted)] mt-1">WANTS</div>
                </div>
                <div className="text-center p-4 rounded bg-green-500/10 border border-green-500/30">
                  <div className="font-pixel text-lg text-[var(--green-light)]">50%</div>
                  <div className="font-pixel text-[10px] text-[var(--text-muted)] mt-1">SAVINGS</div>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Play Budget Tetris in Budgeting City to update your real spending breakdown.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

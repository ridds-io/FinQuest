'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

type Mode = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const router = useRouter();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setMessage(null);
      setLoading(true);
      try {
        if (mode === 'login') {
          const { data, error: err } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (err) {
            setError(err.message);
          } else if (data.user) {
            router.push('/game');
          }
        } else if (mode === 'signup') {
          const { data, error: err } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username } },
          });
          if (err) {
            setError(err.message);
          } else if (data.user) {
            const { error: upsertError } = await supabase.from('users').upsert({
              id: data.user.id,
              email,
              username,
              avatar_type: 'loan-leveraged',
              level: 1,
              xp: 0,
              gold: 2000,
              streak_days: 0,
              total_quests_completed: 0,
              onboarding_completed: false,
            });
            if (upsertError) {
              setError(upsertError.message);
            } else {
              setMessage('Account created! Check your email to verify, then continue.');
            }
          }
        } else {
          const redirectTo = `${window.location.origin}/reset-password`;
          const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
          });
          if (err) {
            setError(err.message);
          } else {
            setMessage('Password reset link sent! Check your email.');
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [mode, email, password, username, router],
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0e1a] to-[#0a1a0a] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[length:24px_24px]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(180deg, rgba(255,255,255,0.07) 0, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 24px)' }} />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-6xl md:text-7xl gap-6 text-white/10 animate-pulse">
        <span className="animate-[float_6s_ease-in-out_infinite]">🪙</span>
        <span className="animate-[float_7s_ease-in-out_infinite]">💰</span>
        <span className="animate-[float_8s_ease-in-out_infinite]">📊</span>
        <span className="animate-[float_9s_ease-in-out_infinite]">🎮</span>
        <span className="animate-[float_10s_ease-in-out_infinite]">⚔️</span>
        <span className="animate-[float_11s_ease-in-out_infinite]">🏆</span>
      </div>
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-[rgba(10,20,40,0.92)] border-2 border-[rgba(255,215,0,0.35)] rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.8)] p-6 md:p-8">
          <div className="mb-6 text-center">
            <div className="font-pixel text-3xl text-[#FFD700] mb-3 flex items-center justify-center gap-2">
              <span>⚔️</span>
              <span>FinQuest</span>
            </div>
            <p className="font-pixel text-[10px] text-[var(--text-muted)] tracking-widest">
              A MONETARY ODYSSEY
            </p>
          </div>

          <div className="mb-4 flex justify-center gap-2 text-[10px] font-pixel">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`px-3 py-2 border-2 rounded transition ${
                mode === 'login'
                  ? 'border-[#FFD700] bg-[#FFD700] text-[#1a1a2e]'
                  : 'border-[#FFD70033] text-[#FFD700] hover:bg-[#FFD70011]'
              }`}
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`px-3 py-2 border-2 rounded transition ${
                mode === 'signup'
                  ? 'border-[#FFD700] bg-[#FFD700] text-[#1a1a2e]'
                  : 'border-[#FFD70033] text-[#FFD700] hover:bg-[#FFD70011]'
              }`}
            >
              SIGN UP
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block font-pixel text-[10px] text-[var(--text-muted)] mb-1">
                EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-[#FFD70055] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#FFD700]"
                placeholder="you@college.edu"
              />
            </div>
            {mode !== 'forgot' && (
              <div>
                <label className="block font-pixel text-[10px] text-[var(--text-muted)] mb-1">
                  PASSWORD
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-[#FFD70055] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#FFD700]"
                  placeholder="••••••••"
                />
              </div>
            )}
            {mode === 'signup' && (
              <div>
                <label className="block font-pixel text-[10px] text-[var(--text-muted)] mb-1">
                  IN-GAME NAME
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-[#FFD70055] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#FFD700]"
                  placeholder="ALEX, NICK, YOU..."
                />
              </div>
            )}

            {mode !== 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-[11px] text-[var(--blue-light)] hover:underline"
              >
                Forgot password?
              </button>
            )}
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[11px] text-[var(--blue-light)] hover:underline"
              >
                ← Back to login
              </button>
            )}

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded px-3 py-2">
                {error}
              </div>
            )}
            {message && (
              <div className="text-xs text-green-300 bg-emerald-500/10 border border-emerald-500/40 rounded px-3 py-2">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#FFD700] text-[#1a1a2e] font-pixel text-[11px] py-2.5 rounded border-2 border-[#FFD700] shadow-[0_4px_0_0_rgba(0,0,0,0.8)] hover:-translate-y-0.5 hover:shadow-[0_2px_0_0_rgba(0,0,0,0.8)] active:translate-y-[1px] active:shadow-none transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? 'PROCESSING...'
                : mode === 'login'
                ? 'ENTER DUNGEON'
                : mode === 'signup'
                ? 'BEGIN QUEST'
                : 'SEND RESET LINK'}
            </button>
          </form>

          <div className="mt-6 text-center text-[10px] text-[var(--text-muted)] font-pixel">
            🇮🇳 Built for Indian College Students · SIT Pune
          </div>
        </div>
      </div>
    </div>
  );
}


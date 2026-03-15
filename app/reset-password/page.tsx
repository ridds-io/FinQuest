'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';


export default function ResetPasswordPage() {
  const router = useRouter();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setMessage(null);
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      setLoading(true);
      try {
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) {
          setError(err.message);
        } else {
          setMessage('✅ Password updated! Redirecting...');
          setTimeout(() => {
            router.push('/game');
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    },
    [password, confirm, router],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0e1a] to-[#0a1a0a] text-[var(--text)] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[length:24px_24px]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(180deg, rgba(255,255,255,0.07) 0, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 24px)' }} />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-[rgba(10,20,40,0.92)] border-2 border-[rgba(255,215,0,0.35)] rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.8)] p-6 md:p-8">
          <div className="mb-6 text-center">
            <div className="font-pixel text-2xl text-[#FFD700] mb-2">Reset Password</div>
            <p className="font-pixel text-[10px] text-[var(--text-muted)] tracking-widest">
              ENTER A NEW SECRET
            </p>
          </div>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block font-pixel text-[10px] text-[var(--text-muted)] mb-1">
                NEW PASSWORD
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
            <div>
              <label className="block font-pixel text-[10px] text-[var(--text-muted)] mb-1">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-black/40 border border-[#FFD70055] rounded px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#FFD700]"
                placeholder="••••••••"
              />
            </div>
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
              {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


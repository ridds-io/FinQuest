'use client';

import { useEffect, useMemo, useState } from 'react';

type Temptation = 'low' | 'medium' | 'high';

const CAFE_EVENTS = [
  { time: '8:00 AM', location: 'Hostel Gate', item: 'Morning Cutting Chai', cost: 20, icon: '☕', category: 'food', temptation: 'low' as Temptation },
  { time: '8:30 AM', location: 'Bus Stop', item: 'Ola Auto to College', cost: 65, icon: '🛺', category: 'transport', temptation: 'medium' as Temptation, alternative: 'College bus for Rs 10' },
  { time: '10:00 AM', location: 'Photocopy Shop', item: 'Lecture Notes Xerox', cost: 30, icon: '📋', category: 'education', temptation: 'low' as Temptation },
  { time: '1:00 PM', location: 'College Canteen', item: 'Thali Lunch', cost: 60, icon: '🍱', category: 'food', temptation: 'low' as Temptation },
  { time: '2:30 PM', location: 'Canteen', item: "Cold Coffee (you're stressed)", cost: 80, icon: '🧋', category: 'food', temptation: 'high' as Temptation, tip: 'Stress spending is real. Is this coffee fixing the stress or delaying it?' },
  { time: '4:00 PM', location: 'Campus Store', item: 'New Notebook (have 3 unused)', cost: 120, icon: '📓', category: 'wants', temptation: 'high' as Temptation, tip: 'You already have notebooks. This is wants, not needs.' },
  { time: '6:00 PM', location: "Friend's Request", item: 'Zomato Group Order split', cost: 180, icon: '🍕', category: 'food', temptation: 'high' as Temptation, tip: 'Social spending pressure is one of the biggest budget busters for students.' },
  { time: '9:00 PM', location: 'Phone Notification', item: 'Spotify Premium upgrade', cost: 119, icon: '🎵', category: 'wants', temptation: 'medium' as Temptation, alternative: 'Student plan for Rs 59' },
];

export function CafeGame({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (xpEarned: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [spent, setSpent] = useState(0);
  const [saved, setSaved] = useState(0);
  const [decisions, setDecisions] = useState<Array<{ eventIndex: number; action: 'spend' | 'save' }>>([]);
  const [showTip, setShowTip] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const current = CAFE_EVENTS[idx];

  const totals = useMemo(() => {
    const totalPossible = CAFE_EVENTS.reduce((a, e) => a + e.cost, 0);
    return { totalPossible };
  }, []);

  useEffect(() => {
    // Reset tip when moving forward
    setShowTip(null);
  }, [idx]);

  const choose = (action: 'spend' | 'save') => {
    if (!current || done) return;
    setDecisions((d) => [...d, { eventIndex: idx, action }]);
    if (action === 'spend') setSpent((s) => s + current.cost);
    else setSaved((s) => s + current.cost);

    if (current.temptation === 'high') {
      setShowTip(current.tip ?? 'High temptation choice. Pause and ask: is this a need or a want?');
      // auto-advance after short delay so tip is readable
      setTimeout(() => {
        setShowTip(null);
        next();
      }, 1400);
      return;
    }
    next();
  };

  const next = () => {
    const nextIdx = idx + 1;
    if (nextIdx >= CAFE_EVENTS.length) {
      setDone(true);
      return;
    }
    setIdx(nextIdx);
  };

  const finish = () => {
    // XP based on saved amount, capped
    const xpEarned = Math.min(200, Math.max(30, Math.floor(saved / 5)));
    onComplete(xpEarned);
    onClose();
  };

  const monthly = spent * 30;
  const yearly = spent * 365;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[220] p-3 sm:p-6" onClick={onClose}>
      <div
        className="bg-[var(--dark2)] border-2 border-[var(--panel-border)] rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-[var(--panel-border)] sticky top-0 bg-[var(--dark2)] z-10">
          <div>
            <div className="font-pixel text-gold text-sm">☕ Univ. Café — Campus Day</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              UPI pings all day. Choose <span className="text-green-300">SAVE</span> or <span className="text-red-300">SPEND</span>.
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-red-400 text-xl ml-4">✕</button>
        </div>

        {!done ? (
          <div className="p-5 space-y-4">
            <div className="bg-black/30 border border-white/10 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-pixel text-[10px] text-[var(--text-muted)] mb-2">
                    {current.time} · {current.location}
                  </div>
                  <div className="text-[var(--text)] text-sm leading-relaxed">
                    <span className="text-lg mr-2">{current.icon}</span>
                    <span className="font-semibold">{current.item}</span>
                  </div>
                  {current.alternative && (
                    <div className="text-xs text-[var(--text-muted)] mt-2">
                      Alternative: <span className="text-gold">{current.alternative}</span>
                    </div>
                  )}
                </div>
                <div className="font-pixel text-gold text-xs whitespace-nowrap">
                  ₹{current.cost.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="mt-4 flex gap-3 justify-end">
                <button
                  onClick={() => choose('save')}
                  className="font-pixel text-xs bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 transition"
                >
                  SAVE
                </button>
                <button
                  onClick={() => choose('spend')}
                  className="font-pixel text-xs bg-red-500/20 text-red-200 border border-red-500/40 px-4 py-2 rounded hover:bg-red-500/30 transition"
                >
                  SPEND
                </button>
              </div>
            </div>

            {showTip && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="font-pixel text-[10px] text-yellow-300 mb-2">TIP</div>
                <div className="text-sm text-[var(--text)] leading-relaxed">{showTip}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/25 border border-white/10 rounded-lg p-3">
                <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-1">SPENT TODAY</div>
                <div className="font-pixel text-sm text-red-200">₹{spent.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-black/25 border border-white/10 rounded-lg p-3">
                <div className="font-pixel text-[9px] text-[var(--text-muted)] mb-1">SAVED TODAY</div>
                <div className="font-pixel text-sm text-green-200">₹{saved.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="h-2 bg-black/50 rounded overflow-hidden">
              <div
                className="h-full bg-gold/80 transition-all duration-300"
                style={{ width: `${Math.round(((idx + 1) / CAFE_EVENTS.length) * 100)}%` }}
              />
            </div>
            <div className="font-pixel text-[9px] text-[var(--text-muted)] text-center">
              Event {idx + 1} / {CAFE_EVENTS.length}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="font-pixel text-gold text-lg mb-2">Day Summary</div>
              <div className="text-sm text-[var(--text-muted)]">
                You could have spent ₹{totals.totalPossible.toLocaleString('en-IN')} today.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-4">
                <div className="font-pixel text-[10px] text-red-200 mb-1">TOTAL SPENT</div>
                <div className="font-pixel text-xl text-red-100">₹{spent.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/25 rounded-lg p-4">
                <div className="font-pixel text-[10px] text-green-200 mb-1">TOTAL SAVED</div>
                <div className="font-pixel text-xl text-green-100">₹{saved.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-lg p-4 text-sm text-[var(--text-muted)] leading-relaxed">
              At this pace: <span className="text-gold font-semibold">₹{monthly.toLocaleString('en-IN')}/month</span> and{' '}
              <span className="text-gold font-semibold">₹{yearly.toLocaleString('en-IN')}/year</span> on these daily purchases.
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={finish}
                className="font-pixel text-xs bg-gold text-[var(--dark)] px-6 py-2.5 rounded hover:-translate-y-1 transition"
              >
                Claim XP →
              </button>
              <button
                onClick={onClose}
                className="font-pixel text-xs bg-white/10 border border-white/20 text-[var(--text)] px-6 py-2.5 rounded hover:border-gold/50 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


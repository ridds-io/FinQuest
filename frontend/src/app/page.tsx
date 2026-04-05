import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0a0e1a] via-[#0d2a1a] to-[#0a1a0a] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(0,255,100,0.04) 31px, rgba(0,255,100,0.04) 32px),
            repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(0,255,100,0.04) 31px, rgba(0,255,100,0.04) 32px)`,
        }}
      />
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gold/15 relative z-10">
        <div className="font-pixel text-sm sm:text-base text-gold tracking-wider">⚔️ FinQuest</div>
        <div className="hidden sm:flex gap-6">
          <a href="#features" className="text-[var(--text-muted)] text-sm hover:text-gold transition">Features</a>
          <a href="#modules" className="text-[var(--text-muted)] text-sm hover:text-gold transition">Modules</a>
        </div>
        <Link
          href="/game"
          className="font-pixel text-xs bg-gold text-[var(--dark)] px-4 py-2 rounded-sm hover:bg-white hover:-translate-y-0.5 transition"
        >
          ▶ Play Free
        </Link>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 sm:py-16 relative z-10">
        <div className="font-pixel text-xs text-[var(--green-light)] bg-green/20 border border-green/40 px-4 py-2 rounded-full mb-6 tracking-wider">
          🇮🇳 Made for Indian College Students
        </div>
        <h1 className="font-pixel text-2xl sm:text-4xl md:text-5xl text-gold mb-1 drop-shadow-lg">
          FinQuest
        </h1>
        <p className="font-pixel text-xs sm:text-sm text-[var(--text-muted)] mb-4 tracking-wider">
          A Monetary Odyssey
        </p>
        <p className="text-base sm:text-lg text-[var(--text)] max-w-xl leading-relaxed mb-8 font-light">
          Master <strong className="text-gold font-semibold">budgeting, investing & loans</strong> through an
          immersive RPG. Real Indian scenarios — ₹ rents, UPI payments, chai stalls, PG life.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mb-10">
          <Link
            href="/game"
            className="font-pixel text-sm bg-gold text-[var(--dark)] px-6 py-3 rounded-sm shadow-lg hover:-translate-y-1 transition"
          >
            ▶ Start Free Game
          </Link>
          <Link
            href="/profile"
            className="font-pixel text-xs border border-green text-[var(--green-light)] px-6 py-3 rounded-sm hover:bg-green/15 transition"
          >
            📊 View Profile
          </Link>
        </div>
        <div className="flex flex-wrap gap-6 justify-center font-pixel text-xs text-[var(--text-muted)]">
          <span className="border border-white/10 px-4 py-2 rounded-full">🎓 <span className="text-gold">1,000+</span> Students</span>
          <span className="border border-white/10 px-4 py-2 rounded-full">🏆 <span className="text-gold">9</span> Modules</span>
          <span className="border border-white/10 px-4 py-2 rounded-full">🤖 <span className="text-gold">AI</span> Tutor</span>
          <span className="border border-white/10 px-4 py-2 rounded-full">🇮🇳 <span className="text-gold">SIT</span> Pune Beta</span>
        </div>
      </section>

      <section id="features" className="px-4 py-12 sm:py-16 relative z-10">
        <div className="font-pixel text-xs text-[var(--green-light)] text-center tracking-widest mb-4">📚 Learning Modules</div>
        <h2 className="font-pixel text-sm sm:text-lg text-center text-[var(--text)] max-w-2xl mx-auto mb-10 leading-relaxed">
          Three Cities. Nine Modules. Infinite Scenarios.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: '🏘️',
              title: 'Budgeting City',
              desc: 'Navigate PG life in Pune. Split rent, track chai bills, optimize your ₹15k student budget.',
              tags: ['Personal Budgeting', 'Student Discounts', 'Expense Tracking'],
            },
            {
              icon: '🏗️',
              title: 'Investment Tower',
              desc: 'Start a SIP, pick mutual funds, understand why your senior went bankrupt day-trading Nifty.',
              tags: ['Stocks & MF', 'SIP Calculator', 'Risk Profiling'],
            },
            {
              icon: '🏛️',
              title: 'Loan Bank',
              desc: 'Decode your education loan, avoid credit card traps, understand EMIs before signing.',
              tags: ['Education Loans', 'Credit Cards', 'EMI Planning'],
            },
          ].map((card) => (
            <Link
              key={card.title}
              href="/game"
              className="block bg-white/5 border border-gold/20 rounded p-6 hover:border-gold/40 hover:-translate-y-1 transition"
            >
              <div className="text-2xl mb-4">{card.icon}</div>
              <div className="font-pixel text-sm text-gold mb-2">{card.title}</div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">{card.desc}</p>
              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-pixel text-[10px] bg-green/15 text-[var(--green-light)] border border-green/30 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-sm text-[var(--text-muted)] relative z-10">
        Built with ❤️ at Symbiosis Institute of Technology, Pune · Privacy · Terms · Contact
      </footer>
    </div>
  );
}

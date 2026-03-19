'use client';
import dynamic from 'next/dynamic';

const MainGameView = dynamic(() => import('@/components/MainGameView'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#16213e]">
      <p className="font-pixel text-gold text-sm">Loading FinQuest...</p>
    </div>
  ),
});

export default function MainGame() {
  return <MainGameView />;
}

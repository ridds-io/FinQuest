import dynamic from 'next/dynamic';

const GameView = dynamic(() => import('@/components/GameView'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#16213e]">
      <p className="font-pixel text-gold text-sm">Loading FinQuest...</p>
    </div>
  ),
});

export default function GamePage() {
  return <GameView />;
}

'use client';
import dynamic from 'next/dynamic';

const InvestCityView = dynamic(() => import('@/components/InvestCityView'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#16213e]">
      <p className="font-pixel text-gold text-sm">Loading Investment City...</p>
    </div>
  ),
});

export default function InvestCity() {
  return <InvestCityView />;
}

'use client';
import dynamic from 'next/dynamic';

const BudgetingCityView = dynamic(() => import('@/components/BudgetingCityView'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#16213e]">
      <p className="font-pixel text-gold text-sm">Loading Budgeting City...</p>
    </div>
  ),
});

export default function BudgetingCity() {
  return <BudgetingCityView />;
}

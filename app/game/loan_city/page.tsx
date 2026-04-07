'use client';

import dynamic from 'next/dynamic';

const LoanCityView = dynamic(() => import('@/components/LoanCityView'), {
  ssr: false,
});

export default function LoanCityPage() {
  return <LoanCityView />;
}

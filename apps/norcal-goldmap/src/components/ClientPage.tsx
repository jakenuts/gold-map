'use client';

import dynamic from 'next/dynamic';
import Navbar from './Navbar';

const DynamicMap = dynamic(() => import('./Map'), {
  loading: () => (
    <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  ),
  ssr: false
});

export default function ClientPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-grow relative">
        <DynamicMap />
      </div>
    </main>
  );
}

'use client';

import dynamic from 'next/dynamic';

const ClientPage = dynamic(() => import('./ClientPage'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  )
});

export default function MapPage() {
  return <ClientPage />;
}

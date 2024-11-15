'use client';

import dynamic from 'next/dynamic';

const MapComponent = dynamic(
  () => import('./MapComponent'),
  { 
    loading: () => (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    ),
    ssr: false
  }
);

const MapWrapper = () => {
  return (
    <div className="flex-grow relative w-full">
      <MapComponent />
    </div>
  );
};

export default MapWrapper;

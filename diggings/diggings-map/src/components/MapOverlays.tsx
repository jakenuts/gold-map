import React from 'react';

export const LoadingIndicator = () => (
  <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-gray-700 font-medium">Loading data...</span>
  </div>
);

interface ErrorDisplayProps {
  error: Error;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-lg max-w-md">
    <p className="font-bold text-sm mb-1">Error loading data</p>
    <p className="text-sm break-words">{error.message}</p>
  </div>
);

export const TestErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg max-w-md">
    <p className="font-bold text-sm mb-1">KMZ Loading Test Error</p>
    <p className="text-sm break-words">{message}</p>
  </div>
);

export const MapControls: React.FC = () => (
  <div className="absolute top-4 right-4 z-10 flex flex-col space-y-4">
    <div className="bg-white rounded-lg shadow-lg p-2">
      <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
        Reset View
      </button>
    </div>
  </div>
);

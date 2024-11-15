import { FC } from 'react';

export const Legend: FC = () => {
  return (
    <div className="absolute bottom-8 left-4 bg-white p-4 rounded-lg shadow-lg z-10 transition-transform hover:scale-[1.01]">
      <h3 className="text-sm font-semibold mb-3 text-gray-700">Legend</h3>
      <div className="space-y-2.5">
        <div className="flex items-center space-x-2 group">
          <div className="w-4 h-4 rounded-full bg-[#4CAF50] border border-white shadow-sm group-hover:scale-110 transition-transform"></div>
          <span className="text-sm text-gray-600 group-hover:text-gray-900">Active Claims</span>
        </div>
        <div className="flex items-center space-x-2 group">
          <div className="w-4 h-4 rounded-full bg-[#F44336] border border-white shadow-sm group-hover:scale-110 transition-transform"></div>
          <span className="text-sm text-gray-600 group-hover:text-gray-900">Closed Claims</span>
        </div>
        <div className="flex items-center space-x-2 group">
          <div className="w-4 h-4 rounded-full bg-[#9E9E9E] border border-white shadow-sm group-hover:scale-110 transition-transform"></div>
          <span className="text-sm text-gray-600 group-hover:text-gray-900">Void Claims</span>
        </div>
        <div className="flex items-center space-x-2 group">
          <div className="w-4 h-4 rounded-full bg-[#FFD700] border border-black shadow-sm group-hover:scale-110 transition-transform"></div>
          <span className="text-sm text-gray-600 group-hover:text-gray-900">USGS Records</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500">Click on markers for details</p>
      </div>
    </div>
  );
};

export default Legend;

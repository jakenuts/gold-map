import React from 'react';
import { LOCATION_TYPE_COLORS } from '../utils/mapLayers';

const Legend = () => {
  const locationTypes = Object.entries(LOCATION_TYPE_COLORS).filter(([type]) => type !== 'default');
  const usgsRecord = { color: '#FFD700', label: 'USGS Records' };

  return (
    <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-4 max-w-xs">
      <h3 className="text-sm font-semibold mb-3">Legend</h3>
      
      {/* Location Types Section */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-600 mb-2">Location Types</h4>
        <div className="grid grid-cols-2 gap-2">
          {locationTypes.map(([type, color]) => (
            <div key={type} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-700 capitalize">
                {type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* USGS Records Section */}
      <div className="pt-2 border-t border-gray-200">
        <h4 className="text-xs font-medium text-gray-600 mb-2">Other Data</h4>
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full border border-gray-300"
            style={{ backgroundColor: usgsRecord.color }}
          />
          <span className="text-xs text-gray-700">{usgsRecord.label}</span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">Click on markers for details</p>
      </div>
    </div>
  );
};

export default Legend;

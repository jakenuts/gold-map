import React from 'react';

const Legend = () => {
  const items = [
    { color: '#4CAF50', label: 'Active Claims' },
    { color: '#F44336', label: 'Closed Claims' },
    { color: '#9E9E9E', label: 'Void Claims' },
    { color: '#FFD700', label: 'USGS Records' }
  ];

  return (
    <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-4">
      <h3 className="text-sm font-semibold mb-3">Legend</h3>
      <div className="space-y-2">
        {items.map(({ color, label }) => (
          <div key={label} className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-700">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">Click on markers for details</p>
      </div>
    </div>
  );
};

export default Legend;

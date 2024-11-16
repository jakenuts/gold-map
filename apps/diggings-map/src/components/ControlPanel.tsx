import React from 'react';
import { useMap } from '../context/MapContext';
import { LocationType } from '../types';

const ControlPanel = () => {
  const { layers, setLayers, filters, setFilters, controlPanelVisible, setControlPanelVisible } = useMap();

  // Location type options from the LocationType type
  const locationTypes: LocationType[] = [
    'mine',
    'prospect',
    'past producer',
    'producer',
    'occurrence',
    'mineral location',
    'mineral deposit',
    'claim'
  ];

  // Settings button - positioned in upper right corner
  const SettingsButton = () => (
    <button
      onClick={() => setControlPanelVisible(!controlPanelVisible)}
      className="absolute top-4 right-12 bg-white p-2 rounded-lg shadow-lg z-20 hover:bg-gray-50 transition-colors"
      title={controlPanelVisible ? "Hide Settings" : "Show Settings"}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-6 w-6 text-gray-600"
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>
  );

  // Control panel content
  const ControlPanelContent = () => (
    <div className={`absolute top-4 right-24 bg-white p-4 rounded-lg shadow-lg w-80 z-10 transition-all duration-300 ${controlPanelVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
      <div className="space-y-4">
        {/* Layers Section */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Layers</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={layers.miningClaims}
                onChange={(e) => setLayers({ ...layers, miningClaims: e.target.checked })}
                className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
              />
              <span>Mining Claims</span>
            </label>
            <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={layers.usgsRecords}
                onChange={(e) => setLayers({ ...layers, usgsRecords: e.target.checked })}
                className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
              />
              <span>USGS Records</span>
            </label>
          </div>
        </div>

        {/* Filters Section */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Filters</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Location Type</label>
              <select
                value={filters.locationType}
                onChange={(e) => setFilters({ ...filters, locationType: e.target.value })}
                className="w-full p-2 border rounded hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors duration-200"
              >
                <option value="all">All Types</option>
                {locationTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full p-2 border rounded hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors duration-200"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="void">Void</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full p-2 border rounded hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors duration-200"
              >
                <option value="all">All Years</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SettingsButton />
      <ControlPanelContent />
    </>
  );
};

export default ControlPanel;

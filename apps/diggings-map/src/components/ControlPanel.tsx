import React from 'react';
import { useMap } from '../context/MapContext';

const ControlPanel = () => {
  const { layers, setLayers, filters, setFilters } = useMap();

  return (
    <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg w-80 z-10 transition-transform hover:scale-[1.01]">
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
              <label className="block text-sm font-medium mb-1 text-gray-700">Claim Type</label>
              <select
                value={filters.claimType}
                onChange={(e) => setFilters({ ...filters, claimType: e.target.value })}
                className="w-full p-2 border rounded hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors duration-200"
              >
                <option value="all">All Types</option>
                <option value="lode">Lode</option>
                <option value="placer">Placer</option>
                <option value="mill">Mill Site</option>
                <option value="tunnel">Tunnel Site</option>
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
};

export default ControlPanel;

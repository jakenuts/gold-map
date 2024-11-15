import React from 'react';
import { useMap } from '../context/MapContext';

const ControlPanel = () => {
  const { layers, setLayers, filters, setFilters } = useMap();

  return (
    <div className="flex flex-col flex-1">
      {/* Layers Section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Layers</h2>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layers.miningClaims}
              onChange={(e) => setLayers({ ...layers, miningClaims: e.target.checked })}
              className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">Mining Claims</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layers.usgsRecords}
              onChange={(e) => setLayers({ ...layers, usgsRecords: e.target.checked })}
              className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">USGS Records</span>
          </label>
        </div>
      </section>

      {/* Filters Section */}
      <section className="flex-1">
        <h2 className="text-lg font-semibold mb-3">Filters</h2>
        <div className="space-y-4">
          {/* Claim Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Claim Type
            </label>
            <select
              value={filters.claimType}
              onChange={(e) => setFilters({ ...filters, claimType: e.target.value })}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="lode">Lode</option>
              <option value="placer">Placer</option>
              <option value="mill">Mill</option>
              <option value="tunnel">Tunnel</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="void">Void</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Years</option>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Data is filtered based on map viewport and selected criteria
        </p>
      </div>
    </div>
  );
};

export default ControlPanel;

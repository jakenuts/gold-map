import { useMap } from '../context/MapContext';

const ControlPanel = () => {
  const { layers, setLayers, filters, setFilters } = useMap();

  return (
    <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg w-80 z-10 transition-transform hover:scale-[1.01]">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Layers</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={layers.miningClaims}
                onChange={(e) =>
                  setLayers((prev) => ({
                    ...prev,
                    miningClaims: e.target.checked,
                  }))
                }
                className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
              />
              <span>Mining Claims</span>
            </label>
            <label className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={layers.usgsRecords}
                onChange={(e) =>
                  setLayers((prev) => ({
                    ...prev,
                    usgsRecords: e.target.checked,
                  }))
                }
                className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
              />
              <span>USGS Records</span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Filters</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Claim Type</label>
              <select
                value={filters.claimType}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    claimType: e.target.value,
                  }))
                }
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
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
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
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    year: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors duration-200"
              >
                <option value="all">All Years</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;

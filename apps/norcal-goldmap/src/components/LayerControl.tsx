'use client';

import { LayerControlProps } from '../types/map';

const LayerControl: React.FC<LayerControlProps> = ({ layers, activeLayer, onLayerChange }) => {
  return (
    <div 
      className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3"
      role="toolbar"
      aria-label="Map Layer Controls"
    >
      <div className="flex flex-col gap-2 min-w-[160px]">
        {layers.map((layer) => (
          <button
            key={layer.id}
            className={`
              px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200
              transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500
              ${
                activeLayer === layer.id
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                  : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/90'
              }
            `}
            onClick={() => onLayerChange(layer.id)}
            aria-pressed={activeLayer === layer.id}
            aria-label={`Switch to ${layer.name} map layer`}
          >
            {layer.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LayerControl;

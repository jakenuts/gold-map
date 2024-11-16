import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LayerState, FilterState, MapContextType } from '../types';

interface Viewport {
  longitude: number;
  latitude: number;
  zoom: number;
}

const defaultViewport: Viewport = {
  // Center on Northern California
  longitude: -120.5,
  latitude: 39.5,
  zoom: 7
};

const defaultLayers: LayerState = {
  miningClaims: true,
  usgsRecords: true
};

const defaultFilters: FilterState = {
  locationType: 'mine',  // Default to showing mines
  status: 'all',
  year: 'all'
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [layers, setLayers] = useState<LayerState>(defaultLayers);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);
  const [controlPanelVisible, setControlPanelVisible] = useState(false); // Hidden by default

  return (
    <MapContext.Provider
      value={{
        layers,
        setLayers,
        filters,
        setFilters,
        viewport,
        setViewport,
        controlPanelVisible,
        setControlPanelVisible
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};

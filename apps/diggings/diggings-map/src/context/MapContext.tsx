import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LayerState, FilterState } from '../types';

interface Viewport {
  longitude: number;
  latitude: number;
  zoom: number;
}

interface MapContextType {
  layers: LayerState;
  setLayers: (layers: LayerState) => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  viewport: Viewport;
  setViewport: (viewport: Viewport) => void;
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
  claimType: 'all',
  status: 'all',
  year: 'all'
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [layers, setLayers] = useState<LayerState>(defaultLayers);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);

  return (
    <MapContext.Provider
      value={{
        layers,
        setLayers,
        filters,
        setFilters,
        viewport,
        setViewport
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

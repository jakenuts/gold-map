import { createContext, useContext, ReactNode, useState, Dispatch, SetStateAction } from 'react';
import { LayerState, FilterState, MapContextType } from '../types';

const defaultViewport = {
  longitude: -119.4179,
  latitude: 36.7783,
  zoom: 6,
};

const defaultLayers: LayerState = {
  miningClaims: true,
  usgsRecords: true,
};

const defaultFilters: FilterState = {
  claimType: 'all',
  status: 'all',
  year: 'all',
};

export interface MapContextValue {
  layers: LayerState;
  setLayers: Dispatch<SetStateAction<LayerState>>;
  filters: FilterState;
  setFilters: Dispatch<SetStateAction<FilterState>>;
  viewport: typeof defaultViewport;
  setViewport: Dispatch<SetStateAction<typeof defaultViewport>>;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<LayerState>(defaultLayers);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [viewport, setViewport] = useState(defaultViewport);

  return (
    <MapContext.Provider
      value={{
        layers,
        setLayers,
        filters,
        setFilters,
        viewport,
        setViewport,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}

export default MapContext;

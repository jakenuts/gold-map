'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_LAYERS } from '../config/mapLayers';
import { useMapLayers } from '../hooks/useMapLayers';
import LayerControl from './LayerControl';
import type { FC } from 'react';

const Map: FC = () => {
  const mapRef = useRef<L.Map | null>(null);
  const initRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const mapLayers = useMapLayers(MAP_LAYERS);

  useEffect(() => {
    if (!mapRef.current && !initRef.current) {
      initRef.current = true;
      const map = L.map('map', {
        center: [39.8283, -120.5283],
        zoom: 8,
        zoomControl: false,
        attributionControl: true,
        fadeAnimation: true,
        zoomAnimation: true
      });

      // Add zoom and scale controls
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.scale({
        imperial: true,
        metric: true,
        position: 'bottomleft'
      }).addTo(map);

      // Move attribution control to bottom right
      map.attributionControl.setPosition('bottomright');

      mapRef.current = map;

      // Initialize with first layer
      mapLayers.handleLayerChange(map, MAP_LAYERS[0].id);

      // Trigger a resize after map is initialized
      setTimeout(() => {
        map.invalidateSize();
        setIsInitializing(false);
      }, 500);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initRef.current = false;
      }
    };
  }, [mapLayers]);

  const onLayerChange = async (layerId: string) => {
    if (mapRef.current) {
      setIsLoading(true);
      try {
        mapLayers.handleLayerChange(mapRef.current, layerId);
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] relative" role="region" aria-label="Interactive map of Northern California">
      <div id="map" className="w-full h-full" />
      {(isLoading || isInitializing) && (
        <div 
          className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[1001]"
          role="alert"
          aria-live="polite"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            <p className="text-white text-sm font-medium">
              {isInitializing ? 'Initializing map...' : 'Loading layer...'}
            </p>
          </div>
        </div>
      )}
      <LayerControl
        layers={MAP_LAYERS}
        activeLayer={mapLayers.activeLayerId}
        onLayerChange={onLayerChange}
      />
    </div>
  );
};

export { Map as default };

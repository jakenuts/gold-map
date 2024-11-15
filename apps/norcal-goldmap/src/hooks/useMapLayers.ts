import { useState, useCallback, useRef } from 'react';
import { LayerConfig } from '../types/map';
import L from 'leaflet';

interface MapLayersHook {
  activeLayerId: string;
  handleLayerChange: (map: L.Map, layerId: string) => void;
}

export const useMapLayers = (layers: LayerConfig[]): MapLayersHook => {
  const [activeLayerId, setActiveLayerId] = useState(layers[0].id);
  const activeLayersRef = useRef<L.Layer[]>([]);

  const createLayer = useCallback((config: LayerConfig) => {
    const baseLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: config.attribution
    });

    if (config.overlay) {
      const overlayLayer = L.tileLayer(config.overlay.url, {
        maxZoom: config.maxZoom
      });
      return L.layerGroup([baseLayer, overlayLayer]);
    }

    return baseLayer;
  }, []);

  const handleLayerChange = useCallback((map: L.Map, layerId: string) => {
    const newConfig = layers.find(l => l.id === layerId);
    if (!newConfig) return;

    // Remove existing layers
    activeLayersRef.current.forEach(layer => map.removeLayer(layer));
    activeLayersRef.current = [];

    // Create and add new layer
    const newLayer = createLayer(newConfig);
    newLayer.addTo(map);

    activeLayersRef.current = [newLayer];
    setActiveLayerId(layerId);
  }, [layers, createLayer]);

  return {
    activeLayerId,
    handleLayerChange
  };
};

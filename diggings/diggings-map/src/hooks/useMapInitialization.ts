import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useMap } from '../context/MapContext';

export const useMapInitialization = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const { viewport, setViewport } = useMap();

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom
    });

    const mapInstance = map.current;

    mapInstance.on('load', () => {
      console.log('Map loaded');
      mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');
      mapInstance.addControl(new maplibregl.ScaleControl(), 'bottom-right');
    });

    mapInstance.on('moveend', () => {
      const center = mapInstance.getCenter();
      setViewport({
        longitude: center.lng,
        latitude: center.lat,
        zoom: mapInstance.getZoom(),
      });
    });

    // Initialize popup
    popup.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '300px',
      className: 'custom-popup'
    });

    return () => {
      popup.current?.remove();
      mapInstance.remove();
    };
  }, []);

  return { mapContainer, map, popup };
};

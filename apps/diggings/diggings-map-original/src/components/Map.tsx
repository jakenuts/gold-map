import { useEffect, useRef } from 'react';
import maplibregl, { MapGeoJSONFeature } from 'maplibre-gl';
import { useQuery } from '@tanstack/react-query';
import { useMap } from '../context/MapContext';
import { api } from '../services/api';
import { MiningClaim } from '../types';
import Legend from './Legend';
import 'maplibre-gl/dist/maplibre-gl.css';

interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number];
}

interface Properties {
  claimName?: string;
  claimId?: string;
  claimType?: string;
  status?: string;
  township?: string;
  range?: string;
  section?: string;
  filingDate?: string;
  siteName?: string;
  siteId?: string;
  commodityTypes?: string[];
  operationType?: string;
}

const LoadingIndicator = () => (
  <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-10 flex items-center space-x-2">
    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-gray-700">Loading data...</span>
  </div>
);

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  const { layers, filters, viewport, setViewport } = useMap();

  // Apply filters to mining claims
  const filterMiningClaims = (claims: MiningClaim[]): MiningClaim[] => {
    return claims.filter(claim => {
      if (filters.claimType !== 'all' && claim.claimType !== filters.claimType) return false;
      if (filters.status !== 'all' && claim.status !== filters.status) return false;
      if (filters.year !== 'all') {
        const claimYear = new Date(claim.filingDate).getFullYear().toString();
        if (claimYear !== filters.year) return false;
      }
      return true;
    });
  };

  // Query for mining claims data
  const { data: miningClaims, isLoading: isLoadingClaims } = useQuery({
    queryKey: ['miningClaims', viewport, filters],
    queryFn: async () => {
      if (!map.current) return [];
      const bounds = map.current.getBounds();
      const claims = await api.getMiningClaims({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
      return filterMiningClaims(claims);
    },
    enabled: !!map.current && layers.miningClaims,
  });

  // Query for USGS records
  const { data: usgsRecords, isLoading: isLoadingUSGS } = useQuery({
    queryKey: ['usgsRecords', viewport],
    queryFn: () => {
      if (!map.current) return [];
      const bounds = map.current.getBounds();
      return api.getUSGSRecords({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    },
    enabled: !!map.current && layers.usgsRecords,
  });

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

  // Update mining claims layer
  useEffect(() => {
    if (!map.current || !miningClaims) return;

    const mapInstance = map.current;

    // Remove existing layers if they exist
    if (mapInstance.getSource('mining-claims')) {
      mapInstance.removeLayer('mining-claims-layer');
      mapInstance.removeSource('mining-claims');
    }

    if (layers.miningClaims && miningClaims.length > 0) {
      mapInstance.addSource('mining-claims', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: miningClaims.map(claim => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [claim.longitude, claim.latitude]
            },
            properties: {
              ...claim,
              color: claim.status === 'active' ? '#4CAF50' : 
                     claim.status === 'closed' ? '#F44336' : '#9E9E9E'
            }
          }))
        }
      });

      mapInstance.addLayer({
        id: 'mining-claims-layer',
        type: 'circle',
        source: 'mining-claims',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 4,
            16, 12
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Add click handler for mining claims
      mapInstance.on('click', 'mining-claims-layer', (e) => {
        if (!e.features?.[0]) return;
        
        const feature = e.features[0] as MapGeoJSONFeature;
        const props = feature.properties as Properties;
        const geometry = feature.geometry as GeoJSONPoint;
        const coordinates: [number, number] = [...geometry.coordinates];

        const html = `
          <div class="p-4">
            <h3 class="text-lg font-bold mb-2">${props.claimName}</h3>
            <div class="space-y-1">
              <p><span class="font-medium">Claim ID:</span> ${props.claimId}</p>
              <p><span class="font-medium">Type:</span> ${props.claimType}</p>
              <p><span class="font-medium">Status:</span> ${props.status}</p>
              <p><span class="font-medium">Location:</span> ${props.township}, ${props.range}, Section ${props.section}</p>
              <p><span class="font-medium">Filed:</span> ${props.filingDate ? new Date(props.filingDate).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        `;

        popup.current?.setLngLat(coordinates).setHTML(html).addTo(mapInstance);
      });

      // Add hover effect
      mapInstance.on('mouseenter', 'mining-claims-layer', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });

      mapInstance.on('mouseleave', 'mining-claims-layer', () => {
        mapInstance.getCanvas().style.cursor = '';
      });
    }
  }, [miningClaims, layers.miningClaims]);

  // Update USGS records layer
  useEffect(() => {
    if (!map.current || !usgsRecords) return;

    const mapInstance = map.current;

    if (mapInstance.getSource('usgs-records')) {
      mapInstance.removeLayer('usgs-records-layer');
      mapInstance.removeSource('usgs-records');
    }

    if (layers.usgsRecords && usgsRecords.length > 0) {
      mapInstance.addSource('usgs-records', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: usgsRecords.map(record => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [record.longitude, record.latitude]
            },
            properties: {
              ...record
            }
          }))
        }
      });

      mapInstance.addLayer({
        id: 'usgs-records-layer',
        type: 'circle',
        source: 'usgs-records',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 4,
            16, 12
          ],
          'circle-color': '#FFD700',
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#000000'
        }
      });

      // Add click handler for USGS records
      mapInstance.on('click', 'usgs-records-layer', (e) => {
        if (!e.features?.[0]) return;
        
        const feature = e.features[0] as MapGeoJSONFeature;
        const props = feature.properties as Properties;
        const geometry = feature.geometry as GeoJSONPoint;
        const coordinates: [number, number] = [...geometry.coordinates];

        const html = `
          <div class="p-4">
            <h3 class="text-lg font-bold mb-2">${props.siteName}</h3>
            <div class="space-y-1">
              <p><span class="font-medium">Site ID:</span> ${props.siteId}</p>
              <p><span class="font-medium">Commodities:</span> ${props.commodityTypes?.join(', ') || 'N/A'}</p>
              <p><span class="font-medium">Operation Type:</span> ${props.operationType}</p>
              <p><span class="font-medium">Status:</span> ${props.status}</p>
            </div>
          </div>
        `;

        popup.current?.setLngLat(coordinates).setHTML(html).addTo(mapInstance);
      });

      // Add hover effect
      mapInstance.on('mouseenter', 'usgs-records-layer', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });

      mapInstance.on('mouseleave', 'usgs-records-layer', () => {
        mapInstance.getCanvas().style.cursor = '';
      });
    }
  }, [usgsRecords, layers.usgsRecords]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      <Legend />
      {(isLoadingClaims || isLoadingUSGS) && <LoadingIndicator />}
    </div>
  );
};

export default Map;

import maplibregl, { Map, MapGeoJSONFeature } from 'maplibre-gl';
import { MiningClaim, USGSRecord, LocationType } from '../types';

interface Properties {
  claimName?: string;
  claimId?: string;
  claimType?: string;
  locationType?: LocationType;
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

// Color mappings for different location types
const LOCATION_COLORS: Record<LocationType, string> = {
  'mine': '#FF4136',           // Red
  'prospect': '#FFDC00',       // Yellow
  'past producer': '#B10DC9',  // Purple
  'producer': '#01FF70',       // Green
  'occurrence': '#7FDBFF',     // Blue
  'mineral location': '#FF851B', // Orange
  'mineral deposit': '#F012BE', // Pink
  'claim': '#39CCCC',          // Teal
  'default': '#AAAAAA'         // Gray
};

export const addMiningClaimsLayer = (
  map: Map,
  claims: MiningClaim[],
  popup: maplibregl.Popup
) => {
  if (map.getSource('mining-claims')) {
    map.removeLayer('mining-claims-layer');
    map.removeSource('mining-claims');
  }

  if (claims.length > 0) {
    map.addSource('mining-claims', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: claims.map(claim => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [claim.longitude, claim.latitude]
          },
          properties: {
            ...claim,
            color: LOCATION_COLORS[claim.locationType] || LOCATION_COLORS.default
          }
        }))
      }
    });

    map.addLayer({
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

    addLayerInteractions(map, 'mining-claims-layer', popup, renderMiningClaimPopup);
  }
};

export const addUSGSRecordsLayer = (
  map: Map,
  records: USGSRecord[],
  popup: maplibregl.Popup
) => {
  if (map.getSource('usgs-records')) {
    map.removeLayer('usgs-records-layer');
    map.removeSource('usgs-records');
  }

  if (records.length > 0) {
    map.addSource('usgs-records', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: records.map(record => ({
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

    map.addLayer({
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

    addLayerInteractions(map, 'usgs-records-layer', popup, renderUSGSRecordPopup);
  }
};

const addLayerInteractions = (
  map: Map,
  layerId: string,
  popup: maplibregl.Popup,
  renderPopup: (props: Properties) => string
) => {
  map.on('click', layerId, (e) => {
    if (!e.features?.[0]) return;
    
    const feature = e.features[0] as MapGeoJSONFeature;
    const props = feature.properties as Properties;
    const geometry = feature.geometry as { type: 'Point'; coordinates: [number, number] };
    const coordinates: [number, number] = [...geometry.coordinates];

    popup.setLngLat(coordinates)
         .setHTML(renderPopup(props))
         .addTo(map);
  });

  // Add hover effect
  map.on('mouseenter', layerId, () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', layerId, () => {
    map.getCanvas().style.cursor = '';
  });
};

const renderMiningClaimPopup = (props: Properties): string => `
  <div class="p-4">
    <h3 class="text-lg font-bold mb-2">${props.claimName}</h3>
    <div class="space-y-1">
      <p><span class="font-medium">Claim ID:</span> ${props.claimId}</p>
      <p><span class="font-medium">Location Type:</span> ${props.locationType}</p>
      <p><span class="font-medium">Claim Type:</span> ${props.claimType}</p>
      <p><span class="font-medium">Status:</span> ${props.status}</p>
      <p><span class="font-medium">Location:</span> ${props.township}, ${props.range}, Section ${props.section}</p>
      <p><span class="font-medium">Filed:</span> ${props.filingDate ? new Date(props.filingDate).toLocaleDateString() : 'N/A'}</p>
    </div>
  </div>
`;

const renderUSGSRecordPopup = (props: Properties): string => `
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

// Export colors for use in Legend
export const LOCATION_TYPE_COLORS = LOCATION_COLORS;

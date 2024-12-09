import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Color mapping for different location types
const getLocationColor = (locationType: string, properties: Record<string, any>): string => {
  const mineralDepositColors: Record<string, string> = {
    'Producer': '#FF4500',     // Red-orange for active producers
    'Occurrence': '#4169E1',   // Royal blue for occurrences
    'Past Producer': '#9370DB', // Purple for past producers
    'Prospect': '#32CD32'      // Green for prospects
  };

  if (locationType === 'mineral_deposit' && properties.depositType) {
    return mineralDepositColors[properties.depositType] || '#808080';
  }

  // Default colors for other location types
  const defaultColors: Record<string, string> = {
    'mineral_deposit': '#FF4500',
    'historical_site': '#4B0082',
    'geological_feature': '#006400'
  };

  return defaultColors[locationType] || '#808080';
};

interface Location {
  id: string;
  name: string;
  locationType: string;
  location: {
    coordinates: [number, number];
  };
  properties: Record<string, any>;
}

interface Props {
  locations: Location[];
  center: [number, number];
  zoom: number;
}

export const Map = ({ locations, center, zoom }: Props) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    console.log('Locations:', locations);
  }, [locations]);

  if (!mounted) {
    return React.createElement('div', null, 'Loading map...');
  }

  const renderPopupContent = (location: Location) => {
    const basicInfo = [
      React.createElement('h3', { key: 'title' }, location.name),
      React.createElement('p', { key: 'type' }, `Type: ${location.locationType.replace('_', ' ')}`),
      React.createElement('p', { key: 'coords' }, 
        `Coordinates: [${location.location.coordinates[1]}, ${location.location.coordinates[0]}]`)
    ];

    // Add type-specific properties
    const propertyElements = Object.entries(location.properties || {})
      .filter(([key]) => !['id', 'name', 'location'].includes(key))
      .map(([key, value], index) => 
        React.createElement('p', { key: `prop-${index}` },
          `${key.replace(/([A-Z])/g, ' $1').trim()}: ${Array.isArray(value) ? value.join(', ') : value}`
        )
      );

    return React.createElement('div', null, [...basicInfo, ...propertyElements]);
  };

  return React.createElement('div', 
    { style: { height: '100%', width: '100%', position: 'relative' } },
    React.createElement(MapContainer, {
      center,
      zoom,
      style: { height: '100%', width: '100%' },
      scrollWheelZoom: true,
      children: [
        React.createElement(TileLayer, {
          key: 'tile',
          attribution: '© OpenStreetMap contributors',
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        }),
        ...locations.map(location => {
          if (!location.location || !location.location.coordinates) {
            console.warn('Missing location data:', location);
            return null;
          }

          const [lng, lat] = location.location.coordinates;
          
          return React.createElement(CircleMarker, {
            key: location.id,
            center: [lat, lng] as [number, number],
            radius: 8,
            fillColor: getLocationColor(location.locationType, location.properties),
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
            children: React.createElement(Popup, {
              children: renderPopupContent(location)
            })
          });
        }).filter(Boolean)
      ]
    })
  );
};

workimport React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { MineralDeposit } from '../../types/MineralDeposit';
import 'leaflet/dist/leaflet.css';

// Color mapping for different deposit types
const getDepositColor = (depositType: string | null): string => {
  const typeColorMap: Record<string, string> = {
    'Producer': '#FF4500',     // Red-orange for active producers
    'Occurrence': '#4169E1',   // Royal blue for occurrences
    'Past Producer': '#9370DB', // Purple for past producers
    'Prospect': '#32CD32'      // Green for prospects
  };

  if (!depositType) return '#808080'; // Gray for unknown
  return typeColorMap[depositType] || '#808080';
};

interface Props {
  deposits: MineralDeposit[];
  center: [number, number];
  zoom: number;
}

export const Map = ({ deposits, center, zoom }: Props) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return React.createElement('div', null, 'Loading map...');
  }

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
        ...deposits.map(deposit => {
          // Ensure we're using the correct coordinate order [lat, lng] for Leaflet
          const coordinates: [number, number] = [
            deposit.location.coordinates[1],  // Latitude
            deposit.location.coordinates[0]   // Longitude
          ];
          
          return React.createElement(CircleMarker, {
            key: deposit.id,
            center: coordinates,
            radius: 8,
            fillColor: getDepositColor(deposit.depositType),
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
            children: React.createElement(Popup, {
              children: React.createElement('div', null, [
                React.createElement('h3', { key: 'title' }, deposit.name),
                React.createElement('p', { key: 'type' }, `Type: ${deposit.depositType || 'Unknown'}`),
                React.createElement('p', { key: 'commodities' }, `Commodities: ${deposit.commodities || 'Unknown'}`)
              ])
            })
          });
        })
      ]
    })
  );
};

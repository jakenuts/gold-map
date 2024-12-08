import React from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { MineralDeposit } from '../../types/MineralDeposit';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
const DefaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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
        ...deposits.map(deposit => 
          React.createElement(Marker, {
            key: deposit.id,
            position: [deposit.location.coordinates[1], deposit.location.coordinates[0]],
            icon: DefaultIcon,
            children: React.createElement(Popup, {
              children: React.createElement('div', null, [
                React.createElement('h3', { key: 'title' }, deposit.name),
                React.createElement('p', { key: 'type' }, `Type: ${deposit.depositType || 'Unknown'}`),
                React.createElement('p', { key: 'commodities' }, `Commodities: ${deposit.commodities || 'Unknown'}`)
              ])
            })
          })
        )
      ]
    })
  );
};

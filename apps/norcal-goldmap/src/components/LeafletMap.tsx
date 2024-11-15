'use client';

import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';

const LeafletMap = () => {
  return (
    <div className="w-full h-[calc(100vh-64px)]">
      <MapContainer
        center={[39.8283, -120.5283]}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
};

export default LeafletMap;

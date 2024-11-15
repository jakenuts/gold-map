import { useEffect, useState } from 'react';
import { useMap } from '../context/MapContext';
import { useMapInitialization } from '../hooks/useMapInitialization';
import { useMapData } from '../hooks/useMapData';
import { addMiningClaimsLayer, addUSGSRecordsLayer } from '../utils/mapLayers';
import { LoadingIndicator, ErrorDisplay } from './MapOverlays';
import Legend from './Legend';
import { KMLService } from '../services/kmlService';
import 'maplibre-gl/dist/maplibre-gl.css';

const Map = () => {
  const { layers } = useMap();
  const { mapContainer, map, popup } = useMapInitialization();
  const {
    miningClaims,
    usgsRecords,
    isLoadingClaims,
    isLoadingUSGS,
    claimsError
  } = useMapData(map);

  const [testError, setTestError] = useState<string | null>(null);

  // Test KMZ loading directly
  useEffect(() => {
    const testKMZLoading = async () => {
      try {
        console.log('Testing KMZ file loading...');
        const response = await fetch('/data/filtered-norcal-west.kmz');
        if (!response.ok) {
          throw new Error(`Failed to fetch KMZ file: ${response.status} ${response.statusText}`);
        }
        const data = await response.arrayBuffer();
        console.log('KMZ file loaded successfully, size:', data.byteLength);
        
        // Try parsing the KMZ file
        const claims = await KMLService.parseKMZ('/data/filtered-norcal-west.kmz');
        console.log('KMZ parsing successful, claims:', claims.length);
        setTestError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error loading KMZ file';
        console.error('KMZ test loading failed:', errorMessage);
        setTestError(errorMessage);
      }
    };

    testKMZLoading();
  }, []);

  // Update mining claims layer
  useEffect(() => {
    if (!map.current || !miningClaims) return;
    if (layers.miningClaims) {
      addMiningClaimsLayer(map.current, miningClaims, popup.current!);
    }
  }, [miningClaims, layers.miningClaims]);

  // Update USGS records layer
  useEffect(() => {
    if (!map.current || !usgsRecords) return;
    if (layers.usgsRecords) {
      addUSGSRecordsLayer(map.current, usgsRecords, popup.current!);
    }
  }, [usgsRecords, layers.usgsRecords]);

  return (
    <div className="absolute inset-0 flex flex-col">
      <div ref={mapContainer} className="flex-1 relative">
        <div className="absolute inset-0">
          {/* Map will be rendered here */}
        </div>
        
        {/* Overlays */}
        <div className="absolute top-0 right-0 z-10 p-4 space-y-4">
          {(isLoadingClaims || isLoadingUSGS) && <LoadingIndicator />}
          {claimsError && <ErrorDisplay error={claimsError as Error} />}
          {testError && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg">
              <p className="font-bold">KMZ Loading Test Error:</p>
              <p className="text-sm">{testError}</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10">
          <Legend />
        </div>
      </div>
    </div>
  );
};

export default Map;

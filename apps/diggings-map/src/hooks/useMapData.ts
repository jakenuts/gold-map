import { useQuery } from '@tanstack/react-query';
import { MiningClaim, FilterState } from '../types';
import { api } from '../services/api';
import { useMap } from '../context/MapContext';
import { RefObject } from 'react';
import maplibregl from 'maplibre-gl';

const filterMiningClaims = (claims: MiningClaim[], filters: FilterState): MiningClaim[] => {
  console.log('Filtering claims:', {
    totalClaims: claims.length,
    filters
  });
 
  const filtered = claims.filter(claim => {
    if (filters.locationType !== 'all' && claim.locationType !== filters.locationType) return false;
    if (filters.status !== 'all' && claim.status !== filters.status) return false;
    if (filters.year !== 'all') {
      const claimYear = new Date(claim.filingDate).getFullYear().toString();
      if (claimYear !== filters.year) return false;
    }
    return true;
  });

  console.log('Filtered claims:', {
    remainingClaims: filtered.length,
    locationTypes: [...new Set(filtered.map(c => c.locationType))],
    statuses: [...new Set(filtered.map(c => c.status))]
  });

  return filtered;
};

export const useMapData = (mapRef: RefObject<maplibregl.Map>) => {
  const { layers, filters, viewport } = useMap();

  console.log('Map data hook state:', {
    layers,
    viewport,
    mapInitialized: !!mapRef.current
  });

  // Query for mining claims data
  const { 
    data: miningClaims, 
    isLoading: isLoadingClaims, 
    error: claimsError 
  } = useQuery({
    queryKey: ['miningClaims', viewport, filters],
    queryFn: async () => {
      if (!mapRef.current) {
        console.log('Map not initialized yet');
        return [];
      }

      const bounds = mapRef.current.getBounds();
      console.log('Fetching claims for bounds:', {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        center: mapRef.current.getCenter(),
        zoom: mapRef.current.getZoom()
      });

      try {
        const claims = await api.getMiningClaims({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
        console.log('Received claims:', {
          total: claims.length,
          sample: claims.slice(0, 3)
        });
        return filterMiningClaims(claims, filters);
      } catch (error) {
        console.error('Error fetching claims:', error);
        throw error;
      }
    },
    enabled: !!mapRef.current && layers.miningClaims,
    retry: 1,
  });

  // Query for USGS records
  const { 
    data: usgsRecords, 
    isLoading: isLoadingUSGS 
  } = useQuery({
    queryKey: ['usgsRecords', viewport],
    queryFn: () => {
      if (!mapRef.current) {
        console.log('Map not initialized yet for USGS records');
        return [];
      }
      console.log('Fetching USGS records');
      return api.getUSGSRecords();
    },
    enabled: !!mapRef.current && layers.usgsRecords,
  });

  return {
    miningClaims,
    usgsRecords,
    isLoadingClaims,
    isLoadingUSGS,
    claimsError
  };
};

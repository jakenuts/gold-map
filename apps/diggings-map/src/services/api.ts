import { MiningClaim, USGSRecord } from '../types';
import { KMLService } from './kmlService';

// Cache for loaded KML data
let cachedClaims: MiningClaim[] | null = null;

interface API {
  getMiningClaims(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<MiningClaim[]>;
  getUSGSRecords(): Promise<USGSRecord[]>;
}

export const api: API = {
  async getMiningClaims(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<MiningClaim[]> {
    try {
      // Load and cache KML data if not already loaded
      if (!cachedClaims) {
        console.log('No cached claims found, loading KMZ data...');
        try {
          // Clear any existing cache
          cachedClaims = null;
          
          cachedClaims = await KMLService.parseKMZ('/data/filtered-norcal-west.kmz');
          console.log('Successfully loaded and cached claims:', {
            total: cachedClaims.length,
            bounds: {
              north: Math.max(...cachedClaims.map(c => c.latitude)),
              south: Math.min(...cachedClaims.map(c => c.latitude)),
              east: Math.max(...cachedClaims.map(c => c.longitude)),
              west: Math.min(...cachedClaims.map(c => c.longitude))
            },
            locationTypes: [...new Set(cachedClaims.map(c => c.locationType))],
            claimTypes: [...new Set(cachedClaims.map(c => c.claimType))],
            statuses: [...new Set(cachedClaims.map(c => c.status))]
          });

          // Log the first few claims to help debug
          console.log('Sample claims:', cachedClaims.slice(0, 3).map(c => ({
            name: c.claimName,
            locationType: c.locationType,
            claimType: c.claimType,
            status: c.status,
            coords: [c.longitude, c.latitude]
          })));

        } catch (err) {
          const error = err instanceof Error ? err : new Error('Unknown error loading KMZ file');
          console.error('Error loading KMZ file:', error);
          throw new Error(`Failed to load mining claims data: ${error.message}`);
        }
      }

      // Filter claims based on viewport bounds
      console.log('Filtering claims by bounds:', bounds);
      const filteredClaims = (cachedClaims || []).filter(claim => 
        claim.latitude >= bounds.south &&
        claim.latitude <= bounds.north &&
        claim.longitude >= bounds.west &&
        claim.longitude <= bounds.east
      );

      console.log('Filtered claims:', {
        total: filteredClaims.length,
        locationTypes: [...new Set(filteredClaims.map(c => c.locationType))],
        sample: filteredClaims.slice(0, 3).map(c => ({
          name: c.claimName,
          locationType: c.locationType,
          status: c.status,
          coords: [c.longitude, c.latitude]
        }))
      });

      return filteredClaims;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error in getMiningClaims');
      console.error('Error in getMiningClaims:', error);
      throw error;
    }
  },

  async getUSGSRecords(): Promise<USGSRecord[]> {
    // For now, return empty array as we're focusing on KMZ data
    return [];
  }
};

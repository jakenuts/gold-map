import { MiningClaim, USGSRecord } from '../types';
import { KMLService } from './kmlService';

// Cache for loaded KML data
let cachedClaims: MiningClaim[] | null = null;

export const api = {
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
          cachedClaims = await KMLService.parseKMZ('/data/filtered-norcal-west.kmz');
          console.log('Successfully loaded and cached claims:', {
            total: cachedClaims.length,
            bounds: {
              north: Math.max(...cachedClaims.map(c => c.latitude)),
              south: Math.min(...cachedClaims.map(c => c.latitude)),
              east: Math.max(...cachedClaims.map(c => c.longitude)),
              west: Math.min(...cachedClaims.map(c => c.longitude))
            },
            types: [...new Set(cachedClaims.map(c => c.claimType))],
            statuses: [...new Set(cachedClaims.map(c => c.status))]
          });
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
        sample: filteredClaims.slice(0, 3)
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

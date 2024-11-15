import { MiningClaim, USGSRecord } from '../types';

// Simulated data for development
const generateMockMiningClaims = (count: number): MiningClaim[] => {
  const claimTypes = ['lode', 'placer', 'mill', 'tunnel'] as const;
  const statuses = ['active', 'closed', 'void'] as const;
  
  return Array.from({ length: count }, (_, i) => ({
    id: `claim-${i}`,
    claimId: `BLM-${Math.random().toString(36).substr(2, 9)}`,
    claimName: `Test Claim ${i}`,
    claimType: claimTypes[Math.floor(Math.random() * claimTypes.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    township: `T${Math.floor(Math.random() * 40 + 1)}N`,
    range: `R${Math.floor(Math.random() * 40 + 1)}E`,
    section: String(Math.floor(Math.random() * 36 + 1)),
    latitude: 36.7783 + (Math.random() - 0.5) * 2,
    longitude: -119.4179 + (Math.random() - 0.5) * 2,
    filingDate: new Date(2020 + Math.floor(Math.random() * 4), 
                        Math.floor(Math.random() * 12), 
                        Math.floor(Math.random() * 28)).toISOString(),
    lastUpdated: new Date().toISOString()
  }));
};

const generateMockUSGSRecords = (count: number): USGSRecord[] => {
  const commodities = ['Gold', 'Silver', 'Copper', 'Iron'];
  const operationTypes = ['Surface', 'Underground', 'Both'];
  const statuses = ['Active', 'Inactive', 'Historical'];

  return Array.from({ length: count }, (_, i) => ({
    id: `usgs-${i}`,
    siteId: `USGS-${Math.random().toString(36).substr(2, 9)}`,
    siteName: `USGS Site ${i}`,
    commodityTypes: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 },
      () => commodities[Math.floor(Math.random() * commodities.length)]
    ),
    operationType: operationTypes[Math.floor(Math.random() * operationTypes.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    latitude: 36.7783 + (Math.random() - 0.5) * 2,
    longitude: -119.4179 + (Math.random() - 0.5) * 2,
    lastUpdated: new Date().toISOString()
  }));
};

export const api = {
  async getMiningClaims(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<MiningClaim[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const claims = generateMockMiningClaims(100);
    return claims.filter(claim => 
      claim.latitude >= bounds.south &&
      claim.latitude <= bounds.north &&
      claim.longitude >= bounds.west &&
      claim.longitude <= bounds.east
    );
  },

  async getUSGSRecords(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<USGSRecord[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const records = generateMockUSGSRecords(50);
    return records.filter(record =>
      record.latitude >= bounds.south &&
      record.latitude <= bounds.north &&
      record.longitude >= bounds.west &&
      record.longitude <= bounds.east
    );
  }
};

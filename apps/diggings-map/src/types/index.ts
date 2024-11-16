export type LocationType = 'mine' | 'prospect' | 'past producer' | 'producer' | 'occurrence' | 'mineral location' | 'mineral deposit' | 'claim' | 'default';

export interface MiningClaim {
  id: string;
  claimId: string;
  claimName: string;
  claimType: 'lode' | 'placer' | 'mill' | 'tunnel';
  locationType: LocationType;  // Added this field
  status: 'active' | 'closed' | 'void';
  township: string;
  range: string;
  section: string;
  latitude: number;
  longitude: number;
  filingDate: string;
  lastUpdated: string;
}

export interface USGSRecord {
  id: string;
  siteId: string;
  siteName: string;
  commodityTypes: string[];
  operationType: string;
  status: string;
  latitude: number;
  longitude: number;
  lastUpdated: string;
}

export interface LayerState {
  miningClaims: boolean;
  usgsRecords: boolean;
}

export interface FilterState {
  claimType: string;
  status: string;
  year: string;
}

export interface MapContextType {
  layers: LayerState;
  setLayers: (layers: LayerState) => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  viewport: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  setViewport: (viewport: { longitude: number; latitude: number; zoom: number }) => void;
}

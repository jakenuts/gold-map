export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface MineralDeposit {
  id: string;
  name: string;
  depositType: string | null;
  commodities: string | null;
  location: GeoPoint;
  properties: Record<string, any>;
  source: string;
  sourceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

import { GeoLocation } from './GeoLocation.js';
export declare class DataSource {
    id: string;
    name: string;
    description: string;
    url: string;
    config: Record<string, any>;
    locations: GeoLocation[];
    createdAt: Date;
    updatedAt: Date;
}

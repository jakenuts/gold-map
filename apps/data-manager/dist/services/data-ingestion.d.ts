import { GeoLocation } from '../entities/GeoLocation.js';
import { DataSource as GeoDataSource } from '../entities/DataSource.js';
export declare class DataIngestionService {
    private mrdsClient;
    private depositClient;
    private geoLocationRepository;
    private dataSourceRepository;
    constructor();
    private ensureDataSource;
    ingestUSGSData(bbox?: string): Promise<GeoLocation[]>;
    private prepareLocations;
    getLocationsInBoundingBox(minLon: number, minLat: number, maxLon: number, maxLat: number, category?: string, subcategory?: string): Promise<GeoLocation[]>;
    getAllLocations(category?: string, subcategory?: string): Promise<GeoLocation[]>;
    getDataSources(): Promise<GeoDataSource[]>;
    getCategories(): Promise<{
        category: string;
        subcategories: string[];
    }[]>;
}

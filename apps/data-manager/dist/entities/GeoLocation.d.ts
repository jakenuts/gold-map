import { DataSource } from './DataSource.js';
export declare class GeoLocation {
    id: string;
    name: string;
    category: string;
    subcategory: string;
    location: any;
    properties: Record<string, any>;
    dataSource: DataSource;
    dataSourceId: string;
    sourceId: string;
    createdAt: Date;
    updatedAt: Date;
}

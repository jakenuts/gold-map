import { WFSClient, Feature } from './wfs-client.js';
export declare class USGSDepositClient extends WFSClient {
    private mapFile;
    constructor();
    protected getRequestParams(bbox: string, format?: string): Record<string, string>;
    protected parseWFSXML(xmlData: string): Feature[];
    transformToGeoLocation(feature: Feature): {
        name: any;
        category: string;
        subcategory: any;
        location: {
            type: string;
            coordinates: number[];
        };
        properties: {
            depositType: any;
            commodities: any;
            developmentStatus: any;
        };
        sourceId: any;
    };
}

import { WFSClient, Feature } from './wfs-client.js';
export declare class USGSMRDSClient extends WFSClient {
    constructor();
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
            commodities: any;
        };
        sourceId: any;
    };
}

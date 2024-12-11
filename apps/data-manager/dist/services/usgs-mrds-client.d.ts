import { WFSClient, Feature } from './wfs-client.js';
export declare class USGSMRDSClient extends WFSClient {
    constructor();
    private parseCoordinates;
    private extractCoordinates;
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

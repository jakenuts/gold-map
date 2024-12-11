import { z } from 'zod';
export declare const FeatureSchema: z.ZodObject<{
    type: z.ZodLiteral<"Feature">;
    geometry: z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>;
    properties: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    type: "Feature";
    geometry: {
        type: "Point";
        coordinates: [number, number];
    };
    properties: Record<string, any>;
}, {
    type: "Feature";
    geometry: {
        type: "Point";
        coordinates: [number, number];
    };
    properties: Record<string, any>;
}>;
export type Feature = z.infer<typeof FeatureSchema>;
export declare class USGSDepositClient {
    private endpoint;
    private baseUrl;
    private typeName;
    private timeout;
    private xmlParser;
    constructor();
    private withTimeout;
    getFeatures(bbox?: string): Promise<Feature[]>;
    private parseWFSXML;
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

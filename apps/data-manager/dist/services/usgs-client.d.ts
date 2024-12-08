import { z } from 'zod';
declare const GeoJSONFeature: z.ZodObject<{
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
export type USGSFeature = z.infer<typeof GeoJSONFeature>;
export declare class USGSClient {
    private baseUrl;
    private defaultBBox;
    constructor();
    getMineralDeposits(bbox?: string): Promise<{
        type: "Feature";
        geometry: {
            type: "Point";
            coordinates: [number, number];
        };
        properties: Record<string, any>;
    }[]>;
    private getTestData;
    transformToMineralDeposit(feature: USGSFeature): {
        name: any;
        depositType: any;
        commodities: any;
        location: {
            type: string;
            coordinates: [number, number];
        };
        properties: Record<string, any>;
        source: string;
        sourceId: any;
    };
}
export {};

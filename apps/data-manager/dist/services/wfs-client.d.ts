import { z } from 'zod';
import { XMLParser } from 'fast-xml-parser';
export declare const GeoJSONFeature: z.ZodObject<{
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
export declare const GeoJSONFeatureCollection: z.ZodObject<{
    type: z.ZodLiteral<"FeatureCollection">;
    features: z.ZodArray<z.ZodObject<{
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
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "FeatureCollection";
    features: {
        type: "Feature";
        geometry: {
            type: "Point";
            coordinates: [number, number];
        };
        properties: Record<string, any>;
    }[];
}, {
    type: "FeatureCollection";
    features: {
        type: "Feature";
        geometry: {
            type: "Point";
            coordinates: [number, number];
        };
        properties: Record<string, any>;
    }[];
}>;
export type Feature = z.infer<typeof GeoJSONFeature>;
export declare abstract class WFSClient {
    protected baseUrl: string;
    protected defaultBBox: string;
    protected xmlParser: XMLParser;
    protected typeName: string;
    constructor(baseUrl: string, typeName: string);
    protected abstract parseWFSXML(xmlData: string): Feature[];
    abstract transformToGeoLocation(feature: Feature): any;
    protected formatBBox(bbox?: string): string;
    protected getRequestParams(bbox: string, format?: string): Record<string, string>;
    getFeatures(bbox?: string): Promise<Feature[]>;
}

import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
export type WFSVersion = '1.0.0' | '1.1.0';
export type WFSOperation = 'GetCapabilities' | 'GetFeature' | 'DescribeFeatureType';
export interface BoundingBox {
    minLon: number;
    minLat: number;
    maxLon: number;
    maxLat: number;
}
export interface WFSClientConfig {
    baseUrl: string;
    version?: WFSVersion;
    typeName: string;
    defaultBBox?: BoundingBox;
    srsName?: string;
    maxFeatures?: number;
}
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
export type Feature = z.infer<typeof GeoJSONFeature>;
/**
 * Base WFS client that handles common WFS operations
 */
export declare class WFSBaseClient {
    protected baseUrl: string;
    protected version: WFSVersion;
    protected typeName: string;
    protected srsName: string;
    protected defaultBBox: BoundingBox;
    protected xmlParser: XMLParser;
    protected maxFeatures: number;
    constructor(config: WFSClientConfig);
    /**
     * Format bounding box based on WFS version
     * WFS 1.0.0: minx,miny,maxx,maxy
     * WFS 1.1.0: miny,minx,maxy,maxx
     */
    protected formatBBox(bbox?: BoundingBox): string;
    /**
     * Validate coordinate values
     */
    protected isValidCoordinates(bbox: BoundingBox): boolean;
    /**
     * Build request parameters for WFS operation
     */
    protected getRequestParams(operation: WFSOperation, bbox?: BoundingBox, additionalParams?: Record<string, string>): Record<string, string>;
    /**
     * Check for WFS service exceptions in XML response
     */
    protected checkServiceException(xmlData: string): void;
    /**
     * Make WFS request and return raw XML response
     */
    protected makeRequest(operation: WFSOperation, bbox?: BoundingBox, additionalParams?: Record<string, string>): Promise<string>;
    /**
     * Get raw XML response for GetCapabilities
     */
    getCapabilities(): Promise<string>;
    /**
     * Get raw XML response for GetFeature
     */
    getFeatures(bbox?: BoundingBox, additionalParams?: Record<string, string>): Promise<string>;
    /**
     * Get raw XML response for DescribeFeatureType
     */
    describeFeatureType(): Promise<string>;
}

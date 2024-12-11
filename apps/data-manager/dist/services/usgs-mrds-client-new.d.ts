import { WFSBaseClient, Feature as BaseFeature, BoundingBox } from './wfs-base-client.js';
import { z } from 'zod';
declare const MRDSProperties: z.ZodObject<{
    name: z.ZodString;
    dep_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    commod1: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    site_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    development_status: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    state: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    county: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ftr_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ftr_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ftr_azimut: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    topo_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    topo_date: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    topo_scale: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    compiledby: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    remarks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    gda_id: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    scanid: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    original_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    group: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    geometry_type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    feature_class: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id?: string | null | undefined;
    category?: string | null | undefined;
    dep_type?: string | null | undefined;
    commod1?: string | null | undefined;
    site_type?: string | null | undefined;
    development_status?: string | null | undefined;
    state?: string | null | undefined;
    county?: string | null | undefined;
    ftr_type?: string | null | undefined;
    ftr_name?: string | null | undefined;
    ftr_azimut?: number | null | undefined;
    topo_name?: string | null | undefined;
    topo_date?: number | null | undefined;
    topo_scale?: string | null | undefined;
    compiledby?: string | null | undefined;
    remarks?: string | null | undefined;
    gda_id?: number | null | undefined;
    scanid?: number | null | undefined;
    original_type?: string | null | undefined;
    group?: string | null | undefined;
    geometry_type?: string | null | undefined;
    feature_class?: string | null | undefined;
}, {
    name: string;
    id?: string | null | undefined;
    category?: string | null | undefined;
    dep_type?: string | null | undefined;
    commod1?: string | null | undefined;
    site_type?: string | null | undefined;
    development_status?: string | null | undefined;
    state?: string | null | undefined;
    county?: string | null | undefined;
    ftr_type?: string | null | undefined;
    ftr_name?: string | null | undefined;
    ftr_azimut?: number | null | undefined;
    topo_name?: string | null | undefined;
    topo_date?: number | null | undefined;
    topo_scale?: string | null | undefined;
    compiledby?: string | null | undefined;
    remarks?: string | null | undefined;
    gda_id?: number | null | undefined;
    scanid?: number | null | undefined;
    original_type?: string | null | undefined;
    group?: string | null | undefined;
    geometry_type?: string | null | undefined;
    feature_class?: string | null | undefined;
}>;
export type MRDSFeature = BaseFeature & {
    properties: z.infer<typeof MRDSProperties>;
};
export type Feature = BaseFeature;
export declare class USGSMRDSClient extends WFSBaseClient {
    constructor();
    /**
     * Parse bbox string into BoundingBox object
     */
    private parseBBox;
    /**
     * Get raw XML response from WFS
     */
    getFeatures(bbox?: BoundingBox, additionalParams?: Record<string, string>): Promise<string>;
    /**
     * Get MRDS features as parsed objects
     */
    getMRDSFeatures(bbox?: string | BoundingBox): Promise<MRDSFeature[]>;
    /**
     * Parse coordinates from MRDS format
     */
    private parseCoordinates;
    /**
     * Transform MRDS feature to GeoLocation format
     */
    transformToGeoLocation(feature: MRDSFeature): {
        name: string;
        category: string;
        subcategory: string;
        location: {
            type: string;
            coordinates: [number, number];
        };
        properties: {
            name: string;
            id?: string | null | undefined;
            category?: string | null | undefined;
            dep_type?: string | null | undefined;
            commod1?: string | null | undefined;
            site_type?: string | null | undefined;
            development_status?: string | null | undefined;
            state?: string | null | undefined;
            county?: string | null | undefined;
            ftr_type?: string | null | undefined;
            ftr_name?: string | null | undefined;
            ftr_azimut?: number | null | undefined;
            topo_name?: string | null | undefined;
            topo_date?: number | null | undefined;
            topo_scale?: string | null | undefined;
            compiledby?: string | null | undefined;
            remarks?: string | null | undefined;
            gda_id?: number | null | undefined;
            scanid?: number | null | undefined;
            original_type?: string | null | undefined;
            group?: string | null | undefined;
            geometry_type?: string | null | undefined;
            feature_class?: string | null | undefined;
            depositType: string | null | undefined;
            commodities: string | null | undefined;
            developmentStatus: string | null | undefined;
        };
        sourceId: string | null;
    };
}
export {};

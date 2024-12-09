import axios from 'axios';
import { z } from 'zod';
import { XMLParser } from 'fast-xml-parser';
export const GeoJSONFeature = z.object({
    type: z.literal('Feature'),
    geometry: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()]),
    }),
    properties: z.record(z.any()),
});
export const GeoJSONFeatureCollection = z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(GeoJSONFeature),
});
export class WFSClient {
    baseUrl;
    defaultBBox;
    xmlParser;
    typeName;
    constructor(baseUrl, typeName) {
        this.baseUrl = baseUrl;
        this.typeName = typeName;
        this.defaultBBox = '-124.407182,40.071180,-122.393331,41.740961';
        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: true,
            textNodeName: '_text',
            isArray: (name) => ['featureMember', 'coordinates'].indexOf(name) !== -1
        });
        console.log(`WFS Client initialized for ${typeName} with:`, {
            baseUrl: this.baseUrl,
            defaultBBox: this.defaultBBox,
        });
    }
    formatBBox(bbox) {
        if (!bbox)
            return this.defaultBBox;
        // Remove any extra whitespace
        const trimmed = bbox.trim();
        // If already properly formatted with commas, return as is
        if (/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/.test(trimmed)) {
            return trimmed;
        }
        // Try to parse space-separated format
        const parts = trimmed.split(/\s+/);
        if (parts.length === 4 && parts.every(part => /^-?\d+\.?\d*$/.test(part))) {
            return parts.join(',');
        }
        console.warn('Invalid bounding box format, using default:', trimmed);
        return this.defaultBBox;
    }
    async getFeatures(bbox) {
        try {
            const effectiveBBox = this.formatBBox(bbox);
            console.log(`Fetching ${this.typeName} data with bbox:`, effectiveBBox);
            // Try XML first since it's more reliable
            console.log('Attempting XML request...');
            const xmlResponse = await axios.get(this.baseUrl, {
                params: {
                    service: 'WFS',
                    version: '1.0.0',
                    request: 'GetFeature',
                    typeName: this.typeName,
                    bbox: effectiveBBox,
                    srsName: 'EPSG:4326' // Explicitly request coordinates in WGS84
                },
                headers: {
                    'Accept': 'application/xml'
                }
            });
            if (typeof xmlResponse.data === 'string') {
                console.log('XML response received, parsing...');
                console.log('Raw XML response:', xmlResponse.data.substring(0, 1000) + '...'); // Log first 1000 chars of XML
                // Check for service exceptions
                if (xmlResponse.data.includes('ServiceExceptionReport')) {
                    console.error('WFS service returned an exception:', xmlResponse.data);
                    throw new Error(`WFS service error for ${this.typeName}`);
                }
                const features = this.parseWFSXML(xmlResponse.data);
                if (features.length > 0) {
                    console.log(`Successfully parsed ${features.length} features from XML`);
                    return features;
                }
                console.log('No features found in XML response');
            }
            // If XML fails, try JSON
            console.log('XML parsing failed or empty, attempting JSON request...');
            const jsonResponse = await axios.get(this.baseUrl, {
                params: {
                    service: 'WFS',
                    version: '1.0.0',
                    request: 'GetFeature',
                    typeName: this.typeName,
                    bbox: effectiveBBox,
                    outputFormat: 'application/json',
                    srsName: 'EPSG:4326'
                },
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (typeof jsonResponse.data === 'string') {
                try {
                    const parsedData = JSON.parse(jsonResponse.data);
                    console.log('JSON response parsed, validating...');
                    const jsonResult = GeoJSONFeatureCollection.safeParse(parsedData);
                    if (jsonResult.success) {
                        console.log(`Successfully parsed ${jsonResult.data.features.length} features from JSON`);
                        return jsonResult.data.features;
                    }
                    console.log('JSON validation failed:', jsonResult.error);
                }
                catch (e) {
                    console.log('Failed to parse JSON string:', e);
                }
            }
            else {
                console.log('JSON response received, validating...');
                const jsonResult = GeoJSONFeatureCollection.safeParse(jsonResponse.data);
                if (jsonResult.success) {
                    console.log(`Successfully parsed ${jsonResult.data.features.length} features from JSON`);
                    return jsonResult.data.features;
                }
                console.log('JSON validation failed:', jsonResult.error);
            }
            throw new Error(`Failed to parse both XML and JSON responses from ${this.typeName} API`);
        }
        catch (error) {
            console.error(`Error in get${this.typeName}:`, error);
            if (axios.isAxiosError(error)) {
                console.error('Axios error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                });
            }
            throw error;
        }
    }
}
//# sourceMappingURL=wfs-client.js.map
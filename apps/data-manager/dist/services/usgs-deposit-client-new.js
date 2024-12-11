import { WfsEndpoint } from '@camptocamp/ogc-client';
import { z } from 'zod';
import { XMLParser } from 'fast-xml-parser';
export const FeatureSchema = z.object({
    type: z.literal('Feature'),
    geometry: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()]),
    }),
    properties: z.record(z.any()),
});
export class USGSDepositClient {
    endpoint;
    baseUrl;
    typeName;
    timeout = 60000; // 60 seconds timeout
    xmlParser;
    constructor() {
        this.baseUrl = process.env.USGS_DEPOSIT_BASE_URL || 'https://mrdata.usgs.gov/services/wfs/deposit';
        this.typeName = 'points'; // Changed from 'deposit' to 'points'
        this.endpoint = new WfsEndpoint(this.baseUrl);
        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: true,
            textNodeName: '_text',
            isArray: (name) => ['featureMember', 'coordinates'].indexOf(name) !== -1,
            trimValues: true
        });
        console.log('Deposit Client initialized with:', {
            baseUrl: this.baseUrl,
            typeName: this.typeName
        });
    }
    async withTimeout(promise, timeoutMs, operation) {
        let timeoutHandle;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutHandle = setTimeout(() => {
                reject(new Error(`Operation timed out after ${timeoutMs}ms: ${operation}`));
            }, timeoutMs);
        });
        try {
            const result = await Promise.race([promise, timeoutPromise]);
            clearTimeout(timeoutHandle);
            return result;
        }
        catch (error) {
            clearTimeout(timeoutHandle);
            throw error;
        }
    }
    async getFeatures(bbox) {
        try {
            // Use XML format directly
            const params = new URLSearchParams({
                service: 'WFS',
                version: '1.0.0',
                request: 'GetFeature',
                typeName: this.typeName,
                srsName: 'EPSG:4326'
            });
            if (bbox) {
                // Format bbox with proper commas
                const formattedBbox = bbox.split(',').map(n => parseFloat(n).toFixed(6)).join(',');
                params.append('bbox', formattedBbox);
            }
            const url = `${this.baseUrl}?${params.toString()}`;
            console.log('Deposit: Making request:', url);
            const response = await this.withTimeout(fetch(url), this.timeout, 'WFS GetFeature request');
            console.log('Deposit: Response status:', response.status);
            const xmlText = await response.text();
            if (!response.ok) {
                throw new Error(`WFS request failed: ${response.status} ${response.statusText}\n${xmlText}`);
            }
            const features = this.parseWFSXML(xmlText);
            console.log(`Deposit: Parsed ${features.length} features from XML`);
            return features;
        }
        catch (error) {
            console.error('Deposit: Error fetching features:', error);
            throw error;
        }
    }
    parseWFSXML(xmlData) {
        try {
            console.log('Deposit: Parsing XML response...');
            const parsed = this.xmlParser.parse(xmlData);
            const featureMembers = parsed?.['wfs:FeatureCollection']?.['gml:featureMember'] ||
                parsed?.['FeatureCollection']?.['featureMember'] || [];
            const featureArray = Array.isArray(featureMembers) ? featureMembers : [featureMembers];
            console.log(`Deposit: Found ${featureArray.length} features in XML`);
            return featureArray
                .map((feature) => {
                const deposit = feature?.['points'] || feature?.['ms:points'] ||
                    feature?.['deposit'] || feature?.['ms:deposit'];
                if (!deposit) {
                    console.log('Deposit: No deposit data found in feature');
                    return null;
                }
                // Try to get coordinates from various possible paths
                let coordinates = null;
                // Try gml:Point/gml:coordinates
                const pointCoords = deposit?.['gml:Point']?.['gml:coordinates']?._text ||
                    deposit?.['Point']?.['coordinates']?._text;
                if (pointCoords) {
                    const parts = pointCoords.trim().split(/[,\s]+/).map(Number);
                    if (parts.length === 2 && !parts.some(isNaN)) {
                        coordinates = [parts[0], parts[1]];
                    }
                }
                // Try direct LAT/LONG fields if Point coordinates not found
                if (!coordinates) {
                    const lat = parseFloat(deposit?.['LAT']?._text || deposit?.['lat']?._text);
                    const lon = parseFloat(deposit?.['LONG']?._text || deposit?.['long']?._text);
                    if (!isNaN(lat) && !isNaN(lon)) {
                        coordinates = [lon, lat];
                    }
                }
                if (!coordinates) {
                    console.log('Deposit: No valid coordinates found in feature');
                    return null;
                }
                const geoJSONFeature = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: coordinates,
                    },
                    properties: {
                        name: deposit?.['NAME']?._text || deposit?.['name']?._text || 'Unknown',
                        deposit_type: deposit?.['DEPOSIT_TYPE']?._text || deposit?.['deposit_type']?._text || null,
                        commodities: deposit?.['COMMODITIES']?._text || deposit?.['commodities']?._text || null,
                        id: deposit?.['ID']?._text || deposit?.['id']?._text || null,
                        site_type: deposit?.['SITE_TYPE']?._text || deposit?.['site_type']?._text || null,
                        development_status: deposit?.['DEV_STATUS']?._text || deposit?.['dev_status']?._text || null,
                        state: deposit?.['STATE']?._text || null,
                        county: deposit?.['COUNTY']?._text || null,
                    },
                };
                return geoJSONFeature;
            })
                .filter((feature) => feature !== null);
        }
        catch (error) {
            console.error('Deposit: Error parsing XML:', error);
            return [];
        }
    }
    transformToGeoLocation(feature) {
        const { geometry, properties } = feature;
        // Extract common properties
        const name = properties.name || 'Unknown Deposit';
        const siteType = properties.site_type || null;
        const depositType = properties.deposit_type || null;
        const commodities = properties.commodities || null;
        // Create point geometry in PostGIS format
        const [longitude, latitude] = geometry.coordinates;
        const location = {
            type: 'Point',
            coordinates: [longitude, latitude],
        };
        // Return transformed data matching GeoLocation schema
        return {
            name,
            category: 'deposit',
            subcategory: siteType || depositType || 'unknown',
            location,
            properties: {
                depositType,
                commodities,
                developmentStatus: properties.development_status,
                ...properties,
            },
            sourceId: properties.id?.toString() || null,
        };
    }
}
//# sourceMappingURL=usgs-deposit-client-new.js.map
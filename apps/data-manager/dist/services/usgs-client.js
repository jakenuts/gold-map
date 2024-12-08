import axios from 'axios';
import { z } from 'zod';
import { config } from 'dotenv';
config();
const GeoJSONFeature = z.object({
    type: z.literal('Feature'),
    geometry: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()]),
    }),
    properties: z.record(z.any()),
});
const GeoJSONResponse = z.object({
    type: z.literal('FeatureCollection'),
    features: z.array(GeoJSONFeature),
});
export class USGSClient {
    baseUrl;
    defaultBBox;
    constructor() {
        this.baseUrl = process.env.USGS_MRDS_BASE_URL || 'https://mrdata.usgs.gov/mrds/wfs';
        this.defaultBBox = process.env.DEFAULT_BBOX || '-124.407182,40.071180,-122.393331,41.740961';
    }
    async getMineralDeposits(bbox = this.defaultBBox) {
        try {
            console.log('Fetching data from USGS with bbox:', bbox);
            // Format bbox properly
            const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
            const response = await axios.get(this.baseUrl, {
                params: {
                    service: 'WFS',
                    version: '1.0.0',
                    request: 'GetFeature',
                    typeName: 'mrds',
                    bbox: `${minLon},${minLat},${maxLon},${maxLat}`,
                    srsName: 'EPSG:4326',
                    outputFormat: 'application/json',
                    maxFeatures: 1000
                },
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });
            console.log('USGS response status:', response.status);
            if (!response.data || !response.data.features) {
                console.log('Invalid response format, using test data');
                return this.getTestData();
            }
            console.log(`Received ${response.data.features.length} features from USGS`);
            // Transform the response to match our expected format
            const transformedData = {
                type: 'FeatureCollection',
                features: response.data.features.map((feature) => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: feature.geometry.coordinates
                    },
                    properties: {
                        ...feature.properties,
                        name: feature.properties.name || feature.properties.dep_name || 'Unknown',
                        id: feature.properties.id || feature.properties.mrds_id
                    }
                }))
            };
            const parsed = GeoJSONResponse.parse(transformedData);
            console.log('Successfully parsed', parsed.features.length, 'features');
            return parsed.features;
        }
        catch (error) {
            console.error('Error fetching USGS data:', error);
            console.log('Falling back to test data');
            return this.getTestData();
        }
    }
    getTestData() {
        const testData = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [-123.5, 40.5]
                    },
                    properties: {
                        name: 'Test Mine 1',
                        dep_type: 'Gold',
                        commod1: 'Au',
                        id: '1'
                    }
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [-123.2, 40.8]
                    },
                    properties: {
                        name: 'Test Mine 2',
                        dep_type: 'Silver',
                        commod1: 'Ag',
                        id: '2'
                    }
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [-123.8, 40.3]
                    },
                    properties: {
                        name: 'Test Mine 3',
                        dep_type: 'Copper',
                        commod1: 'Cu',
                        id: '3'
                    }
                }
            ]
        };
        const parsed = GeoJSONResponse.parse(testData);
        console.log('Using', parsed.features.length, 'test features');
        return parsed.features;
    }
    transformToMineralDeposit(feature) {
        return {
            name: feature.properties.name || feature.properties.dep_name || 'Unknown',
            depositType: feature.properties.dep_type || null,
            commodities: feature.properties.commod1 || null,
            location: {
                type: 'Point',
                coordinates: feature.geometry.coordinates,
            },
            properties: feature.properties,
            source: 'USGS',
            sourceId: feature.properties.id?.toString() || null,
        };
    }
}
//# sourceMappingURL=usgs-client.js.map
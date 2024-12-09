import axios from 'axios';
import { z } from 'zod';
import { config } from 'dotenv';
import { XMLParser } from 'fast-xml-parser';

config();

const GeoJSONFeature = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: z.record(z.any()),
});

const GeoJSONFeatureCollection = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(GeoJSONFeature),
});

export type USGSFeature = z.infer<typeof GeoJSONFeature>;

export class USGSClient {
  private baseUrl: string;
  private defaultBBox: string;
  private xmlParser: XMLParser;

  constructor() {
    this.baseUrl = process.env.USGS_MRDS_BASE_URL || 'https://mrdata.usgs.gov/services/wfs/mrds';
    this.defaultBBox = process.env.DEFAULT_BBOX || '-124.407182,40.071180,-122.393331,41.740961';
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      textNodeName: '_text',
    });

    console.log('USGS Client initialized with:', {
      baseUrl: this.baseUrl,
      defaultBBox: this.defaultBBox,
    });
  }

  private parseWFSXML(xmlData: string): USGSFeature[] {
    try {
      console.log('Parsing XML response...');
      const parsed = this.xmlParser.parse(xmlData);
      console.log('XML parsed structure:', JSON.stringify(parsed, null, 2));

      const features = parsed?.['wfs:FeatureCollection']?.['gml:featureMember'] || [];
      const featureArray = Array.isArray(features) ? features : [features];
      console.log(`Found ${featureArray.length} features in XML`);

      return featureArray
        .map((feature: any) => {
          const mrds = feature?.['mrds:mrds'];
          if (!mrds) {
            console.log('No mrds data found in feature:', feature);
            return null;
          }

          const lat = parseFloat(mrds?.['mrds:LAT']?._text || '0');
          const lon = parseFloat(mrds?.['mrds:LONG']?._text || '0');
          
          if (isNaN(lat) || isNaN(lon)) {
            console.log('Invalid coordinates:', { lat, lon });
            return null;
          }

          const geoJSONFeature: USGSFeature = {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lon, lat] as [number, number],
            },
            properties: {
              name: mrds?.['mrds:NAME']?._text || 'Unknown',
              dep_type: mrds?.['mrds:DEP_TYPE']?._text || null,
              commod1: mrds?.['mrds:COMMOD1']?._text || null,
              id: mrds?.['mrds:ID']?._text || null,
            },
          };

          return geoJSONFeature;
        })
        .filter((feature): feature is USGSFeature => feature !== null);
    } catch (error) {
      console.error('Error parsing XML:', error);
      return [];
    }
  }

  public async getMineralDeposits(bbox?: string): Promise<USGSFeature[]> {
    try {
      console.log('Fetching USGS data with bbox:', bbox || this.defaultBBox);
      
      // Try JSON first
      console.log('Attempting JSON request...');
      const jsonResponse = await axios.get(this.baseUrl, {
        params: {
          service: 'WFS',
          version: '1.0.0',
          request: 'GetFeature',
          typeName: 'mrds',
          bbox: bbox || this.defaultBBox,
          outputFormat: 'application/json',
        },
      });

      console.log('JSON response received, validating...');
      const jsonResult = GeoJSONFeatureCollection.safeParse(jsonResponse.data);
      if (jsonResult.success) {
        console.log(`Successfully parsed ${jsonResult.data.features.length} features from JSON`);
        return jsonResult.data.features;
      }
      console.log('JSON validation failed:', jsonResult.error);

      // If JSON fails, try XML
      console.log('Attempting XML request...');
      const xmlResponse = await axios.get(this.baseUrl, {
        params: {
          service: 'WFS',
          version: '1.0.0',
          request: 'GetFeature',
          typeName: 'mrds',
          bbox: bbox || this.defaultBBox,
        },
      });

      if (typeof xmlResponse.data === 'string') {
        console.log('XML response received, parsing...');
        const features = this.parseWFSXML(xmlResponse.data);
        if (features.length > 0) {
          console.log(`Successfully parsed ${features.length} features from XML`);
          return features;
        }
      }

      console.log('XML response was not a string:', typeof xmlResponse.data);
      throw new Error('Failed to parse both JSON and XML responses from USGS API');
    } catch (error) {
      console.error('Error in getMineralDeposits:', error);
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

  public transformToMineralDeposit(feature: USGSFeature) {
    const { geometry, properties } = feature;

    // Extract common properties
    const name = properties.name || 'Unknown Deposit';
    const depositType = properties.dep_type || null;
    const commodities = properties.commod1 || null;

    // Create point geometry in PostGIS format
    const [longitude, latitude] = geometry.coordinates;
    const location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    // Return transformed data matching GeoLocation schema
    return {
      name,
      locationType: 'mineral_deposit',
      location,
      properties: {
        depositType,
        commodities,
        ...properties,
      },
      source: 'USGS',
      sourceId: properties.id?.toString() || null,
    };
  }
}

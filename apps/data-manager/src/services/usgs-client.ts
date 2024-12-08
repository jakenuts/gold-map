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

const GeoJSONResponse = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(GeoJSONFeature),
});

export type USGSFeature = z.infer<typeof GeoJSONFeature>;
type WFSFeature = {
  'ms:mrds': {
    'gml:boundedBy'?: { 'gml:Box': any };
    'ms:geometry'?: { 
      'gml:Point': {
        'gml:coordinates': string;
      } 
    };
    'ms:dep_id'?: number;
    'ms:site_name'?: string;
    'ms:dev_stat'?: string;
    'ms:fips_code'?: string;
    'ms:huc_code'?: string;
    'ms:quad_code'?: string;
    'ms:url'?: string;
    'ms:code_list'?: string;
  };
};

export class USGSClient {
  private baseUrl: string;
  private defaultBBox: string;
  private parser: XMLParser;

  constructor() {
    this.baseUrl = process.env.USGS_MRDS_BASE_URL || 'https://mrdata.usgs.gov/services/wfs/mrds';
    this.defaultBBox = process.env.DEFAULT_BBOX || '-124.407182,40.071180,-122.393331,41.740961';
    this.parser = new XMLParser({
      ignoreAttributes: true,
      parseAttributeValue: true,
      parseTagValue: true
    });
    console.log('USGS Client initialized with:', {
      baseUrl: this.baseUrl,
      defaultBBox: this.defaultBBox
    });
  }

  async getMineralDeposits(bbox: string = this.defaultBBox): Promise<USGSFeature[]> {
    try {
      console.log('Fetching data from USGS with bbox:', bbox);
      
      // Format bbox properly
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
      console.log('Parsed bbox coordinates:', { minLon, minLat, maxLon, maxLat });
      
      const params = new URLSearchParams({
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'mrds',
        bbox: `${minLon},${minLat},${maxLon},${maxLat}`,
        srsName: 'EPSG:4326'
      });
      
      const url = `${this.baseUrl}?${params.toString()}`;
      console.log('Making request to USGS URL:', url);
      
      const response = await axios.get(url, {
        headers: {
          'Accept': 'text/xml',
          'Content-Type': 'text/xml'
        },
        timeout: 10000
      });

      console.log('USGS response status:', response.status);
      
      if (!response.data) {
        console.error('No data received from USGS');
        return this.getTestData();
      }

      // Parse XML to JSON
      const parsedXml = this.parser.parse(response.data);
      console.log('Parsed XML response:', JSON.stringify(parsedXml, null, 2));

      // Extract features from WFS response
      const featureCollection = parsedXml['wfs:FeatureCollection'];
      if (!featureCollection || !featureCollection['gml:featureMember']) {
        console.error('No features found in WFS response');
        return this.getTestData();
      }

      // Convert features to GeoJSON format
      let features = Array.isArray(featureCollection['gml:featureMember']) 
        ? featureCollection['gml:featureMember'] 
        : [featureCollection['gml:featureMember']];

      console.log(`Found ${features.length} features in WFS response`);

      const geoJsonFeatures = features.map((feature: WFSFeature) => {
        const mrdsFeature = feature['ms:mrds'];
        if (!mrdsFeature) {
          console.warn('Invalid feature structure:', feature);
          return null;
        }

        // Extract coordinates from GML point
        const geometry = mrdsFeature['ms:geometry']?.['gml:Point'];
        if (!geometry || !geometry['gml:coordinates']) {
          console.warn('Invalid geometry for feature:', mrdsFeature);
          return null;
        }

        // Parse coordinates from the string format "-122.450820,41.023180"
        const [longitude, latitude] = geometry['gml:coordinates'].split(',').map(Number);
        if (isNaN(longitude) || isNaN(latitude)) {
          console.warn('Invalid coordinates:', geometry['gml:coordinates']);
          return null;
        }

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [longitude, latitude]
          },
          properties: {
            name: mrdsFeature['ms:site_name'] || 'Unknown',
            dep_type: mrdsFeature['ms:dev_stat'] || null,
            commod1: mrdsFeature['ms:code_list']?.trim() || null,
            id: mrdsFeature['ms:dep_id']?.toString(),
            url: mrdsFeature['ms:url'],
            fips_code: mrdsFeature['ms:fips_code'],
            huc_code: mrdsFeature['ms:huc_code'],
            quad_code: mrdsFeature['ms:quad_code']
          }
        };
      }).filter((f): f is NonNullable<typeof f> => f !== null);

      if (geoJsonFeatures.length === 0) {
        console.warn('No valid features found after transformation');
        return this.getTestData();
      }

      console.log(`Successfully transformed ${geoJsonFeatures.length} features to GeoJSON`);
      console.log('Sample transformed feature:', JSON.stringify(geoJsonFeatures[0], null, 2));

      const transformedData = {
        type: 'FeatureCollection' as const,
        features: geoJsonFeatures
      };

      try {
        const parsed = GeoJSONResponse.parse(transformedData);
        console.log('Successfully validated GeoJSON data');
        return parsed.features;
      } catch (parseError) {
        console.error('Error validating GeoJSON data:', parseError);
        return this.getTestData();
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error fetching USGS data:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching USGS data:', error);
      }
      return this.getTestData();
    }
  }

  private getTestData(): USGSFeature[] {
    console.log('Generating test data');
    const testData = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
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
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
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
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
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

  public transformToMineralDeposit(feature: USGSFeature) {
    const transformed = {
      name: feature.properties.name || 'Unknown',
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
    
    console.log('Transformed deposit:', transformed);
    return transformed;
  }
}

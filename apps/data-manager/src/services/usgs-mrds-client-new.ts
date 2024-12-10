import { WfsEndpoint } from '@camptocamp/ogc-client';
import { z } from 'zod';
import type { Feature as GeoJSONFeature, GeoJsonProperties, Geometry } from 'geojson';
import { XMLParser } from 'fast-xml-parser';

export const FeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: z.record(z.any()),
});

export type Feature = z.infer<typeof FeatureSchema>;

interface FeatureResponse {
  features: Array<GeoJSONFeature<Geometry, GeoJsonProperties>>;
}

export class USGSMRDSClient {
  private endpoint: WfsEndpoint;
  private baseUrl: string;
  private typeName: string;
  private timeout: number = 60000; // 60 seconds timeout
  private xmlParser: XMLParser;

  constructor() {
    this.baseUrl = process.env.USGS_MRDS_BASE_URL || 'https://mrdata.usgs.gov/services/wfs/mrds';
    this.typeName = 'mrds';
    this.endpoint = new WfsEndpoint(this.baseUrl);
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      textNodeName: '_text',
      isArray: (name) => ['featureMember', 'coordinates'].indexOf(name) !== -1,
      trimValues: true
    });
    console.log('MRDS Client initialized with:', {
      baseUrl: this.baseUrl,
      typeName: this.typeName
    });
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms: ${operation}`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutHandle!);
      return result;
    } catch (error) {
      clearTimeout(timeoutHandle!);
      throw error;
    }
  }

  public async getFeatures(bbox?: string): Promise<Feature[]> {
    try {
      // Try JSON first
      const jsonParams = new URLSearchParams({
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: this.typeName,
        srsName: 'EPSG:4326',
        outputFormat: 'application/json'
      });

      if (bbox) {
        // Format bbox with proper commas
        const formattedBbox = bbox.split(',').map(n => parseFloat(n).toFixed(6)).join(',');
        jsonParams.append('bbox', formattedBbox);
      }

      const jsonUrl = `${this.baseUrl}?${jsonParams.toString()}`;
      console.log('MRDS: Trying JSON URL:', jsonUrl);

      try {
        console.log('MRDS: Sending JSON request...');
        const jsonResponse = await this.withTimeout(
          fetch(jsonUrl),
          this.timeout,
          'WFS GetFeature JSON request'
        );
        
        console.log('MRDS: JSON response status:', jsonResponse.status);
        const responseText = await jsonResponse.text();
        console.log('MRDS: JSON response text:', responseText.substring(0, 500) + '...');

        if (jsonResponse.ok) {
          try {
            const data = JSON.parse(responseText) as FeatureResponse;
            if (data.features && Array.isArray(data.features)) {
              console.log(`MRDS: Received ${data.features.length} JSON features`);
              const features = data.features.map(feature => ({
                type: 'Feature' as const,
                geometry: feature.geometry,
                properties: feature.properties || {}
              }));

              return features.filter((feature): feature is Feature => 
                FeatureSchema.safeParse(feature).success
              );
            }
          } catch (parseError) {
            console.error('MRDS: Error parsing JSON:', parseError);
          }
        }
      } catch (error) {
        console.log('MRDS: JSON request failed:', error);
      }

      // If JSON fails, try XML
      const xmlParams = new URLSearchParams({
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: this.typeName,
        srsName: 'EPSG:4326'
      });

      if (bbox) {
        // Format bbox with proper commas
        const formattedBbox = bbox.split(',').map(n => parseFloat(n).toFixed(6)).join(',');
        xmlParams.append('bbox', formattedBbox);
      }

      const xmlUrl = `${this.baseUrl}?${xmlParams.toString()}`;
      console.log('MRDS: Trying XML URL:', xmlUrl);

      console.log('MRDS: Sending XML request...');
      const xmlResponse = await this.withTimeout(
        fetch(xmlUrl),
        this.timeout,
        'WFS GetFeature XML request'
      );
      
      console.log('MRDS: XML response status:', xmlResponse.status);
      const xmlText = await xmlResponse.text();
      console.log('MRDS: XML response text:', xmlText.substring(0, 500) + '...');

      if (!xmlResponse.ok) {
        throw new Error(`WFS request failed: ${xmlResponse.status} ${xmlResponse.statusText}\n${xmlText}`);
      }

      const features = this.parseWFSXML(xmlText);
      console.log(`MRDS: Parsed ${features.length} features from XML`);
      return features;

    } catch (error) {
      console.error('MRDS: Error fetching features:', error);
      throw error;
    }
  }

  private parseWFSXML(xmlData: string): Feature[] {
    try {
      console.log('MRDS: Parsing XML response...');
      const parsed = this.xmlParser.parse(xmlData);
      console.log('MRDS: Parsed XML structure:', JSON.stringify(parsed, null, 2).substring(0, 500) + '...');

      const featureMembers = parsed?.['wfs:FeatureCollection']?.['gml:featureMember'] || 
                            parsed?.['FeatureCollection']?.['featureMember'] || [];
                            
      const featureArray = Array.isArray(featureMembers) ? featureMembers : [featureMembers];
      console.log(`MRDS: Found ${featureArray.length} features in XML`);

      return featureArray
        .map((feature: any) => {
          const mrds = feature?.['mrds-high'] || feature?.['ms:mrds-high'] || 
                      feature?.['mrds'] || feature?.['ms:mrds'];
          if (!mrds) {
            console.log('MRDS: No mrds data found in feature');
            return null;
          }

          // Try to get coordinates from various possible paths
          let coordinates: [number, number] | null = null;

          // Try gml:Point/gml:coordinates
          const pointCoords = mrds?.['gml:Point']?.['gml:coordinates']?._text ||
                            mrds?.['Point']?.['coordinates']?._text;
          if (pointCoords) {
            const parts = pointCoords.trim().split(/[,\s]+/).map(Number);
            if (parts.length === 2 && !parts.some(isNaN)) {
              coordinates = [parts[0], parts[1]];
            }
          }

          // Try direct LAT/LONG fields if Point coordinates not found
          if (!coordinates) {
            const lat = parseFloat(mrds?.['LAT']?._text || mrds?.['lat']?._text);
            const lon = parseFloat(mrds?.['LONG']?._text || mrds?.['long']?._text);
            if (!isNaN(lat) && !isNaN(lon)) {
              coordinates = [lon, lat];
            }
          }

          if (!coordinates) {
            console.log('MRDS: No valid coordinates found in feature');
            return null;
          }

          const geoJSONFeature: Feature = {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coordinates,
            },
            properties: {
              name: mrds?.['NAME']?._text || mrds?.['name']?._text || 'Unknown',
              dep_type: mrds?.['DEP_TYPE']?._text || mrds?.['dep_type']?._text || null,
              commod1: mrds?.['COMMOD1']?._text || mrds?.['commod1']?._text || null,
              id: mrds?.['ID']?._text || mrds?.['id']?._text || null,
              site_type: mrds?.['SITE_TYPE']?._text || mrds?.['site_type']?._text || null,
              development_status: mrds?.['DEV_STATUS']?._text || mrds?.['dev_status']?._text || null,
              state: mrds?.['STATE']?._text || null,
              county: mrds?.['COUNTY']?._text || null,
            },
          };

          return geoJSONFeature;
        })
        .filter((feature): feature is Feature => feature !== null);
    } catch (error) {
      console.error('MRDS: Error parsing XML:', error);
      return [];
    }
  }

  public transformToGeoLocation(feature: Feature) {
    const { geometry, properties } = feature;

    // Extract common properties
    const name = properties.name || 'Unknown Deposit';
    const siteType = properties.site_type || null;
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
      category: 'mineral_deposit',
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

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

export type Feature = z.infer<typeof GeoJSONFeature>;

export abstract class WFSClient {
  protected baseUrl: string;
  protected defaultBBox: string;
  protected xmlParser: XMLParser;
  protected typeName: string;

  constructor(baseUrl: string, typeName: string) {
    this.baseUrl = baseUrl;
    this.typeName = typeName;
    // Ensure proper comma formatting in default bbox
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

  protected abstract parseWFSXML(xmlData: string): Feature[];
  public abstract transformToGeoLocation(feature: Feature): any;

  protected formatBBox(bbox?: string): string {
    if (!bbox) return this.defaultBBox;
    
    // Remove any extra whitespace and ensure proper comma formatting
    const parts = bbox.trim().split(/[\s,]+/).filter(Boolean);
    if (parts.length === 4 && parts.every(part => /^-?\d+\.?\d*$/.test(part))) {
      return parts.join(',');
    }
    
    console.warn('Invalid bounding box format, using default:', bbox);
    return this.defaultBBox;
  }

  protected getRequestParams(bbox: string, format?: string) {
    const params: Record<string, string> = {
      service: 'WFS',
      version: '1.0.0',
      request: 'GetFeature',
      typeName: this.typeName,
      bbox: bbox,
      srsName: 'EPSG:4326'
    };

    if (format) {
      params.outputFormat = format;
    }

    return params;
  }

  public async getFeatures(bbox?: string): Promise<Feature[]> {
    try {
      const effectiveBBox = this.formatBBox(bbox);
      console.log(`Fetching ${this.typeName} data with bbox:`, effectiveBBox);
      
      // Try XML first since it's more reliable
      console.log('Attempting XML request...');
      const xmlResponse = await axios.get(this.baseUrl, {
        params: this.getRequestParams(effectiveBBox),
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
        params: this.getRequestParams(effectiveBBox, 'application/json'),
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
        } catch (e) {
          console.log('Failed to parse JSON string:', e);
        }
      } else {
        console.log('JSON response received, validating...');
        const jsonResult = GeoJSONFeatureCollection.safeParse(jsonResponse.data);
        if (jsonResult.success) {
          console.log(`Successfully parsed ${jsonResult.data.features.length} features from JSON`);
          return jsonResult.data.features;
        }
        console.log('JSON validation failed:', jsonResult.error);
      }

      throw new Error(`Failed to parse both XML and JSON responses from ${this.typeName} API`);
    } catch (error) {
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

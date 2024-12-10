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

interface BoundingBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

const DEFAULT_BBOX: BoundingBox = {
  minLon: -124.407182,
  minLat: 40.071180,
  maxLon: -122.393331,
  maxLat: 41.740961
};

export abstract class WFSClient {
  protected baseUrl: string;
  protected defaultBBox: string;
  protected xmlParser: XMLParser;
  protected typeName: string;

  constructor(baseUrl: string, typeName: string) {
    this.baseUrl = baseUrl;
    this.typeName = typeName;
    
    // Initialize default bounding box with proper formatting
    this.defaultBBox = [
      DEFAULT_BBOX.minLon.toFixed(6),
      DEFAULT_BBOX.minLat.toFixed(6),
      DEFAULT_BBOX.maxLon.toFixed(6),
      DEFAULT_BBOX.maxLat.toFixed(6)
    ].join(',');
    
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      textNodeName: '_text',
      isArray: (name) => ['featureMember', 'coordinates'].indexOf(name) !== -1,
      trimValues: true
    });

    console.log(`WFS Client initialized for ${typeName} with:`, {
      baseUrl: this.baseUrl,
      defaultBBox: this.defaultBBox,
      typeName: this.typeName
    });
  }

  protected abstract parseWFSXML(xmlData: string): Feature[];
  public abstract transformToGeoLocation(feature: Feature): any;

  protected formatBBox(bbox?: string): string {
    if (!bbox) return this.defaultBBox;

    try {
      // First clean the input string and ensure proper comma separation
      const cleanBBox = decodeURIComponent(bbox).trim().replace(/[\s]+/g, ',');
      console.log('Cleaned bbox:', cleanBBox);
      
      // Split on commas and filter out empty strings
      const coordinates = cleanBBox
        .split(',')
        .map(str => str.trim())
        .filter(str => str.length > 0)
        .map(Number);

      console.log('Parsed coordinates:', coordinates);

      // Validate we have exactly 4 valid numbers
      if (coordinates.length !== 4 || coordinates.some(isNaN)) {
        console.warn('Invalid bounding box format, using default. Expected 4 numbers, got:', bbox);
        return this.defaultBBox;
      }

      const [minLon, minLat, maxLon, maxLat] = coordinates;
      
      // Check longitude range (-180 to 180)
      if (minLon < -180 || minLon > 180 || maxLon < -180 || maxLon > 180) {
        console.warn('Invalid longitude values in bounding box, using default:', bbox);
        return this.defaultBBox;
      }

      // Check latitude range (-90 to 90)
      if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
        console.warn('Invalid latitude values in bounding box, using default:', bbox);
        return this.defaultBBox;
      }

      // Check that min is less than max
      if (minLon > maxLon || minLat > maxLat) {
        console.warn('Invalid bounding box: min values greater than max values:', bbox);
        return this.defaultBBox;
      }

      // Format with consistent precision and comma separation
      const formattedBBox = [
        minLon.toFixed(6),
        minLat.toFixed(6),
        maxLon.toFixed(6),
        maxLat.toFixed(6)
      ].join(',');

      console.log('Formatted bbox:', formattedBBox);
      return formattedBBox;
    } catch (error) {
      console.error('Error formatting bounding box:', error);
      return this.defaultBBox;
    }
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

    console.log(`Request params for ${this.typeName}:`, params);
    return params;
  }

  public async getFeatures(bbox?: string): Promise<Feature[]> {
    try {
      const effectiveBBox = this.formatBBox(bbox);
      console.log(`Fetching ${this.typeName} data with bbox:`, effectiveBBox);
      
      // Build the URL with parameters
      const url = new URL(this.baseUrl);
      const params = this.getRequestParams(effectiveBBox);
      
      // Add parameters to URL
      Object.entries(params).forEach(([key, value]) => {
        // Don't encode commas in bbox
        if (key === 'bbox') {
          url.searchParams.append(key, value);
        } else {
          url.searchParams.append(key, encodeURIComponent(value));
        }
      });

      const requestUrl = url.toString();
      console.log('Full request URL:', requestUrl);

      // Try XML first since it's more reliable
      console.log('Attempting XML request...');
      const xmlResponse = await axios.get(requestUrl, {
        headers: {
          'Accept': 'application/xml'
        }
      });

      if (typeof xmlResponse.data === 'string') {
        console.log('XML response received, parsing...');
        console.log('Raw XML response:', xmlResponse.data);
        
        // Check for service exceptions
        if (xmlResponse.data.includes('ServiceExceptionReport')) {
          const errorMatch = xmlResponse.data.match(/<ServiceException[^>]*>([\s\S]*?)<\/ServiceException>/);
          const errorMessage = errorMatch ? errorMatch[1].trim() : 'Unknown WFS service error';
          console.error('WFS service returned an exception:', errorMessage);
          throw new Error(`WFS service error for ${this.typeName}: ${errorMessage}`);
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
      url.searchParams.set('outputFormat', 'application/json');
      console.log('JSON request URL:', url.toString());

      const jsonResponse = await axios.get(url.toString(), {
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

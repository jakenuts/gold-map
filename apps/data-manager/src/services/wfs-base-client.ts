import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

// Types for WFS versions and operations
export type WFSVersion = '1.0.0' | '1.1.0';
export type WFSOperation = 'GetCapabilities' | 'GetFeature' | 'DescribeFeatureType';

// Interface for bounding box coordinates
export interface BoundingBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

// Configuration for WFS client
export interface WFSClientConfig {
  baseUrl: string;
  version?: WFSVersion;
  typeName: string;
  defaultBBox?: BoundingBox;
  srsName?: string;
  maxFeatures?: number;
}

// Base schema for GeoJSON features
export const GeoJSONFeature = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: z.record(z.any()),
});

export type Feature = z.infer<typeof GeoJSONFeature>;

/**
 * Base WFS client that handles common WFS operations
 */
export class WFSBaseClient {
  protected baseUrl: string;
  protected version: WFSVersion;
  protected typeName: string;
  protected srsName: string;
  protected defaultBBox: BoundingBox;
  protected xmlParser: XMLParser;
  protected maxFeatures: number;

  constructor(config: WFSClientConfig) {
    this.baseUrl = config.baseUrl;
    this.version = config.version || '1.0.0';
    this.typeName = config.typeName;
    this.srsName = config.srsName || 'EPSG:4326';
    this.maxFeatures = config.maxFeatures || 100;
    
    // Default bounding box if none provided
    this.defaultBBox = config.defaultBBox || {
      minLon: -124.407182,
      minLat: 40.071180,
      maxLon: -122.393331,
      maxLat: 41.740961
    };

    // Initialize XML parser with common options
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      textNodeName: '_text',
      isArray: (name) => ['featureMember', 'coordinates'].indexOf(name) !== -1,
      trimValues: true
    });
  }

  /**
   * Format bounding box based on WFS version
   */
  protected formatBBox(bbox?: BoundingBox): string {
    let effectiveBox = bbox || this.defaultBBox;
    
    // Validate coordinates
    if (!this.isValidCoordinates(effectiveBox)) {
      console.warn('Invalid bounding box, using default:', effectiveBox);
      effectiveBox = this.defaultBBox;
    }

    // Always use lon,lat order for 1.0.0
    return [
      effectiveBox.minLon.toFixed(6),
      effectiveBox.minLat.toFixed(6),
      effectiveBox.maxLon.toFixed(6),
      effectiveBox.maxLat.toFixed(6)
    ].join(',');
  }

  /**
   * Validate coordinate values
   */
  protected isValidCoordinates(bbox: BoundingBox): boolean {
    const { minLon, minLat, maxLon, maxLat } = bbox;

    // Check longitude range (-180 to 180)
    if (minLon < -180 || minLon > 180 || maxLon < -180 || maxLon > 180) {
      return false;
    }

    // Check latitude range (-90 to 90)
    if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
      return false;
    }

    // Check that min is less than max
    if (minLon > maxLon || minLat > maxLat) {
      return false;
    }

    return true;
  }

  /**
   * Build request parameters for WFS operation
   */
  protected getRequestParams(operation: WFSOperation, bbox?: BoundingBox, additionalParams: Record<string, string> = {}) {
    const params: Record<string, string> = {
      service: 'WFS',
      version: this.version,
      request: operation,
      ...additionalParams
    };

    if (operation === 'GetFeature') {
      params.typeName = this.typeName;
      params.srsName = this.srsName;
      params.maxFeatures = this.maxFeatures.toString();
      if (bbox) {
        params.bbox = this.formatBBox(bbox);
      }
    }

    return params;
  }

  /**
   * Check for WFS service exceptions in XML response
   */
  protected checkServiceException(xmlData: string): void {
    if (xmlData.includes('ServiceExceptionReport')) {
      const errorMatch = xmlData.match(/<ServiceException[^>]*>([\s\S]*?)<\/ServiceException>/);
      const errorMessage = errorMatch ? errorMatch[1].trim() : 'Unknown WFS service error';
      throw new Error(`WFS service error: ${errorMessage}`);
    }
  }

  /**
   * Make WFS request and return raw XML response
   */
  protected async makeRequest(operation: WFSOperation, bbox?: BoundingBox, additionalParams: Record<string, string> = {}): Promise<string> {
    try {
      const url = new URL(this.baseUrl);
      const params = this.getRequestParams(operation, bbox, additionalParams);
      
      // Add parameters to URL
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      console.log(`Making ${operation} request to:`, url.toString());

      const response = await axios.get(url.toString(), {
        headers: {
          'Accept': 'application/xml',
          'Connection': 'keep-alive'
        },
        timeout: 60000, // Increased to 60 second timeout
        maxContentLength: 100 * 1024 * 1024, // Increased to 100MB max response size
        decompress: true,
        validateStatus: (status) => status < 500,
        httpAgent: new (await import('http')).Agent({ keepAlive: true }),
        httpsAgent: new (await import('https')).Agent({ keepAlive: true })
      });

      if (typeof response.data === 'string') {
        // Check for service exceptions
        this.checkServiceException(response.data);
        return response.data;
      }

      throw new Error('Unexpected response format');
    } catch (error) {
      console.error(`Error in ${operation}:`, error);
      if (axios.isAxiosError(error)) {
        console.error('Response details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }
      throw error;
    }
  }

  /**
   * Get raw XML response for GetCapabilities
   */
  public async getCapabilities(): Promise<string> {
    return this.makeRequest('GetCapabilities');
  }

  /**
   * Get raw XML response for GetFeature
   */
  public async getFeatures(bbox?: BoundingBox, additionalParams: Record<string, string> = {}): Promise<string> {
    return this.makeRequest('GetFeature', bbox, additionalParams);
  }

  /**
   * Get raw XML response for DescribeFeatureType
   */
  public async describeFeatureType(): Promise<string> {
    return this.makeRequest('DescribeFeatureType');
  }
}

import { WFSBaseClient, Feature as BaseFeature, BoundingBox } from './wfs-base-client.js';
import { z } from 'zod';

// Deposit-specific feature properties schema
const DepositProperties = z.object({
  name: z.string(),
  deposit_type: z.string().nullable().optional(),
  commodities: z.string().nullable().optional(),
  id: z.string().nullable().optional(),
  site_type: z.string().nullable().optional(),
  development_status: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  county: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  reference_detail: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  doi: z.string().nullable().optional()
});

export type DepositFeature = BaseFeature & {
  properties: z.infer<typeof DepositProperties>;
};

// Re-export base Feature type
export type Feature = BaseFeature;

export class USGSDepositClient extends WFSBaseClient {
  constructor() {
    super({
      baseUrl: process.env.USGS_DEPOSIT_BASE_URL || 'https://mrdata.usgs.gov/services/wfs/deposit',
      version: '1.0.0',  // Back to 1.0.0 which we know works
      typeName: 'points',
      srsName: 'EPSG:4267',
      maxFeatures: 50000
    });
  }

  /*
  <DefaultSRS>urn:ogc:def:crs:EPSG::4267</DefaultSRS>
  <OtherSRS>urn:ogc:def:crs:EPSG::4269</OtherSRS>
  <OtherSRS>urn:ogc:def:crs:EPSG::4326</OtherSRS>
  <OtherSRS>urn:ogc:def:crs:EPSG::3857</OtherSRS>
  <OtherSRS>urn:ogc:def:crs:EPSG::900913</OtherSRS>
  <OtherSRS>urn:ogc:def:crs:EPSG::102113</OtherSRS>
  */
  /**
   * Get raw XML response from WFS
   */
  public async getFeatures(bbox?: BoundingBox, additionalParams: Record<string, string> = {}): Promise<string> {
    // Add debug logging
    if (bbox) {
      console.log('Raw bbox values:', bbox);
    }
    const result = await super.getFeatures(bbox, additionalParams);
    
    // Log the raw response for debugging
    console.log('Raw XML response:', result.substring(0, 500) + '...');
    
    return result;
  }

  /**
   * Get Deposit features as parsed objects
   */
  public async getDepositFeatures(bbox?: string | BoundingBox): Promise<DepositFeature[]> {
    try {
      // Convert string bbox to object if needed
      let bboxObj: BoundingBox | undefined;
      if (typeof bbox === 'string') {
        const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
        bboxObj = { minLon, minLat, maxLon, maxLat };
      } else if (bbox) {
        // Expand the bounding box slightly to ensure we don't miss features on the edges
        bboxObj = {
          minLon: bbox.minLon - 0.01,
          minLat: bbox.minLat - 0.01,
          maxLon: bbox.maxLon + 0.01,
          maxLat: bbox.maxLat + 0.01
        };
      }

      const xmlData = await this.getFeatures(bboxObj);
      const features: DepositFeature[] = [];
      const featureRegex = /<gml:featureMember>([\s\S]*?)<\/gml:featureMember>/g;
      const fieldRegex = /<(?:ms:)?(\w+)>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:ms:)?\w+>/g;
      
      let featureMatch;
      while ((featureMatch = featureRegex.exec(xmlData)) !== null) {
        const featureXml = featureMatch[1];
        console.log('\nProcessing feature XML:', featureXml);

        let coordinates: [number, number] | null = null;
        const rawProps: Record<string, any> = {};

        // Extract coordinates
        const coordMatch = /<gml:coordinates>(.*?)<\/gml:coordinates>/.exec(featureXml);
        if (coordMatch) {
          coordinates = this.parseCoordinates(coordMatch[1]);
          console.log('Found coordinates from gml:coordinates:', coordMatch[1], '=>', coordinates);
        }

        // Try gml:pos if coordinates not found
        if (!coordinates) {
          const posMatch = /<gml:pos>(.*?)<\/gml:pos>/.exec(featureXml);
          if (posMatch) {
            const [lon, lat] = posMatch[1].trim().split(/\s+/).map(Number);
            if (!isNaN(lon) && !isNaN(lat)) {
              coordinates = [lon, lat];
              console.log('Found coordinates from gml:pos:', posMatch[1], '=>', coordinates);
            }
          }
        }

        // Extract field values
        let fieldMatch;
        while ((fieldMatch = fieldRegex.exec(featureXml)) !== null) {
          const [_, fieldName, value] = fieldMatch;
          if (value && value.trim()) {
            rawProps[fieldName.toLowerCase()] = value.trim();
            console.log(`Found field ${fieldName}:`, value.trim());
          }
        }

        // Skip features without coordinates
        if (!coordinates) {
          console.log('No valid coordinates found in feature:', {
            id: rawProps.id || 'unknown',
            name: rawProps.name || 'Unknown'
          });
          continue;
        }

        // Map raw properties to schema properties
        const properties = {
          name: rawProps.name || rawProps.site_name || 'Unknown',
          deposit_type: rawProps.deposit_type || rawProps.dep_type || null,
          commodities: rawProps.commodities || rawProps.commodity || null,
          id: rawProps.id || rawProps.dep_id || null,
          site_type: rawProps.site_type || null,
          development_status: rawProps.development_status || rawProps.dev_status || null,
          state: rawProps.state || null,
          county: rawProps.county || null,
          reference: rawProps.reference || rawProps.ref_id || null,
          reference_detail: rawProps.reference_detail || rawProps.ref_detail || null,
          remarks: rawProps.remarks || null,
          doi: rawProps.doi || null
        };

        console.log('Mapped properties:', properties);

        // Validate properties against schema
        const validationResult = DepositProperties.safeParse(properties);
        if (!validationResult.success) {
          console.error('Invalid Deposit properties:', validationResult.error);
          continue;
        }

        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates
          },
          properties: validationResult.data
        });
      }

      console.log(`Found ${features.length} valid Deposit features`);
      return features;

    } catch (error) {
      console.error('Error parsing Deposit XML:', error);
      return [];
    }
  }

  /**
   * Parse coordinates from Deposit format
   */
  private parseCoordinates(coordString: string): [number, number] | null {
    try {
      // Take just the first coordinate pair (they're duplicated)
      const firstPair = coordString.trim().split(' ')[0];
      
      // Split on comma or space
      const [lon, lat] = firstPair.split(/[,\s]+/).map(Number);
      
      // Validate the numbers
      if (isNaN(lon) || isNaN(lat)) {
        console.log('Failed to parse numbers:', { lon, lat, original: firstPair });
        return null;
      }

      // Validate coordinate ranges
      if (Math.abs(lon) <= 180 && Math.abs(lat) <= 90) {
        return [lon, lat];
      }

      console.log('Coordinates out of range:', { lon, lat });
      return null;
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return null;
    }
  }

  /**
   * Transform Deposit feature to GeoLocation format
   */
  public transformToGeoLocation(feature: DepositFeature) {
    const { geometry, properties } = feature;

    return {
      name: properties.name,
      category: 'deposit',
      subcategory: properties.site_type || properties.deposit_type || 'unknown',
      location: {
        type: 'Point',
        coordinates: geometry.coordinates,
      },
      properties: {
        depositType: properties.deposit_type,
        commodities: properties.commodities,
        developmentStatus: properties.development_status,
        reference: properties.reference,
        referenceDetail: properties.reference_detail,
        remarks: properties.remarks,
        doi: properties.doi,
        ...properties,
      },
      sourceId: properties.id?.toString() || null,
    };
  }
}

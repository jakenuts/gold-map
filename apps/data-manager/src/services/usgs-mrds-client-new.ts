import { WFSBaseClient, Feature, BoundingBox } from './wfs-base-client';
import { z } from 'zod';

// MRDS-specific feature properties schema
const MRDSProperties = z.object({
  name: z.string(),
  dep_type: z.string().nullable().optional(),
  commod1: z.string().nullable().optional(),
  id: z.string().nullable().optional(),
  site_type: z.string().nullable().optional(),
  development_status: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  county: z.string().nullable().optional(),
  ftr_type: z.string().nullable().optional(),
  ftr_name: z.string().nullable().optional(),
  ftr_azimut: z.number().nullable().optional(),
  topo_name: z.string().nullable().optional(),
  topo_date: z.number().nullable().optional(),
  topo_scale: z.string().nullable().optional(),
  compiledby: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  gda_id: z.number().nullable().optional(),
  scanid: z.number().nullable().optional(),
  original_type: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  group: z.string().nullable().optional(),
  geometry_type: z.string().nullable().optional(),
  feature_class: z.string().nullable().optional()
});

export type MRDSFeature = Feature & {
  properties: z.infer<typeof MRDSProperties>;
};

export class USGSMRDSClient extends WFSBaseClient {
  constructor() {
    super({
      baseUrl: process.env.USGS_MRDS_BASE_URL || 'https://mrdata.usgs.gov/services/wfs/mrds',
      version: '1.0.0', // Use 1.0.0 for consistent lon,lat order
      typeName: 'mrds',
      srsName: 'EPSG:4326',
      maxFeatures: 5  // Reduced for testing
    });
  }

  /**
   * Parse bbox string into BoundingBox object
   */
  private parseBBox(bbox: string): BoundingBox | undefined {
    try {
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
      if (
        !isNaN(minLon) && !isNaN(minLat) && !isNaN(maxLon) && !isNaN(maxLat) &&
        Math.abs(minLon) <= 180 && Math.abs(maxLon) <= 180 &&
        Math.abs(minLat) <= 90 && Math.abs(maxLat) <= 90 &&
        minLon <= maxLon && minLat <= maxLat
      ) {
        return { minLon, minLat, maxLon, maxLat };
      }
      console.error('Invalid bbox values:', { minLon, minLat, maxLon, maxLat });
      return undefined;
    } catch (error) {
      console.error('Error parsing bbox string:', error);
      return undefined;
    }
  }

  /**
   * Get raw XML response from WFS
   */
  public async getFeatures(bbox?: BoundingBox, additionalParams: Record<string, string> = {}): Promise<string> {
    return super.getFeatures(bbox, additionalParams);
  }

  /**
   * Get MRDS features as parsed objects
   */
  public async getMRDSFeatures(bbox?: string | BoundingBox): Promise<MRDSFeature[]> {
    try {
      // Convert string bbox to object if needed
      let bboxObj: BoundingBox | undefined;
      if (typeof bbox === 'string') {
        bboxObj = this.parseBBox(bbox);
      } else {
        bboxObj = bbox;
      }

      const xmlData = await this.getFeatures(bboxObj);
      const features: MRDSFeature[] = [];
      const featureRegex = /<gml:featureMember>([\s\S]*?)<\/gml:featureMember>/g;
      const fieldRegex = /<ms:(\w+)>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/ms:\w+>/g;
      
      let featureMatch;
      while ((featureMatch = featureRegex.exec(xmlData)) !== null) {
        const featureXml = featureMatch[1];
        let coordinates: [number, number] | null = null;
        const rawProps: Record<string, any> = {};

        // Extract coordinates
        const coordMatch = /<gml:coordinates>(.*?)<\/gml:coordinates>/.exec(featureXml);
        if (coordMatch) {
          coordinates = this.parseCoordinates(coordMatch[1]);
        }

        // Extract field values
        let fieldMatch;
        while ((fieldMatch = fieldRegex.exec(featureXml)) !== null) {
          const [_, fieldName, value] = fieldMatch;
          rawProps[fieldName] = value || null;
        }

        // Skip features without coordinates
        if (!coordinates) {
          console.log('No valid coordinates found in feature:', {
            id: rawProps.dep_id || 'unknown',
            name: rawProps.site_name || 'Unknown'
          });
          continue;
        }

        // Map raw properties to schema properties
        const properties = {
          name: rawProps.site_name || 'Unknown',
          dep_type: rawProps.dep_type || null,
          commod1: rawProps.code_list?.trim() || null,
          id: rawProps.dep_id || null,
          site_type: rawProps.site_type || null,
          development_status: rawProps.dev_stat || null,
          state: rawProps.state || null,
          county: rawProps.county || null,
          ftr_type: rawProps.ftr_type || null,
          ftr_name: rawProps.ftr_name || null,
          ftr_azimut: rawProps.ftr_azimut ? parseInt(rawProps.ftr_azimut) : null,
          topo_name: rawProps.topo_name || null,
          topo_date: rawProps.topo_date ? parseInt(rawProps.topo_date) : null,
          topo_scale: rawProps.topo_scale || null,
          compiledby: rawProps.compiledby || null,
          remarks: rawProps.remarks || null,
          gda_id: rawProps.gda_id ? parseInt(rawProps.gda_id) : null,
          scanid: rawProps.scanid ? parseInt(rawProps.scanid) : null,
          original_type: rawProps.original_type || null,
          category: rawProps.category || null,
          group: rawProps.group || null,
          geometry_type: rawProps.geometry_type || null,
          feature_class: rawProps.feature_class || null
        };

        // Validate properties against schema
        const validationResult = MRDSProperties.safeParse(properties);
        if (!validationResult.success) {
          console.error('Invalid MRDS properties:', validationResult.error);
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

      console.log(`Found ${features.length} valid MRDS features`);
      return features;

    } catch (error) {
      console.error('Error parsing MRDS XML:', error);
      return [];
    }
  }

  /**
   * Parse coordinates from MRDS format
   */
  private parseCoordinates(coordString: string): [number, number] | null {
    try {
      // Take just the first coordinate pair (they're duplicated)
      const firstPair = coordString.trim().split(' ')[0];
      
      // Find the decimal points
      const firstDecimal = firstPair.indexOf('.');
      if (firstDecimal === -1) return null;
      
      // Find the second decimal by skipping the first one
      const secondDecimal = firstPair.indexOf('.', firstDecimal + 1);
      if (secondDecimal === -1) return null;

      // Extract the numbers
      const lon = parseFloat(firstPair.substring(0, secondDecimal - 2)); // -2 to handle the digits before the second decimal
      const lat = parseFloat(firstPair.substring(secondDecimal - 2));

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
   * Transform MRDS feature to GeoLocation format
   */
  public transformToGeoLocation(feature: MRDSFeature) {
    const { geometry, properties } = feature;

    return {
      name: properties.name,
      category: 'mineral_deposit',
      subcategory: properties.site_type || properties.dep_type || 'unknown',
      location: {
        type: 'Point',
        coordinates: geometry.coordinates,
      },
      properties: {
        depositType: properties.dep_type,
        commodities: properties.commod1,
        developmentStatus: properties.development_status,
        ...properties,
      },
      sourceId: properties.id?.toString() || null,
    };
  }
}

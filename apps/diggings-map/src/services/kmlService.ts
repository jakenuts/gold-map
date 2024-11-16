import * as toGeoJSON from '@tmcw/togeojson';
import JSZip from 'jszip';
import { MiningClaim, LocationType } from '../types';

// Track all types we find
const foundTypes = new Set<string>();

interface KMLProperties {
  name?: string;
  type?: string;
  Type?: string;
  STATUS?: string;
  status?: string;
  description?: string;
  [key: string]: string | undefined;
}

// Type mappings for KML data
const TYPE_MAPPINGS: Record<string, MiningClaim['claimType']> = {
  'mine': 'lode',
  'prospect': 'placer',
  'past producer': 'lode',
  'producer': 'lode',
  'occurrence': 'placer',
  'mineral location': 'lode',
  'mineral deposit': 'lode',
  'claim': 'lode',
  'default': 'lode'
};

const STATUS_MAPPINGS: Record<string, MiningClaim['status']> = {
  'active': 'active',
  'inactive': 'closed',
  'abandoned': 'void',
  'past producer': 'closed',
  'producer': 'active',
  'occurrence': 'active',
  'default': 'active'
};

// Function to normalize type string to LocationType
function normalizeLocationType(type: string): LocationType {
  const normalized = type.toLowerCase();
  if (normalized === 'mine' || 
      normalized === 'prospect' || 
      normalized === 'past producer' || 
      normalized === 'producer' || 
      normalized === 'occurrence' || 
      normalized === 'mineral location' || 
      normalized === 'mineral deposit' || 
      normalized === 'claim') {
    return normalized as LocationType;
  }
  return 'default';
}

export class KMLService {
  private static async extractKMLFromKMZ(kmzData: ArrayBuffer): Promise<Document> {
    try {
      console.log('Extracting KML from KMZ file, size:', kmzData.byteLength);
      const zip = new JSZip();
      const contents = await zip.loadAsync(kmzData);
      
      const kmlFile = Object.values(contents.files).find(file => 
        file.name.toLowerCase().endsWith('.kml')
      );
      
      if (!kmlFile) {
        throw new Error('No KML file found in KMZ archive');
      }

      console.log('Found KML file:', kmlFile.name);
      const kmlString = await kmlFile.async('string');
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(kmlString, 'text/xml');
      
      if (doc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Failed to parse KML: ' + doc.getElementsByTagName('parsererror')[0].textContent);
      }

      return doc;
    } catch (error) {
      console.error('Error in extractKMLFromKMZ:', error);
      throw error;
    }
  }

  private static parseFeatureProperties(properties: KMLProperties): MiningClaim {
    try {
      // Log all properties to help identify fields
      console.log('Raw properties:', properties);

      // Extract type from various possible fields
      const type = properties.Type || properties.type || '';
      const status = (properties.STATUS || properties.status || '').toLowerCase();
      
      // Add to our collection of found types
      if (type) {
        foundTypes.add(type);
      }

      const typeKey = type.toLowerCase();
      const mappedType = TYPE_MAPPINGS[typeKey] || TYPE_MAPPINGS.default;
      const mappedStatus = STATUS_MAPPINGS[status] || STATUS_MAPPINGS.default;
      const locationType = normalizeLocationType(type);

      return {
        id: `kml-${Math.random().toString(36).substr(2, 9)}`,
        claimId: `KML-${Math.random().toString(36).substr(2, 9)}`,
        claimName: properties.name || 'Unknown',
        claimType: mappedType,
        locationType: locationType,  // Added this field
        status: mappedStatus,
        latitude: 0, // Will be set later
        longitude: 0, // Will be set later
        township: '',
        range: '',
        section: '',
        filingDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing feature properties:', error, properties);
      return {
        id: `kml-error-${Math.random().toString(36).substr(2, 9)}`,
        claimId: `KML-ERROR-${Math.random().toString(36).substr(2, 9)}`,
        claimName: 'Error',
        claimType: 'lode',
        locationType: 'default',  // Added this field
        status: 'active',
        latitude: 0,
        longitude: 0,
        township: '',
        range: '',
        section: '',
        filingDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    }
  }

  static async parseKMZ(kmzUrl: string): Promise<MiningClaim[]> {
    console.log('Starting KMZ parsing from URL:', kmzUrl);
    try {
      const response = await fetch(kmzUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch KMZ file: ${response.status} ${response.statusText}`);
      }
      
      const kmzData = await response.arrayBuffer();
      const kmlDoc = await this.extractKMLFromKMZ(kmzData);
      const geoJson = toGeoJSON.kml(kmlDoc);
      
      console.log('Found features:', geoJson.features.length);
      
      const claims: MiningClaim[] = [];

      for (const feature of geoJson.features) {
        try {
          if (!feature.geometry) {
            console.log('Skipping feature without geometry');
            continue;
          }

          // Get coordinates based on geometry type
          let coordinates = null;
          if (feature.geometry.type === 'Point') {
            coordinates = feature.geometry.coordinates;
          } else if (feature.geometry.type === 'Polygon') {
            coordinates = feature.geometry.coordinates[0][0]; // Use first point of polygon
          }

          if (!coordinates) {
            console.log('Skipping feature without valid coordinates');
            continue;
          }

          const claim = this.parseFeatureProperties(feature.properties as KMLProperties);
          claim.longitude = coordinates[0];
          claim.latitude = coordinates[1];
          claims.push(claim);
        } catch (error) {
          console.error('Error processing feature:', error);
        }
      }

      console.log('KMZ parsing complete:', {
        totalFeatures: geoJson.features.length,
        validClaims: claims.length,
        foundTypes: Array.from(foundTypes)
      });

      return claims;
    } catch (error) {
      console.error('Error parsing KMZ file:', error);
      throw error;
    }
  }
}

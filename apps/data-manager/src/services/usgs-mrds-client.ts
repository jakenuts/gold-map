import { WFSClient, Feature } from './wfs-client.js';

export class USGSMRDSClient extends WFSClient {
  constructor() {
    // Use the correct URL from the capabilities document
    const baseUrl = process.env.USGS_MRDS_BASE_URL || 'https://mrdata.usgs.gov/services/wfs/mrds';
     // Use the correct feature type from the capabilities document
    super(baseUrl, 'mrds');
  }

  private parseCoordinates(coordString: string): [number, number] | null {
    try {
      // Handle various coordinate string formats:
      // "lon,lat" or "lat,lon" or "lon lat" or "lat lon"
      const parts = coordString.trim().split(/[,\s]+/).map(Number);
      
      if (parts.length !== 2 || parts.some(isNaN)) {
        return null;
      }

      const [x, y] = parts;
      
      // Validate coordinate ranges
      if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
        // Assume x is longitude, y is latitude
        return [x, y];
      } else if (Math.abs(x) <= 90 && Math.abs(y) <= 180) {
        // Assume x is latitude, y is longitude
        return [y, x];
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return null;
    }
  }

  private extractCoordinates(feature: any): [number, number] | null {
    try {
      // Try different possible paths to coordinates
      const mrds = feature?.['mrds-high'] || feature?.['ms:mrds-high'] || 
                  feature?.['mrds'] || feature?.['ms:mrds'];

      if (!mrds) {
        console.log('No MRDS data found in feature:', feature);
        return null;
      }

      // 1. Try gml:Point/gml:coordinates
      const pointGeom = mrds?.['gml:Point'] || mrds?.['Point'];
      const pointCoords = pointGeom?.['gml:coordinates']?._text || 
                         pointGeom?.['coordinates']?._text;
      if (pointCoords) {
        const coords = this.parseCoordinates(pointCoords);
        if (coords) return coords;
      }

      // 2. Try geometry/Point/coordinates
      const geomPoint = mrds?.['geometry']?.['Point'] || 
                       mrds?.['gml:geometry']?.['Point'] ||
                       mrds?.['geometry']?.['gml:Point'];
      const geomCoords = geomPoint?.['coordinates']?._text || 
                        geomPoint?.['gml:coordinates']?._text;
      if (geomCoords) {
        const coords = this.parseCoordinates(geomCoords);
        if (coords) return coords;
      }

      // 3. Try direct LAT/LONG fields with various possible paths and casings
      const possibleLatFields = ['LAT', 'lat', 'LATITUDE', 'latitude'];
      const possibleLonFields = ['LONG', 'long', 'LON', 'lon', 'LONGITUDE', 'longitude'];
      
      let lat: number | null = null;
      let lon: number | null = null;

      // Find latitude
      for (const field of possibleLatFields) {
        const value = parseFloat(mrds[field]?._text);
        if (!isNaN(value) && Math.abs(value) <= 90) {
          lat = value;
          break;
        }
      }

      // Find longitude
      for (const field of possibleLonFields) {
        const value = parseFloat(mrds[field]?._text);
        if (!isNaN(value) && Math.abs(value) <= 180) {
          lon = value;
          break;
        }
      }

      if (lat !== null && lon !== null) {
        return [lon, lat];
      }

      // 4. Try msGMLOutput paths
      const msOutput = feature?.['msGMLOutput']?.['mrds_layer'] || 
                      feature?.['msGMLOutput']?.['ms:mrds_layer'];
      if (msOutput) {
        const lat = parseFloat(msOutput['ms:LAT']?._text || msOutput['LAT']?._text);
        const lon = parseFloat(msOutput['ms:LONG']?._text || msOutput['LONG']?._text);
        
        if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
          return [lon, lat];
        }
      }

      console.log('No valid coordinates found in feature:', {
        id: mrds?.['ID']?._text || 'unknown',
        name: mrds?.['NAME']?._text || 'unknown'
      });
      return null;

    } catch (error) {
      console.error('Error extracting coordinates:', error);
      return null;
    }
  }

  protected parseWFSXML(xmlData: string): Feature[] {
    try {
      console.log('Parsing MRDS XML response...');
      const parsed = this.xmlParser.parse(xmlData);
      console.log('Parsed MRDS structure:', JSON.stringify(parsed, null, 2));

      // Handle both namespace prefixed and non-prefixed paths
      const featureMembers = parsed?.['wfs:FeatureCollection']?.['gml:featureMember'] || 
                            parsed?.['FeatureCollection']?.['featureMember'] || [];
                            
      const featureArray = Array.isArray(featureMembers) ? featureMembers : [featureMembers];
      console.log(`Found ${featureArray.length} MRDS features in XML`);

      return featureArray
        .map((feature: any) => {
          const coordinates = this.extractCoordinates(feature);
          if (!coordinates) {
            return null;
          }

          // Try different possible paths to the mrds data
          const mrds = feature?.['mrds-high'] || feature?.['ms:mrds-high'] || 
                      feature?.['mrds'] || feature?.['ms:mrds'];
          if (!mrds) {
            console.log('No mrds data found in feature:', feature);
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
              ftr_type: mrds?.['FTR_TYPE']?._text || null,
              ftr_name: mrds?.['FTR_NAME']?._text || null,
              ftr_azimut: mrds?.['FTR_AZIMUT']?._text ? parseInt(mrds?.['FTR_AZIMUT']?._text) : null,
              topo_name: mrds?.['TOPO_NAME']?._text || null,
              topo_date: mrds?.['TOPO_DATE']?._text ? parseInt(mrds?.['TOPO_DATE']?._text) : null,
              topo_scale: mrds?.['TOPO_SCALE']?._text || null,
              compiledby: mrds?.['COMPILEDBY']?._text || null,
              remarks: mrds?.['REMARKS']?._text || null,
              gda_id: mrds?.['GDA_ID']?._text ? parseInt(mrds?.['GDA_ID']?._text) : null,
              scanid: mrds?.['SCANID']?._text ? parseInt(mrds?.['SCANID']?._text) : null,
              original_type: mrds?.['original_type']?._text || null,
              category: mrds?.['category']?._text || null,
              group: mrds?.['group']?._text || null,
              geometry_type: mrds?.['geometry_type']?._text || null,
              feature_class: mrds?.['feature_class']?._text || null
            },
          };

          return geoJSONFeature;
        })
        .filter((feature): feature is Feature => feature !== null);
    } catch (error) {
      console.error('Error parsing MRDS XML:', error);
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

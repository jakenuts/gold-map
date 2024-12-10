import { WFSClient, Feature } from './wfs-client.js';

export class USGSDepositClient extends WFSClient {
  constructor() {
    // Use the correct URL from the capabilities document
    const baseUrl = process.env.USGS_DEPOSIT_BASE_URL || 'https://mrdata.usgs.gov/services/wfs/deposit';
    // 'points' is the correct feature type for point data
    super(baseUrl, 'deposit');
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
      const deposit = feature?.['points'] || feature?.['ms:points'] || 
                     feature?.['deposit'] || feature?.['ms:deposit'];

      if (!deposit) {
        return null;
      }

      // 1. Try gml:Point/gml:coordinates
      const pointGeom = deposit?.['gml:Point'] || deposit?.['Point'];
      const pointCoords = pointGeom?.['gml:coordinates']?._text || 
                         pointGeom?.['coordinates']?._text;
      if (pointCoords) {
        const coords = this.parseCoordinates(pointCoords);
        if (coords) return coords;
      }

      // 2. Try geometry/Point/coordinates
      const geomPoint = deposit?.['geometry']?.['Point'] || 
                       deposit?.['gml:geometry']?.['Point'] ||
                       deposit?.['geometry']?.['gml:Point'];
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
        const value = parseFloat(deposit[field]?._text);
        if (!isNaN(value) && Math.abs(value) <= 90) {
          lat = value;
          break;
        }
      }

      // Find longitude
      for (const field of possibleLonFields) {
        const value = parseFloat(deposit[field]?._text);
        if (!isNaN(value) && Math.abs(value) <= 180) {
          lon = value;
          break;
        }
      }

      if (lat !== null && lon !== null) {
        return [lon, lat];
      }

      // 4. Try msGMLOutput paths
      const msOutput = feature?.['msGMLOutput']?.['deposit_layer'] || 
                      feature?.['msGMLOutput']?.['ms:deposit_layer'] ||
                      feature?.['msGMLOutput']?.['points_layer'] ||
                      feature?.['msGMLOutput']?.['ms:points_layer'];
      if (msOutput) {
        const lat = parseFloat(msOutput['ms:LAT']?._text || msOutput['LAT']?._text);
        const lon = parseFloat(msOutput['ms:LONG']?._text || msOutput['LONG']?._text);
        
        if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
          return [lon, lat];
        }
      }

      console.log('No valid coordinates found in feature:', {
        id: deposit?.['ID']?._text || 'unknown',
        name: deposit?.['NAME']?._text || 'unknown'
      });
      return null;

    } catch (error) {
      console.error('Error extracting coordinates:', error);
      return null;
    }
  }

  protected parseWFSXML(xmlData: string): Feature[] {
    try {
      console.log('Parsing Deposit XML response...');
      const parsed = this.xmlParser.parse(xmlData);
      console.log('Parsed Deposit structure:', JSON.stringify(parsed, null, 2));

      // Handle both namespace prefixed and non-prefixed paths
      const featureMembers = parsed?.['wfs:FeatureCollection']?.['gml:featureMember'] || 
                            parsed?.['FeatureCollection']?.['featureMember'] || [];
                            
      const featureArray = Array.isArray(featureMembers) ? featureMembers : [featureMembers];
      console.log(`Found ${featureArray.length} Deposit features in XML`);

      return featureArray
        .map((feature: any) => {
          const coordinates = this.extractCoordinates(feature);
          if (!coordinates) {
            return null;
          }

          // Try different possible paths to the deposit data
          const deposit = feature?.['points'] || feature?.['ms:points'] || 
                         feature?.['deposit'] || feature?.['ms:deposit'];
          if (!deposit) {
            console.log('No deposit data found in feature:', feature);
            return null;
          }

          const geoJSONFeature: Feature = {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coordinates,
            },
            properties: {
              name: deposit?.['NAME']?._text || deposit?.['name']?._text || 'Unknown',
              deposit_type: deposit?.['DEPOSIT_TYPE']?._text || deposit?.['deposit_type']?._text || null,
              commodities: deposit?.['COMMODITIES']?._text || deposit?.['commodities']?._text || null,
              id: deposit?.['ID']?._text || deposit?.['id']?._text || null,
              site_type: deposit?.['SITE_TYPE']?._text || deposit?.['site_type']?._text || null,
              development_status: deposit?.['DEV_STATUS']?._text || deposit?.['dev_status']?._text || null,
              state: deposit?.['STATE']?._text || null,
              county: deposit?.['COUNTY']?._text || null,
              ftr_type: deposit?.['FTR_TYPE']?._text || null,
              ftr_name: deposit?.['FTR_NAME']?._text || null,
              ftr_azimut: deposit?.['FTR_AZIMUT']?._text ? parseInt(deposit?.['FTR_AZIMUT']?._text) : null,
              topo_name: deposit?.['TOPO_NAME']?._text || null,
              topo_date: deposit?.['TOPO_DATE']?._text ? parseInt(deposit?.['TOPO_DATE']?._text) : null,
              topo_scale: deposit?.['TOPO_SCALE']?._text || null,
              compiledby: deposit?.['COMPILEDBY']?._text || null,
              remarks: deposit?.['REMARKS']?._text || null,
              gda_id: deposit?.['GDA_ID']?._text ? parseInt(deposit?.['GDA_ID']?._text) : null,
              scanid: deposit?.['SCANID']?._text ? parseInt(deposit?.['SCANID']?._text) : null,
              original_type: deposit?.['original_type']?._text || null,
              category: deposit?.['category']?._text || null,
              group: deposit?.['group']?._text || null,
              geometry_type: deposit?.['geometry_type']?._text || null,
              feature_class: deposit?.['feature_class']?._text || null
            },
          };

          return geoJSONFeature;
        })
        .filter((feature): feature is Feature => feature !== null);
    } catch (error) {
      console.error('Error parsing Deposit XML:', error);
      return [];
    }
  }

  public transformToGeoLocation(feature: Feature) {
    const { geometry, properties } = feature;

    // Extract common properties
    const name = properties.name || 'Unknown Deposit';
    const siteType = properties.site_type || null;
    const depositType = properties.deposit_type || null;
    const commodities = properties.commodities || null;

    // Create point geometry in PostGIS format
    const [longitude, latitude] = geometry.coordinates;
    const location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    // Return transformed data matching GeoLocation schema
    return {
      name,
      category: 'deposit',
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

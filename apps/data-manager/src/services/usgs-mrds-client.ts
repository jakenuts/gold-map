import { WFSClient, Feature } from './wfs-client.js';

export class USGSMRDSClient extends WFSClient {
  constructor() {
    const baseUrl = process.env.USGS_MRDS_BASE_URL || 'https://mrdata.usgs.gov/services/wfs/mrds';
    super(baseUrl, 'mrds');
  }

  protected parseWFSXML(xmlData: string): Feature[] {
    try {
      console.log('Parsing MRDS XML response...');
      const parsed = this.xmlParser.parse(xmlData);
      console.log('Parsed MRDS structure:', JSON.stringify(parsed, null, 2).substring(0, 500) + '...');

      // Handle both namespace prefixed and non-prefixed paths
      const featureMembers = parsed?.['wfs:FeatureCollection']?.['gml:featureMember'] || 
                            parsed?.['FeatureCollection']?.['featureMember'] || [];
                            
      const featureArray = Array.isArray(featureMembers) ? featureMembers : [featureMembers];
      console.log(`Found ${featureArray.length} MRDS features in XML`);

      return featureArray
        .map((feature: any) => {
          // Try different possible paths to the mrds data
          const mrds = feature?.['ms:mrds'] || feature?.['mrds'] || feature?.['mrds:mrds'];
          if (!mrds) {
            console.log('No mrds data found in feature:', feature);
            return null;
          }

          // Try to get coordinates from geometry
          let coordinates: [number, number] | null = null;

          // First try the gml:coordinates field
          const geometry = mrds?.['gml:boundedBy']?.['gml:Box'];
          if (geometry?.['gml:coordinates']?._text) {
            const coordParts = geometry['gml:coordinates']._text.trim().split(/\s+/);
            if (coordParts.length === 2) {
              const [coord1, coord2] = coordParts;
              const [lon1, lat1] = coord1.split(',').map(Number);
              const [lon2, lat2] = coord2.split(',').map(Number);
              if (!isNaN(lon1) && !isNaN(lat1) && !isNaN(lon2) && !isNaN(lat2)) {
                // Use the first coordinate pair
                coordinates = [lon1, lat1];
              }
            }
          }

          // If no coordinates from geometry, try direct coordinate fields
          if (!coordinates) {
            const lat = parseFloat(mrds?.['LAT']?._text || mrds?.['lat']?._text || '');
            const lon = parseFloat(mrds?.['LONG']?._text || mrds?.['long']?._text || '');
            if (!isNaN(lat) && !isNaN(lon)) {
              coordinates = [lon, lat];
            }
          }
          
          if (!coordinates) {
            console.log('Invalid or missing coordinates in feature:', {
              id: mrds?.['ID']?._text || 'unknown',
              name: mrds?.['NAME']?._text || 'unknown'
            });
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
              // Add any additional properties that match the example
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

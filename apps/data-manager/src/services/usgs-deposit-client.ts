import axios from 'axios';
import { WFSClient, Feature } from './wfs-client.js';

export class USGSDepositClient extends WFSClient {
  private mapFile: string;

  constructor() {
    const baseUrl = process.env.USGS_DEPOSIT_BASE_URL || 'https://mrdata.usgs.gov/cgi-bin/mapserv';
    super(baseUrl, 'points');
    this.mapFile = '/mnt/mrt/map-files/deposit.map';
  }

  protected getRequestParams(bbox: string, format?: string) {
    const params = super.getRequestParams(bbox, format);
    params.map = this.mapFile;
    return params;
  }

  protected parseWFSXML(xmlData: string): Feature[] {
    try {
      console.log('Parsing Deposit XML response...');
      const parsed = this.xmlParser.parse(xmlData);
      console.log('Parsed Deposit structure:', JSON.stringify(parsed, null, 2).substring(0, 500) + '...');

      // Handle both namespace prefixed and non-prefixed paths
      const featureMembers = parsed?.['FeatureCollection']?.['featureMember'] || 
                            parsed?.['wfs:FeatureCollection']?.['gml:featureMember'] || [];
                            
      const featureArray = Array.isArray(featureMembers) ? featureMembers : [featureMembers];
      console.log(`Found ${featureArray.length} Deposit features in XML`);

      return featureArray
        .map((feature: any) => {
          // Try different possible paths to the points data
          const deposit = feature?.['points'] || feature?.['ms:points'] || feature?.['deposit:points'];
          if (!deposit) {
            console.log('No deposit data found in feature:', feature);
            return null;
          }

          // Try to get coordinates from geometry
          let coordinates: [number, number] | null = null;

          const geometry = deposit?.['geometry'] || deposit?.['gml:geometry'];
          const point = geometry?.['Point'] || geometry?.['gml:Point'];
          const coords = point?.['coordinates']?._text || point?.['gml:coordinates']?._text;
          
          if (coords) {
            const [lon, lat] = coords.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lon)) {
              coordinates = [lon, lat];
            }
          }

          // If no coordinates from geometry, try direct coordinate fields
          if (!coordinates) {
            const lat = parseFloat(deposit?.['LAT']?._text || deposit?.['lat']?._text || '');
            const lon = parseFloat(deposit?.['LONG']?._text || deposit?.['long']?._text || '');
            if (!isNaN(lat) && !isNaN(lon)) {
              coordinates = [lon, lat];
            }
          }
          
          if (!coordinates) {
            console.log('Invalid or missing coordinates in feature');
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
              // Add any additional properties that match the example you provided
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

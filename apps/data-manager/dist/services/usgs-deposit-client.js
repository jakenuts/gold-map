import { WFSClient } from './wfs-client.js';
export class USGSDepositClient extends WFSClient {
    constructor() {
        const baseUrl = process.env.USGS_DEPOSIT_BASE_URL || 'https://mrdata.usgs.gov/services/deposit';
        super(baseUrl, 'points');
    }
    parseWFSXML(xmlData) {
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
                .map((feature) => {
                // Try different possible paths to the points data
                const deposit = feature?.['points'] || feature?.['ms:points'] || feature?.['deposit:points'];
                if (!deposit) {
                    console.log('No deposit data found in feature:', feature);
                    return null;
                }
                // Try to get coordinates from geometry
                let coordinates = null;
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
                const geoJSONFeature = {
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
                    },
                };
                return geoJSONFeature;
            })
                .filter((feature) => feature !== null);
        }
        catch (error) {
            console.error('Error parsing Deposit XML:', error);
            return [];
        }
    }
    transformToGeoLocation(feature) {
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
//# sourceMappingURL=usgs-deposit-client.js.map
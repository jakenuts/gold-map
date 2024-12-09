import { WFSClient } from './wfs-client.js';
export class USGSMRDSClient extends WFSClient {
    constructor() {
        const baseUrl = process.env.USGS_MRDS_BASE_URL || 'https://mrdata.usgs.gov/services/wfs/mrds';
        super(baseUrl, 'mrds');
    }
    parseWFSXML(xmlData) {
        try {
            console.log('Parsing MRDS XML response...');
            const parsed = this.xmlParser.parse(xmlData);
            console.log('Parsed MRDS structure:', JSON.stringify(parsed, null, 2).substring(0, 500) + '...');
            // Handle both namespace prefixed and non-prefixed paths
            const featureMembers = parsed?.['FeatureCollection']?.['featureMember'] ||
                parsed?.['wfs:FeatureCollection']?.['gml:featureMember'] || [];
            const featureArray = Array.isArray(featureMembers) ? featureMembers : [featureMembers];
            console.log(`Found ${featureArray.length} MRDS features in XML`);
            return featureArray
                .map((feature) => {
                // Try different possible paths to the mrds data
                const mrds = feature?.['mrds'] || feature?.['ms:mrds'] || feature?.['mrds:mrds'];
                if (!mrds) {
                    console.log('No mrds data found in feature:', feature);
                    return null;
                }
                // Try different possible coordinate paths
                let coordinates = null;
                // Try direct coordinate fields
                const possibleLatFields = ['LAT', 'lat', 'LATITUDE', 'latitude'];
                const possibleLonFields = ['LONG', 'long', 'LONGITUDE', 'longitude'];
                for (const latField of possibleLatFields) {
                    for (const lonField of possibleLonFields) {
                        const lat = parseFloat(mrds[latField]?._text);
                        const lon = parseFloat(mrds[lonField]?._text);
                        if (!isNaN(lat) && !isNaN(lon)) {
                            coordinates = [lon, lat];
                            break;
                        }
                    }
                    if (coordinates)
                        break;
                }
                // If no direct coordinates, try geometry
                if (!coordinates) {
                    const geometry = mrds?.['geometry'] || mrds?.['gml:geometry'];
                    const point = geometry?.['Point'] || geometry?.['gml:Point'];
                    const coords = point?.['coordinates']?._text || point?.['gml:coordinates']?._text;
                    if (coords) {
                        const [lon, lat] = coords.split(',').map(Number);
                        if (!isNaN(lat) && !isNaN(lon)) {
                            coordinates = [lon, lat];
                        }
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
                        name: mrds?.['NAME']?._text || mrds?.['name']?._text || 'Unknown',
                        dep_type: mrds?.['DEP_TYPE']?._text || mrds?.['dep_type']?._text || null,
                        commod1: mrds?.['COMMOD1']?._text || mrds?.['commod1']?._text || null,
                        id: mrds?.['ID']?._text || mrds?.['id']?._text || null,
                    },
                };
                return geoJSONFeature;
            })
                .filter((feature) => feature !== null);
        }
        catch (error) {
            console.error('Error parsing MRDS XML:', error);
            return [];
        }
    }
    transformToGeoLocation(feature) {
        const { geometry, properties } = feature;
        // Extract common properties
        const name = properties.name || 'Unknown Deposit';
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
            subcategory: depositType || 'unknown',
            location,
            properties: {
                commodities,
                ...properties,
            },
            sourceId: properties.id?.toString() || null,
        };
    }
}
//# sourceMappingURL=usgs-mrds-client.js.map
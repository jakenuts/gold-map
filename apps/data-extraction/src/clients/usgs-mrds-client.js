import { WFSBaseClient } from './wfs-base-client.js';

export class USGSMRDSClient extends WFSBaseClient {
    constructor() {
        super({
            baseUrl: 'https://mrdata.usgs.gov/services/wfs/mrds',
            version: '1.0.0',
            typeName: 'mrds',
            srsName: 'EPSG:4326',
            maxFeatures: 50000
        });
    }

    /**
     * Parse coordinates from GML Point with improved error handling
     */
    parseCoordinates(feature) {
        try {
            // Get coordinates from GML Point
            const coordStr = feature?.['ms:geometry']?.['gml:Point']?.['gml:coordinates'];
            if (!coordStr) {
                console.warn('No coordinates found in feature');
                return null;
            }

            // Take just the first coordinate pair (they're duplicated)
            const firstPair = coordStr.trim().split(' ')[0];
            
            // Find the decimal points
            const firstDecimal = firstPair.indexOf('.');
            if (firstDecimal === -1) {
                console.warn('No decimal point found in coordinate string:', firstPair);
                return null;
            }
            
            // Find the second decimal by skipping the first one
            const secondDecimal = firstPair.indexOf('.', firstDecimal + 1);
            if (secondDecimal === -1) {
                console.warn('Second decimal point not found in coordinate string:', firstPair);
                return null;
            }

            // Extract the numbers
            const lon = parseFloat(firstPair.substring(0, secondDecimal - 2)); // -2 to handle the digits before the second decimal
            const lat = parseFloat(firstPair.substring(secondDecimal - 2));

            // Validate the numbers
            if (isNaN(lon) || isNaN(lat)) {
                console.warn('Failed to parse numbers:', { lon, lat, original: firstPair });
                return null;
            }

            // Validate coordinate ranges
            if (Math.abs(lon) <= 180 && Math.abs(lat) <= 90) {
                return [lon, lat];
            }

            console.warn('Coordinates out of range:', { lon, lat });
            return null;
        } catch (error) {
            console.warn('Error parsing coordinates:', error);
            return null;
        }
    }

    /**
     * Get MRDS features as parsed objects with improved field handling
     */
    async getMRDSFeatures(bbox) {
        try {
            // First get the feature type description to see available fields
            console.log('Getting feature type description...');
            const descXml = await this.describeFeatureType();
            console.log('Feature type description:', descXml);

            // Request all features without restricting fields
            const xmlData = await this.getFeatures(bbox);
            
            if (!xmlData) {
                console.error('No XML data received from WFS service');
                return [];
            }

            const parsed = this.xmlParser.parse(xmlData);
            
            // Get all feature members with better error handling
            const featureMembers = parsed?.['wfs:FeatureCollection']?.['gml:featureMember'];
            if (!Array.isArray(featureMembers)) {
                console.error('No feature members found in response');
                return [];
            }
            
            console.log('Number of feature members:', featureMembers.length);
            
            const features = featureMembers.map((member, index) => {
                const feature = member['ms:mrds'];
                if (!feature) {
                    console.warn(`No ms:mrds in feature member at index ${index}`);
                    return null;
                }

                const coordinates = this.parseCoordinates(feature);
                if (!coordinates) {
                    console.warn(`Failed to parse coordinates for: ${feature['ms:site_name'] || 'Unknown site'}`);
                    return null;
                }

                // Parse FIPS code for state/county info
                const fipsCode = feature['ms:fips_code'] || '';
                const stateCode = fipsCode.substring(1, 3); // Skip 'f' prefix
                const countyCode = fipsCode.substring(3);
                
                // Map state codes to names
                const stateMap = {
                    '06': 'California',
                    '41': 'Oregon'
                };

                // Map raw properties to schema properties
                const properties = {
                    name: feature['ms:site_name'] || 'Unknown',
                    id: feature['ms:dep_id'] || null,
                    development_status: feature['ms:dev_stat'] || null,
                    commodities: (feature['ms:code_list'] || '').trim().split(/[,\s]+/).filter(Boolean),
                    commodity_desc: feature['ms:code_list'] || '',
                    url: feature['ms:url'] || null,
                    state: stateMap[stateCode] || null,
                    county_code: countyCode || null,
                    fips_code: feature['ms:fips_code'] || null,
                    huc_code: feature['ms:huc_code'] || null,
                    quad_code: feature['ms:quad_code'] || null
                };

                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates
                    },
                    properties
                };
            }).filter(feature => feature !== null);

            console.log(`Found ${features.length} valid MRDS features out of ${featureMembers.length} total`);
            
            if (features.length === 0) {
                console.warn('No valid features were parsed from the response');
            }
            
            return features;

        } catch (error) {
            console.error('Error fetching/parsing MRDS data:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            return [];
        }
    }
}

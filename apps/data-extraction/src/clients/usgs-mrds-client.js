import { WFSBaseClient } from './wfs-base-client.js';

export class USGSMRDSClient extends WFSBaseClient {
    constructor() {
        super({
            baseUrl: 'https://mrdata.usgs.gov/wfs/mrds',
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

            // Split the coordinate string on common delimiters
            const parts = coordStr.trim().split(/[,\s]+/);
            
            // If we got exactly two parts, try parsing them
            if (parts.length === 2) {
                const [lon, lat] = parts.map(parseFloat);
                
                // Validate the coordinates
                if (!isNaN(lon) && !isNaN(lat) && 
                    Math.abs(lon) <= 180 && Math.abs(lat) <= 90) {
                    return [lon, lat];
                }
                console.warn('Invalid coordinate values:', lon, lat);
                return null;
            }
            
            // Fallback to original concatenated string parsing if needed
            const cleanStr = coordStr.trim();
            const firstDecimal = cleanStr.indexOf('.');
            
            if (firstDecimal > 0) {
                // Look for the second number start after some decimal places
                let secondNumStart = -1;
                for (let i = firstDecimal + 7; i < cleanStr.length; i++) {
                    if (cleanStr[i] === '-' || (!isNaN(cleanStr[i]) && cleanStr[i] !== '.')) {
                        secondNumStart = i;
                        break;
                    }
                }
                
                if (secondNumStart > 0) {
                    const lon = parseFloat(cleanStr.substring(0, secondNumStart));
                    const lat = parseFloat(cleanStr.substring(secondNumStart));
                    
                    if (!isNaN(lon) && !isNaN(lat) && 
                        Math.abs(lon) <= 180 && Math.abs(lat) <= 90) {
                        return [lon, lat];
                    }
                }
            }
            
            console.warn('Failed to parse coordinate string:', coordStr);
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

            // Request features with basic fields first
            const xmlData = await this.getFeatures(bbox, {
                propertyName: [
                    'dep_id', 'site_name', 'dev_stat'
                ].map(field => `ms:${field}`).join(',')
            });
            
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

                // Map raw properties to schema properties with improved field handling
                const properties = {
                    name: feature['ms:site_name'] || 'Unknown',
                    id: feature['ms:dep_id'] || null,
                    development_status: feature['ms:dev_stat'] || null,
                    commodities: (feature['ms:commodity'] || '').trim().split(/[,;]\s*/).filter(Boolean),
                    commodity_desc: feature['ms:commodity'] || '',
                    production_size: feature['ms:prod_size'] || null,
                    ore_control: feature['ms:ore_ctrl'] || null,
                    deposit_type: feature['ms:dep_type'] || null,
                    workings_type: feature['ms:work_type'] || null,
                    url: feature['ms:url'] || null,
                    fips_code: feature['ms:fips_cd'] || null,
                    huc_code: feature['ms:huc_cd'] || null,
                    quad_name: feature['ms:quad_name'] || null
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

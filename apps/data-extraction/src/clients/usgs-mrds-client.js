import { WFSBaseClient } from './wfs-base-client.js';

export class USGSMRDSClient extends WFSBaseClient {
    constructor() {
        super({
            baseUrl: 'https://mrdata.usgs.gov/services/wfs/mrds',
            version: '1.0.0', // Use 1.0.0 for consistent lon,lat order
            typeName: 'mrds',
            srsName: 'EPSG:4326',
            maxFeatures: 10000
        });
    }

    /**
     * Parse coordinates from MRDS format
     */
    parseCoordinates(coordString) {
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
            const lon = parseFloat(firstPair.substring(0, secondDecimal - 2));
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
     * Get MRDS features as parsed objects
     */
    async getMRDSFeatures(bbox) {
        try {
            const xmlData = await this.getFeatures(bbox);
            const features = [];
            const featureRegex = /<gml:featureMember>([\s\S]*?)<\/gml:featureMember>/g;
            const fieldRegex = /<ms:(\w+)>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/ms:\w+>/g;
            
            let featureMatch;
            while ((featureMatch = featureRegex.exec(xmlData)) !== null) {
                const featureXml = featureMatch[1];
                let coordinates = null;
                const rawProps = {};

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

                features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates
                    },
                    properties
                });
            }

            console.log(`Found ${features.length} valid MRDS features`);
            return features;

        } catch (error) {
            console.error('Error parsing MRDS XML:', error);
            return [];
        }
    }
}

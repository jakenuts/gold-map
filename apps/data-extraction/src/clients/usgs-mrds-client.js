import { WFSBaseClient } from './wfs-base-client.js';

export class USGSMRDSClient extends WFSBaseClient {
    constructor() {
        super({
            baseUrl: 'https://mrdata.usgs.gov/wfs/mrds',
            version: '1.0.0',
            typeName: 'mrds',
            srsName: 'EPSG:4326',
            maxFeatures: 10000
        });
        this.fields = [];
    }

    /**
     * Initialize fields from WFS service
     */
    async initialize() {
        try {
            console.log('Fetching sample MRDS feature to determine fields...');
            // Make a GetFeature request to get all fields
            const xmlData = await this.makeRequest('GetFeature', this.defaultBBox, {
                maxFeatures: '1',
                typeName: this.typeName,
                srsName: this.srsName
            });
            
            const parsed = this.xmlParser.parse(xmlData);
            console.log('Full parsed response:', JSON.stringify(parsed, null, 2));
            
            const featureMember = parsed?.['wfs:FeatureCollection']?.['gml:featureMember']?.[0] || {};
            const feature = featureMember['ms:mrds'] || {};
            
            // Extract field names from the feature
            this.fields = Object.keys(feature).filter(key => 
                !key.startsWith('@_') && 
                !key.startsWith('gml:') &&
                !key.startsWith('ms:') &&
                key !== 'msGeometry' &&
                key !== 'boundedBy'
            );

            console.log('Found fields:', this.fields);
        } catch (error) {
            console.error('Error initializing fields:', error);
            // Use known working fields as fallback
            this.fields = [
                'dep_id', 'site_name', 'dev_stat', 'commodity', 'commodmod',
                'ore_ctrl', 'host_rock', 'ore_miner', 'gangue', 'alteration',
                'prod_size', 'dep_type', 'model', 'oper_type', 'work_type',
                'ore_text', 'geology', 'geologyt', 'prod_grade', 'prod_years',
                'reserves', 'dresinfo', 'comments', 'dec_long', 'dec_lat'
            ];
            console.log('Using fallback fields:', this.fields);
        }
    }

    /**
     * Get field names for WFS request
     */
    getFieldNames() {
        return this.fields.join(',');
    }

    /**
     * Parse coordinates from WFS feature
     */
    parseCoordinates(feature) {
        const lon = parseFloat(feature.dec_long);
        const lat = parseFloat(feature.dec_lat);
        
        if (isNaN(lon) || isNaN(lat)) {
            return null;
        }

        if (Math.abs(lon) <= 180 && Math.abs(lat) <= 90) {
            return [lon, lat];
        }

        return null;
    }

    /**
     * Get MRDS features as parsed objects
     */
    async getMRDSFeatures(bbox) {
        // Ensure fields are initialized
        if (this.fields.length === 0) {
            await this.initialize();
        }
        try {
            // Request features with specific fields
            const xmlData = await this.getFeatures(bbox, {
                propertyName: this.getFieldNames()
            });

            // Log the first part of the response to debug
            console.log('XML Response Sample:', xmlData.substring(0, 500));
            
            const parsed = this.xmlParser.parse(xmlData);
            console.log('Parsed structure:', JSON.stringify(parsed, null, 2).substring(0, 500));
            
            // Handle different possible response structures
            const featureMembers = 
                parsed?.['wfs:FeatureCollection']?.['gml:featureMember'] ||
                parsed?.FeatureCollection?.featureMember ||
                [];
            
            const features = featureMembers.map(member => {
                const feature = member['ms:mrds'] || {};
                if (!feature) return null;

                const coordinates = this.parseCoordinates(feature);
                if (!coordinates) return null;

                // Map raw properties to schema properties
                const properties = {
                    name: feature.site_name || 'Unknown',
                    id: feature.dep_id || null,
                    development_status: feature.dev_stat || null,
                    commodities: {
                        primary: feature.commod1?.split(',').map(c => c.trim()) || [],
                        secondary: feature.commod2?.split(',').map(c => c.trim()) || [],
                        tertiary: feature.commod3?.split(',').map(c => c.trim()) || []
                    },
                    geology: {
                        ore_control: feature.ore_ctrl || null,
                        host_rock: feature.host_rock || null,
                        ore_minerals: feature.ore_miner?.split(',').map(m => m.trim()) || [],
                        gangue_minerals: feature.gangue?.split(',').map(m => m.trim()) || [],
                        alteration: feature.alteration || null,
                        deposit_type: feature.dep_type || null,
                        model: feature.model || null,
                        age: feature.geol_age || null,
                        description: feature.geologyt || null
                    },
                    production: {
                        size: feature.prod_size || null,
                        grade: feature.prod_grade || null,
                        years: feature.prod_years || null,
                        type: feature.oper_type || null,
                        work_type: feature.work_type || null
                    },
                    details: {
                        ore_text: feature.ore_text || null,
                        comments: feature.comments || null,
                        references: feature.refs || null,
                        reporter: feature.reporter || null,
                        reserves: feature.reserves || null,
                        processing: feature.dresinfo || null
                    }
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

            console.log(`Found ${features.length} valid MRDS features`);
            return features;

        } catch (error) {
            console.error('Error parsing MRDS XML:', error);
            return [];
        }
    }
}

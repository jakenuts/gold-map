import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

async function testNorCalRequest() {
    try {
        // Northern California bounding box
        const bbox = '-124.482003,39.000000,-120.000000,42.009518';
        
        // Construct URL with parameters
        const baseUrl = 'https://mrdata.usgs.gov/wfs/mrds';
        const params = new URLSearchParams({
            service: 'WFS',
            version: '1.0.0',
            request: 'GetFeature',
            typeName: 'mrds',
            maxFeatures: '100',
            bbox: bbox,
            srsName: 'EPSG:4326'
        });

        const url = `${baseUrl}?${params.toString()}`;
        console.log('Making request to:', url);

        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/xml'
            },
            timeout: 30000
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        // Parse XML response
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: true,
            textNodeName: '#text'
        });

        const parsed = parser.parse(response.data);
        
        // Get feature members
        const featureMembers = parsed?.['wfs:FeatureCollection']?.['gml:featureMember'] || [];
        console.log('\nFound', featureMembers.length, 'features');

        // Log first feature as example
        if (featureMembers.length > 0) {
            console.log('\nExample feature:');
            console.log(JSON.stringify(featureMembers[0], null, 2));
        }

        // Count features by state using FIPS code
        const stateCount = featureMembers.reduce((acc, member) => {
            const fips = member?.['ms:mrds']?.['ms:fips_code'] || 'unknown';
            acc[fips] = (acc[fips] || 0) + 1;
            return acc;
        }, {});

        console.log('\nFeatures by state (FIPS code):');
        Object.entries(stateCount).forEach(([fips, count]) => {
            console.log(`${fips}: ${count} features`);
        });

    } catch (error) {
        console.error('Request failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testNorCalRequest().catch(console.error);

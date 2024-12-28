import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

async function getFeatureFields() {
    const url = new URL('https://mrdata.usgs.gov/wfs/mrds');
    
    // Request a single feature to examine its structure
    const params = {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'mrds',
        maxFeatures: '1',
        bbox: '-124.407182,40.071180,-122.393331,41.740961'
    };
    
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    console.log('Requesting single feature from:', url.toString());

    try {
        const response = await axios.get(url.toString(), {
            headers: {
                'Accept': 'application/xml'
            }
        });

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: true,
            textNodeName: '#text'
        });

        const parsed = parser.parse(response.data);
        
        // Get the first feature
        const feature = parsed?.['wfs:FeatureCollection']?.['gml:featureMember']?.[0]?.['ms:mrds'];
        
        if (feature) {
            console.log('\nAvailable fields in feature:');
            Object.keys(feature)
                .filter(key => !key.startsWith('@_') && !key.startsWith('gml:') && key !== 'msGeometry')
                .forEach(field => {
                    console.log(`- ${field}: ${feature[field]}`);
                });
        } else {
            console.log('No feature found in response');
            console.log('Full response:', JSON.stringify(parsed, null, 2));
        }

    } catch (error) {
        console.error('Error getting feature:', error);
        if (axios.isAxiosError(error)) {
            console.error('Response details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
        }
    }
}

getFeatureFields().catch(console.error);

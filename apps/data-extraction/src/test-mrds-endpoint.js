import axios from 'axios';

async function testMRDSEndpoint() {
    const url = new URL('https://mrdata.usgs.gov/wfs/mrds');
    
    // Basic WFS GetFeature request parameters
    const params = {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'mrds',
        srsName: 'EPSG:4326',
        maxFeatures: '1',
        bbox: '-124.407182,40.071180,-122.393331,41.740961'
    };
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    console.log('Testing MRDS endpoint with URL:', url.toString());

    try {
        const response = await axios.get(url.toString(), {
            headers: {
                'Accept': 'application/xml',
                'Connection': 'keep-alive'
            },
            timeout: 60000,
            maxContentLength: 100 * 1024 * 1024,
            decompress: true,
            responseType: 'text'
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('\nResponse data sample:', response.data.substring(0, 2000));
        
        // Check if response contains expected WFS elements
        const hasFeatureCollection = response.data.includes('wfs:FeatureCollection');
        const hasFeatureMember = response.data.includes('gml:featureMember');
        const hasMRDS = response.data.includes('ms:mrds');
        
        console.log('\nResponse validation:');
        console.log('- Contains FeatureCollection:', hasFeatureCollection);
        console.log('- Contains FeatureMember:', hasFeatureMember);
        console.log('- Contains MRDS data:', hasMRDS);

    } catch (error) {
        console.error('Error testing endpoint:', error);
        if (axios.isAxiosError(error)) {
            console.error('Response details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
            });
        }
    }
}

testMRDSEndpoint().catch(console.error);

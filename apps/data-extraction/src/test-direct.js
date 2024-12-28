import axios from 'axios';

async function testDirectRequest() {
    try {
        // Construct URL with minimal parameters
        const baseUrl = 'https://mrdata.usgs.gov/wfs/mrds';
        const params = new URLSearchParams({
            service: 'WFS',
            version: '1.0.0',
            request: 'GetFeature',
            typeName: 'mrds',
            maxFeatures: '5'
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
        console.log('\nResponse data:', response.data);

    } catch (error) {
        console.error('Request failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testDirectRequest().catch(console.error);

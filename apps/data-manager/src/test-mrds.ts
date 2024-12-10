import { WfsEndpoint } from '@camptocamp/ogc-client';
import { XMLParser } from 'fast-xml-parser';
import type { BoundingBox, CrsCode } from '@camptocamp/ogc-client';
import axios from 'axios';

async function testMRDS() {
    const baseUrl = 'https://mrdata.usgs.gov/services/wfs/mrds';

    try {
        // Define our parameters
        // BoundingBox type expects [minX,minY,maxX,maxY]
        const bbox: BoundingBox = [-124.0, 40.5, -123.5, 41.0];
        const crs: CrsCode = 'EPSG:4326';

        // Create endpoint but don't wait for initialization
        const endpoint = new WfsEndpoint(baseUrl);

        // Try getting URL immediately
        const url = endpoint.getFeatureUrl('mrds', {
            maxFeatures: 10,
            extent: bbox,
            extentCrs: crs,
            outputCrs: crs
        });

        console.log('\nGenerated URL:', url);

        // For WFS 1.1.0, we need to swap coordinate order in bbox
        // from [minX,minY,maxX,maxY] to [minY,minX,maxY,maxX]
        const [minX, minY, maxX, maxY] = bbox;
        const wfsBbox = `${minY},${minX},${maxY},${maxX}`;

        // Construct URL manually with proper parameter formatting
        const params = new URLSearchParams({
            service: 'WFS',
            version: '1.1.0',
            request: 'GetFeature',
            typeName: 'mrds',
            maxFeatures: '10',
            srsName: crs
        });

        // Add bbox parameter separately to ensure proper formatting
        params.append('bbox', `${wfsBbox},${crs}`);
        
        const requestUrl = `${baseUrl}?${params.toString()}`;
        console.log('\nUsing URL:', requestUrl);

        // Make the request
        console.log('\nFetching features...');
        const response = await axios.get(requestUrl, {
            headers: {
                'Accept': 'application/xml'
            }
        });

        console.log('Response status:', response.status);

        // Parse XML
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: true,
            textNodeName: '_text',
            isArray: (name) => ['featureMember'].indexOf(name) !== -1,
            removeNSPrefix: true
        });

        const data = parser.parse(response.data);
        const features = data?.FeatureCollection?.featureMember?.map((f: any) => f.mrds) || [];
        
        console.log(`\nRetrieved ${features.length} features`);

        if (features.length > 0) {
            console.log('\nFirst feature:', JSON.stringify(features[0], null, 2));
            
            // Show all available fields from first feature
            console.log('\nAvailable fields:');
            Object.keys(features[0]).sort().forEach(key => {
                const value = features[0][key];
                console.log(`${key}: ${typeof value} = ${JSON.stringify(value)}`);
            });
        } else {
            console.log('\nRaw response:', response.data.substring(0, 1000));
        }

    } catch (error) {
        console.error('Error:', error);
        if (axios.isAxiosError(error)) {
            console.error('Response data:', error.response?.data);
        }
    }
}

// Run the test
testMRDS().catch(console.error);

import { WfsEndpoint } from '@camptocamp/ogc-client';
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

async function testMRDS() {
    const baseUrl = 'https://mrdata.usgs.gov/services/wfs/mrds';

    try {
        // Get capabilities
        const params = new URLSearchParams({
            service: 'WFS',
            version: '1.1.0',
            request: 'GetCapabilities'
        });

        const url = `${baseUrl}?${params.toString()}`;
        console.log('\nGetting capabilities from:', url);

        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/xml'
            }
        });
        console.log('Response status:', response.status);
        
        const text = response.data;

        // Parse XML
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: true,
            textNodeName: '_text',
            isArray: (name) => ['FeatureType', 'Operation'].indexOf(name) !== -1,
            removeNSPrefix: true
        });

        const data = parser.parse(text);
        
        // Extract service information
        const serviceInfo = data?.WFS_Capabilities?.ServiceIdentification || {};
        console.log('\nService Information:');
        console.log('Title:', serviceInfo.Title?._text);
        console.log('Abstract:', serviceInfo.Abstract?._text);
        console.log('Keywords:', serviceInfo.Keywords?._text);

        // Extract operations
        const operations = data?.WFS_Capabilities?.OperationsMetadata?.Operation || [];
        console.log('\nAvailable Operations:');
        operations.forEach((op: any) => {
            console.log(`\nOperation: ${op['@_name']}`);
            if (op.Parameter) {
                console.log('Parameters:', op.Parameter);
            }
        });

        // Extract feature type details
        const featureTypes = data?.WFS_Capabilities?.FeatureTypeList?.FeatureType || [];
        console.log('\nFeature Types:');
        featureTypes.forEach((ft: any) => {
            console.log(`\nName: ${ft.Name?._text}`);
            console.log(`Title: ${ft.Title?._text}`);
            console.log(`Abstract: ${ft.Abstract?._text}`);
            if (ft.DefaultSRS) console.log(`Default SRS: ${ft.DefaultSRS?._text}`);
            if (ft.OtherSRS) console.log(`Other SRS: ${ft.OtherSRS?._text}`);
            if (ft.OutputFormats) console.log('Output Formats:', ft.OutputFormats);
        });

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Axios error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
        } else {
            console.error('Error:', error);
        }
    }
}

// Run the test
testMRDS().catch(console.error);

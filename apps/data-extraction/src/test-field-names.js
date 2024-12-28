import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

async function getFieldNames() {
    const url = new URL('https://mrdata.usgs.gov/wfs/mrds');
    
    // Request DescribeFeatureType to get field definitions
    const params = {
        service: 'WFS',
        version: '1.0.0',
        request: 'DescribeFeatureType',
        typeName: 'mrds',
        outputFormat: 'XMLSCHEMA'
    };
    
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    console.log('Requesting feature type description from:', url.toString());

    try {
        const response = await axios.get(url.toString(), {
            headers: {
                'Accept': 'application/xml'
            }
        });

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: true
        });

        const parsed = parser.parse(response.data);
        console.log('Full response:', JSON.stringify(parsed, null, 2));

        // Navigate through the schema structure to find element definitions
        const schema = parsed?.['xsd:schema'];
        const complexType = schema?.['xsd:complexType']?.find(t => t?.['@_name'] === 'mrdsType');
        const sequence = complexType?.['xsd:complexContent']?.['xsd:extension']?.['xsd:sequence'];
        const elements = sequence?.['xsd:element'] || [];

        console.log('\nField definitions:');
        elements.forEach(element => {
            console.log(`- ${element['@_name']}: ${element['@_type']}`);
        });

    } catch (error) {
        console.error('Error getting field names:', error);
        if (axios.isAxiosError(error)) {
            console.error('Response details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
        }
    }
}

getFieldNames().catch(console.error);

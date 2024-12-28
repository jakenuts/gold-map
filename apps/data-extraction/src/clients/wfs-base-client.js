import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

/**
 * Base WFS client that handles common WFS operations
 */
export class WFSBaseClient {
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.version = config.version || '1.0.0';
        this.typeName = config.typeName;
        this.srsName = config.srsName || 'EPSG:4326';
        this.maxFeatures = config.maxFeatures || 100;
        
        // Default bounding box if none provided
        this.defaultBBox = config.defaultBBox || {
            minLon: -124.407182,
            minLat: 40.071180,
            maxLon: -122.393331,
            maxLat: 41.740961
        };

        // Initialize XML parser with options tuned for USGS WFS
        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: true,
            textNodeName: '#text',
            isArray: (name) => [
                'featureMember',
                'coordinates',
                'element',
                'sequence',
                'complexType'
            ].indexOf(name) !== -1,
            removeNSPrefix: false,
            trimValues: true,
            parseTagValue: true,
            parseTrueNumberOnly: true,
            ignoreDeclaration: true,
            ignorePiTags: true,
            allowBooleanAttributes: true
        });
    }

    /**
     * Format bounding box based on WFS version
     */
    formatBBox(bbox) {
        let effectiveBox = bbox || this.defaultBBox;
        
        // Validate coordinates
        if (!this.isValidCoordinates(effectiveBox)) {
            console.warn('Invalid bounding box, using default:', effectiveBox);
            effectiveBox = this.defaultBBox;
        }

        // Always use lon,lat order for 1.0.0
        return [
            effectiveBox.minLon.toFixed(6),
            effectiveBox.minLat.toFixed(6),
            effectiveBox.maxLon.toFixed(6),
            effectiveBox.maxLat.toFixed(6)
        ].join(',');
    }

    /**
     * Validate coordinate values
     */
    isValidCoordinates(bbox) {
        const { minLon, minLat, maxLon, maxLat } = bbox;

        // Check longitude range (-180 to 180)
        if (minLon < -180 || minLon > 180 || maxLon < -180 || maxLon > 180) {
            return false;
        }

        // Check latitude range (-90 to 90)
        if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
            return false;
        }

        // Check that min is less than max
        if (minLon > maxLon || minLat > maxLat) {
            return false;
        }

        return true;
    }

    /**
     * Get feature type description from WFS service
     */
    async describeFeatureType() {
        const response = await this.makeRequest('DescribeFeatureType', null, {
            typeName: this.typeName
        });
        return response;
    }

    /**
     * Build request parameters for WFS operation
     */
    getRequestParams(operation, bbox, additionalParams = {}) {
        const params = {
            service: 'WFS',
            version: this.version,
            request: operation,
            ...additionalParams
        };

        if (operation === 'GetFeature') {
            params.typeName = this.typeName;
            params.srsName = this.srsName;
            params.maxFeatures = this.maxFeatures.toString();
            if (bbox) {
                params.bbox = this.formatBBox(bbox);
            }
            
            // Don't specify propertyName to get all available fields
            if (additionalParams.propertyName === '') {
                delete params.propertyName;
            }
        }

        return params;
    }

    /**
     * Check for WFS service exceptions in XML response
     */
    checkServiceException(xmlData) {
        if (xmlData.includes('ServiceExceptionReport')) {
            const errorMatch = xmlData.match(/<ServiceException[^>]*>([\s\S]*?)<\/ServiceException>/);
            const errorMessage = errorMatch ? errorMatch[1].trim() : 'Unknown WFS service error';
            throw new Error(`WFS service error: ${errorMessage}`);
        }
    }

    /**
     * Make WFS request and return raw XML response
     */
    async makeRequest(operation, bbox, additionalParams = {}) {
        try {
            const url = new URL(this.baseUrl);
            const params = this.getRequestParams(operation, bbox, additionalParams);
            
            // Add parameters to URL
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });

            console.log(`Making ${operation} request to:`, url.toString());

            console.log('Making request to URL:', url.toString());
            const response = await axios.get(url.toString(), {
                headers: {
                    'Accept': 'application/xml',
                    'Connection': 'keep-alive'
                },
                timeout: 60000,
                maxContentLength: 100 * 1024 * 1024,
                decompress: true,
                validateStatus: (status) => status < 500,
                httpAgent: new HttpAgent({ keepAlive: true }),
                httpsAgent: new HttpsAgent({ keepAlive: true })
            });

            if (typeof response.data === 'string') {
                console.log('Raw XML response:', response.data.substring(0, 1000));
                // Check for service exceptions
                this.checkServiceException(response.data);
                return response.data;
            }

            throw new Error('Unexpected response format');
        } catch (error) {
            console.error(`Error in ${operation}:`, error);
            if (axios.isAxiosError(error)) {
                console.error('Response details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                });
            }
            throw error;
        }
    }

    /**
     * Get raw XML response for GetFeature
     */
    async getFeatures(bbox, additionalParams = {}) {
        return this.makeRequest('GetFeature', bbox, additionalParams);
    }
}

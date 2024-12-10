# WFS (Web Feature Service) Endpoints

## Protocol Details

### Versions
- **1.0.0**: Uses lon,lat coordinate order in bbox
- **1.1.0**: Uses lat,lon coordinate order in bbox (EPSG axis order)

### Common Operations
- **GetCapabilities**: Get service metadata
- **DescribeFeatureType**: Get feature type schema
- **GetFeature**: Retrieve actual features

### Request Parameters
| Parameter | Description | Example |
|-----------|-------------|---------|
| service | Always 'WFS' | WFS |
| version | Protocol version | 1.0.0, 1.1.0 |
| request | Operation name | GetFeature |
| typeName | Feature type to query | mrds |
| bbox | Bounding box for spatial filtering | -124,40,-123,41 |
| srsName | Coordinate reference system | EPSG:4326 |
| maxFeatures | Limit number of features | 10 |
| outputFormat | Response format | application/xml, application/json |

### Important Notes
1. **Coordinate Order**:
   - WFS 1.0.0: bbox uses lon,lat order (minLon,minLat,maxLon,maxLat)
   - WFS 1.1.0: bbox uses lat,lon order (minLat,minLon,maxLat,maxLon)
   - Always verify with specific endpoint documentation

2. **Response Formats**:
   - XML/GML is the most reliable format
   - JSON support varies by endpoint
   - Some endpoints support GeoJSON directly

3. **Error Handling**:
   - Check for ServiceExceptionReport in XML responses
   - Handle coordinate order differences between versions
   - Validate bounding box values

## Implementation Strategy

### Generic WFS Client
1. **Version Support**:
   - Support both 1.0.0 and 1.1.0
   - Handle coordinate order differences automatically
   - Allow version selection per endpoint

2. **Response Handling**:
   - Focus on XML/GML parsing first (most reliable)
   - Add JSON support as fallback
   - Provide raw response access for endpoint-specific parsing

3. **Error Handling**:
   - Parse ServiceExceptionReport
   - Validate coordinates and parameters
   - Provide detailed error information

### Endpoint-Specific Clients
1. **Configuration**:
   - Specify version requirements
   - Define feature type schema
   - Set default parameters

2. **Response Parsing**:
   - Implement endpoint-specific XML parsing
   - Define typed feature interfaces
   - Handle special cases or extensions

3. **Feature Transformation**:
   - Convert to common GeoJSON format
   - Add endpoint-specific property mapping
   - Handle coordinate transformations if needed

## Testing Strategy
1. **Basic Operations**:
   - GetCapabilities to verify service
   - GetFeature with simple bbox
   - Error response handling

2. **Version Compatibility**:
   - Test coordinate order handling
   - Verify parameter formatting
   - Check response parsing

3. **Edge Cases**:
   - Invalid bbox values
   - Service exceptions
   - Large response handling

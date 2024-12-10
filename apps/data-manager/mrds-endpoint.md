# USGS MRDS (Mineral Resources Data System) Endpoint

## Service Details
- **Base URL**: https://mrdata.usgs.gov/services/wfs/mrds
- **Feature Type**: mrds
- **Version**: 1.0.0 (preferred, uses lon,lat order)
- **SRS**: EPSG:4326

## Feature Properties
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| NAME | string | Site name | "Liscomb Hill" |
| DEP_TYPE | string | Deposit type | "Vein" |
| COMMOD1 | string | Primary commodity | "Gold" |
| ID | string | Unique identifier | "10187731" |
| SITE_TYPE | string | Type of site | "Prospect" |
| DEV_STATUS | string | Development status | "Active" |
| STATE | string | State location | "CA" |
| COUNTY | string | County location | "Humboldt" |
| LAT | number | Latitude | 40.832940 |
| LONG | number | Longitude | -123.956440 |

## XML Response Structure
```xml
<wfs:FeatureCollection>
  <gml:featureMember>
    <mrds>
      <NAME>Site Name</NAME>
      <DEP_TYPE>Deposit Type</DEP_TYPE>
      <COMMOD1>Primary Commodity</COMMOD1>
      <!-- ... other fields ... -->
      <gml:Point>
        <gml:coordinates>-123.956440,40.832940</gml:coordinates>
      </gml:Point>
    </mrds>
  </gml:featureMember>
</wfs:FeatureCollection>
```

## Coordinate Handling
1. Primary Source: gml:Point/gml:coordinates
2. Fallback: LAT/LONG fields
3. Format: Comma or space-separated values
4. Order: lon,lat in WFS 1.0.0

## Implementation Notes
1. **XML Parsing**:
   - Handle both namespaced and non-namespaced tags
   - Support multiple coordinate formats
   - Extract all available metadata

2. **Data Transformation**:
   - Convert to GeoJSON format
   - Normalize property names
   - Handle missing or null values

3. **Error Handling**:
   - Validate coordinate values
   - Check for required fields
   - Handle malformed XML

4. **Feature Properties**:
   - Preserve original field names
   - Include all available metadata
   - Convert types appropriately (string/number)

## Example Usage
```typescript
const client = new USGSMRDSClient();
const bbox = {
  minLon: -124.0,
  minLat: 40.5,
  maxLon: -123.5,
  maxLat: 41.0
};
const features = await client.getFeatures(bbox);
```

## Common Issues
1. **Coordinate Variations**:
   - Different coordinate formats in response
   - Need to handle both lat,lon and lon,lat orders
   - Validate coordinate ranges

2. **XML Structure**:
   - Inconsistent namespace usage
   - Multiple possible paths to same data
   - Need to handle both single and multiple features

3. **Data Quality**:
   - Missing or null values
   - Inconsistent field casing
   - Various date formats

## Testing Strategy
1. **Basic Operations**:
   - GetFeature with bbox
   - Coordinate parsing
   - Feature transformation

2. **Edge Cases**:
   - Empty responses
   - Invalid coordinates
   - Missing fields

3. **Data Validation**:
   - Property types
   - Coordinate ranges
   - Required fields

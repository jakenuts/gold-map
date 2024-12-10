# USGS Web Feature Services

## MRDS (Mineral Resources Data System)

### Base URL
`https://mrdata.usgs.gov/services/wfs/mrds`

### Service Parameters
- **Service**: WFS
- **Version**: 1.1.0 (confirmed working)
- **TypeName**: mrds
- **SRS**: EPSG:4326

### Request Parameters
| Parameter | Description | Format | Example |
|-----------|-------------|---------|---------|
| bbox | Bounding box for spatial filtering | minLat,minLon,maxLat,maxLon,EPSG:4326 | 40.5,-124.0,41.0,-123.5,EPSG:4326 |
| maxFeatures | Limit number of returned features | integer | 10 |
| srsName | Coordinate reference system | string | EPSG:4326 |

### Feature Fields (Verified)
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| @_id | string | Feature ID | "mrds.182885" |
| dep_id | number | Deposit ID | 10187731 |
| site_name | string | Name of the site | "Liscomb Hill" |
| dev_stat | string | Development status | "Prospect" |
| code_list | string | Commodity codes | "BA" |
| fips_code | string | FIPS location code | "f06023" |
| huc_code | string | Hydrologic Unit Code | "h18010102" |
| quad_code | string | Quadrangle code | "q41124NWA2" |
| url | string | Link to USGS detail page | "https://mrdata.usgs.gov/mrds/show-mrds.php?dep_id=10187731" |
| geometry | object | GML Point geometry | {"Point": {"pos": "40.832940 -123.956440", "@_srsName": "EPSG:4326"}} |
| boundedBy | object | Feature bounding box | {"Envelope": {"lowerCorner": "40.832940 -123.956440", "upperCorner": "40.832940 -123.956440", "@_srsName": "EPSG:4326"}} |

### Important Notes
- WFS 1.1.0 uses lat,lon coordinate order (different from 1.0.0 which uses lon,lat)
- The service only supports XML/GML output format (GML 3.1.1)
- Each feature has a unique dep_id that can be used to link to the full USGS record
- The code_list field contains commodity codes (e.g., "BA")
- Coordinates are returned in "latitude longitude" order in both geometry and boundedBy fields

### Example Request
```
https://mrdata.usgs.gov/services/wfs/mrds?
  service=WFS&
  version=1.1.0&
  request=GetFeature&
  typeName=mrds&
  srsName=EPSG:4326&
  maxFeatures=10&
  bbox=40.5,-124.0,41.0,-123.5,EPSG:4326
```

### Implementation Notes
1. Coordinate Order:
   - WFS 1.1.0 expects bbox in lat,lon order
   - Response geometry is also in lat,lon order
   - Convert as needed for GeoJSON (which uses lon,lat)

2. Response Format:
   - Content-Type: text/xml; subtype=gml/3.1.1; charset=UTF-8
   - GML 3.1.1 format with namespace prefixes
   - Point geometries use gml:pos element for coordinates

3. Using ogc-client:
   - BoundingBox type expects [minX,minY,maxX,maxY]
   - Need to transform coordinates for WFS 1.1.0 requests
   - Client initialization (isReady) may be slow/unreliable
   - Manual URL construction might be more reliable

4. Error Handling:
   - Check for empty FeatureCollection
   - Validate coordinate values and order
   - Handle both XML parsing and GML interpretation

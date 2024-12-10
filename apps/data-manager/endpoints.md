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
| code_list | string | Commodity codes | "CU AU" |
| fips_code | string | FIPS location code | "fCI" |
| huc_code | string | Hydrologic Unit Code | null |
| quad_code | string | Quadrangle code | null |
| url | string | Link to USGS detail page | "https://mrdata.usgs.gov/mrds/show-mrds.php?dep_id=10058048" |
| geometry | object | GML Point geometry | {"Point": {"pos": "-26.387770 -70.302320", "@_srsName": "EPSG:4326"}} |

### Notes
- The service only supports XML/GML output formats (no GeoJSON support)
- Coordinates are returned in latitude,longitude order in WFS 1.1.0
- Some fields (huc_code, quad_code) may be empty depending on the location
- The bbox parameter must include the CRS URN suffix for WFS 1.1.0
- Each feature has a unique dep_id that can be used to link to the full USGS record
- The code_list field contains space-separated commodity codes (e.g., "CU AU" for Copper and Gold)

### Example Requests

#### Get Features
```
https://mrdata.usgs.gov/services/wfs/mrds?
  service=WFS&
  version=1.1.0&
  request=GetFeature&
  typeName=mrds&
  srsName=EPSG:4326&
  maxFeatures=5&
  bbox=40.5,-124.0,41.0,-123.5,urn:ogc:def:crs:EPSG::4326
```

#### Get Feature Count
```
https://mrdata.usgs.gov/services/wfs/mrds?
  service=WFS&
  version=1.1.0&
  request=GetFeature&
  typeName=mrds&
  resultType=hits
```

### Implementation Notes
- When implementing a client, always handle the XML response format (GML 3.1.1)
- Consider implementing coordinate order conversion since the service uses lat,lon but GeoJSON uses lon,lat
- The dep_id field is useful for deduplication and linking to more detailed information
- The code_list field can be parsed to identify the commodities present at each site
- Use resultType=hits to get feature count before fetching actual features
- Both WFS 1.0.0 and 1.1.0 are supported, but 1.1.0 is recommended for better coordinate handling

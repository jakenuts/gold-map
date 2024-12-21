# Gold Map Data Extraction

This project combines multiple data sources to create comprehensive gold mining and prospecting datasets for Northern California. It processes and combines data from:

1. USGS Mineral Resources Data System (MRDS)
2. Bureau of Land Management (BLM) Mining Claims

## Data Sources

### USGS MRDS
- Contains detailed information about mineral resources including mines, prospects, and deposits
- Data includes geological information, production history, resources, and more
- Accessed through text files in the `data/` directory
- Provides rich historical and geological context for mining sites

### BLM Mining Claims
- Provides active and closed mining claim boundaries
- Accessed through REST API: `https://gis.blm.gov/nlsdb/rest/services/Mining_Claims/MiningClaims/MapServer`
- Includes claim status, type, acreage, and legal descriptions
- Two main categories:
  - Active Claims (Layer 1)
  - Closed Claims (Layer 2)

## Scripts

### Data Fetching and Processing

1. `compile-northern-california.js`
   - Processes USGS MRDS text files
   - Filters data to Northern California region
   - Creates comprehensive site records with all related data
   - Output: `extracted/northern_california_sites.json`

2. `fetch-blm-claims.js`
   - Fetches both active and closed mining claims from BLM API
   - Uses same geographic bounds as USGS data
   - Combines claims into single GeoJSON dataset
   - Output: `extracted/blm_mining_claims.geojson`

3. `create-combined-gold-data.js`
   - Combines USGS gold sites and BLM mining claims
   - Creates unified GeoJSON dataset
   - Converts data to KML format
   - Outputs:
     - `extracted/combined_gold_data.geojson`
     - `extracted/combined_gold_data.kml`

### Analysis Scripts

1. `analyze-data-relationships.js`
   - Examines relationships between different data fields
   - Helps understand data structure and connections

2. `analyze-gold-references.js`
   - Focuses on gold-specific data points
   - Identifies important gold-related features

3. `create-focused-gold-geojson.js`
   - Creates gold-focused dataset
   - Filters and enhances gold-related information

## Geographic Coverage

The project focuses on Northern California with the following bounds:
- North: 41.7410164
- South: 40.0711794
- East: -122.3933314
- West: -124.4071825

## Data Structure

### USGS Data Fields
- Site identification and names
- Location coordinates and administrative info
- Deposit characteristics
- Geological information
- Production history
- Resource estimates
- Ownership information

### BLM Claims Fields
- Claim status (active/closed)
- Claim type (lode, placer, etc.)
- Case number
- Claim name
- Recorded acres
- Patent status
- Legal land description

## Usage

1. Fetch and process USGS data:
```bash
node src/compile-northern-california.js
```

2. Fetch BLM claims data:
```bash
node src/fetch-blm-claims.js
```

3. Create combined dataset:
```bash
node src/create-combined-gold-data.js
```

The final outputs will be available in the `extracted/` directory:
- `combined_gold_data.geojson`: Combined dataset in GeoJSON format
- `combined_gold_data.kml`: Combined dataset in KML format for use in mapping applications

## Data Quality Notes

1. USGS MRDS Data:
   - Historical data with varying levels of detail
   - Some records may be incomplete or outdated
   - Valuable for geological and historical context

2. BLM Claims Data:
   - Updated regularly through MLRS
   - Accurate claim boundaries based on legal descriptions
   - Current status information
   - Quality scores available for spatial accuracy

## Future Enhancements

Potential improvements to consider:

1. Additional Data Sources:
   - State mining records
   - Historical maps and surveys
   - Environmental impact reports

2. Enhanced Analysis:
   - Spatial clustering of claims and sites
   - Historical trend analysis
   - Geological correlation studies

3. Data Updates:
   - Automated periodic updates from BLM API
   - Version tracking for changes
   - Change detection between updates

## Dependencies

- Node.js
- node-fetch: For API requests
- tokml: For KML conversion
- fs/promises: For file operations

## Contributing

When adding new features or data sources:

1. Maintain consistent geographic bounds
2. Follow existing data structure patterns
3. Update documentation
4. Add appropriate error handling
5. Include data quality notes

## License

This project is for educational and research purposes. Please respect data source terms of use and attribution requirements.

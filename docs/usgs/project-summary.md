I'd like to build a system that can pull all the data relating to a particular area (starting with Northern California) from various OGC feeds, correlate entries between feeds and build an aggregated dataset that can be updated, filtered, viewed on a map & table, and extended over time while keeping the core data
from these feeds complete and refreshed. The folders below contain attempts at this, use that information and code where helpful. Reuse a project if it seems to present a good starting point or begin a new one. All code should be either typescript/react or if that presents problems python can be used for the data collection/aggregation but not presentation.

Tasks

1. Analyse these pages and feeds to determine the best sources for the most complete datasets along with any related data.
2. Append a succint list of the feeds, formats and features in each feed.
3. Build a system to collect generic geo data on a schedule and a data store to work with them. One location might have many related sites so allow links between them.
4. Build reliable feed retreival clients for each feed and dataset.
5. Test the collection, aggregation, cross linking and storage elements of the system
6. Build the querying/filtering/exporting subsystem to create geojson, kml, json data outputs.
7. Summarize all work in succint lists categorized by task and include insights that will help using the feeds, system or extending the work.

* Make sure all code builds, is well structured and captures all the data available given the search area.
* Commit each significant change to git with a list of tasks accomplished
* Extend, improve and mark off tasks in this document.

Feed Analysis and Data Relationships (Updated 2024-01-09)
---------------------------

### USGS Data Feed Analysis

1. MRDS (Mineral Resources Data System)
   - Primary data source for mineral deposits
   - Capabilities:
     * WFS 1.1.0 with GML 3.1.1 output
     * Rich filtering (spatial, attribute-based)
     * Global coverage (-179,-73 to 180,81)
   - Key Data Elements:
     * Deposit identification and names
     * Development status and significance
     * Commodity information
     * Geographic and administrative location
     * Bibliographic references
     * Links to related records
   - Strengths:
     * Comprehensive mineral resource information
     * Historical and geological context
     * Production and development details
   - Limitations:
     * Point-based locations only
     * Some historical data may be incomplete

2. SGMC (State Geologic Map Compilation)
   - Geological context at 1:500,000 scale
   - Capabilities:
     * WFS 1.1.0 with GML 3.1.1 output
     * US coverage (-125,24.5 to -66.9,49.4)
     * Three feature types
   - Feature Types:
     * Lithology: Bedrock and surficial geology
     * Contacts: Geological boundaries
     * Structure: Faults and other features
   - Strengths:
     * Consistent geology across state boundaries
     * Rich geological context for mineral deposits
     * Complete spatial coverage
   - Limitations:
     * 1:500,000 scale may miss local details
     * Complex polygon and line geometries

3. USMIN (Mining Features)
   - Physical mining infrastructure from USGS topo maps
   - Capabilities:
     * WFS 1.1.0 with GML 3.1.1 output
     * Western US coverage (-125,29 to -94.35,49.1)
     * Both point and polygon features
   - Feature Types:
     * Points: shafts, adits, prospects, etc.
       - Location and feature type
       - Source map details (name, date, scale)
       - Feature orientation (azimuth)
     * Polygons: mining areas and facilities
   - Strengths:
     * Detailed physical infrastructure
     * Historical map source tracking
     * Spatial relationships between features
   - Limitations:
     * Western US coverage only
     * Historical data may not reflect current conditions

4. Geophysics and Additional Data
   - Magnetic Anomaly Data:
     * WMS-based interactive map service
     * Gridded data covering North America
     * Shows variations in earth materials/structure
     * Available through map viewer interface
     * Direct WMS service endpoints unstable
   - Additional Geophysical Data:
     * Airborne geophysical surveys available
     * Includes magnetic field, resistivity, gamma ray
     * Coverage varies by survey area
   - Integration Considerations:
     * Primary access through map viewers
     * Direct service access needs reliability testing
     * May need to implement caching/fallback options
     * Consider using downloaded data for reliability

5. Data Relationships and Integration
   - MRDS provides the authoritative deposit information
   - USMIN adds physical infrastructure context
   - Linkage opportunities:
     * Spatial proximity
     * Name matching where available
     * Cross-referencing with historical documents
   - Integration considerations:
     * Different spatial coverages
     * Temporal differences in data collection
     * Varying levels of attribute completeness

4. Best Practices for Feed Usage
   - Use MRDS as primary data source
   - Enhance with USMIN physical features
   - Consider temporal aspects of data
   - Implement robust error handling for:
     * Missing attributes
     * Coordinate transformations
     * XML namespace handling
   - Cache responses to reduce API load
   - Implement progressive loading for large areas

5. Data Quality Considerations
   - Validate coordinate systems (WGS84/NAD27)
   - Check completeness of required fields
   - Consider historical context of data
   - Verify spatial relationships
   - Track data sources and dates


### Completed Tasks

1. Data Source Analysis ✓
   - Analyzed USGS MRDS, USMIN, SGMC, and geophysics data feeds
   - Documented feed formats and capabilities in feeds-summary.md
   - Identified WFS/WMS/WMTS endpoints and their specific features

2. Data Collection and Storage ✓
   - Implemented TypeScript-based data manager with PostGIS integration
   - Created flexible GeoLocation schema supporting multiple data types
   - Built robust WFS client with XML/JSON response handling
   - Implemented bounding box validation and coordinate parsing

3. Feed Retrieval Clients ✓
   - Developed USGS MRDS data extraction pipeline
   - Implemented BLM mining claims data fetching
   - Created data transformation and validation layers
   - Added support for multiple coordinate systems

4. Data Processing and Linking ✓
   - Created scripts for Northern California data compilation
   - Implemented data relationship analysis
   - Built gold-specific data filtering and enhancement
   - Combined USGS and BLM data into unified datasets

5. Export System ✓
   - Implemented GeoJSON and KML export capabilities
   - Created optimized and focused datasets for different use cases
   - Added rich description generation for sites

### Key Insights

1. Feed Characteristics
   - MRDS WFS feed provides richest historical and geological data
   - USMIN WFS complements MRDS with detailed site features
   - SGMC provides crucial geological context but requires careful processing
   - Geophysics feeds best accessed through WMS for visualization

2. Implementation Challenges
   - WFS responses require robust XML parsing with namespace handling
   - Coordinate systems vary between feeds requiring transformation
   - Large datasets need optimization for web visualization
   - Complex relationships between sites require careful data modeling

3. Data Quality Considerations
   - Historical USGS data has varying levels of completeness
   - BLM claim data more current but requires regular updates
   - Spatial accuracy varies between data sources
   - Some site relationships only discoverable through text analysis

4. Best Practices
   - Use PostGIS for efficient spatial queries
   - Implement flexible schema for varied data types
   - Cache WFS responses to reduce API load
   - Use spatial indexing for performance
   - Maintain source data integrity while enhancing relationships

### Future Recommendations

1. Data Enhancement
   - Implement automated updates from BLM API
   - Add state-level mining records
   - Incorporate historical maps and surveys
   - Add environmental impact data

2. System Improvements
   - Add spatial clustering for better visualization
   - Implement change detection between updates
   - Add version tracking for data changes
   - Enhance cross-reference between data sources

3. Performance Optimization
   - Implement tile-based data loading
   - Add client-side caching
   - Optimize property filtering
   - Add progressive loading for large datasets

Data Sources

Summary Pages
	
	Map with links to aggregate data feeds below
	https://mrdata.usgs.gov/general/map-us.html

	Summary of all data available
	https://mrdata.usgs.gov/

Mineral Deposit/Extraction Sites
	
	https://mrdata.usgs.gov/services/wfs/mrds

	Sites of current or past mineral extraction sites like mines, placer operations, dredging, related workings (tailing piles, etc) and related comments, remarks, geological studies, rock types, historical data.

	- Capture every data point available
	- Identify any other data available in this API
	- Identify related data in this or other USGS feeds
	- Aggregate any data related to the sites, nearby associated locations or geological/historical analysis & remarks.


Mining Features
	
	https://mrdata.usgs.gov/services/wfs/usmin
	* wfs 1.1 - also wms 1.3, OGC feeds

	Markers for entrances, adits, other sites associted with a mining operation. Should be related
	to MRDS mineral resource sites. For instance, a gold mine from MRDS will have it's shaft, adits listed here
	along with locations, direction pointing, remarks

	- Capture every data point available
	- Identify any other data available in this API
	- Identify related data in this or other USGS feeds
	- Aggregate any data related to the sites, nearby associated locations or geological/historical analysis & remarks.

SGMC Geologic Features

	https://mrdata.usgs.gov/services/wfs/sgmc2
	wfs 1.1 - also wms 1.3,wmts 1.1 OGC feeds

	SGMC geologic units
	SGMC contacts
	SGMC structures

Geology and Geophysics Data
 	
	Magnetic anomaly

		https://www.sciencebase.gov/arcgis/services/mrt/NAmag_webmerc/MapServer/	WMSServer?request=GetCapabilities&service=WMS&version=1.3.0
		* WMS 1.3 - also WMTS 1.0 OGC feed - possibly others hidden?

	Gravity: Bouguer anomaly
	Gravity: Isostatic anomaly
	Gamma ray: Uranium
	Gamma ray: Thorium
	Gamma ray: Potassium

Geochemistry

	NGDB Rock geochemistry
	NGDB Sediment geochemistry
	NGDB Soil geochemistry
	NGDB Concentrate geochemistry

Data Viewer Implementation (Updated 2024-01-09)
---------------------------

### Architecture Overview

1. Data Source Abstraction
   - Common interface for all data sources (WFS, KML, database)
   - Standardized data fetching and column definitions
   - Support for filtering and pagination
   - Geometry handling for spatial data

2. UI Components
   - Modern table interface using shadcn/ui
   - Source selection dropdown
   - File upload for KML/KMZ
   - Search and filtering capabilities
   - Responsive design

3. Data Sources
   - MRDS WFS feed integration
   - KML/KMZ file support
   - Future: Database integration
   - Future: Additional USGS feeds

### Implementation Status

1. Core Framework ✓
   - Data source interface defined
   - UI components created
   - Table view implementation
   - Basic filtering support

2. Data Sources
   - KML/KMZ: File loading and parsing ✓
   - MRDS: WFS client implementation ✓
   - Pending: Additional USGS feeds
   - Pending: Database integration

3. Next Steps
   - Test MRDS feed integration
   - Add column customization
   - Implement advanced filtering
   - Add export capabilities
   - Add visualization options

Code Entry Points and Scripts
---------------------------

### Data Manager (TypeScript/Node.js)
Location: `data-manager/`
- `src/server.ts` - Main application server with PostGIS integration
- `src/test-mrds.ts` - USGS MRDS feed client and testing
- `src/test-mrds-storage.ts` - Data storage and retrieval testing
- `src/run-migrations.ts` - Database schema management

### Data Extraction Scripts (Node.js)
Location: `data-extraction/src/`

Data Collection:
- `compile-northern-california.js` - Processes USGS MRDS text files for Northern California
- `fetch-blm-claims.js` - Fetches BLM mining claims data
- `create-combined-gold-data.js` - Combines USGS and BLM data

Analysis:
- `analyze-data-relationships.js` - Examines relationships between data fields
- `analyze-gold-references.js` - Analyzes gold-specific data points
- `analyze-data-completeness.js` - Checks data quality and completeness

Export:
- `convert-to-geojson.js` - Creates standard GeoJSON output
- `convert-to-rich-geojson.js` - Creates enhanced GeoJSON with full details
- `convert-to-optimized-geojson.js` - Creates size-optimized GeoJSON
- `create-focused-gold-geojson.js` - Creates gold-specific datasets

### Web Application (TypeScript/React)
Location: `diggings-map/`
- `src/main.tsx` - Application entry point
- `src/App.tsx` - Main application component
- `src/services/` - Data fetching and processing services

To evaluate progress:

1. Data Collection System:
```bash
cd data-manager
pnpm install
# Set up .env file with database credentials
pnpm typeorm migration:run
node src/server.js
```

2. Data Processing:
```bash
cd data-extraction
npm install
node src/compile-northern-california.js
node src/fetch-blm-claims.js
node src/create-combined-gold-data.js
```

3. Web Visualization:
```bash
cd diggings-map
pnpm install
pnpm dev
```

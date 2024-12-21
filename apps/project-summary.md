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


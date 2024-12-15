import { createReadStream, writeFileSync } from 'fs';
import { createInterface } from 'readline';

/*
GeoJSON is recommended for this dataset because:
1. It's widely supported by GIS tools (QGIS, ArcGIS, Mapbox, Leaflet)
2. It handles both geometry and properties elegantly
3. It's JSON-based, making it easy to work with in modern applications
4. It supports nested properties, perfect for the related table data
5. It's human-readable and easily convertible to other formats

Alternative formats considered:
- Shapefile: Traditional but limited in attribute data types and field lengths
- GeoPackage: Good for large datasets but more complex to work with
- KML: Good for visualization but less suitable for analysis
*/

async function convertToGeoJSON() {
    console.log('Converting Northern California MRDS data to GeoJSON...');

    const features = [];
    let isFirstLine = true;
    let headers = [];

    const rl = createInterface({
        input: createReadStream('data/MRDS_NorthernCalifornia.txt'),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (isFirstLine) {
            headers = line.split('\t').map(h => h.trim());
            isFirstLine = false;
            continue;
        }

        const fields = line.split('\t');
        const longitude = parseFloat(fields[6]);
        const latitude = parseFloat(fields[7]);

        // Skip if coordinates are invalid
        if (isNaN(longitude) || isNaN(latitude)) {
            continue;
        }

        // Create GeoJSON feature
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude] // GeoJSON uses [lon, lat] order
            },
            properties: {
                dep_id: fields[1].trim(),
                name: fields[2].replace(/"/g, '').trim(),
                development_status: fields[3].replace(/"/g, '').trim(),
                url: fields[4].replace(/"/g, '').trim(),
                commodities: fields[5].replace(/"/g, '').trim().split(' ').filter(c => c),
                // Add additional properties as needed
                metadata: {
                    source: 'USGS MRDS',
                    region: 'Northern California',
                    extraction_date: new Date().toISOString().split('T')[0]
                }
            }
        };

        features.push(feature);
    }

    // Create the full GeoJSON object
    const geojson = {
        type: 'FeatureCollection',
        features: features,
        properties: {
            name: 'Northern California Mineral Deposits',
            description: 'Filtered USGS MRDS data for Northern California region',
            bounds: {
                north: 41.741016,
                south: 40.071179,
                east: -122.393331,
                west: -124.407183
            }
        }
    };

    // Write to file
    writeFileSync('data/northern_california_deposits.geojson', JSON.stringify(geojson, null, 2));

    console.log('\nConversion complete:');
    console.log(`Total features converted: ${features.length}`);
    console.log('Output: data/northern_california_deposits.geojson');
    console.log('\nRecommended next steps:');
    console.log('1. Load in QGIS or ArcGIS for visualization');
    console.log('2. Use Mapbox or Leaflet for web mapping');
    console.log('3. Convert to other formats using ogr2ogr if needed:');
    console.log('   - To Shapefile: ogr2ogr -f "ESRI Shapefile" output.shp northern_california_deposits.geojson');
    console.log('   - To GeoPackage: ogr2ogr -f "GPKG" output.gpkg northern_california_deposits.geojson');
    console.log('   - To PostGIS: ogr2ogr -f "PostgreSQL" PG:"dbname=mydb" northern_california_deposits.geojson');
}

console.log('Starting GeoJSON conversion...');
convertToGeoJSON().catch(console.error);

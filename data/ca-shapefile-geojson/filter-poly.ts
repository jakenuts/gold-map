import * as fs from 'fs/promises';

interface GeoJSONFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: number[][][] | number[][][][]; // Can be Polygon or MultiPolygon
    };
    properties: {
        [key: string]: any;
    };
}

interface GeoJSONCollection {
    type: string;
    features: GeoJSONFeature[];
}

// Convert degrees and minutes to decimal degrees
function dmsToDecimal(degrees: number, minutes: number, seconds: number): number {
    return degrees + (minutes / 60) + (seconds / 3600);
}

// Bounding box coordinates
const bounds = {
    north: dmsToDecimal(41, 44, 27.659),
    south: dmsToDecimal(40, 4, 16.246),
    east: -dmsToDecimal(122, 23, 35.993),
    west: -dmsToDecimal(124, 24, 25.857)
};

// Check if a polygon intersects with the bounding box
function polygonIntersectsBounds(coordinates: number[][][]): boolean {
    // Check if any point of the polygon is within bounds
    for (const ring of coordinates) {
        for (const [lon, lat] of ring) {
            if (
                lat >= bounds.south &&
                lat <= bounds.north &&
                lon >= bounds.west &&
                lon <= bounds.east
            ) {
                return true;
            }
        }
    }
    return false;
}

// Check if a MultiPolygon intersects with the bounding box
function multiPolygonIntersectsBounds(coordinates: number[][][][]): boolean {
    return coordinates.some(polygonIntersectsBounds);
}

async function filterPolygons() {
    try {
        console.log('Reading polygon file...');
        const content = await fs.readFile('CA-poly.json', 'utf8');
        const geojson: GeoJSONCollection = JSON.parse(content);

        console.log('Filtering polygons...');
        const filteredFeatures = geojson.features.filter(feature => {
            if (feature.geometry.type === 'MultiPolygon') {
                return multiPolygonIntersectsBounds(feature.geometry.coordinates as number[][][][]);
            }
            return polygonIntersectsBounds(feature.geometry.coordinates as number[][][]);
        });

        const filteredGeoJSON: GeoJSONCollection = {
            type: "FeatureCollection",
            features: filteredFeatures
        };

        console.log(`Original features: ${geojson.features.length}`);
        console.log(`Filtered features: ${filteredFeatures.length}`);

        console.log('Writing filtered file...');
        await fs.writeFile(
            'CA-poly-filtered.json',
            JSON.stringify(filteredGeoJSON, null, 2)
        );
        console.log('Polygon filtering complete!');

    } catch (error) {
        console.error('Error:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

filterPolygons();

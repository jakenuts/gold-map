import * as fs from 'fs/promises';

interface GeoJSONFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: number[];
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

async function filterPoints() {
    try {
        console.log('Reading point file...');
        const content = await fs.readFile('CA-point.json', 'utf8');
        const geojson: GeoJSONCollection = JSON.parse(content);

        console.log('Filtering points...');
        const filteredFeatures = geojson.features.filter(feature => {
            const [lon, lat] = feature.geometry.coordinates;
            return (
                lat >= bounds.south &&
                lat <= bounds.north &&
                lon >= bounds.west &&
                lon <= bounds.east
            );
        });

        const filteredGeoJSON: GeoJSONCollection = {
            type: "FeatureCollection",
            features: filteredFeatures
        };

        console.log(`Original features: ${geojson.features.length}`);
        console.log(`Filtered features: ${filteredFeatures.length}`);

        console.log('Writing filtered file...');
        await fs.writeFile(
            'CA-point-filtered.json',
            JSON.stringify(filteredGeoJSON, null, 2)
        );
        console.log('Point filtering complete!');

    } catch (error) {
        console.error('Error:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

filterPoints();

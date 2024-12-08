import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GeoJSONFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: any;
    };
    properties: {
        [key: string]: any;
    };
}

interface GeoJSONCollection {
    type: string;
    features: GeoJSONFeature[];
}

async function exportGeoJSON(groupFilter?: string) {
    try {
        // Read the merged file
        console.log('Reading merged GeoJSON file...');
        const mergedPath = path.join(__dirname, 'CA-merged-filtered.json');
        const content = await fs.readFile(mergedPath, 'utf8');
        const geojson: GeoJSONCollection = JSON.parse(content);

        // Get unique groups
        const groups = new Set(geojson.features.map(f => f.properties.group));

        if (groupFilter) {
            // Export specific group
            if (!groups.has(groupFilter)) {
                console.error(`Error: Group "${groupFilter}" not found`);
                console.log('Available groups:', Array.from(groups).sort());
                process.exit(1);
            }

            const groupFeatures = geojson.features.filter(f => f.properties.group === groupFilter);
            const outputPath = path.join(__dirname, `export-${groupFilter.toLowerCase().replace(/\s+/g, '-')}.json`);
            
            await fs.writeFile(
                outputPath,
                JSON.stringify({
                    type: "FeatureCollection",
                    features: groupFeatures
                }, null, 2)
            );
            
            console.log(`Exported ${groupFeatures.length} features to: ${outputPath}`);
        } else {
            // Export all groups to separate files
            console.log('Exporting groups to separate files...');
            
            const exports = Array.from(groups).map(async group => {
                const groupFeatures = geojson.features.filter(f => f.properties.group === group);
                const outputPath = path.join(__dirname, `export-${group.toLowerCase().replace(/\s+/g, '-')}.json`);
                
                await fs.writeFile(
                    outputPath,
                    JSON.stringify({
                        type: "FeatureCollection",
                        features: groupFeatures
                    }, null, 2)
                );
                
                return { group, count: groupFeatures.length };
            });

            const results = await Promise.all(exports);
            
            console.log('\nExported files:');
            results.sort((a, b) => b.count - a.count)
                .forEach(({ group, count }) => {
                    console.log(`export-${group.toLowerCase().replace(/\s+/g, '-')}.json: ${count} features`);
                });
        }

    } catch (error) {
        console.error('Error:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

// Check if a specific group was requested
const groupArg = process.argv[2];
if (groupArg && groupArg.toLowerCase() === '--help') {
    console.log('Usage:');
    console.log('  npx tsx export-geojson.ts           # Export all groups to separate files');
    console.log('  npx tsx export-geojson.ts <group>   # Export specific group');
    console.log('\nExample:');
    console.log('  npx tsx export-geojson.ts Mines     # Export only mine features');
    process.exit(0);
}

exportGeoJSON(groupArg);

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

function shouldIncludeFeature(ftrType: string): boolean {
    return !['Coal Mine', 'Sand Pit'].includes(ftrType);
}

function getFeatureGroup(category: string): string {
    // Define main groups
    if (['Prospect Pit', 'Gravel/Borrow Pit', 'Other Pit'].includes(category)) {
        return 'Pits';
    }
    if (['Mine', 'Mine Shaft', 'Placer Mine', 'Open Pit Mine', 'Hydraulic Mine'].includes(category)) {
        return 'Mines';
    }
    if (['Quarry'].includes(category)) {
        return 'Quarries';
    }
    if (['Tailings'].includes(category)) {
        return 'Tailings';
    }
    if (['Mine Dump'].includes(category)) {
        return 'Mine Dumps';
    }
    if (['Adit'].includes(category)) {
        return 'Adits';
    }
    if (['Diggings'].includes(category)) {
        return 'Diggings';
    }
    return 'Other';
}

function consolidateCategory(originalCategory: string): string {
    // Pit consolidations
    if (['Borrow Pit', 'Gravel Pit', 'Gravel/Borrow Pit - Undifferentiated'].includes(originalCategory)) {
        return 'Gravel/Borrow Pit';
    }
    if (['Disturbed Surface - Pit'].includes(originalCategory)) {
        return 'Other Pit';
    }
    
    // Mine consolidations
    if (['Open Pit Mine', 'Open Pit Mine or Quarry'].includes(originalCategory)) {
        return 'Open Pit Mine';
    }
    if (['Mine'].includes(originalCategory)) {
        return 'Mine';
    }
    
    // Quarry consolidations
    if (['Quarry', 'Quarry - Rock'].includes(originalCategory)) {
        return 'Quarry';
    }
    
    // Tailings consolidations
    if (['Tailings - Dredge', 'Tailings - Undifferentiated'].includes(originalCategory)) {
        return 'Tailings';
    }
    
    return originalCategory;
}

async function mergeGeoJSON() {
    try {
        const pointPath = path.join(__dirname, 'CA-point-filtered.json');
        const polyPath = path.join(__dirname, 'CA-poly-filtered.json');
        const outputPath = path.join(__dirname, 'CA-merged-filtered.json');

        console.log('Reading files...');
        const pointContent = await fs.readFile(pointPath, 'utf8');
        const polyContent = await fs.readFile(polyPath, 'utf8');
        
        const pointGeoJSON: GeoJSONCollection = JSON.parse(pointContent);
        const polyGeoJSON: GeoJSONCollection = JSON.parse(polyContent);

        // Process features
        console.log('Processing features...');
        const processedFeatures = [
            ...pointGeoJSON.features
                .filter(feature => shouldIncludeFeature(feature.properties.FTR_TYPE))
                .map(feature => ({
                    type: "Feature",
                    geometry: feature.geometry,
                    properties: {
                        ...feature.properties,
                        original_type: feature.properties.FTR_TYPE,
                        category: consolidateCategory(feature.properties.FTR_TYPE),
                        group: getFeatureGroup(consolidateCategory(feature.properties.FTR_TYPE)),
                        geometry_type: 'point',
                        feature_class: 'mining_site'
                    }
                })),
            ...polyGeoJSON.features
                .filter(feature => shouldIncludeFeature(feature.properties.FTR_TYPE))
                .map(feature => ({
                    type: "Feature",
                    geometry: feature.geometry,
                    properties: {
                        ...feature.properties,
                        original_type: feature.properties.FTR_TYPE,
                        category: consolidateCategory(feature.properties.FTR_TYPE),
                        group: getFeatureGroup(consolidateCategory(feature.properties.FTR_TYPE)),
                        geometry_type: 'polygon',
                        feature_class: 'mining_site'
                    }
                }))
        ];

        // Create the final GeoJSON
        const mergedGeoJSON = {
            type: "FeatureCollection",
            features: processedFeatures
        };

        // Write merged data
        console.log('Writing merged file...');
        await fs.writeFile(outputPath, JSON.stringify(mergedGeoJSON, null, 2));
        console.log(`\nMerged data saved to: ${outputPath}`);

        // Print summary
        const groups = new Map<string, number>();
        processedFeatures.forEach(feature => {
            const group = feature.properties.group;
            groups.set(group, (groups.get(group) || 0) + 1);
        });

        console.log('\nFeature Groups:');
        for (const [group, count] of groups) {
            console.log(`${group}: ${count} features`);
        }

    } catch (error) {
        console.error('Error:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

mergeGeoJSON();

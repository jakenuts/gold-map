import { createReadStream, writeFileSync } from 'fs';
import { createInterface } from 'readline';

// Focus on the most important properties for GIS visualization
async function loadEssentialData(depId) {
    const data = {
        commodities: new Set(),
        production: {
            hasProduction: false,
            latestYear: null,
            totalAmount: 0
        },
        geology: {
            rockTypes: new Set(),
            alterationType: null
        }
    };

    // Helper function to read related files
    async function readRelatedFile(filename, processor) {
        try {
            const rl = createInterface({
                input: createReadStream(`data/${filename}`),
                crlfDelay: Infinity
            });

            let isFirstLine = true;
            for await (const line of rl) {
                if (isFirstLine) {
                    isFirstLine = false;
                    continue;
                }

                const fields = line.split('\t');
                const recordDepId = fields[1]?.trim();
                if (recordDepId === depId) {
                    processor(fields);
                }
            }
        } catch (err) {
            // Silently continue if file not found
        }
    }

    // Load commodity data (most important for visualization)
    await readRelatedFile('Commodity.txt', (fields) => {
        const commodity = fields[3]?.trim();
        const importance = fields[7]?.trim();
        if (commodity && importance?.toLowerCase().includes('primary')) {
            data.commodities.add(commodity);
        }
    });

    // Load basic production info
    await readRelatedFile('Production.txt', (fields) => {
        data.production.hasProduction = true;
        const year = parseInt(fields[2]?.trim());
        if (year && (!data.production.latestYear || year > data.production.latestYear)) {
            data.production.latestYear = year;
        }
    });

    // Load basic geology info
    await readRelatedFile('Rocks.txt', (fields) => {
        const rockType = fields[5]?.trim();
        if (rockType) {
            data.geology.rockTypes.add(rockType);
        }
    });

    await readRelatedFile('Alteration.txt', (fields) => {
        if (!data.geology.alterationType) {
            data.geology.alterationType = fields[3]?.trim();
        }
    });

    return {
        commodities: Array.from(data.commodities),
        production: data.production,
        geology: {
            rockTypes: Array.from(data.geology.rockTypes),
            alterationType: data.geology.alterationType
        }
    };
}

async function convertToEssentialGeoJSON() {
    console.log('Converting to essential GeoJSON with focused properties...');

    const features = [];
    let isFirstLine = true;
    let processedCount = 0;

    const rl = createInterface({
        input: createReadStream('data/MRDS_NorthernCalifornia.txt'),
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (isFirstLine) {
            isFirstLine = false;
            continue;
        }

        const fields = line.split('\t');
        const depId = fields[1].trim();
        const longitude = parseFloat(fields[6]);
        const latitude = parseFloat(fields[7]);

        if (isNaN(longitude) || isNaN(latitude)) continue;

        // Load essential data
        const essentialData = await loadEssentialData(depId);
        
        processedCount++;
        if (processedCount % 100 === 0) {
            console.log(`Processed ${processedCount} deposits...`);
        }

        // Create focused GeoJSON feature
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            properties: {
                id: depId,
                name: fields[2].replace(/"/g, '').trim(),
                status: fields[3].replace(/"/g, '').trim(),
                primary_commodities: essentialData.commodities,
                production_status: essentialData.production.hasProduction ? 
                    `Produced (last: ${essentialData.production.latestYear})` : 
                    'No recorded production',
                geology: {
                    rock_types: essentialData.geology.rockTypes,
                    alteration: essentialData.geology.alterationType
                },
                // Add a category field for easy symbolization
                category: essentialData.commodities[0] || 'Unknown',
                // Add a size field for visualization
                size: essentialData.production.hasProduction ? 'Producer' : 'Prospect'
            }
        };

        features.push(feature);
    }

    // Create the GeoJSON object
    const geojson = {
        type: 'FeatureCollection',
        features: features,
        properties: {
            name: 'Northern California Mineral Deposits',
            description: 'Essential USGS MRDS data optimized for GIS visualization',
            bounds: {
                north: 41.741016,
                south: 40.071179,
                east: -122.393331,
                west: -124.407183
            },
            generated: new Date().toISOString()
        }
    };

    // Write to file
    writeFileSync('data/northern_california_deposits_essential.geojson', 
                 JSON.stringify(geojson, null, 2));

    console.log('\nEssential conversion complete:');
    console.log(`Total features converted: ${features.length}`);
    console.log('Output: data/northern_california_deposits_essential.geojson');
    console.log('\nOptimized for GIS visualization with:');
    console.log('- Primary commodities for classification');
    console.log('- Production status for symbolization');
    console.log('- Basic geology for analysis');
    console.log('- Category and size fields for easy styling');
}

console.log('Starting essential GeoJSON conversion...');
convertToEssentialGeoJSON().catch(console.error);

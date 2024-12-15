import { createReadStream, writeFileSync } from 'fs';
import { createInterface } from 'readline';

// Cache for related data to avoid multiple file reads
const dataCache = {
    commodities: new Map(),
    production: new Map(),
    geology: new Map()
};

// Pre-load related data into cache
async function preloadRelatedData() {
    console.log('Preloading related data...');

    async function loadFile(filename, processor) {
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
                processor(line.split('\t'));
            }
        } catch (err) {
            console.error(`Warning: Could not load ${filename}`);
        }
    }

    await Promise.all([
        // Load commodities
        loadFile('Commodity.txt', (fields) => {
            const depId = fields[1]?.trim();
            if (!dataCache.commodities.has(depId)) {
                dataCache.commodities.set(depId, []);
            }
            dataCache.commodities.get(depId).push({
                name: fields[3]?.trim(),
                code: fields[4]?.trim(),
                importance: fields[7]?.trim()
            });
        }),

        // Load production
        loadFile('Production.txt', (fields) => {
            const depId = fields[1]?.trim();
            if (!dataCache.production.has(depId)) {
                dataCache.production.set(depId, []);
            }
            dataCache.production.get(depId).push({
                year: fields[2]?.trim(),
                amount: fields[7]?.trim(),
                units: fields[8]?.trim()
            });
        }),

        // Load geology (combining rocks and alteration)
        loadFile('Rocks.txt', (fields) => {
            const depId = fields[1]?.trim();
            if (!dataCache.geology.has(depId)) {
                dataCache.geology.set(depId, { rocks: [], alteration: [] });
            }
            dataCache.geology.get(depId).rocks.push({
                type: fields[5]?.trim(),
                description: fields[10]?.trim()
            });
        }),

        loadFile('Alteration.txt', (fields) => {
            const depId = fields[1]?.trim();
            if (!dataCache.geology.has(depId)) {
                dataCache.geology.set(depId, { rocks: [], alteration: [] });
            }
            dataCache.geology.get(depId).alteration.push({
                type: fields[3]?.trim(),
                description: fields[4]?.trim()
            });
        })
    ]);

    console.log('Related data preloaded');
}

async function convertToGeoJSON() {
    await preloadRelatedData();

    console.log('Converting to GeoJSON...');
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

        processedCount++;
        if (processedCount % 100 === 0) {
            console.log(`Processed ${processedCount} deposits...`);
        }

        // Get cached data
        const commodities = dataCache.commodities.get(depId) || [];
        const production = dataCache.production.get(depId) || [];
        const geology = dataCache.geology.get(depId) || { rocks: [], alteration: [] };

        // Create optimized feature
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
                commodities: {
                    primary: commodities
                        .filter(c => c.importance?.toLowerCase().includes('primary'))
                        .map(c => c.code),
                    all: commodities.map(c => c.code)
                },
                production: {
                    has_production: production.length > 0,
                    latest_year: production.length > 0 ? 
                        Math.max(...production.map(p => parseInt(p.year) || 0)) : null,
                    count: production.length
                },
                geology: {
                    rock_types: [...new Set(geology.rocks.map(r => r.type))],
                    alteration_types: [...new Set(geology.alteration.map(a => a.type))]
                },
                // Fields optimized for GIS visualization
                category: commodities.find(c => c.importance?.toLowerCase().includes('primary'))?.code || 'Unknown',
                size_class: production.length > 0 ? 'Producer' : 'Prospect',
                development_phase: fields[3].replace(/"/g, '').trim()
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
            description: 'Optimized USGS MRDS data for GIS visualization',
            bounds: {
                north: 41.741016,
                south: 40.071179,
                east: -122.393331,
                west: -124.407183
            },
            generated: new Date().toISOString(),
            feature_count: features.length
        }
    };

    writeFileSync('data/northern_california_deposits_optimized.geojson', 
                 JSON.stringify(geojson, null, 2));

    console.log('\nConversion complete:');
    console.log(`Total features: ${features.length}`);
    console.log('Output: data/northern_california_deposits_optimized.geojson');
    console.log('\nFeatures optimized for GIS with:');
    console.log('- Primary and secondary commodities');
    console.log('- Production status and history');
    console.log('- Geological characteristics');
    console.log('- Pre-classified fields for visualization');
}

console.log('Starting optimized GeoJSON conversion...');
convertToGeoJSON().catch(console.error);

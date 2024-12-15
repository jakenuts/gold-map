import { createReadStream, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';

async function loadRelatedData(depId) {
    console.log(`Loading related data for deposit ${depId}...`);
    
    const data = {
        commodities: [],
        production: [],
        resources: [],
        geology: {
            rocks: [],
            alteration: [],
            structure: []
        },
        workings: []
    };

    // Helper function to read related files
    async function readRelatedFile(filename, processor) {
        const filepath = `data/${filename}`;
        if (!existsSync(filepath)) {
            console.error(`File not found: ${filepath}`);
            return;
        }

        try {
            const rl = createInterface({
                input: createReadStream(filepath),
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
            console.error(`Error reading ${filename}:`, err);
        }
    }

    // Load commodity data
    await readRelatedFile('Commodity.txt', (fields) => {
        data.commodities.push({
            name: fields[3]?.trim() || '',
            code: fields[4]?.trim() || '',
            type: fields[5]?.trim() || '',
            group: fields[6]?.trim() || '',
            importance: fields[7]?.trim() || ''
        });
    });

    // Load production data
    await readRelatedFile('Production.txt', (fields) => {
        data.production.push({
            year: fields[2]?.trim() || '',
            amount: fields[7]?.trim() || '',
            units: fields[8]?.trim() || '',
            material: fields[9]?.trim() || ''
        });
    });

    // Load resource data
    await readRelatedFile('Resources.txt', (fields) => {
        data.resources.push({
            year: fields[2]?.trim() || '',
            type: fields[5]?.trim() || '',
            amount: fields[13]?.trim() || '',
            units: fields[16]?.trim() || ''
        });
    });

    // Load geological data
    await readRelatedFile('Rocks.txt', (fields) => {
        data.geology.rocks.push({
            type: fields[5]?.trim() || '',
            description: fields[10]?.trim() || ''
        });
    });

    await readRelatedFile('Alteration.txt', (fields) => {
        data.geology.alteration.push({
            type: fields[3]?.trim() || '',
            description: fields[4]?.trim() || ''
        });
    });

    await readRelatedFile('Structure.txt', (fields) => {
        data.geology.structure.push({
            type: fields[3]?.trim() || '',
            description: fields[4]?.trim() || ''
        });
    });

    // Load workings data
    await readRelatedFile('Workings.txt', (fields) => {
        data.workings.push({
            type: fields[3]?.trim() || '',
            name: fields[4]?.trim() || '',
            dimensions: {
                area: fields[5]?.trim() || '',
                area_units: fields[6]?.trim() || '',
                length: fields[7]?.trim() || '',
                length_units: fields[8]?.trim() || '',
                depth: fields[17]?.trim() || '',
                depth_units: fields[18]?.trim() || ''
            }
        });
    });

    return data;
}

async function convertToEnhancedGeoJSON() {
    console.log('Converting to enhanced GeoJSON with related data...');

    const features = [];
    let isFirstLine = true;
    let processedCount = 0;
    let sampleFeature = null;

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

        if (isNaN(longitude) || isNaN(latitude)) {
            console.log(`Skipping record ${depId} due to invalid coordinates`);
            continue;
        }

        // Process only first 10 records for testing
        if (processedCount >= 10) break;

        // Load all related data for this deposit
        const relatedData = await loadRelatedData(depId);
        
        processedCount++;
        console.log(`Processed deposit ${depId} (${processedCount}/10)`);

        // Create enhanced GeoJSON feature
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            properties: {
                dep_id: depId,
                name: fields[2].replace(/"/g, '').trim(),
                development_status: fields[3].replace(/"/g, '').trim(),
                url: fields[4].replace(/"/g, '').trim(),
                commodities: {
                    list: fields[5].replace(/"/g, '').trim().split(' ').filter(c => c),
                    details: relatedData.commodities
                },
                production: relatedData.production,
                resources: relatedData.resources,
                geology: relatedData.geology,
                workings: relatedData.workings,
                summary: {
                    total_commodities: relatedData.commodities.length,
                    has_production: relatedData.production.length > 0,
                    has_resources: relatedData.resources.length > 0,
                    development_type: fields[3].replace(/"/g, '').trim(),
                    primary_commodities: relatedData.commodities
                        .filter(c => c.importance?.toLowerCase().includes('primary'))
                        .map(c => c.code)
                }
            }
        };

        if (!sampleFeature) {
            sampleFeature = feature;
        }

        features.push(feature);
    }

    // Create the enhanced GeoJSON object
    const geojson = {
        type: 'FeatureCollection',
        features: features,
        properties: {
            name: 'Northern California Mineral Deposits (Enhanced)',
            description: 'USGS MRDS data with detailed related information',
            bounds: {
                north: 41.741016,
                south: 40.071179,
                east: -122.393331,
                west: -124.407183
            },
            generated: new Date().toISOString(),
            total_features: features.length
        }
    };

    // Write to file
    writeFileSync('data/northern_california_deposits_enhanced.geojson', 
                 JSON.stringify(geojson, null, 2));

    console.log('\nEnhanced conversion complete:');
    console.log(`Total features converted: ${features.length}`);
    console.log('\nSample feature:');
    console.log(JSON.stringify(sampleFeature, null, 2));
}

console.log('Starting enhanced GeoJSON conversion (test run with 10 records)...');
convertToEnhancedGeoJSON().catch(console.error);

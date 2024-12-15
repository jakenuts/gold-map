import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define input paths
const sourceFile = path.join(__dirname, '..', 'extracted', 'northern_california_sites.json');
const outputFile = path.join(__dirname, '..', 'extracted', 'northern_california_gold_focused.geojson');

// Helper function to safely get nested value
const getNestedValue = (obj, path) => {
    try {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    } catch (e) {
        return null;
    }
};

// Helper function to check if a value is non-empty
const isNonEmpty = (value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== undefined && value !== null && value !== '';
};

// Read and analyze both files
Promise.all([
    fs.promises.readFile(sourceFile, 'utf8'),
    fs.promises.readFile(outputFile, 'utf8')
]).then(([sourceData, outputData]) => {
    const sourceSites = JSON.parse(sourceData);
    const outputGeojson = JSON.parse(outputData);
    const outputSites = outputGeojson.features;

    console.log('\nData Completeness Analysis:');
    console.log('=========================');
    
    // Analyze source data
    const sourceStats = {
        total: sourceSites.length,
        fields: {
            elevation: 0,
            hostRocks: 0,
            depositType: 0,
            workings: 0,
            comments: 0,
            district: 0,
            physiography: 0
        }
    };

    // Sample storage
    const samplesWithData = {
        elevation: [],
        hostRocks: [],
        depositType: [],
        workings: [],
        comments: []
    };

    // Analyze source sites
    sourceSites.forEach(site => {
        // Check elevation
        const elevation = getNestedValue(site, 'location.physiography.elevation');
        if (isNonEmpty(elevation)) {
            sourceStats.fields.elevation++;
            if (samplesWithData.elevation.length < 3) {
                samplesWithData.elevation.push({
                    name: site.name,
                    elevation: elevation,
                    county: getNestedValue(site, 'location.administrative.county')
                });
            }
        }

        // Check host rocks
        const rocks = getNestedValue(site, 'geology.rocks');
        if (Array.isArray(rocks) && rocks.length > 0) {
            sourceStats.fields.hostRocks++;
            if (samplesWithData.hostRocks.length < 3) {
                samplesWithData.hostRocks.push({
                    name: site.name,
                    rocks: rocks.map(r => r.name || r.type).filter(Boolean)
                });
            }
        }

        // Check deposit type
        const depositType = getNestedValue(site, 'deposit.type');
        if (isNonEmpty(depositType)) {
            sourceStats.fields.depositType++;
            if (samplesWithData.depositType.length < 3) {
                samplesWithData.depositType.push({
                    name: site.name,
                    type: depositType
                });
            }
        }

        // Check workings
        if (Array.isArray(site.workings) && site.workings.length > 0) {
            sourceStats.fields.workings++;
            if (samplesWithData.workings.length < 3) {
                samplesWithData.workings.push({
                    name: site.name,
                    workings: site.workings.map(w => w.type).filter(Boolean)
                });
            }
        }

        // Check comments
        const comments = getNestedValue(site, 'metadata.comments');
        if (Array.isArray(comments) && comments.length > 0) {
            sourceStats.fields.comments++;
            if (samplesWithData.comments.length < 3) {
                samplesWithData.comments.push({
                    name: site.name,
                    comments: comments.map(c => c.text).filter(Boolean)
                });
            }
        }

        // Check district
        if (isNonEmpty(getNestedValue(site, 'location.administrative.district'))) {
            sourceStats.fields.district++;
        }

        // Check physiography
        if (isNonEmpty(getNestedValue(site, 'location.physiography'))) {
            sourceStats.fields.physiography++;
        }
    });

    // Analyze output data
    const outputStats = {
        total: outputSites.length,
        fields: {
            elevation: outputSites.filter(s => isNonEmpty(s.properties.elevation)).length,
            hostRocks: outputSites.filter(s => isNonEmpty(s.properties.host_rocks)).length,
            depositType: outputSites.filter(s => isNonEmpty(s.properties.deposit_type)).length,
            workingsDesc: outputSites.filter(s => isNonEmpty(s.properties.workings_description)).length,
            geologicalDesc: outputSites.filter(s => isNonEmpty(s.properties.geological_description)).length,
            depositDesc: outputSites.filter(s => isNonEmpty(s.properties.deposit_description)).length
        }
    };

    // Print statistics
    console.log('\nSource Data Statistics:');
    console.log('---------------------');
    console.log(`Total Sites: ${sourceStats.total}`);
    Object.entries(sourceStats.fields).forEach(([field, count]) => {
        const percentage = ((count/sourceStats.total)*100).toFixed(2);
        console.log(`${field}: ${count} sites (${percentage}%)`);
    });

    console.log('\nOutput Data Statistics:');
    console.log('--------------------');
    console.log(`Total Sites: ${outputStats.total}`);
    Object.entries(outputStats.fields).forEach(([field, count]) => {
        const percentage = ((count/outputStats.total)*100).toFixed(2);
        console.log(`${field}: ${count} sites (${percentage}%)`);
    });

    console.log('\nSample Data from Source:');
    console.log('----------------------');
    Object.entries(samplesWithData).forEach(([field, samples]) => {
        if (samples.length > 0) {
            console.log(`\n${field} samples:`);
            console.log(JSON.stringify(samples, null, 2));
        }
    });

}).catch(error => {
    console.error('Error analyzing data:', error);
});

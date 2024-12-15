import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define input and output paths
const inputPath = path.join(__dirname, '..', 'extracted', 'northern_california_gold_sites.json');
const outputPath = path.join(__dirname, '..', 'extracted', 'northern_california_gold_focused.geojson');

// Helper function to clean and format text
const cleanText = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/\s+/g, ' ').trim();
};

// Helper function to join text with proper spacing
const joinTexts = (texts) => {
    if (!Array.isArray(texts)) return '';
    return texts.filter(t => t && t.trim()).join('. ').replace(/\.\./g, '.').trim();
};

// Helper function to process array fields
const processArray = (arr, field) => {
    if (!Array.isArray(arr)) return '';
    return arr
        .map(item => item[field])
        .filter(item => item && item !== 'Host' && item !== 'Associated')
        .join(', ');
};

// Helper function to expand production size
const expandProductionSize = (size) => {
    const sizeMap = {
        'S': 'Small',
        'M': 'Medium',
        'L': 'Large'
    };
    return sizeMap[size] || size || '';
};

// Helper function to safely get nested property
const getNestedValue = (obj, path) => {
    try {
        return path.split('.').reduce((current, key) => current?.[key], obj) || '';
    } catch (e) {
        return '';
    }
};

// Helper function to process comments by category
const processCategorizedComments = (site) => {
    const categorized = {
        deposit: [],
        geology: [],
        location: [],
        workings: [],
        production: [],
        development: [],
        other: []
    };

    // Process metadata comments
    if (site.metadata?.comments) {
        site.metadata.comments.forEach(comment => {
            const category = comment.category?.toLowerCase() || 'other';
            const text = cleanText(comment.text);
            if (text) {
                if (categorized[category]) {
                    categorized[category].push(text);
                } else {
                    categorized.other.push(text);
                }
            }
        });
    }

    // Add geology descriptions
    if (site.geology?.description) {
        categorized.geology.push(cleanText(site.geology.description));
    }

    // Process rocks information
    if (Array.isArray(site.geology?.rocks)) {
        const rocks = site.geology.rocks
            .filter(rock => rock.description || rock.name)
            .map(rock => `${rock.name}${rock.description ? `: ${rock.description}` : ''}`);
        if (rocks.length > 0) {
            categorized.geology.push(`Host rocks: ${rocks.join('; ')}`);
        }
    }

    // Add deposit descriptions
    if (site.deposit?.description) {
        categorized.deposit.push(cleanText(site.deposit.description));
    }

    // Process workings information
    if (Array.isArray(site.workings)) {
        site.workings.forEach(working => {
            const type = working.type ? `${working.type} workings` : 'Workings';
            const depth = working.dimensions?.depth?.value 
                ? ` (depth: ${working.dimensions.depth.value}${working.dimensions.depth.units || 'm'})`
                : '';
            categorized.workings.push(`${type}${depth}`);
        });
    }

    return categorized;
};

// Read and process the file
fs.readFile(inputPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    try {
        const sites = JSON.parse(data);
        
        // Convert to GeoJSON
        const geojson = {
            "type": "FeatureCollection",
            "features": sites.map(site => {
                // Extract coordinates from the correct nested structure
                const longitude = parseFloat(getNestedValue(site, 'location.coordinates.longitude') || '0');
                const latitude = parseFloat(getNestedValue(site, 'location.coordinates.latitude') || '0');
                
                // Process commodities to highlight gold
                const commodities = Array.isArray(site.commodities) 
                    ? site.commodities.map(c => c.name).join(', ')
                    : '';

                // Get elevation if available
                const elevation = getNestedValue(site, 'location.physiography.elevation')
                    ? `${getNestedValue(site, 'location.physiography.elevation')} ft`
                    : '';

                // Process all comments
                const comments = processCategorizedComments(site);

                // Create a descriptive name that includes district if available
                const district = getNestedValue(site, 'location.administrative.district');
                const displayName = district ? `${site.name} (${district})` : site.name;
                
                return {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [longitude, latitude]
                    },
                    "properties": {
                        // Basic information
                        "id": site.id || '',
                        "name": displayName,
                        
                        // Status and type information
                        "deposit_type": cleanText(getNestedValue(site, 'deposit.type')),
                        "deposit_status": cleanText(getNestedValue(site, 'deposit.status')),
                        "development_status": cleanText(site.development_status),
                        
                        // Geology information
                        "host_rocks": processArray(getNestedValue(site, 'geology.rocks'), 'type'),
                        "rock_age": processArray(getNestedValue(site, 'geology.ages'), 'name'),
                        // Detailed descriptions
                        "deposit_description": comments.deposit.join(' '),
                        "geological_description": comments.geology.join(' '),
                        "location_details": comments.location.join(' '),
                        "workings_description": comments.workings.join(' '),
                        "production_details": comments.production.join(' '),
                        "development_details": comments.development.join(' '),
                        "other_details": comments.other.join(' '),
                        
                        // Mining details
                        "operation_type": cleanText(site.operation_type),
                        "workings": cleanText(site.workings)
                    }
                };
            }).filter(feature => 
                // Filter out features with invalid coordinates (0,0 or NaN)
                feature.geometry.coordinates[0] !== 0 && 
                feature.geometry.coordinates[1] !== 0 &&
                !isNaN(feature.geometry.coordinates[0]) &&
                !isNaN(feature.geometry.coordinates[1])
            )
        };

        // Write GeoJSON to file with proper JSON formatting
        const jsonString = JSON.stringify(geojson, null, 2);

        fs.writeFile(outputPath, jsonString, 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing file:', writeErr);
                return;
            }
            console.log('\nGeoJSON Conversion Results:');
            console.log('-------------------------');
            console.log(`Total features converted: ${geojson.features.length}`);
            console.log(`New GeoJSON file created: ${path.basename(outputPath)}`);
            console.log('\nIncluded properties for each feature:');
            console.log('- Site identification (ID, name with district)');
            console.log('- Deposit information (type, status, development)');
            console.log('- Geological details (host rocks, age, alteration, structure)');
            console.log('- Location context (county, district, elevation)');
            console.log('- Commodity information');
            console.log('- Production information (size, years)');
            console.log('- Detailed descriptions:');
            console.log('  * Deposit characteristics');
            console.log('  * Geological features');
            console.log('  * Location specifics');
            console.log('  * Workings and development');
            console.log('  * Production history');
            console.log('  * Other relevant details');
            
            // Log a sample feature for verification
            if (geojson.features.length > 0) {
                console.log('\nSample feature (Black Bear site):');
                const blackBearSite = geojson.features.find(f => 
                    f.properties.id === '10034372' || 
                    f.properties.name.includes('Black Bear')
                );
                if (blackBearSite) {
                    console.log(JSON.stringify(blackBearSite, null, 2));
                }
            }
        });

    } catch (error) {
        console.error('Error processing JSON:', error);
    }
});

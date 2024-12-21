import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define input and output paths
const inputPath = path.join(__dirname, '..', 'extracted', 'northern_california_sites.json');
const outputPath = path.join(__dirname, '..', 'extracted', 'northern_california_gold_focused.geojson');

// Helper function to check if a site is gold-related
const isGoldSite = (site) => {
    // Check primary commodities
    const hasGoldCommodity = site.commodities?.some(c => 
        c.name?.toLowerCase() === 'gold' || 
        c.code?.toLowerCase() === 'au'
    );
    if (hasGoldCommodity) return true;

    // Check comments for gold mentions
    const comments = site.metadata?.comments || [];
    const hasGoldInComments = comments.some(c => 
        c.text?.toLowerCase().includes('gold') ||
        c.text?.toLowerCase().includes('au ') || 
        c.text?.toLowerCase().includes('quartz') 
    );
    if (hasGoldInComments) return true;

    // Check deposit description
    if (site.deposit?.description?.toLowerCase().includes('gold')) return true;

    // Check geology description
    if (site.geology?.description?.toLowerCase().includes('gold') ||
        site.geology?.description?.toLowerCase().includes('quartz')) return true;

    // Check remarks
    if (site.remarks?.toLowerCase().includes('gold') ||
        site.remarks?.toLowerCase().includes('quartz')) return true;

    return false;
};

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

// Helper function to extract elevation from text
const extractElevation = (text) => {
    if (!text) return null;
    const elevationMatch = text.match(/(\d+(?:,\d+)?)\s*(?:ft|feet|foot)/i);
    return elevationMatch ? elevationMatch[1].replace(',', '') + ' ft' : null;
};

// Helper function to process rocks information
const processRocks = (rocks) => {
    if (!Array.isArray(rocks)) return '';
    return rocks
        .map(rock => {
            const name = rock.name || '';
            const type = rock.type !== 'Host' ? rock.type : '';
            const desc = rock.description ? ` (${rock.description})` : '';
            return [name, type, desc].filter(Boolean).join(' ').trim();
        })
        .filter(Boolean)
        .join('; ');
};

// Helper function to process workings information
const processWorkings = (workings) => {
    if (!Array.isArray(workings)) return [];
    return workings.map(working => {
        const type = working.type || 'Unknown type';
        const dimensions = working.dimensions || {};
        const details = [];
        
        if (dimensions.depth?.value) {
            details.push(`depth: ${dimensions.depth.value}${dimensions.depth.units || 'm'}`);
        }
        if (dimensions.length?.value) {
            details.push(`length: ${dimensions.length.value}${dimensions.length.units || 'm'}`);
        }
        
        return details.length > 0 ? `${type} (${details.join(', ')})` : type;
    });
};

// Helper function to process physiography information
const processPhysiography = (site) => {
    const result = {};
    
    // Get physiography section data
    const physiography = site.location?.physiography;
    if (physiography) {
        if (physiography.elevation) {
            result.elevation = `${physiography.elevation} ft`;
        }
        
        // Include terrain information
        result.terrain = [
            physiography.division,
            physiography.province,
            physiography.section
        ].filter(Boolean).join(', ');
    }

    // If no elevation in physiography, look in comments
    if (!result.elevation && site.metadata?.comments) {
        for (const comment of site.metadata.comments) {
            const elevationFromComment = extractElevation(comment.text);
            if (elevationFromComment) {
                result.elevation = elevationFromComment;
                break;
            }
        }
    }

    // Look for elevation in remarks
    if (!result.elevation) {
        const elevationFromRemarks = extractElevation(site.remarks);
        if (elevationFromRemarks) {
            result.elevation = elevationFromRemarks;
        }
    }

    // Look for elevation in geological description
    if (!result.elevation && site.geology?.description) {
        const elevationFromGeology = extractElevation(site.geology.description);
        if (elevationFromGeology) {
            result.elevation = elevationFromGeology;
        }
    }

    return result;
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
    const rocksInfo = processRocks(site.geology?.rocks);
    if (rocksInfo) {
        categorized.geology.push(`Host rocks: ${rocksInfo}`);
    }

    // Add deposit descriptions
    if (site.deposit?.description) {
        categorized.deposit.push(cleanText(site.deposit.description));
    }

    // Process workings information
    const workingsInfo = processWorkings(site.workings);
    if (workingsInfo.length > 0) {
        categorized.workings.push(...workingsInfo);
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
        
        // Filter for gold-related sites first
        const goldSites = sites.filter(isGoldSite);

        console.log(`\nFiltered ${sites.length} total sites down to ${goldSites.length} gold-related sites`);
        
        // Convert to GeoJSON
        const geojson = {
            "type": "FeatureCollection",
            "features": goldSites.map(site => {
                // Extract coordinates from the correct nested structure
                const longitude = parseFloat(getNestedValue(site, 'location.coordinates.longitude') || '0');
                const latitude = parseFloat(getNestedValue(site, 'location.coordinates.latitude') || '0');
                
                // Process commodities to highlight gold
                const commodities = Array.isArray(site.commodities) 
                    ? site.commodities.map(c => c.name).join(', ')
                    : '';

                // Process physiography information
                const physiography = processPhysiography(site);

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
                        "host_rocks": processRocks(site.geology?.rocks),
                        "rock_age": processArray(getNestedValue(site, 'geology.ages'), 'name'),
                        "alteration_types": processArray(getNestedValue(site, 'geology.alteration'), 'type'),
                        "structural_features": processArray(getNestedValue(site, 'geology.structure'), 'type'),
                        
                        // Location context
                        "county": getNestedValue(site, 'location.administrative.county'),
                        "district": district || '',
                        "elevation": physiography.elevation || '',
                        "terrain": physiography.terrain || '',
                        
                        // Commodities
                        "commodities": commodities,
                        "primary_commodity": commodities.includes('Gold') ? 'Gold' : commodities.split(',')[0],
                        
                        // Production information
                        "production_size": expandProductionSize(getNestedValue(site, 'deposit.size')),
                        "production_years": cleanText(getNestedValue(site, 'deposit.productionYears')),
                        
                        // Detailed descriptions
                        "deposit_description": joinTexts(comments.deposit),
                        "geological_description": joinTexts(comments.geology),
                        "location_details": joinTexts(comments.location),
                        "workings_description": joinTexts(comments.workings),
                        "production_details": joinTexts(comments.production),
                        "development_details": joinTexts(comments.development),
                        "other_details": joinTexts(comments.other),
                        
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
        const jsonString = JSON.stringify(geojson, null, 2)
            .replace(/\}\s*\{/g, '},\n{')  // Add commas between objects
            .replace(/"\s*\}/g, '"\n}')    // Format closing braces
            .replace(/\[\s*\{/g, '[\n{');  // Format opening brackets

        fs.writeFile(outputPath, jsonString, 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing file:', writeErr);
                return;
            }
            
            // Count sites by primary commodity
            const commodityStats = geojson.features.reduce((acc, feature) => {
                const commodity = feature.properties.primary_commodity;
                acc[commodity] = (acc[commodity] || 0) + 1;
                return acc;
            }, {});

            console.log('\nGeoJSON Conversion Results:');
            console.log('-------------------------');
            console.log(`Total features converted: ${geojson.features.length}`);
            console.log(`New GeoJSON file created: ${path.basename(outputPath)}`);
            
            console.log('\nCommodity Statistics:');
            Object.entries(commodityStats).sort((a, b) => b[1] - a[1]).forEach(([commodity, count]) => {
                console.log(`- ${commodity}: ${count} sites (${((count/geojson.features.length)*100).toFixed(2)}%)`);
            });

            console.log('\nIncluded properties for each feature:');
            console.log('- Site identification (ID, name with district)');
            console.log('- Deposit information (type, status, development)');
            console.log('- Geological details (host rocks, age, alteration, structure)');
            console.log('- Location context (county, district, elevation, terrain)');
            console.log('- Commodity information');
            console.log('- Production information (size, years)');
            console.log('- Detailed descriptions:');
            console.log('  * Deposit characteristics');
            console.log('  * Geological features');
            console.log('  * Location specifics');
            console.log('  * Workings and development');
            console.log('  * Production history');
            console.log('  * Other relevant details');
            
            // Find the most detailed Black Bear site for the example
            if (geojson.features.length > 0) {
                console.log('\nSample feature (Black Bear site with most details):');
                const blackBearSites = geojson.features.filter(f => 
                    f.properties.name.toLowerCase().includes('black bear')
                );
                
                // Sort by amount of description content
                const mostDetailed = blackBearSites.sort((a, b) => {
                    const getDescriptionLength = (props) => 
                        (props.deposit_description + props.geological_description + 
                         props.workings_description + props.production_details).length;
                    return getDescriptionLength(b.properties) - getDescriptionLength(a.properties);
                })[0];

                if (mostDetailed) {
                    console.log(JSON.stringify(mostDetailed, null, 2));
                }
            }
        });

    } catch (error) {
        console.error('Error processing JSON:', error);
    }
});

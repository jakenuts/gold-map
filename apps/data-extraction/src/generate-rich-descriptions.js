import { createReadStream, writeFileSync } from 'fs';
import { createInterface } from 'readline';

// Cache for related data
const dataCache = {
    deposits: new Map(),
    geology: new Map(),
    production: new Map(),
    comments: new Map(),
    workings: new Map(),
    ore_control: new Map(),
    alteration: new Map()
};

async function loadRelatedData() {
    console.log('Loading related data...');

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
                processor(line.split('\t').map(field => field.replace(/"/g, '').trim()));
            }
        } catch (err) {
            console.error(`Warning: Could not load ${filename}`);
        }
    }

    // Load deposit types and details
    await loadFile('Deposits.txt', (fields) => {
        const depId = fields[1];
        dataCache.deposits.set(depId, {
            type: fields[4],
            operation: fields[7],
            mining_method: fields[8],
            discovery_year: fields[16],
            size: fields[23],
            development_status: fields[3]
        });
    });

    // Load geological information
    await loadFile('Rocks.txt', (fields) => {
        const depId = fields[1];
        if (!dataCache.geology.has(depId)) {
            dataCache.geology.set(depId, { rocks: [], alteration: [], structure: [] });
        }
        if (fields[5] || fields[10]) {
            dataCache.geology.get(depId).rocks.push({
                type: fields[5],
                description: fields[10]
            });
        }
    });

    await loadFile('Alteration.txt', (fields) => {
        const depId = fields[1];
        if (!dataCache.alteration.has(depId)) {
            dataCache.alteration.set(depId, []);
        }
        if (fields[3] || fields[4]) {
            dataCache.alteration.get(depId).push({
                type: fields[3],
                description: fields[4]
            });
        }
    });

    await loadFile('Ore_control.txt', (fields) => {
        const depId = fields[1];
        if (!dataCache.ore_control.has(depId)) {
            dataCache.ore_control.set(depId, []);
        }
        if (fields[3] || fields[4]) {
            dataCache.ore_control.get(depId).push({
                type: fields[3],
                description: fields[4]
            });
        }
    });

    // Load production history
    await loadFile('Production.txt', (fields) => {
        const depId = fields[1];
        if (!dataCache.production.has(depId)) {
            dataCache.production.set(depId, []);
        }
        if (fields[2] || fields[7]) {
            dataCache.production.get(depId).push({
                year: fields[2],
                amount: fields[7],
                units: fields[8],
                material: fields[9]
            });
        }
    });

    // Load comments
    await loadFile('Comments.txt', (fields) => {
        const depId = fields[1];
        if (!dataCache.comments.has(depId)) {
            dataCache.comments.set(depId, []);
        }
        if (fields[4]) {
            dataCache.comments.get(depId).push({
                category: fields[3],
                text: fields[4]
            });
        }
    });

    // Load workings information
    await loadFile('Workings.txt', (fields) => {
        const depId = fields[1];
        if (!dataCache.workings.has(depId)) {
            dataCache.workings.set(depId, []);
        }
        dataCache.workings.get(depId).push({
            type: fields[3],
            name: fields[4],
            dimensions: {
                area: fields[5],
                area_units: fields[6],
                length: fields[7],
                length_units: fields[8],
                depth: fields[17],
                depth_units: fields[18]
            }
        });
    });
}

function categorizeDeposit(depId) {
    const deposit = dataCache.deposits.get(depId);
    const workings = dataCache.workings.get(depId);
    
    // Keywords for categorization
    const placerKeywords = ['placer', 'alluvial', 'stream', 'river'];
    const hydraulicKeywords = ['hydraulic', 'water', 'sluice'];
    const mineKeywords = ['underground', 'surface', 'open pit', 'shaft', 'adit', 'tunnel'];

    let evidence = [];
    
    // Check deposit information
    if (deposit) {
        evidence = evidence.concat([
            deposit.type,
            deposit.operation,
            deposit.mining_method
        ].filter(Boolean));
    }

    // Check workings
    if (workings) {
        evidence = evidence.concat(
            workings.map(w => [w.type, w.name]).flat().filter(Boolean)
        );
    }

    // Convert to lowercase for matching
    evidence = evidence.map(e => e.toLowerCase());

    // Categorize based on evidence
    if (evidence.some(e => placerKeywords.some(k => e.includes(k)))) {
        return 'Placer';
    }
    if (evidence.some(e => hydraulicKeywords.some(k => e.includes(k)))) {
        return 'Hydraulic';
    }
    if (evidence.some(e => mineKeywords.some(k => e.includes(k)))) {
        return 'Mine';
    }

    // Default categorization based on deposit type if available
    if (deposit?.type) {
        if (deposit.type.toLowerCase().includes('vein')) return 'Mine';
        if (deposit.type.toLowerCase().includes('lode')) return 'Mine';
    }

    return 'Unknown';
}

function generateDescription(depId, name, commodities) {
    const deposit = dataCache.deposits.get(depId);
    const geology = dataCache.geology.get(depId);
    const production = dataCache.production.get(depId);
    const comments = dataCache.comments.get(depId);
    const workings = dataCache.workings.get(depId);
    const alteration = dataCache.alteration.get(depId);
    const ore_control = dataCache.ore_control.get(depId);

    let description = [];

    // Title and basic information
    description.push(`<div class="deposit-info">`);
    description.push(`<h2>${name}</h2>`);
    
    if (deposit) {
        description.push(`<div class="basic-info">`);
        description.push(`<p><strong>Development Status:</strong> ${deposit.development_status || 'Unknown'}</p>`);
        description.push(`<p><strong>Deposit Type:</strong> ${deposit.type || 'Unknown'}</p>`);
        description.push(`<p><strong>Primary Commodities:</strong> ${commodities.join(', ')}</p>`);
        if (deposit.discovery_year) {
            description.push(`<p><strong>Discovered:</strong> ${deposit.discovery_year}</p>`);
        }
        if (deposit.size) {
            description.push(`<p><strong>Deposit Size:</strong> ${deposit.size}</p>`);
        }
        description.push(`</div>`);
    }

    // Geological information
    if (geology?.rocks.length > 0 || alteration?.length > 0 || ore_control?.length > 0) {
        description.push(`<div class="geology">`);
        description.push(`<h3>Geological Information</h3>`);
        
        if (geology?.rocks.length > 0) {
            description.push(`<h4>Rock Types</h4>`);
            description.push(`<ul>`);
            geology.rocks.forEach(rock => {
                if (rock.type || rock.description) {
                    description.push(`<li>${rock.type}${rock.description ? `: ${rock.description}` : ''}</li>`);
                }
            });
            description.push(`</ul>`);
        }

        if (alteration?.length > 0) {
            description.push(`<h4>Alteration</h4>`);
            description.push(`<ul>`);
            alteration.forEach(alt => {
                if (alt.type || alt.description) {
                    description.push(`<li>${alt.type}${alt.description ? `: ${alt.description}` : ''}</li>`);
                }
            });
            description.push(`</ul>`);
        }

        if (ore_control?.length > 0) {
            description.push(`<h4>Ore Controls</h4>`);
            description.push(`<ul>`);
            ore_control.forEach(control => {
                if (control.type || control.description) {
                    description.push(`<li>${control.type}${control.description ? `: ${control.description}` : ''}</li>`);
                }
            });
            description.push(`</ul>`);
        }
        
        description.push(`</div>`);
    }

    // Mining and Production
    if (workings?.length > 0 || production?.length > 0) {
        description.push(`<div class="mining">`);
        description.push(`<h3>Mining Information</h3>`);
        
        if (workings?.length > 0) {
            description.push(`<h4>Mine Workings</h4>`);
            description.push(`<ul>`);
            workings.forEach(working => {
                let workingDesc = [];
                if (working.type) workingDesc.push(working.type);
                if (working.name) workingDesc.push(working.name);
                if (working.dimensions.depth) {
                    workingDesc.push(`Depth: ${working.dimensions.depth} ${working.dimensions.depth_units || ''}`);
                }
                if (workingDesc.length > 0) {
                    description.push(`<li>${workingDesc.join(' - ')}</li>`);
                }
            });
            description.push(`</ul>`);
        }

        if (production?.length > 0) {
            description.push(`<h4>Production History</h4>`);
            description.push(`<ul>`);
            production.forEach(prod => {
                if (prod.year || prod.amount) {
                    description.push(`<li>${prod.year || 'Unknown year'}: ${prod.amount || 'Unknown amount'} ${prod.units || ''} ${prod.material || ''}</li>`);
                }
            });
            description.push(`</ul>`);
        }
        
        description.push(`</div>`);
    }

    // Additional Information
    if (comments?.length > 0) {
        description.push(`<div class="additional">`);
        description.push(`<h3>Additional Information</h3>`);
        comments.forEach(comment => {
            if (comment.text) {
                description.push(`<p>${comment.text}</p>`);
            }
        });
        description.push(`</div>`);
    }

    description.push(`</div>`);

    return description.join('\n');
}

async function generateRichFeatures() {
    console.log('Loading and processing data...');
    await loadRelatedData();

    const features = [];
    const rl = createInterface({
        input: createReadStream('data/MRDS_NorthernCalifornia.txt'),
        crlfDelay: Infinity
    });

    let isFirstLine = true;
    let processedCount = 0;

    for await (const line of rl) {
        if (isFirstLine) {
            isFirstLine = false;
            continue;
        }

        const fields = line.split('\t');
        const depId = fields[1].trim();
        const name = fields[2].replace(/"/g, '').trim();
        const commodities = fields[5].replace(/"/g, '').trim().split(' ').filter(c => c);
        const longitude = parseFloat(fields[6]);
        const latitude = parseFloat(fields[7]);

        if (isNaN(longitude) || isNaN(latitude)) continue;

        processedCount++;
        if (processedCount % 100 === 0) {
            console.log(`Processed ${processedCount} deposits...`);
        }

        const category = categorizeDeposit(depId);
        const description = generateDescription(depId, name, commodities);

        // Create GeoJSON feature
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            properties: {
                id: depId,
                name: name,
                category: category,
                primary_commodity: commodities[0] || 'Unknown',
                commodities: commodities,
                description: description,
                usgs_url: `https://mrdata.usgs.gov/mrds/show-mrds.php?dep_id=${depId}`,
                development_status: dataCache.deposits.get(depId)?.development_status || 'Unknown'
            }
        };

        features.push(feature);
    }

    // Create GeoJSON
    const geojson = {
        type: 'FeatureCollection',
        features: features,
        properties: {
            name: 'Northern California Mineral Deposits',
            description: 'USGS MRDS data with enhanced descriptions',
            generated: new Date().toISOString()
        }
    };

    // Write GeoJSON
    writeFileSync('data/northern_california_deposits_rich.geojson', 
                 JSON.stringify(geojson, null, 2));

    // Generate KML
    const kml = generateKML(features);
    writeFileSync('data/northern_california_deposits.kml', kml);

    console.log('\nConversion complete:');
    console.log(`Processed ${features.length} deposits`);
    console.log('Output files:');
    console.log('- data/northern_california_deposits_rich.geojson');
    console.log('- data/northern_california_deposits.kml');
}

function generateKML(features) {
    const kmlStyles = generateKMLStyles();
    const kmlPlacemarks = features.map(feature => {
        const [lon, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        return `
    <Placemark>
      <name>${props.name}</name>
      <description><![CDATA[
        <style>
          .deposit-info { font-family: Arial, sans-serif; }
          .deposit-info h2 { color: #2c3e50; margin-bottom: 10px; }
          .deposit-info h3 { color: #34495e; margin-top: 15px; }
          .deposit-info h4 { color: #7f8c8d; margin-top: 10px; }
          .deposit-info p { margin: 5px 0; }
          .deposit-info ul { margin: 5px 0; padding-left: 20px; }
          .deposit-info .basic-info { background: #f8f9fa; padding: 10px; border-radius: 4px; }
          .deposit-info .geology { margin-top: 15px; }
          .deposit-info .mining { margin-top: 15px; }
          .deposit-info .additional { margin-top: 15px; font-style: italic; }
        </style>
        ${props.description}
        <p><a href="${props.usgs_url}" target="_blank">View on USGS Website</a></p>
      ]]></description>
      <styleUrl>#${props.category.toLowerCase()}_${props.primary_commodity}</styleUrl>
      <Point>
        <coordinates>${lon},${lat}</coordinates>
      </Point>
    </Placemark>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Northern California Mineral Deposits</name>
    <description>USGS MRDS data with enhanced descriptions</description>
    ${kmlStyles}
    ${kmlPlacemarks}
  </Document>
</kml>`;
}

function generateKMLStyles() {
    const categories = ['mine', 'placer', 'hydraulic', 'unknown'];
    const commodities = ['AU', 'AG', 'CU', 'CR', 'MN', 'FE', 'PB', 'ZN'];
    
    const colors = {
        'AU': 'ffff7800',  // Gold
        'AG': 'ffc0c0c0',  // Silver
        'CU': 'ff3373b8',  // Copper
        'CR': 'ff4a4a4a',  // Chromium
        'MN': 'ff4e4e9c',  // Manganese
        'FE': 'ff8b4513',  // Iron
        'PB': 'ff2f4f4f',  // Lead
        'ZN': 'ff708090'   // Zinc
    };

    const scales = {
        'mine': 1.2,
        'placer': 1.0,
        'hydraulic': 1.1,
        'unknown': 0.9
    };

    return categories.map(category => 
        commodities.map(commodity => `
    <Style id="${category}_${commodity}">
      <IconStyle>
        <color>${colors[commodity] || 'ff808080'}</color>
        <scale>${scales[category]}</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/mining.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
      <BalloonStyle>
        <text>$[description]</text>
        <bgColor>ffffffff</bgColor>
        <textColor>ff000000</textColor>
      </BalloonStyle>
    </Style>`).join('\n')
    ).join('\n');
}

console.log('Starting rich feature generation with enhanced descriptions...');
generateRichFeatures().catch(console.error);

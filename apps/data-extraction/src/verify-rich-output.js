import { readFileSync } from 'fs';

function analyzeRichOutput() {
    console.log('Analyzing enhanced output files...\n');

    // Analyze GeoJSON
    console.log('Analyzing GeoJSON output:');
    const geojson = JSON.parse(readFileSync('data/northern_california_deposits_rich.geojson', 'utf8'));
    
    const stats = {
        categories: new Map(),
        commodities: new Map(),
        development_status: new Map(),
        descriptionSections: {
            basic_info: 0,
            geology: 0,
            mining: 0,
            additional: 0
        },
        rockTypes: new Set(),
        alterationTypes: new Set()
    };

    // Analyze features
    geojson.features.forEach(feature => {
        const props = feature.properties;
        
        // Count categories
        stats.categories.set(props.category, 
            (stats.categories.get(props.category) || 0) + 1);
        
        // Count primary commodities
        stats.commodities.set(props.primary_commodity, 
            (stats.commodities.get(props.primary_commodity) || 0) + 1);

        // Count development status
        stats.development_status.set(props.development_status,
            (stats.development_status.get(props.development_status) || 0) + 1);
        
        // Analyze description content
        if (props.description) {
            // Count sections
            if (props.description.includes('basic-info')) stats.descriptionSections.basic_info++;
            if (props.description.includes('geology')) stats.descriptionSections.geology++;
            if (props.description.includes('mining')) stats.descriptionSections.mining++;
            if (props.description.includes('additional')) stats.descriptionSections.additional++;

            // Extract rock types
            const rockMatches = props.description.match(/<li>([^<]+)<\/li>/g);
            if (rockMatches) {
                rockMatches.forEach(match => {
                    const rockType = match.replace(/<\/?li>/g, '').trim();
                    if (rockType.length > 0) {
                        stats.rockTypes.add(rockType);
                    }
                });
            }
        }
    });

    // Output analysis
    console.log('\nFeature Statistics:');
    console.log(`Total Features: ${geojson.features.length}`);

    console.log('\nDeposit Categories:');
    Array.from(stats.categories.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
            const percentage = ((count / geojson.features.length) * 100).toFixed(1);
            console.log(`${category}: ${count} (${percentage}%)`);
        });

    console.log('\nDevelopment Status:');
    Array.from(stats.development_status.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
            const percentage = ((count / geojson.features.length) * 100).toFixed(1);
            console.log(`${status}: ${count} (${percentage}%)`);
        });

    console.log('\nTop Primary Commodities:');
    Array.from(stats.commodities.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([commodity, count]) => {
            const percentage = ((count / geojson.features.length) * 100).toFixed(1);
            console.log(`${commodity}: ${count} (${percentage}%)`);
        });

    console.log('\nDescription Content:');
    Object.entries(stats.descriptionSections).forEach(([section, count]) => {
        const percentage = ((count / geojson.features.length) * 100).toFixed(1);
        console.log(`${section}: ${count} (${percentage}%)`);
    });

    // Sample Output
    console.log('\nSample Feature Description:');
    const sampleFeature = geojson.features[0];
    console.log('\nFeature Properties:');
    console.log(JSON.stringify({
        id: sampleFeature.properties.id,
        name: sampleFeature.properties.name,
        category: sampleFeature.properties.category,
        primary_commodity: sampleFeature.properties.primary_commodity,
        development_status: sampleFeature.properties.development_status
    }, null, 2));

    console.log('\nDescription Preview:');
    // Show first 500 characters of description
    console.log(sampleFeature.properties.description.substring(0, 500) + '...');

    // Analyze KML
    console.log('\nAnalyzing KML output:');
    const kml = readFileSync('data/northern_california_deposits.kml', 'utf8');
    
    console.log('KML Statistics:');
    console.log(`File Size: ${(kml.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Placemarks: ${(kml.match(/<Placemark>/g) || []).length}`);
    console.log(`Styles: ${(kml.match(/<Style /g) || []).length}`);
    console.log(`Contains CSS Styling: ${kml.includes('<style>')}`);
    console.log(`Contains CDATA Sections: ${kml.includes('CDATA')}`);
}

console.log('Starting enhanced output verification...');
analyzeRichOutput();

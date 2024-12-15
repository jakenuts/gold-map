import { readFileSync } from 'fs';

function analyzeGeoJSON() {
    console.log('Analyzing optimized GeoJSON file...');
    
    const data = JSON.parse(readFileSync('data/northern_california_deposits_optimized.geojson', 'utf8'));
    
    // Analysis categories
    const stats = {
        primary_commodities: new Map(),
        all_commodities: new Map(),
        development_status: new Map(),
        production_status: new Map(),
        geology: {
            rock_types: new Set(),
            alteration_types: new Set()
        }
    };

    // Analyze each feature
    data.features.forEach(feature => {
        const props = feature.properties;

        // Analyze commodities
        if (props.commodities) {
            // Primary commodities
            props.commodities.primary?.forEach(commodity => {
                stats.primary_commodities.set(commodity, 
                    (stats.primary_commodities.get(commodity) || 0) + 1);
            });
            // All commodities
            props.commodities.all?.forEach(commodity => {
                stats.all_commodities.set(commodity, 
                    (stats.all_commodities.get(commodity) || 0) + 1);
            });
        }

        // Development status
        if (props.status) {
            stats.development_status.set(props.status, 
                (stats.development_status.get(props.status) || 0) + 1);
        }

        // Production status
        const prodStatus = props.production?.has_production ? 'Producer' : 'Non-producer';
        stats.production_status.set(prodStatus, 
            (stats.production_status.get(prodStatus) || 0) + 1);

        // Geology
        if (props.geology) {
            props.geology.rock_types?.forEach(type => {
                if (type) stats.geology.rock_types.add(type);
            });
            props.geology.alteration_types?.forEach(type => {
                if (type) stats.geology.alteration_types.add(type);
            });
        }
    });

    console.log('\nGeoJSON Analysis Results:');
    console.log('------------------------');
    console.log(`Total Features: ${data.features.length}`);

    console.log('\nPrimary Commodities:');
    Array.from(stats.primary_commodities.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([commodity, count]) => {
            const percentage = ((count / data.features.length) * 100).toFixed(1);
            console.log(`${commodity}: ${count} (${percentage}%)`);
        });

    console.log('\nDevelopment Status:');
    Array.from(stats.development_status.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
            const percentage = ((count / data.features.length) * 100).toFixed(1);
            console.log(`${status}: ${count} (${percentage}%)`);
        });

    console.log('\nProduction Status:');
    Array.from(stats.production_status.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
            const percentage = ((count / data.features.length) * 100).toFixed(1);
            console.log(`${status}: ${count} (${percentage}%)`);
        });

    console.log('\nGeological Characteristics:');
    console.log(`Unique Rock Types: ${stats.geology.rock_types.size}`);
    console.log(`Unique Alteration Types: ${stats.geology.alteration_types.size}`);

    console.log('\nGIS Visualization Recommendations:');
    console.log('--------------------------------');
    console.log('1. Symbol Categories:');
    console.log('   Primary Commodity (Color):');
    const topCommodities = Array.from(stats.primary_commodities.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    topCommodities.forEach(([commodity]) => {
        const colors = {
            'AU': '#FFD700',  // Gold
            'CR': '#4A4A4A',  // Dark Grey
            'AG': '#C0C0C0',  // Silver
            'CU': '#B87333',  // Copper
            'MN': '#9C4E4E'   // Manganese
        };
        console.log(`   - ${commodity}: ${colors[commodity] || '#808080'}`);
    });

    console.log('\n2. Symbol Size (by Development Status):');
    console.log('   - Producer: Large (12px)');
    console.log('   - Past Producer: Medium (9px)');
    console.log('   - Prospect/Occurrence: Small (6px)');

    console.log('\n3. Suggested Layer Structure:');
    console.log('   Base Layers:');
    console.log('   - Topographic');
    console.log('   - Geological (if available)');
    console.log('   Data Layers:');
    console.log('   - Active Producers');
    console.log('   - Past Producers');
    console.log('   - Prospects/Occurrences');

    console.log('\n4. Interactive Features:');
    console.log('   Pop-up Content:');
    console.log('   - Name and ID');
    console.log('   - Primary Commodities');
    console.log('   - Development Status');
    console.log('   - Production History');
    console.log('   - Geological Info');

    console.log('\n5. Filter Groups:');
    console.log('   - By Commodity');
    console.log('   - By Development Status');
    console.log('   - By Production History');
    console.log('   - By Geological Characteristics');
}

console.log('Starting detailed GeoJSON analysis...');
analyzeGeoJSON();

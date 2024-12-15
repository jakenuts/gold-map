import { readFileSync } from 'fs';

function analyzeBasicGeoJSON() {
    console.log('Analyzing Northern California deposits GeoJSON...');
    
    const data = JSON.parse(readFileSync('data/northern_california_deposits.geojson', 'utf8'));
    
    // Analysis categories
    const stats = {
        commodities: new Map(),
        development_status: new Map(),
        locations: new Set(),
        bounds: {
            north: -90,
            south: 90,
            east: -180,
            west: 180
        }
    };

    // First, let's look at the structure of the first feature
    console.log('\nSample Feature Structure:');
    console.log(JSON.stringify(data.features[0], null, 2));

    // Analyze each feature
    data.features.forEach(feature => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;

        // Update bounds
        stats.bounds.north = Math.max(stats.bounds.north, coords[1]);
        stats.bounds.south = Math.min(stats.bounds.south, coords[1]);
        stats.bounds.east = Math.max(stats.bounds.east, coords[0]);
        stats.bounds.west = Math.min(stats.bounds.west, coords[0]);

        // Analyze commodities - handle different possible structures
        const commodityList = props.code_list?.split(' ') || 
                            props.commodities?.list || 
                            props.commodities || 
                            [];
        
        commodityList.forEach(commodity => {
            if (commodity && typeof commodity === 'string') {
                const cleanCommodity = commodity.trim().replace(/"/g, '');
                if (cleanCommodity) {
                    stats.commodities.set(cleanCommodity, 
                        (stats.commodities.get(cleanCommodity) || 0) + 1);
                }
            }
        });

        // Development status
        const status = props.development_status || props.dev_stat || props.status;
        if (status) {
            const cleanStatus = status.replace(/"/g, '').trim();
            stats.development_status.set(cleanStatus, 
                (stats.development_status.get(cleanStatus) || 0) + 1);
        }
    });

    console.log('\nData Analysis:');
    console.log('-------------');
    console.log(`Total Features: ${data.features.length}`);

    console.log('\nGeographic Bounds:');
    console.log(`North: ${stats.bounds.north.toFixed(4)}°`);
    console.log(`South: ${stats.bounds.south.toFixed(4)}°`);
    console.log(`East: ${stats.bounds.east.toFixed(4)}°`);
    console.log(`West: ${stats.bounds.west.toFixed(4)}°`);

    console.log('\nTop Commodities:');
    Array.from(stats.commodities.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
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

    console.log('\nGIS Visualization Recommendations:');
    console.log('--------------------------------');
    console.log('1. Symbology:');
    console.log('   Colors by Primary Commodity:');
    const topFive = Array.from(stats.commodities.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const commodityColors = {
        'AU': '#FFD700',  // Gold
        'CR': '#4A4A4A',  // Dark Grey
        'AG': '#C0C0C0',  // Silver
        'CU': '#B87333',  // Copper
        'MN': '#9C4E4E',  // Manganese
        'FE': '#8B4513',  // Iron
        'PB': '#2F4F4F',  // Lead
        'ZN': '#708090'   // Zinc
    };

    topFive.forEach(([commodity, count]) => {
        const percentage = ((count / data.features.length) * 100).toFixed(1);
        console.log(`   - ${commodity} (${percentage}%): ${commodityColors[commodity] || '#808080'}`);
    });

    console.log('\n2. Symbol Sizing by Development Status:');
    Array.from(stats.development_status.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
            const percentage = ((count / data.features.length) * 100).toFixed(1);
            const size = status.includes('Producer') ? '10px' : 
                        status === 'Prospect' ? '6px' : '8px';
            console.log(`   - ${status} (${percentage}%): ${size}`);
        });

    console.log('\n3. Suggested Layer Structure:');
    console.log('   Active Producers');
    console.log('   ├─ Gold');
    console.log('   ├─ Chromium');
    console.log('   ├─ Silver');
    console.log('   └─ Other');
    console.log('   Past Producers');
    console.log('   ├─ Gold');
    console.log('   ├─ Chromium');
    console.log('   └─ Other');
    console.log('   Prospects/Occurrences');
    console.log('   └─ By Commodity');

    console.log('\n4. Recommended Filters:');
    console.log('   - Development Status');
    console.log('   - Primary Commodity');
    console.log('   - Production Period');
    console.log('   - Geographic Area');
}

console.log('Starting quick GeoJSON analysis with structure inspection...');
analyzeBasicGeoJSON();

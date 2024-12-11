import { USGSDepositClient } from './services/usgs-deposit-client-new.js';
import type { DepositFeature } from './services/usgs-deposit-client-new.js';
import type { BoundingBox } from './services/wfs-base-client.js';

async function testDepositClient() {
    try {
        console.log('Initializing USGS Deposit client...');
        const client = new USGSDepositClient();

        // Use a larger search area to ensure we don't miss any nearby features
        const searchBBox: BoundingBox = {
            minLon: -125.0,    // Further west
            minLat: 39.0,      // Further south
            maxLon: -121.5,    // Further east
            maxLat: 42.5       // Further north
        };
        console.log('Using search bbox coordinates:', searchBBox);
        
        // Get features
        console.log('\nFetching Deposit features...');
        const allFeatures = await client.getDepositFeatures(searchBBox);
        console.log(`\nRetrieved ${allFeatures.length} total features in search area`);

        return;

        // Define our target area
        const targetBBox: BoundingBox = {
            minLon: -124.4072,  // West: 124°24′25.857″W
            minLat: 40.0712,    // South: 40°04′16.246″N
            maxLon: -122.3933,  // East: 122°23′35.993″W
            maxLat: 41.7410     // North: 41°44′27.659″N
        };

        // Calculate target area center
        const targetCenter = {
            lon: (targetBBox.minLon + targetBBox.maxLon) / 2,
            lat: (targetBBox.minLat + targetBBox.maxLat) / 2
        };
        console.log('\nTarget area center:', targetCenter);

        // Calculate distances and analyze distribution
        const featureDistances = allFeatures.map(feature => {
            const [lon, lat] = feature.geometry.coordinates;
            
            // Calculate distance in kilometers using Haversine formula
            const R = 6371; // Earth's radius in kilometers
            const dLat = (lat - targetCenter.lat) * Math.PI / 180;
            const dLon = (lon - targetCenter.lon) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(targetCenter.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;

            // Calculate bearing
            const y = Math.sin(dLon) * Math.cos(lat * Math.PI / 180);
            const x = Math.cos(targetCenter.lat * Math.PI / 180) * Math.sin(lat * Math.PI / 180) -
                     Math.sin(targetCenter.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.cos(dLon);
            const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

            // Determine direction
            let direction;
            if (bearing >= 337.5 || bearing < 22.5) direction = 'N';
            else if (bearing >= 22.5 && bearing < 67.5) direction = 'NE';
            else if (bearing >= 67.5 && bearing < 112.5) direction = 'E';
            else if (bearing >= 112.5 && bearing < 157.5) direction = 'SE';
            else if (bearing >= 157.5 && bearing < 202.5) direction = 'S';
            else if (bearing >= 202.5 && bearing < 247.5) direction = 'SW';
            else if (bearing >= 247.5 && bearing < 292.5) direction = 'W';
            else direction = 'NW';

            return {
                feature,
                distance,
                direction,
                bearing
            };
        });

        // Sort by distance
        featureDistances.sort((a, b) => a.distance - b.distance);

        // Analyze distance ranges
        console.log('\nDistance Distribution:');
        const ranges = [10, 25, 50, 100, 200];
        ranges.forEach((range, index) => {
            const min = index === 0 ? 0 : ranges[index - 1];
            const count = featureDistances.filter(f => f.distance >= min && f.distance < range).length;
            console.log(`${min}-${range}km: ${count} features`);
        });
        console.log(`>200km: ${featureDistances.filter(f => f.distance >= 200).length} features`);

        // Analyze directional distribution
        console.log('\nDirectional Distribution:');
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        directions.forEach(dir => {
            const count = featureDistances.filter(f => f.direction === dir).length;
            console.log(`${dir}: ${count} features`);
        });

        // Show nearest 15 features with detailed information
        console.log('\nNearest 15 features:');
        featureDistances.slice(0, 15).forEach(({ feature, distance, direction }) => {
            console.log('\nFeature details:');
            console.log('Name:', feature.properties.name);
            console.log('Coordinates:', feature.geometry.coordinates);
            console.log('Distance:', distance.toFixed(2), 'km');
            console.log('Direction:', direction);
            console.log('County:', feature.properties.county);
            console.log('State:', feature.properties.state);
            console.log('Deposit Type:', feature.properties.deposit_type);
            console.log('Commodities:', feature.properties.commodities);
            console.log('Development Status:', feature.properties.development_status);
        });

        // Show commodity distribution
        console.log('\nCommodity Distribution:');
        const commodityCounts = featureDistances
            .flatMap(({ feature }) => 
                (feature.properties.commodities || '')
                    .split(';')
                    .map(c => c.trim())
                    .filter(Boolean)
            )
            .reduce((acc: {[key: string]: number}, commodity) => {
                acc[commodity] = (acc[commodity] || 0) + 1;
                return acc;
            }, {});

        Object.entries(commodityCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([commodity, count]) => {
                console.log(`${commodity}: ${count} occurrences`);
            });

    } catch (error) {
        console.error('Error testing Deposit client:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the test
testDepositClient().catch(console.error);

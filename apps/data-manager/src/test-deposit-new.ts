import { USGSDepositClient } from './services/usgs-deposit-client-new.js';
import type { DepositFeature } from './services/usgs-deposit-client-new.js';
import type { BoundingBox } from './services/wfs-base-client.js';

async function testDepositClient() {
    try {
        console.log('Initializing USGS Deposit client...');
        const client = new USGSDepositClient();

        // Northern California bounding box (using larger area that we know works)
        const bbox: BoundingBox = {
            minLon: -124.5,    // West
            minLat: 40.0,      // South
            maxLon: -122.0,    // East
            maxLat: 42.0       // North
        };
        console.log('Using bbox coordinates:', bbox);
        
        // Get features
        console.log('\nFetching Deposit features...');
        const features = await client.getDepositFeatures(bbox);
        console.log(`\nRetrieved ${features.length} features`);

        if (features.length > 0) {
            // Show all feature details since we have a small number
            features.forEach((feature, index) => {
                console.log(`\nFeature ${index + 1} details:`);
                console.log('Name:', feature.properties.name);
                console.log('Deposit Type:', feature.properties.deposit_type);
                console.log('Commodities:', feature.properties.commodities);
                console.log('Development Status:', feature.properties.development_status);
                console.log('Site Type:', feature.properties.site_type);
                console.log('State:', feature.properties.state);
                console.log('County:', feature.properties.county);
                console.log('Coordinates:', feature.geometry.coordinates);
                console.log('Reference:', feature.properties.reference);
                console.log('Reference Detail:', feature.properties.reference_detail);
                console.log('DOI:', feature.properties.doi);
                console.log('Remarks:', feature.properties.remarks);

                // Show GeoLocation format
                console.log('\nGeoLocation format:');
                const geoLocation = client.transformToGeoLocation(feature);
                console.log(JSON.stringify(geoLocation, null, 2));
            });

            // Show statistics
            const uniqueDepositTypes = new Set(features.map((f: DepositFeature) => f.properties.deposit_type).filter(Boolean));
            const uniqueCommodities = new Set(
                features
                    .map((f: DepositFeature) => f.properties.commodities || '')
                    .filter(Boolean)
                    .flatMap((commodities: string) => commodities.split(',').map(s => s.trim()))
                    .filter(Boolean)
            );
            const uniqueSiteTypes = new Set(features.map((f: DepositFeature) => f.properties.site_type).filter(Boolean));
            const uniqueStatuses = new Set(features.map((f: DepositFeature) => f.properties.development_status).filter(Boolean));
            const counties = new Set(features.map((f: DepositFeature) => f.properties.county).filter(Boolean));
            const states = new Set(features.map((f: DepositFeature) => f.properties.state).filter(Boolean));

            console.log('\nStatistics:');
            console.log('Total features:', features.length);
            console.log('\nUnique deposit types:', Array.from(uniqueDepositTypes));
            console.log('\nUnique commodities:', Array.from(uniqueCommodities));
            console.log('\nSite types:', Array.from(uniqueSiteTypes));
            console.log('\nDevelopment statuses:', Array.from(uniqueStatuses));
            console.log('\nStates:', Array.from(states));
            console.log('\nCounties:', Array.from(counties));

            // Distribution analysis
            console.log('\nDistribution Analysis:');
            
            // Deposit type distribution
            console.log('\nDeposit Type Distribution:');
            const depositTypeCount = features.reduce((acc: {[key: string]: number}, f: DepositFeature) => {
                const type = f.properties.deposit_type || 'Unknown';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});
            Object.entries(depositTypeCount)
                .sort(([,a], [,b]) => b - a)
                .forEach(([type, count]) => {
                    console.log(`${type}: ${count} (${((count/features.length)*100).toFixed(1)}%)`);
                });

            // Commodity distribution
            console.log('\nCommodity Distribution:');
            const commodityCount = features.reduce((acc: {[key: string]: number}, f: DepositFeature) => {
                const commodities = f.properties.commodities?.split(',')
                    .map(c => c.trim())
                    .filter(Boolean) || ['Unknown'];
                commodities.forEach((c: string) => {
                    acc[c] = (acc[c] || 0) + 1;
                });
                return acc;
            }, {});
            Object.entries(commodityCount)
                .sort(([,a], [,b]) => b - a)
                .forEach(([commodity, count]) => {
                    console.log(`${commodity}: ${count} (${((count/features.length)*100).toFixed(1)}%)`);
                });

            // Verify coordinates are within bounds
            console.log('\nCoordinate Verification:');
            features.forEach((feature, index) => {
                const [lon, lat] = feature.geometry.coordinates;
                const withinBounds = 
                    lon >= bbox.minLon && lon <= bbox.maxLon &&
                    lat >= bbox.minLat && lat <= bbox.maxLat;
                console.log(`Feature ${index + 1} coordinates [${lon}, ${lat}] within bounds: ${withinBounds}`);
            });

        } else {
            console.log('No features found');
            console.log('This might indicate an issue with:');
            console.log('1. The bounding box format');
            console.log('2. The WFS service endpoint');
            console.log('3. Data availability in this region');
        }

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

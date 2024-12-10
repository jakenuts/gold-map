import { USGSMRDSClient } from './services/usgs-mrds-client-new';
import { BoundingBox } from './services/wfs-base-client';
import type { MRDSFeature } from './services/usgs-mrds-client-new';

async function testMRDSClient() {
    try {
        console.log('Initializing MRDS client...');
        const client = new USGSMRDSClient();

        // First try getting just a few features without bbox
        console.log('\nFetching MRDS features (no bbox)...');
        const features = await client.getMRDSFeatures();
        console.log(`\nRetrieved ${features.length} features`);

        if (features.length > 0) {
            // Show first feature details
            console.log('\nFirst feature details:');
            const first = features[0];
            console.log('Name:', first.properties.name);
            console.log('Type:', first.properties.dep_type);
            console.log('Commodity:', first.properties.commod1);
            console.log('Development Status:', first.properties.development_status);
            console.log('Coordinates:', first.geometry.coordinates);

            // Show GeoLocation format
            console.log('\nGeoLocation format:');
            const geoLocation = client.transformToGeoLocation(first);
            console.log(JSON.stringify(geoLocation, null, 2));

            // Show statistics
            const uniqueTypes = new Set(features.map(f => f.properties.dep_type).filter(Boolean));
            const uniqueCommodities = new Set(features.map(f => f.properties.commod1).filter(Boolean));
            const uniqueStatuses = new Set(features.map(f => f.properties.development_status).filter(Boolean));

            console.log('\nStatistics:');
            console.log('Total features:', features.length);
            console.log('Unique deposit types:', Array.from(uniqueTypes));
            console.log('Unique commodities:', Array.from(uniqueCommodities));
            console.log('Development statuses:', Array.from(uniqueStatuses));

            // Try with bbox in California
            console.log('\nTrying with bbox in California...');
            const bbox: BoundingBox = {
                minLon: -124.0,
                minLat: 40.5,
                maxLon: -123.5,
                maxLat: 41.0
            };
            console.log('Using bbox:', bbox);
            
            const bboxFeatures = await client.getMRDSFeatures(bbox);
            console.log(`Retrieved ${bboxFeatures.length} features with bbox`);

            if (bboxFeatures.length > 0) {
                console.log('\nFirst bbox feature:');
                const firstBbox = bboxFeatures[0];
                console.log('Name:', firstBbox.properties.name);
                console.log('Type:', firstBbox.properties.dep_type);
                console.log('Commodity:', firstBbox.properties.commod1);
                console.log('Development Status:', firstBbox.properties.development_status);
                console.log('Coordinates:', firstBbox.geometry.coordinates);
            }
        } else {
            console.log('No features found');
        }

    } catch (error) {
        console.error('Error testing MRDS client:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the test
testMRDSClient().catch(console.error);

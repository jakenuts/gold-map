import { OgcApiEndpoint } from '@camptocamp/ogc-client';
async function testMRDS() {
    const baseUrl = 'https://mrdata.usgs.gov/services/wfs/mrds';
    try {
        console.log('Initializing OGC API endpoint...');
        const endpoint = new OgcApiEndpoint(baseUrl);
        // Get collections (feature types)
        console.log('\nGetting collections...');
        const collections = await endpoint.recordCollections;
        console.log('Collections:', collections);
        if (collections && collections.length > 0) {
            // Get first 10 items from the first collection
            console.log('\nGetting items from collection:', collections[0]);
            const items = await endpoint.getCollectionItems(collections[0], 10, 0);
            console.log('Items:', items);
        }
    }
    catch (error) {
        console.error('Error:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
    }
}
// Run the test
testMRDS().catch(console.error);
//# sourceMappingURL=test-mrds.js.map
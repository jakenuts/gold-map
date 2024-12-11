import { DataIngestionService } from './services/data-ingestion.js';
import { AppDataSource } from './config/database.js';
async function testMRDSStorage() {
    let connection = null;
    try {
        // Initialize database
        console.log('Initializing database...');
        connection = await AppDataSource.initialize();
        console.log('Initializing services...');
        const ingestionService = new DataIngestionService();
        // Try with bbox in California
        const bbox = {
            minLon: -124.0,
            minLat: 40.5,
            maxLon: -123.5,
            maxLat: 41.0
        };
        console.log('Using bbox:', bbox);
        // Format bbox string properly
        const bboxString = `${bbox.minLon.toFixed(6)},${bbox.minLat.toFixed(6)},${bbox.maxLon.toFixed(6)},${bbox.maxLat.toFixed(6)}`;
        // Ingest data
        console.log('\nIngesting USGS data...');
        const locations = await ingestionService.ingestUSGSData(bboxString);
        console.log(`\nStored ${locations.length} locations`);
        // Show sample of stored data
        if (locations.length > 0) {
            console.log('\nSample of stored locations:');
            locations.slice(0, 3).forEach((location) => {
                console.log({
                    name: location.name,
                    category: location.category,
                    subcategory: location.subcategory,
                    coordinates: location.location.coordinates,
                    source: location.dataSourceId
                });
            });
            console.log('\nTo view the features:');
            console.log('1. Start the web app: pnpm dev');
            console.log('2. Open http://localhost:5173 in your browser');
            console.log('3. The features should appear on the map in Northern California');
        }
        else {
            console.log('No locations were stored');
        }
    }
    catch (error) {
        console.error('Error testing MRDS storage:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
    }
    finally {
        // Close database connection
        if (connection?.isInitialized) {
            console.log('Closing database connection...');
            await connection.destroy();
            console.log('Database connection closed');
        }
    }
}
// Run the test
testMRDSStorage().catch(console.error);
//# sourceMappingURL=test-mrds-storage.js.map
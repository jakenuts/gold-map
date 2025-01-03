import 'reflect-metadata';
import { AppDataSource } from './config/database.js';
import { DataIngestionService } from './services/data-ingestion.js';
async function main() {
    try {
        await AppDataSource.initialize();
        console.log('Database connection initialized');
        const dataService = new DataIngestionService();
        const command = process.argv[2];
        switch (command) {
            case 'ingest':
                const bbox = process.argv[3];
                console.log('Starting USGS data ingestion...');
                await dataService.ingestUSGSData(bbox);
                console.log('Data ingestion completed');
                break;
            case 'query':
                const [minLng, minLat, maxLng, maxLat] = process.argv.slice(3).map(Number);
                if ([minLng, minLat, maxLng, maxLat].some(isNaN)) {
                    console.error('Invalid bounding box parameters. Usage: npm run start query <minLng> <minLat> <maxLng> <maxLat>');
                    process.exit(1);
                }
                const locations = await dataService.getLocationsInBoundingBox(minLng, minLat, maxLng, maxLat);
                console.log(`Found ${locations.length} locations in bounding box`);
                console.log(JSON.stringify(locations, null, 2));
                break;
            default:
                console.log(`
Available commands:
  ingest [bbox]     - Ingest USGS data (optional bounding box)
  query <minLng> <minLat> <maxLng> <maxLat> - Query locations in bounding box
        `);
        }
    }
    catch (error) {
        console.error('Application error:', error);
        process.exit(1);
    }
    finally {
        await AppDataSource.destroy();
    }
}
main();
//# sourceMappingURL=index.js.map
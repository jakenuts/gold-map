import { AppDataSource } from '../config/database.js';
import { GeoLocation } from '../entities/GeoLocation.js';
import { DataSource as GeoDataSource } from '../entities/DataSource.js';
import { USGSMRDSClient } from './usgs-mrds-client-new.js';
import { USGSDepositClient } from './usgs-deposit-client-new.js';
export class DataIngestionService {
    mrdsClient;
    depositClient;
    geoLocationRepository;
    dataSourceRepository;
    constructor() {
        this.mrdsClient = new USGSMRDSClient();
        this.depositClient = new USGSDepositClient();
        this.geoLocationRepository = AppDataSource.getRepository(GeoLocation);
        this.dataSourceRepository = AppDataSource.getRepository(GeoDataSource);
    }
    async ensureDataSource(name, description, url) {
        let dataSource = await this.dataSourceRepository.findOne({ where: { name } });
        if (!dataSource) {
            console.log(`Creating new data source: ${name}`);
            dataSource = this.dataSourceRepository.create({
                name,
                description,
                url,
                config: {}
            });
            await this.dataSourceRepository.save(dataSource);
        }
        else {
            // Update existing data source if URL has changed
            if (dataSource.url !== url) {
                console.log(`Updating data source URL for: ${name}`);
                dataSource.url = url;
                await this.dataSourceRepository.save(dataSource);
            }
        }
        return dataSource;
    }
    async ingestUSGSData(bbox) {
        let queryRunner = null;
        try {
            console.log('Starting USGS data ingestion with bbox:', bbox || 'default');
            // Parse bbox string into object if provided
            let bboxObj;
            if (bbox) {
                const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
                if (!isNaN(minLon) && !isNaN(minLat) && !isNaN(maxLon) && !isNaN(maxLat)) {
                    bboxObj = { minLon, minLat, maxLon, maxLat };
                }
                else {
                    console.warn('Invalid bbox format, using default');
                }
            }
            // Ensure both data sources exist
            const mrdsSource = await this.ensureDataSource('USGS-MRDS', 'USGS Mineral Resources Data System', 'https://mrdata.usgs.gov/services/wfs/mrds');
            const depositSource = await this.ensureDataSource('USGS-Deposit', 'USGS Mineral Deposit Database', 'https://mrdata.usgs.gov/services/wfs/deposit');
            console.log('Data sources configured:', {
                mrds: { id: mrdsSource.id, url: mrdsSource.url },
                deposit: { id: depositSource.id, url: depositSource.url }
            });
            // Fetch data from both sources sequentially for better error handling
            console.log('Fetching MRDS data...');
            let mrdsFeatures = [];
            let mrdsError = null;
            try {
                mrdsFeatures = await this.mrdsClient.getMRDSFeatures(bboxObj);
                console.log(`Successfully fetched ${mrdsFeatures.length} MRDS features`);
                // Log sample coordinates for debugging
                if (mrdsFeatures.length > 0) {
                    console.log('Sample MRDS coordinates:', mrdsFeatures.slice(0, 3).map(f => ({
                        coordinates: f.geometry.coordinates,
                        name: f.properties.name
                    })));
                }
            }
            catch (error) {
                mrdsError = error instanceof Error ? error : new Error('Unknown error fetching MRDS data');
                console.error('Error fetching MRDS data:', error);
                if (error instanceof Error) {
                    console.error('Error details:', error.message);
                    console.error('Stack trace:', error.stack);
                }
            }
            console.log('Fetching Deposit data...');
            let depositFeatures = [];
            let depositError = null;
            try {
                depositFeatures = await this.depositClient.getFeatures(bbox);
                console.log(`Successfully fetched ${depositFeatures.length} Deposit features`);
                // Log sample coordinates for debugging
                if (depositFeatures.length > 0) {
                    console.log('Sample Deposit coordinates:', depositFeatures.slice(0, 3).map(f => ({
                        coordinates: f.geometry.coordinates,
                        name: f.properties.name
                    })));
                }
            }
            catch (error) {
                depositError = error instanceof Error ? error : new Error('Unknown error fetching Deposit data');
                console.error('Error fetching Deposit data:', error);
                if (error instanceof Error) {
                    console.error('Error details:', error.message);
                    console.error('Stack trace:', error.stack);
                }
            }
            if (mrdsFeatures.length === 0 && depositFeatures.length === 0) {
                const errors = [];
                if (mrdsError)
                    errors.push(`MRDS: ${mrdsError.message}`);
                if (depositError)
                    errors.push(`Deposit: ${depositError.message}`);
                throw new Error(`No features retrieved from either USGS source. Errors: ${errors.join('; ')}`);
            }
            // Start transaction
            queryRunner = AppDataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            // Clear existing data for both sources
            console.log('Clearing existing USGS data...');
            await queryRunner.manager.delete(GeoLocation, { dataSourceId: mrdsSource.id });
            await queryRunner.manager.delete(GeoLocation, { dataSourceId: depositSource.id });
            console.log('Cleared existing USGS data');
            // Transform and prepare locations for both sources
            console.log('Transforming features...');
            const mrdsLocations = this.prepareLocations(mrdsFeatures, this.mrdsClient, mrdsSource.id);
            const depositLocations = this.prepareLocations(depositFeatures, this.depositClient, depositSource.id);
            console.log('Transformed locations count:', {
                mrds: mrdsLocations.length,
                deposit: depositLocations.length
            });
            const locations = [...mrdsLocations, ...depositLocations];
            if (locations.length === 0) {
                throw new Error('No valid locations after transformation');
            }
            // Save all locations using raw SQL
            console.log('Saving locations to database...');
            const values = locations.map(location => {
                const [lon, lat] = location.location.coordinates;
                return `(
          '${location.name.replace(/'/g, "''")}',
          '${location.category}',
          '${location.subcategory}',
          '${location.category}',
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326),
          '${JSON.stringify(location.properties).replace(/'/g, "''")}',
          '${location.dataSourceId}',
          ${location.sourceId ? `'${location.sourceId}'` : 'NULL'}
        )`;
            }).join(',\n');
            const insertQuery = `
        INSERT INTO geo_locations (
          name,
          category,
          subcategory,
          "locationType",
          location,
          properties,
          "dataSourceId",
          "sourceId"
        )
        VALUES ${values}
        RETURNING *;
      `;
            const savedLocations = await queryRunner.query(insertQuery);
            // Commit transaction
            await queryRunner.commitTransaction();
            console.log('Successfully saved locations:', {
                total: savedLocations.length,
                mrds: mrdsLocations.length,
                deposit: depositLocations.length,
                sampleCoordinates: savedLocations.slice(0, 3).map((loc) => ({
                    name: loc.name,
                    coordinates: loc.location.coordinates,
                    category: loc.category,
                    source: loc.dataSourceId
                }))
            });
            return savedLocations;
        }
        catch (error) {
            // Rollback transaction on error
            if (queryRunner?.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            console.error('Error during data ingestion:', error);
            if (error instanceof Error) {
                console.error('Error details:', error.message);
                console.error('Stack trace:', error.stack);
            }
            throw error;
        }
        finally {
            // Release query runner
            if (queryRunner) {
                await queryRunner.release();
            }
        }
    }
    prepareLocations(features, client, dataSourceId) {
        const validLocations = [];
        for (const feature of features) {
            try {
                // Type assertion since we know the client will handle its own feature type
                const transformed = client.transformToGeoLocation(feature);
                // Create location object (PostGIS function will be added during save)
                const location = {
                    name: transformed.name,
                    category: transformed.category,
                    subcategory: transformed.subcategory,
                    location: {
                        type: 'Point',
                        coordinates: transformed.location.coordinates
                    },
                    properties: transformed.properties,
                    dataSourceId,
                    sourceId: transformed.sourceId || undefined
                };
                validLocations.push(location);
            }
            catch (error) {
                console.error('Error transforming feature:', {
                    error,
                    feature: {
                        coordinates: feature.geometry.coordinates,
                        properties: feature.properties
                    }
                });
            }
        }
        return validLocations;
    }
    async getLocationsInBoundingBox(minLon, minLat, maxLon, maxLat, category, subcategory) {
        const query = this.geoLocationRepository
            .createQueryBuilder('location')
            .leftJoinAndSelect('location.dataSource', 'dataSource')
            .where(`ST_Within(location.location, ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326))`, {
            minLon,
            minLat,
            maxLon,
            maxLat
        });
        if (category) {
            query.andWhere('location.category = :category', { category });
        }
        if (subcategory) {
            query.andWhere('location.subcategory = :subcategory', { subcategory });
        }
        return query.getMany();
    }
    async getAllLocations(category, subcategory) {
        const query = this.geoLocationRepository
            .createQueryBuilder('location')
            .leftJoinAndSelect('location.dataSource', 'dataSource');
        if (category) {
            query.andWhere('location.category = :category', { category });
        }
        if (subcategory) {
            query.andWhere('location.subcategory = :subcategory', { subcategory });
        }
        return query.getMany();
    }
    async getDataSources() {
        return this.dataSourceRepository.find();
    }
    async getCategories() {
        const result = await this.geoLocationRepository
            .createQueryBuilder('location')
            .select('location.category', 'category')
            .addSelect('location.subcategory', 'subcategory')
            .groupBy('location.category')
            .addGroupBy('location.subcategory')
            .getRawMany();
        // Transform into hierarchical structure
        const categories = {};
        result.forEach(({ category, subcategory }) => {
            if (!categories[category]) {
                categories[category] = new Set();
            }
            categories[category].add(subcategory);
        });
        return Object.entries(categories).map(([category, subcategories]) => ({
            category,
            subcategories: Array.from(subcategories)
        }));
    }
}
//# sourceMappingURL=data-ingestion.js.map
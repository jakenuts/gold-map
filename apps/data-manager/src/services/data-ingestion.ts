import { AppDataSource } from '../config/database.js';
import { GeoLocation } from '../entities/GeoLocation.js';
import { DataSource as GeoDataSource } from '../entities/DataSource.js';
import { USGSMRDSClient } from './usgs-mrds-client.js';
import { USGSDepositClient } from './usgs-deposit-client.js';
import { Repository } from 'typeorm';
import { Feature } from './wfs-client.js';

export class DataIngestionService {
  private mrdsClient: USGSMRDSClient;
  private depositClient: USGSDepositClient;
  private geoLocationRepository: Repository<GeoLocation>;
  private dataSourceRepository: Repository<GeoDataSource>;

  constructor() {
    this.mrdsClient = new USGSMRDSClient();
    this.depositClient = new USGSDepositClient();
    this.geoLocationRepository = AppDataSource.getRepository(GeoLocation);
    this.dataSourceRepository = AppDataSource.getRepository(GeoDataSource);
  }

  private async ensureDataSource(name: string, description: string, url: string) {
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
    } else {
      // Update existing data source if URL has changed
      if (dataSource.url !== url) {
        console.log(`Updating data source URL for: ${name}`);
        dataSource.url = url;
        await this.dataSourceRepository.save(dataSource);
      }
    }
    
    return dataSource;
  }

  async ingestUSGSData(bbox?: string) {
    try {
      // Ensure both data sources exist
      const mrdsSource = await this.ensureDataSource(
        'USGS-MRDS',
        'USGS Mineral Resources Data System',
        'https://mrdata.usgs.gov/services/wfs/mrds'
      );

      const depositSource = await this.ensureDataSource(
        'USGS-Deposit',
        'USGS Mineral Deposit Database',
        'https://mrdata.usgs.gov/services/deposit'
      );

      console.log('Data sources configured:', {
        mrds: mrdsSource.id,
        deposit: depositSource.id
      });

      // Fetch data from both sources sequentially for better error handling
      console.log('Fetching MRDS data...');
      let mrdsFeatures: Feature[] = [];
      try {
        mrdsFeatures = await this.mrdsClient.getFeatures(bbox);
        console.log(`Successfully fetched ${mrdsFeatures.length} MRDS features`);
      } catch (error) {
        console.error('Error fetching MRDS data:', error);
      }

      console.log('Fetching Deposit data...');
      let depositFeatures: Feature[] = [];
      try {
        depositFeatures = await this.depositClient.getFeatures(bbox);
        console.log(`Successfully fetched ${depositFeatures.length} Deposit features`);
      } catch (error) {
        console.error('Error fetching Deposit data:', error);
      }

      if (mrdsFeatures.length === 0 && depositFeatures.length === 0) {
        throw new Error('No features retrieved from either USGS source');
      }

      // Clear existing data for both sources
      console.log('Clearing existing USGS data...');
      await Promise.all([
        this.geoLocationRepository.delete({ dataSourceId: mrdsSource.id }),
        this.geoLocationRepository.delete({ dataSourceId: depositSource.id })
      ]);
      console.log('Cleared existing USGS data');

      // Transform and prepare locations for both sources
      console.log('Transforming features...');
      const locations = [
        ...this.prepareLocations(mrdsFeatures, this.mrdsClient, mrdsSource.id),
        ...this.prepareLocations(depositFeatures, this.depositClient, depositSource.id)
      ];

      if (locations.length === 0) {
        throw new Error('No valid locations after transformation');
      }

      // Save all locations
      console.log('Saving locations to database...');
      const savedLocations = await this.geoLocationRepository.save(locations);
      
      console.log('Successfully saved locations:', {
        total: savedLocations.length,
        mrds: mrdsFeatures.length,
        deposit: depositFeatures.length
      });

      return savedLocations;
    } catch (error) {
      console.error('Error during data ingestion:', error);
      throw error;
    }
  }

  private prepareLocations(
    features: Feature[],
    client: USGSMRDSClient | USGSDepositClient,
    dataSourceId: string
  ) {
    return features.map(feature => {
      const transformed = client.transformToGeoLocation(feature);
      return this.geoLocationRepository.create({
        ...transformed,
        dataSourceId
      });
    });
  }

  async getLocationsInBoundingBox(minLon: number, minLat: number, maxLon: number, maxLat: number, category?: string, subcategory?: string) {
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

  async getAllLocations(category?: string, subcategory?: string) {
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
    const categories: Record<string, Set<string>> = {};
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

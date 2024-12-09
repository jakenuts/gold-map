import { AppDataSource } from '../config/database.js';
import { GeoLocation } from '../entities/GeoLocation.js';
import { USGSClient, USGSFeature } from './usgs-client.js';
import { Repository } from 'typeorm';

export class DataIngestionService {
  private usgsClient: USGSClient;
  private geoLocationRepository: Repository<GeoLocation>;

  constructor() {
    this.usgsClient = new USGSClient();
    this.geoLocationRepository = AppDataSource.getRepository(GeoLocation);
  }

  async ingestUSGSData(bbox?: string) {
    try {
      const features = await this.usgsClient.getMineralDeposits(bbox);
      console.log('Fetched', features.length, 'features from USGS');

      // Clear existing USGS mineral deposit data
      await this.geoLocationRepository.delete({ 
        locationType: 'mineral_deposit',
        source: 'USGS'
      });
      console.log('Cleared existing USGS mineral deposits');

      // Transform and save new data
      const locations = features.map((feature: USGSFeature) => {
        const mineralDeposit = this.usgsClient.transformToMineralDeposit(feature);
        return this.geoLocationRepository.create({
          name: mineralDeposit.name,
          locationType: 'mineral_deposit',
          location: mineralDeposit.location,
          properties: {
            ...mineralDeposit.properties,
            depositType: mineralDeposit.depositType,
            commodities: mineralDeposit.commodities
          },
          source: 'USGS',
          sourceId: mineralDeposit.sourceId
        });
      });

      const savedLocations = await this.geoLocationRepository.save(locations);
      console.log('Successfully saved', savedLocations.length, 'locations to database');

      return savedLocations;
    } catch (error) {
      console.error('Error during data ingestion:', error);
      throw error;
    }
  }

  async getAllLocations(type?: string) {
    if (type) {
      return this.geoLocationRepository.find({
        where: { locationType: type }
      });
    }
    return this.geoLocationRepository.find();
  }

  async getLocationsInBoundingBox(minLon: number, minLat: number, maxLon: number, maxLat: number, type?: string) {
    const query = this.geoLocationRepository
      .createQueryBuilder('location')
      .where(`ST_Within(location.location, ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326))`, {
        minLon,
        minLat,
        maxLon,
        maxLat
      });

    if (type) {
      query.andWhere('location.locationType = :type', { type });
    }

    return query.getMany();
  }
}

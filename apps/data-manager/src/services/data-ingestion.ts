import { AppDataSource } from '../config/database.js';
import { MineralDeposit } from '../entities/MineralDeposit.js';
import { USGSClient, USGSFeature } from './usgs-client.js';
import { Repository } from 'typeorm';

export class DataIngestionService {
  private usgsClient: USGSClient;
  private mineralDepositRepository: Repository<MineralDeposit>;

  constructor() {
    this.usgsClient = new USGSClient();
    this.mineralDepositRepository = AppDataSource.getRepository(MineralDeposit);
  }

  async ingestUSGSData(bbox?: string) {
    try {
      const features = await this.usgsClient.getMineralDeposits(bbox);
      console.log('Fetched', features.length, 'features from USGS');

      // Clear existing data
      await this.mineralDepositRepository.clear();
      console.log('Cleared existing mineral deposits');

      // Transform and save new data
      const deposits = features.map((feature: USGSFeature) => 
        this.mineralDepositRepository.create(
          this.usgsClient.transformToMineralDeposit(feature)
        )
      );

      const savedDeposits = await this.mineralDepositRepository.save(deposits);
      console.log('Successfully saved', savedDeposits.length, 'mineral deposits to database');

      return savedDeposits;
    } catch (error) {
      console.error('Error during data ingestion:', error);
      throw error;
    }
  }

  async getAllDeposits() {
    return this.mineralDepositRepository.find();
  }

  async getDepositsInBoundingBox(minLon: number, minLat: number, maxLon: number, maxLat: number) {
    return this.mineralDepositRepository
      .createQueryBuilder('deposit')
      .where(`ST_Within(deposit.location, ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326))`, {
        minLon,
        minLat,
        maxLon,
        maxLat
      })
      .getMany();
  }
}

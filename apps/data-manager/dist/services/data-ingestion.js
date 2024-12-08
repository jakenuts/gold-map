import { AppDataSource } from '../config/database';
import { MineralDeposit } from '../entities/MineralDeposit';
import { USGSClient } from './usgs-client';
export class DataIngestionService {
    usgsClient;
    mineralDepositRepository;
    constructor() {
        this.usgsClient = new USGSClient();
        this.mineralDepositRepository = AppDataSource.getRepository(MineralDeposit);
    }
    async ingestUSGSData(bbox) {
        try {
            const features = await this.usgsClient.getMineralDeposits(bbox);
            console.log('Fetched', features.length, 'features from USGS');
            // Clear existing data
            await this.mineralDepositRepository.clear();
            console.log('Cleared existing mineral deposits');
            // Transform and save new data
            const deposits = features.map(feature => this.mineralDepositRepository.create(this.usgsClient.transformToMineralDeposit(feature)));
            await this.mineralDepositRepository.save(deposits);
            console.log('Successfully saved', deposits.length, 'mineral deposits to database');
            return deposits;
        }
        catch (error) {
            console.error('Error during data ingestion:', error);
            throw error;
        }
    }
    async getAllDeposits() {
        return this.mineralDepositRepository.find();
    }
    async getDepositsInBoundingBox(minLon, minLat, maxLon, maxLat) {
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
//# sourceMappingURL=data-ingestion.js.map
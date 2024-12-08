import { MineralDeposit } from '../entities/MineralDeposit.js';
export declare class DataIngestionService {
    private usgsClient;
    private mineralDepositRepository;
    constructor();
    ingestUSGSData(bbox?: string): Promise<MineralDeposit[]>;
    getAllDeposits(): Promise<MineralDeposit[]>;
    getDepositsInBoundingBox(minLon: number, minLat: number, maxLon: number, maxLat: number): Promise<MineralDeposit[]>;
}

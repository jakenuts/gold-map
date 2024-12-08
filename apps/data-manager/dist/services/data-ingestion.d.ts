export declare class DataIngestionService {
    private usgsClient;
    private mineralDepositRepository;
    constructor();
    ingestUSGSData(bbox?: string): Promise<any>;
    getAllDeposits(): Promise<any>;
    getDepositsInBoundingBox(minLon: number, minLat: number, maxLon: number, maxLat: number): Promise<any>;
}

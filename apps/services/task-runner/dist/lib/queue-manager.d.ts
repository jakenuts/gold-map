import Bull from 'bull';
import { DataSourceConfig, JobConfig } from '@gold-map/core';
interface QueueOptions {
    redis: {
        host: string;
        port: number;
        password?: string;
    };
    prefix?: string;
}
export declare class QueueManager {
    private queues;
    private options;
    constructor(options: QueueOptions);
    createQueue(name: string, config: JobConfig): Promise<Bull.Queue>;
    private processJob;
    getQueue(name: string): Promise<Bull.Queue | undefined>;
    getQueueStatus(name: string): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    }>;
    addJob(name: string, data: DataSourceConfig): Promise<Bull.Job>;
    scheduleJob(name: string, data: DataSourceConfig, cron: string): Promise<Bull.Job>;
    shutdown(): Promise<void>;
}
export {};
//# sourceMappingURL=queue-manager.d.ts.map
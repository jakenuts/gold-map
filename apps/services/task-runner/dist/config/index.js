import dotenv from 'dotenv';
import { pino } from 'pino';
// Load environment variables
dotenv.config();
// Configuration constants
export const CONFIG = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
    },
    server: {
        port: parseInt(process.env.PORT || '3001', 10),
        host: process.env.HOST || 'localhost',
    },
    queues: {
        // Prefix for all queue names
        prefix: 'gold-map',
        // Default settings for all queues
        settings: {
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: 100, // Keep last 100 completed jobs
                removeOnFail: 1000, // Keep last 1000 failed jobs
            },
        },
    },
    storage: {
        // PostgreSQL connection settings
        postgres: {
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            database: process.env.POSTGRES_DB || 'goldmap',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD,
        },
    },
};
// Logger configuration
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
        },
    },
});
// Queue names
export const QUEUE_NAMES = {
    DATA_COLLECTION: `${CONFIG.queues.prefix}:data-collection`,
    DATA_PROCESSING: `${CONFIG.queues.prefix}:data-processing`,
    SYSTEM_MAINTENANCE: `${CONFIG.queues.prefix}:system-maintenance`,
};
// Job types
export const JOB_TYPES = {
    // Data collection jobs
    FETCH_USGS_MRDS: 'fetch-usgs-mrds',
    FETCH_BLM_CLAIMS: 'fetch-blm-claims',
    // Data processing jobs
    PROCESS_GEOJSON: 'process-geojson',
    UPDATE_SPATIAL_INDEX: 'update-spatial-index',
    // System maintenance jobs
    CLEANUP_OLD_DATA: 'cleanup-old-data',
    OPTIMIZE_INDEXES: 'optimize-indexes',
};
// Validation
if (!CONFIG.storage.postgres.password) {
    throw new Error('PostgreSQL password is required');
}
//# sourceMappingURL=index.js.map
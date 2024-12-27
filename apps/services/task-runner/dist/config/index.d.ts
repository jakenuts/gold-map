export declare const CONFIG: {
    readonly redis: {
        readonly host: string;
        readonly port: number;
        readonly password: string | undefined;
    };
    readonly server: {
        readonly port: number;
        readonly host: string;
    };
    readonly queues: {
        readonly prefix: "gold-map";
        readonly settings: {
            readonly defaultJobOptions: {
                readonly attempts: 3;
                readonly backoff: {
                    readonly type: "exponential";
                    readonly delay: 1000;
                };
                readonly removeOnComplete: 100;
                readonly removeOnFail: 1000;
            };
        };
    };
    readonly storage: {
        readonly postgres: {
            readonly host: string;
            readonly port: number;
            readonly database: string;
            readonly user: string;
            readonly password: string | undefined;
        };
    };
};
export declare const logger: import("pino").Logger<never>;
export declare const QUEUE_NAMES: {
    readonly DATA_COLLECTION: "gold-map:data-collection";
    readonly DATA_PROCESSING: "gold-map:data-processing";
    readonly SYSTEM_MAINTENANCE: "gold-map:system-maintenance";
};
export declare const JOB_TYPES: {
    readonly FETCH_USGS_MRDS: "fetch-usgs-mrds";
    readonly FETCH_BLM_CLAIMS: "fetch-blm-claims";
    readonly PROCESS_GEOJSON: "process-geojson";
    readonly UPDATE_SPATIAL_INDEX: "update-spatial-index";
    readonly CLEANUP_OLD_DATA: "cleanup-old-data";
    readonly OPTIMIZE_INDEXES: "optimize-indexes";
};
export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
export type JobType = typeof JOB_TYPES[keyof typeof JOB_TYPES];
//# sourceMappingURL=index.d.ts.map
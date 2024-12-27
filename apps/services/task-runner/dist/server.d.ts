import { QueueManager } from './lib/queue-manager';
export declare class Server {
    private app;
    private queueManager;
    constructor(queueManager: QueueManager);
    private setupMiddleware;
    private setupRoutes;
    start(port: number): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map
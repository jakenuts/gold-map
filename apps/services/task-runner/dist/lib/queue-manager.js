import Bull from 'bull';
import { createClient } from '@gold-map/data-sources';
export class QueueManager {
    constructor(options) {
        this.queues = new Map();
        this.options = options;
    }
    async createQueue(name, config) {
        if (this.queues.has(name)) {
            return this.queues.get(name);
        }
        const queue = new Bull(name, {
            redis: this.options.redis,
            prefix: this.options.prefix
        });
        queue.process(async (job) => {
            const result = await this.processJob(job.data);
            return result;
        });
        this.queues.set(name, queue);
        return queue;
    }
    async processJob(data) {
        try {
            const client = createClient(data);
            const result = await client.fetchData();
            return {
                success: true,
                duration: 0, // TODO: Track duration
                itemsProcessed: Array.isArray(result) ? result.length : 1
            };
        }
        catch (error) {
            return {
                success: false,
                duration: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getQueue(name) {
        return this.queues.get(name);
    }
    async getQueueStatus(name) {
        const queue = await this.getQueue(name);
        if (!queue) {
            throw new Error(`Queue ${name} not found`);
        }
        const [waiting, active, completed, failed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount()
        ]);
        return { waiting, active, completed, failed };
    }
    async addJob(name, data) {
        const queue = await this.getQueue(name);
        if (!queue) {
            throw new Error(`Queue ${name} not found`);
        }
        return queue.add(data);
    }
    async scheduleJob(name, data, cron) {
        const queue = await this.getQueue(name);
        if (!queue) {
            throw new Error(`Queue ${name} not found`);
        }
        return queue.add(data, {
            repeat: { cron }
        });
    }
    async shutdown() {
        const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
        await Promise.all(closePromises);
        this.queues.clear();
    }
}
//# sourceMappingURL=queue-manager.js.map
import Bull from 'bull';
import { DataSourceConfig, JobConfig, JobResult } from '@gold-map/core';
import { createClient } from '@gold-map/data-sources';

interface QueueOptions {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  prefix?: string;
}

export class QueueManager {
  private queues: Map<string, Bull.Queue>;
  private options: QueueOptions;

  constructor(options: QueueOptions) {
    this.queues = new Map();
    this.options = options;
  }

  async createQueue(name: string, config: JobConfig): Promise<Bull.Queue> {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
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

  private async processJob(data: DataSourceConfig): Promise<JobResult> {
    try {
      const client = createClient(data);
      const result = await client.fetchData();
      
      return {
        success: true,
        duration: 0, // TODO: Track duration
        itemsProcessed: Array.isArray(result) ? result.length : 1
      };
    } catch (error) {
      return {
        success: false,
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getQueue(name: string): Promise<Bull.Queue | undefined> {
    return this.queues.get(name);
  }

  async getQueueStatus(name: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
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

  async addJob(name: string, data: DataSourceConfig): Promise<Bull.Job> {
    const queue = await this.getQueue(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }

    return queue.add(data);
  }

  async scheduleJob(name: string, data: DataSourceConfig, cron: string): Promise<Bull.Job> {
    const queue = await this.getQueue(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }

    return queue.add(data, {
      repeat: { cron }
    });
  }

  async shutdown(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    this.queues.clear();
  }
}

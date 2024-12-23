import Bull, { Queue, Job } from 'bull';
import { DataSourceConfig } from '@gold-map/core';
import { createClient } from '@gold-map/data-sources';
import { CONFIG, QUEUE_NAMES, JOB_TYPES, logger } from '../config';
import IORedis from 'ioredis';
import {
  DataCollectionJobData,
  DataProcessingJobData,
  SystemMaintenanceJobData,
  TimedJobResult,
  JobData,
} from '../types';

type JobProcessor = (job: Job<JobData>) => Promise<TimedJobResult>;

export class QueueManager {
  private queues: Map<string, Queue>;
  private redis: IORedis;

  constructor() {
    this.queues = new Map();
    this.redis = new IORedis({
      host: CONFIG.redis.host,
      port: CONFIG.redis.port,
      password: CONFIG.redis.password,
    });

    // Initialize queues
    this.initializeQueues();
  }

  private initializeQueues() {
    // Data Collection Queue
    this.createQueue(QUEUE_NAMES.DATA_COLLECTION, this.createJobProcessor<DataCollectionJobData>(
      async (job, startTime) => {
        const { type, config } = job.data;
        logger.info({ jobId: job.id, type }, 'Processing data collection job');

        switch (type) {
          case JOB_TYPES.FETCH_USGS_MRDS:
          case JOB_TYPES.FETCH_BLM_CLAIMS: {
            const client = createClient(config);
            const result = await client.fetchData(config);
            return {
              success: true,
              itemsProcessed: result.features.length,
              metadata: {
                source: config.type,
                featureCount: result.features.length,
              },
            };
          }
          default:
            throw new Error(`Unsupported job type: ${type}`);
        }
      }
    ));

    // Data Processing Queue
    this.createQueue(QUEUE_NAMES.DATA_PROCESSING, this.createJobProcessor<DataProcessingJobData>(
      async (job, startTime) => {
        const { type, data } = job.data;
        logger.info({ jobId: job.id, type }, 'Processing data processing job');

        switch (type) {
          case JOB_TYPES.PROCESS_GEOJSON:
            // TODO: Implement GeoJSON processing
            return { success: true };
          case JOB_TYPES.UPDATE_SPATIAL_INDEX:
            // TODO: Implement spatial index update
            return { success: true };
          default:
            throw new Error(`Unsupported job type: ${type}`);
        }
      }
    ));

    // System Maintenance Queue
    this.createQueue(QUEUE_NAMES.SYSTEM_MAINTENANCE, this.createJobProcessor<SystemMaintenanceJobData>(
      async (job, startTime) => {
        const { type } = job.data;
        logger.info({ jobId: job.id, type }, 'Processing system maintenance job');

        switch (type) {
          case JOB_TYPES.CLEANUP_OLD_DATA:
            // TODO: Implement data cleanup
            return { success: true };
          case JOB_TYPES.OPTIMIZE_INDEXES:
            // TODO: Implement index optimization
            return { success: true };
          default:
            throw new Error(`Unsupported job type: ${type}`);
        }
      }
    ));
  }

  private createJobProcessor<T extends JobData>(
    processor: (job: Job<T>, startTime: Date) => Promise<Partial<TimedJobResult>>
  ): JobProcessor {
    return async (job: Job<JobData>) => {
      const startTime = new Date();
      try {
        const result = await processor(job as Job<T>, startTime);
        const endTime = new Date();
        return {
          ...result,
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        } as TimedJobResult;
      } catch (error) {
        const endTime = new Date();
        logger.error({ jobId: job.id, error }, 'Job processing failed');
        throw error;
      }
    };
  }

  private createQueue(name: string, processor: Bull.ProcessCallbackFunction<any>) {
    const queue = new Bull(name, {
      redis: {
        host: CONFIG.redis.host,
        port: CONFIG.redis.port,
        password: CONFIG.redis.password,
      },
      defaultJobOptions: CONFIG.queues.settings.defaultJobOptions,
    });

    // Set up event handlers
    queue.on('error', (error) => {
      logger.error({ queueName: name, error }, 'Queue error occurred');
    });

    queue.on('failed', (job, error) => {
      logger.error(
        { jobId: job.id, queueName: name, error },
        'Job processing failed'
      );
    });

    queue.on('completed', (job) => {
      logger.info(
        { jobId: job.id, queueName: name },
        'Job completed successfully'
      );
    });

    // Add processor
    queue.process(processor);

    // Store queue reference
    this.queues.set(name, queue);

    return queue;
  }

  async addJob(
    queueName: string,
    type: string,
    data: any,
    options?: Bull.JobOptions
  ): Promise<Job<any>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    return queue.add(
      { type, ...data },
      {
        ...CONFIG.queues.settings.defaultJobOptions,
        ...options,
      }
    );
  }

  async scheduleJob(
    queueName: string,
    type: string,
    data: any,
    cron: string
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    await queue.add(
      { type, ...data },
      {
        repeat: { cron },
        ...CONFIG.queues.settings.defaultJobOptions,
      }
    );

    logger.info(
      { queueName, type, cron },
      'Successfully scheduled recurring job'
    );
  }

  async getQueueStatus(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const [active, waiting, completed, failed] = await Promise.all([
      queue.getActive(),
      queue.getWaiting(),
      queue.getCompleted(),
      queue.getFailed(),
    ]);

    return {
      active: active.length,
      waiting: waiting.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down queue manager');
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close())
    );
    await this.redis.quit();
  }
}

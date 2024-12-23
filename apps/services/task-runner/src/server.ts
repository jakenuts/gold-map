import express from 'express';
import { QueueManager } from './lib/queue-manager';
import { CONFIG, QUEUE_NAMES, JOB_TYPES, logger } from './config';
import { DataCollectionJobData, JobSchedule } from './types';

export class TaskRunnerServer {
  private app: express.Application;
  private queueManager: QueueManager;

  constructor() {
    this.app = express();
    this.queueManager = new QueueManager();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    this.app.use((req, _res, next) => {
      logger.info({ method: req.method, path: req.path }, 'Incoming request');
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok' });
    });

    // Queue status
    this.app.get('/api/queues/:name/status', async (req, res) => {
      try {
        const status = await this.queueManager.getQueueStatus(req.params.name);
        res.json(status);
      } catch (error) {
        logger.error({ error }, 'Failed to get queue status');
        res.status(500).json({ error: 'Failed to get queue status' });
      }
    });

    // Add job
    this.app.post('/api/jobs', async (req, res) => {
      try {
        const { queueName, type, data, options } = req.body;
        const job = await this.queueManager.addJob(queueName, type, data, options);
        res.json({ jobId: job.id });
      } catch (error) {
        logger.error({ error }, 'Failed to add job');
        res.status(500).json({ error: 'Failed to add job' });
      }
    });

    // Schedule job
    this.app.post('/api/schedules', async (req, res) => {
      try {
        const schedule: JobSchedule = req.body;
        if (!schedule.enabled) {
          res.status(400).json({ error: 'Schedule must be enabled' });
          return;
        }

        await this.queueManager.scheduleJob(
          schedule.queueName,
          schedule.jobType,
          schedule.data,
          schedule.cron
        );

        res.json({ message: 'Job scheduled successfully' });
      } catch (error) {
        logger.error({ error }, 'Failed to schedule job');
        res.status(500).json({ error: 'Failed to schedule job' });
      }
    });

    // Schedule data collection
    this.app.post('/api/data-collection/schedule', async (req, res) => {
      try {
        const { type, config, cron } = req.body;
        const jobData: DataCollectionJobData = {
          type,
          config,
        };

        await this.queueManager.scheduleJob(
          QUEUE_NAMES.DATA_COLLECTION,
          type,
          jobData,
          cron
        );

        res.json({ message: 'Data collection scheduled successfully' });
      } catch (error) {
        logger.error({ error }, 'Failed to schedule data collection');
        res.status(500).json({ error: 'Failed to schedule data collection' });
      }
    });

    // Error handler
    this.app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error({ error: err }, 'Unhandled error');
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  async start(): Promise<void> {
    // Schedule default system maintenance jobs
    await this.scheduleDefaultJobs();

    // Start server
    this.app.listen(CONFIG.server.port, CONFIG.server.host, () => {
      logger.info(
        { port: CONFIG.server.port, host: CONFIG.server.host },
        'Task runner server started'
      );
    });
  }

  private async scheduleDefaultJobs(): Promise<void> {
    try {
      // Schedule daily data cleanup
      await this.queueManager.scheduleJob(
        QUEUE_NAMES.SYSTEM_MAINTENANCE,
        JOB_TYPES.CLEANUP_OLD_DATA,
        { options: { dryRun: false } },
        '0 0 * * *' // Every day at midnight
      );

      // Schedule weekly index optimization
      await this.queueManager.scheduleJob(
        QUEUE_NAMES.SYSTEM_MAINTENANCE,
        JOB_TYPES.OPTIMIZE_INDEXES,
        { options: { force: false } },
        '0 0 * * 0' // Every Sunday at midnight
      );

      logger.info('Default system maintenance jobs scheduled');
    } catch (error) {
      logger.error({ error }, 'Failed to schedule default jobs');
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    await this.queueManager.shutdown();
    logger.info('Task runner server shut down');
  }
}

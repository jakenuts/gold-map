import express from 'express';
import { DataSourceConfig, JobConfig } from '@gold-map/core';
import { QueueManager } from './lib/queue-manager';

export class Server {
  private app: express.Application;
  private queueManager: QueueManager;

  constructor(queueManager: QueueManager) {
    this.app = express();
    this.queueManager = queueManager;

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (_, res) => {
      res.json({ status: 'ok' });
    });

    // Queue status
    this.app.get('/api/queues/:name/status', async (req, res) => {
      try {
        const status = await this.queueManager.getQueueStatus(req.params.name);
        res.json(status);
      } catch (error) {
        res.status(404).json({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Add job
    this.app.post('/api/queues/:name/jobs', async (req, res) => {
      try {
        const job = await this.queueManager.addJob(
          req.params.name,
          req.body as DataSourceConfig
        );
        res.json({ id: job.id });
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Schedule job
    this.app.post('/api/queues/:name/schedule', async (req, res) => {
      try {
        const { cron, ...config } = req.body;
        const job = await this.queueManager.scheduleJob(
          req.params.name,
          config as DataSourceConfig,
          cron
        );
        res.json({ id: job.id });
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Create queue
    this.app.post('/api/queues', async (req, res) => {
      try {
        const queue = await this.queueManager.createQueue(
          req.body.name,
          req.body as JobConfig
        );
        res.json({ name: queue.name });
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  async start(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    await this.queueManager.shutdown();
  }
}

import { DataSourceConfig, DataSourceType, JobResult } from '@gold-map/core';
import { QueueName, JobType } from '../config';

/**
 * Data Collection Job Data
 */
export interface DataCollectionJobData {
  type: JobType;
  config: DataSourceConfig;
  startTime?: Date;
}

/**
 * Data Processing Job Data
 */
export interface DataProcessingJobData {
  type: JobType;
  data: {
    sourceType: DataSourceType;
    features: any[];
    metadata?: Record<string, unknown>;
  };
}

/**
 * System Maintenance Job Data
 */
export interface SystemMaintenanceJobData {
  type: JobType;
  options?: {
    dryRun?: boolean;
    force?: boolean;
    [key: string]: unknown;
  };
}

/**
 * Job Data Union Type
 */
export type JobData =
  | DataCollectionJobData
  | DataProcessingJobData
  | SystemMaintenanceJobData;

/**
 * Extended Job Result with timing information
 */
export interface TimedJobResult extends JobResult {
  duration: number;
  startTime: Date;
  endTime: Date;
}

/**
 * Queue Status
 */
export interface QueueStatus {
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed?: number;
  paused?: boolean;
}

/**
 * Job Schedule Configuration
 */
export interface JobSchedule {
  queueName: QueueName;
  jobType: JobType;
  data: JobData;
  cron: string;
  enabled: boolean;
  description?: string;
}

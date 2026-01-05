export interface VercelCronConfig {
  crons: CronJob[];
}

export interface CronJob {
  path: string;
  schedule: string;
}

export interface CronRunnerOptions {
  /**
   * Base URL of your Next.js application
   * @example "http://localhost:3000"
   */
  baseUrl: string;

  /**
   * Secret token for authenticating cron requests
   * Should match CRON_SECRET environment variable in your Next.js app
   */
  cronSecret?: string;

  /**
   * Path to vercel.json configuration file
   * @default "./vercel.json"
   */
  configPath?: string;

  /**
   * Enable verbose logging
   * 0 = no verbose, 1 = simple verbose, 2 = extended verbose (includes response body and full error details)
   * @default 0
   */
  verbose?: number;

  /**
   * Filter crons by path pattern
   * @example "/api/crons/notifications/*"
   */
  filter?: string;

  /**
   * Custom fetch implementation (useful for testing)
   */
  fetch?: typeof fetch;
}

export interface CronExecutionResult {
  path: string;
  schedule: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  timestamp: Date;
  duration?: number;
}

export interface CronRunnerStats {
  totalJobs: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecution?: Date;
}

import * as fs from "fs";
import * as cron from "node-cron";
import * as path from "path";
import {
  CronExecutionResult,
  CronJob,
  CronRunnerOptions,
  CronRunnerStats,
  VercelCronConfig,
} from "./types";

export class CronRunner {
  private options: Required<Omit<CronRunnerOptions, "filter" | "fetch">> &
    Pick<CronRunnerOptions, "filter" | "fetch">;
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private stats: CronRunnerStats = {
    totalJobs: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
  };
  private config?: VercelCronConfig;

  constructor(options: CronRunnerOptions) {
    this.options = {
      baseUrl: options.baseUrl,
      cronSecret: options.cronSecret || process.env.CRON_SECRET || "",
      configPath: options.configPath || "./vercel.json",
      verbose: options.verbose ?? 0,
      filter: options.filter,
      fetch: options.fetch,
    };

    this.validateOptions();
  }

  private validateOptions(): void {
    if (!this.options.baseUrl) {
      throw new Error("baseUrl is required");
    }

    try {
      new URL(this.options.baseUrl);
    } catch {
      throw new Error("baseUrl must be a valid URL");
    }
  }

  private loadConfig(): VercelCronConfig {
    const configPath = path.resolve(this.options.configPath);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    try {
      const content = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(content) as VercelCronConfig;

      if (!config.crons || !Array.isArray(config.crons)) {
        throw new Error('Invalid vercel.json: missing "crons" array');
      }

      return config;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in ${configPath}: ${error.message}`);
      }
      throw error;
    }
  }

  private filterJobs(jobs: CronJob[]): CronJob[] {
    if (!this.options.filter) {
      return jobs;
    }

    const pattern = this.options.filter.replace(/\*/g, ".*");
    const regex = new RegExp(`^${pattern}$`);

    return jobs.filter((job) => regex.test(job.path));
  }

  private async executeCron(job: CronJob): Promise<CronExecutionResult> {
    const startTime = Date.now();
    const url = `${this.options.baseUrl}${job.path}`;
    const timestamp = new Date();

    this.log(`Executing cron: ${job.path}`);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.options.cronSecret) {
        headers["Authorization"] = `Bearer ${this.options.cronSecret}`;
      }

      const fetchFn = this.options.fetch || fetch;
      const response = await fetchFn(url, {
        method: "GET",
        headers,
      });

      const duration = Date.now() - startTime;
      const success = response.ok;

      let responseBody: string | undefined;
      if (this.options.verbose >= 2) {
        try {
          const contentType = response.headers.get("content-type") || "";
          const contentLength = response.headers.get("content-length");
          const maxBodySize = 1024 * 10;

          if (!contentLength || parseInt(contentLength, 10) <= maxBodySize) {
            const clonedResponse = response.clone();
            const text = await clonedResponse.text();
            if (text.length <= maxBodySize) {
              responseBody = text;
            } else {
              responseBody = `${text.substring(0, maxBodySize)}... [truncated, total length: ${text.length}]`;
            }
          } else {
            responseBody = `[Response body too large: ${contentLength} bytes, max: ${maxBodySize} bytes]`;
          }
        } catch (bodyError) {
          responseBody = `[Unable to read response body: ${bodyError instanceof Error ? bodyError.message : "Unknown error"}]`;
        }
      }

      if (success) {
        this.stats.successfulExecutions++;
        this.log(`✓ Success: ${job.path} (${response.status}) - ${duration}ms`);
        if (this.options.verbose >= 2 && responseBody) {
          this.log(`  Response body: ${responseBody}`, false);
        }
      } else {
        this.stats.failedExecutions++;
        this.log(
          `✗ Failed: ${job.path} (${response.status}) - ${duration}ms`,
          true,
        );
        if (this.options.verbose >= 2 && responseBody) {
          this.log(`  Response body: ${responseBody}`, true);
        }
      }

      this.stats.lastExecution = timestamp;

      return {
        path: job.path,
        schedule: job.schedule,
        success,
        statusCode: response.status,
        timestamp,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.failedExecutions++;

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.log(`✗ Error: ${job.path} - ${errorMessage}`, true);

      if (this.options.verbose >= 2) {
        const errorDetails =
          error instanceof Error
            ? `  Error name: ${error.name}\n  Error message: ${error.message}\n  Error stack: ${error.stack || "N/A"}`
            : `  Error: ${String(error)}`;
        this.log(errorDetails, true);
      }

      return {
        path: job.path,
        schedule: job.schedule,
        success: false,
        error: errorMessage,
        timestamp,
        duration,
      };
    }
  }

  private validateCronSchedule(schedule: string): boolean {
    return cron.validate(schedule);
  }

  private log(message: string, isError = false): void {
    if (this.options.verbose === 0 && !isError) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}]`;

    if (isError) {
      console.error(`${prefix} ${message}`);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Start the cron runner
   */
  public async start(): Promise<void> {
    this.config = this.loadConfig();
    const jobs = this.filterJobs(this.config.crons);

    if (jobs.length === 0) {
      throw new Error("No cron jobs found matching the filter");
    }

    this.stats.totalJobs = jobs.length;

    this.log(`Starting ${jobs.length} cron job(s)...`);

    for (const job of jobs) {
      if (!this.validateCronSchedule(job.schedule)) {
        throw new Error(
          `Invalid cron schedule for ${job.path}: ${job.schedule}`,
        );
      }

      const task = cron.schedule(job.schedule, async () => {
        await this.executeCron(job);
      });

      this.tasks.set(job.path, task);
      this.log(`Scheduled: ${job.path} (${job.schedule})`);
    }

    this.log("All cron jobs started successfully");
  }

  /**
   * Stop the cron runner
   */
  public stop(): void {
    this.log("Stopping all cron jobs...");

    for (const [path, task] of this.tasks.entries()) {
      task.stop();
      this.log(`Stopped: ${path}`);
    }

    this.tasks.clear();
    this.log("All cron jobs stopped");
  }

  /**
   * Execute all crons once immediately
   */
  public async executeAll(): Promise<CronExecutionResult[]> {
    this.config = this.loadConfig();
    const jobs = this.filterJobs(this.config.crons);

    if (jobs.length === 0) {
      throw new Error("No cron jobs found matching the filter");
    }

    this.log(`Executing ${jobs.length} cron job(s) once...`);

    const results: CronExecutionResult[] = [];

    for (const job of jobs) {
      const result = await this.executeCron(job);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a specific cron job once
   */
  public async executeOne(path: string): Promise<CronExecutionResult> {
    this.config = this.loadConfig();
    const job = this.config.crons.find((j) => j.path === path);

    if (!job) {
      throw new Error(`Cron job not found: ${path}`);
    }

    return this.executeCron(job);
  }

  /**
   * Get current statistics
   */
  public getStats(): CronRunnerStats {
    return { ...this.stats };
  }

  /**
   * Get list of configured cron jobs
   */
  public listJobs(): CronJob[] {
    if (!this.config) {
      this.config = this.loadConfig();
    }

    return this.filterJobs(this.config.crons);
  }
}

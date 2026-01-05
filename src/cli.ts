#!/usr/bin/env node

import { CronRunner } from "./runner";

interface CliArgs {
  url?: string;
  secret?: string;
  config?: string;
  verbose?: number;
  filter?: string;
  once?: boolean;
  list?: boolean;
  execute?: string;
  help?: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {};
  const argv = process.argv.slice(2);
  let verboseCount = 0;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case "--url":
      case "-u":
        args.url = argv[++i];
        break;
      case "--secret":
      case "-s":
        args.secret = argv[++i];
        break;
      case "--config":
      case "-c":
        args.config = argv[++i];
        break;
      case "--verbose":
        verboseCount++;
        break;
      case "-v":
        verboseCount++;
        break;
      case "-vv":
        verboseCount = 2;
        break;
      case "--filter":
      case "-f":
        args.filter = argv[++i];
        break;
      case "--once":
      case "-o":
        args.once = true;
        break;
      case "--list":
      case "-l":
        args.list = true;
        break;
      case "--execute":
      case "-e":
        args.execute = argv[++i];
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        if (!arg.startsWith("-")) {
          args.url = arg;
        }
    }
  }

  if (verboseCount > 0) {
    args.verbose = Math.min(verboseCount, 2);
  }

  return args;
}

function printHelp(): void {
  console.log(`
nextjs-crons - Run Next.js Vercel cron jobs locally

Usage:
  nextjs-crons [options] [url]

Options:
  -u, --url <url>          Base URL of your Next.js app (required)
  -s, --secret <secret>    Cron secret token (or use CRON_SECRET env var)
  -c, --config <path>      Path to vercel.json (default: ./vercel.json)
  -v, --verbose            Enable verbose logging (simple)
  -vv                      Enable extended verbose logging (includes response body and error details)
  -f, --filter <pattern>   Filter crons by path pattern (supports *)
  -o, --once               Execute all crons once and exit
  -l, --list               List all configured cron jobs and exit
  -e, --execute <path>     Execute a specific cron job once and exit
  -h, --help               Show this help message

Examples:
  # Start all crons in watch mode
  nextjs-crons --url http://localhost:3000

  # Execute all crons once
  nextjs-crons --url http://localhost:3000 --once

  # Filter specific crons
  nextjs-crons --url http://localhost:3000 --filter "/api/crons/notifications/*"

  # Execute a specific cron
  nextjs-crons --url http://localhost:3000 --execute "/api/crons/update-exchange-rates"

  # List all configured crons
  nextjs-crons --list

Environment Variables:
  CRON_SECRET              Secret token for cron authentication
  `);
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // List mode doesn't require URL
  if (args.list) {
    try {
      const runner = new CronRunner({
        baseUrl: "http://localhost:3000", // Dummy URL for list mode
        configPath: args.config,
        verbose: args.verbose,
        filter: args.filter,
      });

      const jobs = runner.listJobs();

      console.log(`\nFound ${jobs.length} cron job(s):\n`);

      for (const job of jobs) {
        console.log(`  ${job.path}`);
        console.log(`    Schedule: ${job.schedule}`);
        console.log("");
      }

      process.exit(0);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  if (!args.url) {
    console.error("Error: --url is required\n");
    printHelp();
    process.exit(1);
  }

  try {
    const runner = new CronRunner({
      baseUrl: args.url,
      cronSecret: args.secret,
      configPath: args.config,
      verbose: args.verbose,
      filter: args.filter,
    });

    // Execute specific cron
    if (args.execute) {
      console.log(`Executing cron: ${args.execute}`);
      const result = await runner.executeOne(args.execute);

      if (result.success) {
        console.log(`✓ Success (${result.statusCode}) - ${result.duration}ms`);
        process.exit(0);
      } else {
        console.error(
          `✗ Failed: ${result.error || `Status ${result.statusCode}`}`
        );
        process.exit(1);
      }
    }

    // Execute all crons once
    if (args.once) {
      const results = await runner.executeAll();
      const stats = runner.getStats();

      console.log(`\nExecution completed:`);
      console.log(`  Total: ${results.length}`);
      console.log(`  Success: ${stats.successfulExecutions}`);
      console.log(`  Failed: ${stats.failedExecutions}`);

      process.exit(stats.failedExecutions > 0 ? 1 : 0);
    }

    // Start in watch mode
    await runner.start();

    console.log("\nCron runner is active. Press Ctrl+C to stop.\n");

    // Graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n\nShutting down...");
      runner.stop();

      const stats = runner.getStats();
      console.log("\nFinal statistics:");
      console.log(`  Total jobs: ${stats.totalJobs}`);
      console.log(`  Successful executions: ${stats.successfulExecutions}`);
      console.log(`  Failed executions: ${stats.failedExecutions}`);

      process.exit(0);
    });

    process.on("SIGTERM", () => {
      runner.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

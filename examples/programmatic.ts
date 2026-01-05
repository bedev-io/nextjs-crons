import { CronRunner } from "nextjs-crons";

async function main() {
  // Example 1: Basic usage - start all crons
  const runner = new CronRunner({
    baseUrl: "http://localhost:3000",
    cronSecret: process.env.CRON_SECRET,
    verbose: true,
  });

  await runner.start();

  console.log("Cron runner started. Press Ctrl+C to stop.");

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nStopping cron runner...");
    runner.stop();

    const stats = runner.getStats();
    console.log("Final stats:", stats);

    process.exit(0);
  });
}

// Example 2: Execute all crons once
async function executeOnce() {
  const runner = new CronRunner({
    baseUrl: "http://localhost:3000",
    cronSecret: process.env.CRON_SECRET,
  });

  const results = await runner.executeAll();

  console.log("Execution results:");
  results.forEach((result) => {
    console.log(
      `${result.path}: ${result.success ? "✓" : "✗"} (${result.duration}ms)`
    );
  });

  const stats = runner.getStats();
  console.log("\nStats:", stats);
}

// Example 3: Execute specific cron
async function executeSpecific() {
  const runner = new CronRunner({
    baseUrl: "http://localhost:3000",
    cronSecret: process.env.CRON_SECRET,
  });

  const result = await runner.executeOne("/api/crons/update-exchange-rates");

  if (result.success) {
    console.log("✓ Cron executed successfully");
  } else {
    console.error("✗ Cron failed:", result.error);
  }
}

// Example 4: Filter crons
async function filterCrons() {
  const runner = new CronRunner({
    baseUrl: "http://localhost:3000",
    cronSecret: process.env.CRON_SECRET,
    filter: "/api/crons/notifications/*",
    verbose: true,
  });

  await runner.start();
  console.log("Running only notification crons...");
}

// Example 5: List all configured crons
async function listCrons() {
  const runner = new CronRunner({
    baseUrl: "http://localhost:3000",
  });

  const jobs = runner.listJobs();

  console.log("Configured cron jobs:");
  jobs.forEach((job) => {
    console.log(`  ${job.path}`);
    console.log(`    Schedule: ${job.schedule}`);
  });
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main, executeOnce, executeSpecific, filterCrons, listCrons };

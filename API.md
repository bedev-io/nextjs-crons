# API Documentation

Complete API reference for `nextjs-crons`.

## Table of Contents

- [CronRunner Class](#cronrunner-class)
- [Types](#types)
- [CLI Commands](#cli-commands)

## CronRunner Class

### Constructor

```typescript
new CronRunner(options: CronRunnerOptions)
```

Creates a new instance of CronRunner.

#### Parameters

| Parameter    | Type           | Required | Default                   | Description                                 |
| ------------ | -------------- | -------- | ------------------------- | ------------------------------------------- |
| `baseUrl`    | `string`       | Yes      | -                         | Base URL of your Next.js application        |
| `cronSecret` | `string`       | No       | `process.env.CRON_SECRET` | Secret token for authentication             |
| `configPath` | `string`       | No       | `'./vercel.json'`         | Path to vercel.json configuration           |
| `verbose`    | `boolean`      | No       | `false`                   | Enable verbose logging                      |
| `filter`     | `string`       | No       | -                         | Filter crons by path pattern (supports `*`) |
| `fetch`      | `typeof fetch` | No       | `global.fetch`            | Custom fetch implementation                 |

#### Example

```typescript
const runner = new CronRunner({
  baseUrl: "http://localhost:3000",
  cronSecret: "my-secret",
  verbose: true,
  filter: "/api/crons/notifications/*",
});
```

#### Throws

- `Error` - If `baseUrl` is missing or invalid

---

### Methods

#### `start()`

Starts all configured cron jobs in watch mode.

```typescript
async start(): Promise<void>
```

**Example:**

```typescript
await runner.start();
console.log("Crons are now running...");
```

**Throws:**

- `Error` - If config file is not found or invalid
- `Error` - If no cron jobs match the filter
- `Error` - If any cron schedule is invalid

---

#### `stop()`

Stops all running cron jobs.

```typescript
stop(): void
```

**Example:**

```typescript
runner.stop();
console.log("All crons stopped");
```

---

#### `executeAll()`

Executes all configured cron jobs once immediately.

```typescript
async executeAll(): Promise<CronExecutionResult[]>
```

**Returns:** Array of execution results

**Example:**

```typescript
const results = await runner.executeAll();

results.forEach((result) => {
  if (result.success) {
    console.log(`✓ ${result.path} - ${result.duration}ms`);
  } else {
    console.error(`✗ ${result.path} - ${result.error}`);
  }
});
```

**Throws:**

- `Error` - If no cron jobs match the filter

---

#### `executeOne()`

Executes a specific cron job once immediately.

```typescript
async executeOne(path: string): Promise<CronExecutionResult>
```

**Parameters:**

- `path` - The path of the cron job to execute

**Returns:** Execution result

**Example:**

```typescript
const result = await runner.executeOne("/api/crons/daily-report");

if (result.success) {
  console.log("Cron executed successfully");
} else {
  console.error("Cron failed:", result.error);
}
```

**Throws:**

- `Error` - If cron job with specified path is not found

---

#### `getStats()`

Returns current execution statistics.

```typescript
getStats(): CronRunnerStats
```

**Returns:** Statistics object

**Example:**

```typescript
const stats = runner.getStats();

console.log(`Total jobs: ${stats.totalJobs}`);
console.log(`Successful: ${stats.successfulExecutions}`);
console.log(`Failed: ${stats.failedExecutions}`);
console.log(`Last execution: ${stats.lastExecution}`);
```

---

#### `listJobs()`

Returns list of all configured cron jobs.

```typescript
listJobs(): CronJob[]
```

**Returns:** Array of cron jobs

**Example:**

```typescript
const jobs = runner.listJobs();

jobs.forEach((job) => {
  console.log(`${job.path} - ${job.schedule}`);
});
```

---

## Types

### `CronRunnerOptions`

Configuration options for CronRunner.

```typescript
interface CronRunnerOptions {
  baseUrl: string;
  cronSecret?: string;
  configPath?: string;
  verbose?: boolean;
  filter?: string;
  fetch?: typeof fetch;
}
```

---

### `CronExecutionResult`

Result of a cron execution.

```typescript
interface CronExecutionResult {
  path: string; // Cron job path
  schedule: string; // Cron schedule expression
  success: boolean; // Whether execution was successful
  statusCode?: number; // HTTP status code
  error?: string; // Error message if failed
  timestamp: Date; // Execution timestamp
  duration?: number; // Execution duration in milliseconds
}
```

**Example:**

```typescript
{
  path: '/api/crons/daily-report',
  schedule: '0 8 * * *',
  success: true,
  statusCode: 200,
  timestamp: new Date('2025-01-05T08:00:00Z'),
  duration: 45
}
```

---

### `CronRunnerStats`

Statistics about cron executions.

```typescript
interface CronRunnerStats {
  totalJobs: number; // Total configured jobs
  successfulExecutions: number; // Number of successful executions
  failedExecutions: number; // Number of failed executions
  lastExecution?: Date; // Timestamp of last execution
}
```

---

### `CronJob`

Represents a configured cron job.

```typescript
interface CronJob {
  path: string; // API route path
  schedule: string; // Cron schedule expression
}
```

---

### `VercelCronConfig`

Structure of vercel.json cron configuration.

```typescript
interface VercelCronConfig {
  crons: CronJob[];
}
```

---

## CLI Commands

### Basic Usage

```bash
nextjs-crons [options] [url]
```

### Options

| Option      | Alias | Type      | Description                           |
| ----------- | ----- | --------- | ------------------------------------- |
| `--url`     | `-u`  | `string`  | Base URL (required for most commands) |
| `--secret`  | `-s`  | `string`  | Cron secret token                     |
| `--config`  | `-c`  | `string`  | Path to vercel.json                   |
| `--verbose` | `-v`  | `boolean` | Enable verbose logging                |
| `--filter`  | `-f`  | `string`  | Filter by path pattern                |
| `--once`    | `-o`  | `boolean` | Execute all once and exit             |
| `--list`    | `-l`  | `boolean` | List all crons and exit               |
| `--execute` | `-e`  | `string`  | Execute specific cron and exit        |
| `--help`    | `-h`  | `boolean` | Show help message                     |

### Examples

#### Start in watch mode

```bash
nextjs-crons --url http://localhost:3000
```

#### Execute once with verbose logging

```bash
nextjs-crons --url http://localhost:3000 --once --verbose
```

#### Filter specific crons

```bash
nextjs-crons \
  --url http://localhost:3000 \
  --filter "/api/crons/notifications/*"
```

#### Execute specific cron

```bash
nextjs-crons \
  --url http://localhost:3000 \
  --execute "/api/crons/daily-report"
```

#### List all configured crons

```bash
nextjs-crons --list
```

---

## Error Handling

### Common Errors

#### `baseUrl is required`

**Cause:** Missing or empty `baseUrl` parameter

**Solution:** Provide a valid URL

```typescript
new CronRunner({ baseUrl: "http://localhost:3000" });
```

---

#### `baseUrl must be a valid URL`

**Cause:** Invalid URL format

**Solution:** Ensure URL includes protocol

```typescript
// ✗ Wrong
new CronRunner({ baseUrl: "localhost:3000" });

// ✓ Correct
new CronRunner({ baseUrl: "http://localhost:3000" });
```

---

#### `Config file not found`

**Cause:** `vercel.json` doesn't exist at specified path

**Solution:** Create the file or specify correct path

```typescript
new CronRunner({
  baseUrl: "http://localhost:3000",
  configPath: "./config/vercel.json",
});
```

---

#### `Invalid vercel.json: missing "crons" array`

**Cause:** Config file doesn't have required structure

**Solution:** Ensure file has `crons` array

```json
{
  "crons": [{ "path": "/api/crons/example", "schedule": "* * * * *" }]
}
```

---

#### `No cron jobs found matching the filter`

**Cause:** Filter pattern doesn't match any crons

**Solution:** Check filter pattern or remove filter

```typescript
// Check what's available first
const jobs = runner.listJobs();
console.log(jobs);
```

---

#### `Invalid cron schedule`

**Cause:** Cron schedule expression is malformed

**Solution:** Use valid cron syntax (5 fields)

```json
{
  "crons": [
    // ✗ Wrong (6 fields)
    { "path": "/api/crons/example", "schedule": "0 0 * * * *" },

    // ✓ Correct (5 fields)
    { "path": "/api/crons/example", "schedule": "0 0 * * *" }
  ]
}
```

---

#### `Cron job not found`

**Cause:** Attempting to execute non-existent cron

**Solution:** Verify path exists in config

```typescript
// List available jobs first
const jobs = runner.listJobs();
console.log(jobs.map((j) => j.path));

// Then execute the correct one
await runner.executeOne("/api/crons/existing-job");
```

---

## Advanced Usage

### Custom Fetch Implementation

Useful for testing or adding middleware:

```typescript
const customFetch = async (url: string, init?: RequestInit) => {
  console.log(`Calling: ${url}`);
  const response = await fetch(url, init);
  console.log(`Response: ${response.status}`);
  return response;
};

const runner = new CronRunner({
  baseUrl: "http://localhost:3000",
  fetch: customFetch,
});
```

### Graceful Shutdown

Handle process signals properly:

```typescript
const runner = new CronRunner({
  baseUrl: "http://localhost:3000",
});

await runner.start();

process.on("SIGINT", () => {
  console.log("Shutting down...");
  runner.stop();

  const stats = runner.getStats();
  console.log("Final stats:", stats);

  process.exit(0);
});
```

### Monitoring and Alerting

Track failures and send alerts:

```typescript
const results = await runner.executeAll();
const failures = results.filter((r) => !r.success);

if (failures.length > 0) {
  // Send alert
  await sendAlert({
    message: `${failures.length} crons failed`,
    failures: failures.map((f) => f.path),
  });
}
```

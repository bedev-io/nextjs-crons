# nextjs-crons

A lightweight CLI and library to run Next.js Vercel cron jobs locally or in any environment.

## Features

- ✅ **Zero config** - Reads directly from your `vercel.json`
- 🔒 **Secure** - Supports `CRON_SECRET` authentication
- 🎯 **Flexible** - Use as CLI or programmatically in your code
- 🧪 **Testable** - Fully tested with 80%+ coverage
- 📦 **Lightweight** - Minimal dependencies (only `node-cron`)
- 🔍 **Filtering** - Run specific crons with pattern matching
- 📊 **Stats** - Track execution success/failure rates

## Installation

```bash
# As a dev dependency in your Next.js project
npm install --save-dev @bedev.io/nextjs-crons

# Or globally (recommended)
npm install -g @bedev.io/nextjs-crons
```

## Usage

### CLI Mode

```bash
# Start all crons in watch mode
nextjs-crons --url http://localhost:3000

# Execute all crons once
nextjs-crons --url http://localhost:3000 --once

# With authentication
nextjs-crons --url http://localhost:3000 --secret your-cron-secret

# Filter specific crons
nextjs-crons --url http://localhost:3000 --filter "/api/crons/notifications/*"

# Execute a specific cron once
nextjs-crons --url http://localhost:3000 --execute "/api/crons/notify-happy-birthday"

# List all configured crons
nextjs-crons --list

# Verbose logging (simple)
nextjs-crons --url http://localhost:3000 --verbose

# Verbose logging (extended)
nextjs-crons --url http://localhost:3000 -vv
```

### Programmatic Usage

```typescript
import { CronRunner } from "nextjs-crons";

// Basic usage
const runner = new CronRunner({
  baseUrl: "http://localhost:3000",
  cronSecret: process.env.CRON_SECRET,
});

// Start all crons
await runner.start();

// Stop all crons
runner.stop();

// Execute all crons once
const results = await runner.executeAll();
console.log(results);

// Execute a specific cron
const result = await runner.executeOne("/api/crons/notify-happy-birthday");
console.log(result);

// Get statistics
const stats = runner.getStats();
console.log(stats);

// List configured jobs
const jobs = runner.listJobs();
console.log(jobs);
```

### Advanced Options

```typescript
const runner = new CronRunner({
  // Required: Base URL of your Next.js application
  baseUrl: "http://localhost:3000",

  // Optional: Secret for cron authentication
  // Defaults to process.env.CRON_SECRET
  cronSecret: "your-secret",

  // Optional: Path to vercel.json
  // Defaults to './vercel.json'
  configPath: "./vercel.json",

  // Optional: Enable verbose logging
  // Defaults to false
  verbose: true,

  // Optional: Filter crons by path pattern
  // Supports wildcards (*)
  filter: "/api/crons/notifications/*",
});
```

## Configuration

Create a `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/crons/daily-report",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/crons/every-5-minutes",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Cron Schedule Format

Follows standard cron syntax:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 or 7 is Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

Examples:

- `* * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 8 * * *` - Every day at 8:00 AM
- `0 0 * * 0` - Every Sunday at midnight

## Authentication

Your Next.js cron endpoints should validate the `CRON_SECRET`:

```typescript
// app/api/crons/example/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Your cron logic here
  console.log("Cron executed!");

  return NextResponse.json({ success: true });
}
```

## CLI Options

| Option               | Alias | Description                             |
| -------------------- | ----- | --------------------------------------- |
| `--url <url>`        | `-u`  | Base URL of your Next.js app (required) |
| `--secret <secret>`  | `-s`  | Cron secret token                       |
| `--config <path>`    | `-c`  | Path to vercel.json                     |
| `--verbose`          | `-v`  | Enable verbose logging                  |
| `--filter <pattern>` | `-f`  | Filter crons by path pattern            |
| `--once`             | `-o`  | Execute all crons once and exit         |
| `--list`             | `-l`  | List all configured crons               |
| `--execute <path>`   | `-e`  | Execute a specific cron once            |
| `--help`             | `-h`  | Show help message                       |

## API Reference

### `CronRunner`

#### Constructor

```typescript
new CronRunner(options: CronRunnerOptions)
```

#### Methods

- `start(): Promise<void>` - Start all cron jobs in watch mode
- `stop(): void` - Stop all running cron jobs
- `executeAll(): Promise<CronExecutionResult[]>` - Execute all crons once
- `executeOne(path: string): Promise<CronExecutionResult>` - Execute a specific cron
- `getStats(): CronRunnerStats` - Get execution statistics
- `listJobs(): CronJob[]` - Get list of configured cron jobs

#### Types

```typescript
interface CronRunnerOptions {
  baseUrl: string;
  cronSecret?: string;
  configPath?: string;
  verbose?: boolean;
  filter?: string;
}

interface CronExecutionResult {
  path: string;
  schedule: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  timestamp: Date;
  duration?: number;
}

interface CronRunnerStats {
  totalJobs: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecution?: Date;
}
```

## Use Cases

### Local Development

Run crons while developing:

```bash
# In one terminal
npm run dev

# In another terminal
npx nextjs-crons --url http://localhost:3000 --verbose
```

### Testing

Execute crons manually during testing:

```typescript
import { CronRunner } from "nextjs-crons";

describe("Cron jobs", () => {
  it("should send daily report", async () => {
    const runner = new CronRunner({
      baseUrl: "http://localhost:3000",
    });

    const result = await runner.executeOne("/api/crons/daily-report");
    expect(result.success).toBe(true);
  });
});
```

### CI/CD

Run crons as part of your deployment pipeline:

```yaml
# .github/workflows/test.yml
- name: Test crons
  run: |
    npm run dev &
    npx nextjs-crons --url http://localhost:3000 --once
```

### Self-Hosted Environments

Run crons in environments without Vercel:

```bash
# Docker, VPS, or any server
nextjs-crons --url http://your-app.com --secret $CRON_SECRET
```

## Integration with package.json

Add scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "crons": "nextjs-crons --url http://localhost:3000",
    "crons:once": "nextjs-crons --url http://localhost:3000 --once",
    "crons:list": "nextjs-crons --list"
  }
}
```

Then run:

```bash
npm run crons
```

## Troubleshooting

### Crons not executing

1. Ensure your Next.js app is running
2. Check that `vercel.json` exists and is valid JSON
3. Verify the cron paths are correct
4. Enable verbose logging: `--verbose`

### Authentication errors

1. Set `CRON_SECRET` environment variable
2. Or pass `--secret` flag
3. Ensure your API routes validate the secret

### Invalid cron schedule

Verify your schedule follows cron syntax. Use tools like [crontab.guru](https://crontab.guru/) to validate.

## Contributing

Contributions are welcome! Please open an issue or submit a PR.

## License

MIT

## Credits

Built with:

- [node-cron](https://github.com/node-cron/node-cron) - Cron scheduling

---

Made with ❤️ for the Next.js community

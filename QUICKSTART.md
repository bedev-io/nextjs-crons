# Quick Start Guide

Get up and running with `nextjs-crons` in 5 minutes!

## Installation

```bash
npm install --save-dev nextjs-crons
```

## Step 1: Configure your cron jobs

Create a `vercel.json` file in your project root:

```json
{
  "crons": [
    {
      "path": "/api/crons/daily-report",
      "schedule": "0 8 * * *"
    }
  ]
}
```

## Step 2: Create your cron endpoint

Create `app/api/crons/daily-report/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Your logic here
  console.log("Daily report sent!");

  return NextResponse.json({ success: true });
}
```

## Step 3: Set your environment variable

Create `.env.local`:

```env
CRON_SECRET=your-secret-token-here
```

## Step 4: Run your crons locally

### Option A: Using CLI

```bash
# Start your Next.js dev server
npm run dev

# In another terminal, run the cron runner
npx nextjs-crons --url http://localhost:3000 --verbose
```

### Option B: Using npm scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "crons": "nextjs-crons --url http://localhost:3000"
  }
}
```

Then run:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run crons
```

## Step 5: Test your cron

Execute once to test:

```bash
npx nextjs-crons \
  --url http://localhost:3000 \
  --execute "/api/crons/daily-report" \
  --verbose
```

You should see:

```
✓ Success: /api/crons/daily-report (200) - 45ms
```

## Common Use Cases

### Development

```bash
# Run all crons in watch mode
npx nextjs-crons --url http://localhost:3000 --verbose
```

### Testing

```bash
# Execute all crons once
npx nextjs-crons --url http://localhost:3000 --once
```

### Production (Docker)

```dockerfile
FROM node:20-alpine
RUN npm install -g nextjs-crons
COPY vercel.json .
CMD ["nextjs-crons", "--url", "$BASE_URL", "--secret", "$CRON_SECRET"]
```

## Next Steps

- Read the full [README.md](./README.md) for advanced options
- Check out [examples](./examples/) for more use cases
- Learn about [programmatic usage](./examples/programmatic.ts)

## Troubleshooting

### Crons not executing?

1. Ensure Next.js is running on the specified URL
2. Check that `vercel.json` exists and is valid
3. Verify your cron paths are correct
4. Add `--verbose` flag to see detailed logs

### Getting 401 Unauthorized?

1. Set `CRON_SECRET` environment variable
2. Pass `--secret` flag to CLI
3. Ensure your API route validates the token correctly

### Need help?

Open an issue on GitHub with:

- Your `vercel.json` configuration
- CLI command you're running
- Error messages
- Next.js version

// Example Next.js API route for cron jobs
// File: app/api/crons/example/route.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * Validates the cron secret from the request headers
 */
function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace("Bearer ", "");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.warn("CRON_SECRET is not set in environment variables");
    return false;
  }

  return token === expectedSecret;
}

/**
 * Example cron job endpoint
 * This endpoint will be called by nextjs-crons
 */
export async function GET(request: NextRequest) {
  // Validate cron secret
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Your cron job logic here
    console.log("Cron job executed at:", new Date().toISOString());

    // Example: Send notifications
    // await sendNotifications();

    // Example: Update database
    // await updateDatabase();

    // Example: Call external API
    // await callExternalAPI();

    return NextResponse.json({
      success: true,
      message: "Cron job completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Example with POST method
export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Process the request body if needed
    console.log("Received data:", body);

    return NextResponse.json({
      success: true,
      data: body,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

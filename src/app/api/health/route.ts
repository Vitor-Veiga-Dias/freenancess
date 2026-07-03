import { NextResponse } from "next/server";

import { prisma } from "@/infrastructure/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      service: "freenances",
      database: "connected",
      timestamp,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database connection failed";

    return NextResponse.json(
      {
        status: "degraded",
        service: "freenances",
        database: "disconnected",
        error: message,
        timestamp,
      },
      { status: 503 },
    );
  }
}

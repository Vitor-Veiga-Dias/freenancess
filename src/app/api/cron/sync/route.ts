import { NextResponse } from "next/server";

import { syncAllConnections } from "@/application/use-cases/sync-orchestrator";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncAllConnections();

  return NextResponse.json({
    ok: true,
    ...result,
    syncedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  return GET(request);
}

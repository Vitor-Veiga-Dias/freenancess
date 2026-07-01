import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "freenances",
    timestamp: new Date().toISOString(),
  });
}

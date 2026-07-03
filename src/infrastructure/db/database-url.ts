const DEFAULT_CONNECTION_LIMIT = "3";
const BUILD_TIME_DATABASE_URL =
  "postgresql://build:build@127.0.0.1:5432/build?connection_limit=1&pool_timeout=10";

function isBuildTimeWithoutDatabase(): boolean {
  if (process.env.DATABASE_URL) {
    return false;
  }

  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}

export function resolveDatabaseUrl(
  rawUrl = process.env.DATABASE_URL,
  connectionLimit = process.env.DATABASE_CONNECTION_LIMIT ?? DEFAULT_CONNECTION_LIMIT,
): string {
  if (!rawUrl) {
    if (isBuildTimeWithoutDatabase()) {
      return BUILD_TIME_DATABASE_URL;
    }

    throw new Error("DATABASE_URL is not set");
  }

  const url = new URL(rawUrl);

  if (!url.searchParams.has("connection_limit")) {
    url.searchParams.set("connection_limit", connectionLimit);
  }

  if (!url.searchParams.has("pool_timeout")) {
    url.searchParams.set("pool_timeout", "10");
  }

  return url.toString();
}

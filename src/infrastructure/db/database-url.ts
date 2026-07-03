const DEFAULT_CONNECTION_LIMIT = "3";

export function resolveDatabaseUrl(
  rawUrl = process.env.DATABASE_URL,
  connectionLimit = process.env.DATABASE_CONNECTION_LIMIT ?? DEFAULT_CONNECTION_LIMIT,
): string {
  if (!rawUrl) {
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

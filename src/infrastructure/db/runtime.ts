export type FreenancesRuntime = "web" | "desktop";

export const DESKTOP_APP_PORT = 3847;
export const DESKTOP_APP_URL = `http://localhost:${DESKTOP_APP_PORT}`;

export function getRuntime(): FreenancesRuntime {
  return process.env.FREENANCES_RUNTIME === "desktop" ? "desktop" : "web";
}

export function isDesktopRuntime(): boolean {
  return getRuntime() === "desktop";
}

function normalizeOrigin(value: string): string {
  return value.replace(/\/$/, "");
}

export function resolvePublicAppUrl(): string {
  if (isDesktopRuntime()) {
    return normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL ?? DESKTOP_APP_URL);
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  }

  if (process.env.BETTER_AUTH_URL) {
    return normalizeOrigin(process.env.BETTER_AUTH_URL);
  }

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (railwayDomain) {
    return `https://${railwayDomain}`;
  }

  return "http://localhost:3000";
}

export function getAppBaseUrl(): string {
  return resolvePublicAppUrl();
}

export function getTrustedOrigins(): string[] {
  const origins = new Set<string>([
    "http://localhost:3000",
    "http://localhost:3001",
    DESKTOP_APP_URL,
  ]);

  for (const value of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
    process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : null,
  ]) {
    if (value) {
      origins.add(normalizeOrigin(value));
    }
  }

  return [...origins];
}

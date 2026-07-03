export type FreenancesRuntime = "web" | "desktop";

export const DESKTOP_APP_PORT = 3847;
export const DESKTOP_APP_URL = `http://localhost:${DESKTOP_APP_PORT}`;

export function getRuntime(): FreenancesRuntime {
  return process.env.FREENANCES_RUNTIME === "desktop" ? "desktop" : "web";
}

export function isDesktopRuntime(): boolean {
  return getRuntime() === "desktop";
}

export function getAppBaseUrl(): string {
  if (isDesktopRuntime()) {
    return process.env.NEXT_PUBLIC_APP_URL ?? DESKTOP_APP_URL;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

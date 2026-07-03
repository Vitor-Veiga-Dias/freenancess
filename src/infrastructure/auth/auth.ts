import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import {
  DESKTOP_APP_URL,
  getAppBaseUrl,
} from "@/infrastructure/db/runtime";
import { prisma } from "@/infrastructure/db/prisma";

function getTrustedOrigins(): string[] {
  const origins = new Set(
    [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.BETTER_AUTH_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      DESKTOP_APP_URL,
    ].filter((origin): origin is string => Boolean(origin)),
  );

  return [...origins];
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? getAppBaseUrl(),
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: getTrustedOrigins(),
});

export type AuthSession = typeof auth.$Infer.Session;

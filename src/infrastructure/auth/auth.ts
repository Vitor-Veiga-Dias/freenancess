import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@/infrastructure/db/prisma";
import {
  getAppBaseUrl,
  getTrustedOrigins,
} from "@/infrastructure/db/runtime";

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

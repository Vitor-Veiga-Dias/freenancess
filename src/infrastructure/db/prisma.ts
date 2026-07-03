import { PrismaClient } from "@prisma/client";

import { resolveDatabaseUrl } from "@/infrastructure/db/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: resolveDatabaseUrl(),
      },
    },
  });

globalForPrisma.prisma = prisma;

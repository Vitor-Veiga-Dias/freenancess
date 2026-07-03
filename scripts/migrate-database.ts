import { spawnSync } from "node:child_process";

import { PrismaClient as PostgresClient } from "@prisma/client";
import { PrismaClient as SqliteClient } from "../src/generated/prisma-sqlite";

import { loadProjectEnv, maskDatabaseUrl } from "./load-env.mjs";

loadProjectEnv();

const DEFAULT_SQLITE_SOURCE = "file:./data/desktop/freenances.db";

type SourceClient = PostgresClient | SqliteClient;

function resolveTargetUrl(): string {
  const target =
    process.env.TARGET_DATABASE_URL ??
    process.env.DATABASE_PUBLIC_URL ??
    process.env.DATABASE_URL;

  if (!target || target.includes("${{")) {
    throw new Error(
      "Set TARGET_DATABASE_URL to the Railway Postgres public URL (Connect → Public Network). " +
        "Template variables like ${{RAILWAY_TCP_PROXY_DOMAIN}} are not resolved outside Railway.",
    );
  }

  return target;
}

function resolveSourceUrl(): string {
  const source =
    process.env.SOURCE_DATABASE_URL ??
    process.env.SOURCE_SQLITE_URL ??
    process.env.AIVEN_DATABASE_URL;

  if (!source || source.includes("${{")) {
    throw new Error(
      "Set SOURCE_DATABASE_URL to your Aiven connection string (with ?sslmode=require).",
    );
  }

  return source;
}

function isSqliteUrl(url: string): boolean {
  return url.startsWith("file:");
}

function createSourceClient(url: string): SourceClient {
  if (isSqliteUrl(url)) {
    return new SqliteClient({
      datasources: { db: { url } },
    });
  }

  return new PostgresClient({
    datasources: { db: { url } },
  });
}

function pushSchemaToTarget(targetUrl: string): void {
  console.log("Applying Prisma schema to target database...");

  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
    {
      env: { ...process.env, DATABASE_URL: targetUrl },
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  if (result.status !== 0) {
    throw new Error("Failed to apply schema on target database.");
  }
}

function scopesToPostgres(scopes: unknown): string[] {
  if (Array.isArray(scopes)) {
    return scopes.filter((scope): scope is string => typeof scope === "string");
  }

  if (typeof scopes === "string") {
    try {
      return scopesToPostgres(JSON.parse(scopes) as unknown);
    } catch {
      return scopes
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean);
    }
  }

  return [];
}

async function clearTargetDatabase(target: PostgresClient): Promise<void> {
  await target.flowAllocation.deleteMany();
  await target.transaction.deleteMany();
  await target.bankAccount.deleteMany();
  await target.bankConnection.deleteMany();
  await target.manualEntry.deleteMany();
  await target.categoryBudget.deleteMany();
  await target.intent.deleteMany();
  await target.domainEvent.deleteMany();
  await target.simulation.deleteMany();
  await target.financialContext.deleteMany();
  await target.session.deleteMany();
  await target.account.deleteMany();
  await target.verification.deleteMany();
  await target.user.deleteMany();
}

async function migrate(): Promise<void> {
  const sourceUrl = resolveSourceUrl();
  const targetUrl = resolveTargetUrl();

  console.log(
    `Source: ${isSqliteUrl(sourceUrl) ? sourceUrl : maskDatabaseUrl(sourceUrl)}`,
  );
  console.log(`Target: ${maskDatabaseUrl(targetUrl)}`);

  pushSchemaToTarget(targetUrl);

  const source = createSourceClient(sourceUrl);
  const target = new PostgresClient({
    datasources: { db: { url: targetUrl } },
  });

  try {
    await source.$connect();
    await target.$connect();

    await clearTargetDatabase(target);

    const users = await source.user.findMany();
    for (const user of users) {
      await target.user.create({ data: user });
    }
    console.log(`Users: ${users.length}`);

    const sessions = await source.session.findMany();
    for (const session of sessions) {
      await target.session.create({ data: session });
    }
    console.log(`Sessions: ${sessions.length}`);

    const accounts = await source.account.findMany();
    for (const account of accounts) {
      await target.account.create({ data: account });
    }
    console.log(`Accounts: ${accounts.length}`);

    const verifications = await source.verification.findMany();
    for (const verification of verifications) {
      await target.verification.create({ data: verification });
    }
    console.log(`Verifications: ${verifications.length}`);

    const contexts = await source.financialContext.findMany();
    for (const context of contexts) {
      await target.financialContext.create({ data: context });
    }
    console.log(`Financial contexts: ${contexts.length}`);

    const connections = await source.bankConnection.findMany();
    for (const connection of connections) {
      await target.bankConnection.create({
        data: {
          id: connection.id,
          userId: connection.userId,
          contextId: connection.contextId,
          providerItemId: connection.providerItemId,
          institutionName: connection.institutionName,
          status: connection.status,
          scopes: scopesToPostgres(connection.scopes),
          consentExpiresAt: connection.consentExpiresAt,
          lastSyncedAt: connection.lastSyncedAt,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
        },
      });
    }
    console.log(`Bank connections: ${connections.length}`);

    const bankAccounts = await source.bankAccount.findMany();
    for (const bankAccount of bankAccounts) {
      await target.bankAccount.create({ data: bankAccount });
    }
    console.log(`Bank accounts: ${bankAccounts.length}`);

    const transactions = await source.transaction.findMany();
    for (const transaction of transactions) {
      await target.transaction.create({ data: transaction });
    }
    console.log(`Transactions: ${transactions.length}`);

    const flowAllocations = await source.flowAllocation.findMany();
    for (const allocation of flowAllocations) {
      await target.flowAllocation.create({ data: allocation });
    }
    console.log(`Flow allocations: ${flowAllocations.length}`);

    const intents = await source.intent.findMany();
    for (const intent of intents) {
      await target.intent.create({ data: intent });
    }
    console.log(`Intents: ${intents.length}`);

    const domainEvents = await source.domainEvent.findMany();
    for (const event of domainEvents) {
      await target.domainEvent.create({ data: event });
    }
    console.log(`Domain events: ${domainEvents.length}`);

    const simulations = await source.simulation.findMany();
    for (const simulation of simulations) {
      await target.simulation.create({ data: simulation });
    }
    console.log(`Simulations: ${simulations.length}`);

    const manualEntries = await source.manualEntry.findMany();
    for (const entry of manualEntries) {
      await target.manualEntry.create({ data: entry });
    }
    console.log(`Manual entries: ${manualEntries.length}`);

    const categoryBudgets = await source.categoryBudget.findMany();
    for (const budget of categoryBudgets) {
      await target.categoryBudget.create({ data: budget });
    }
    console.log(`Category budgets: ${categoryBudgets.length}`);

    console.log("Database migration completed successfully.");
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

migrate().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});

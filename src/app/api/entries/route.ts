import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createManualEntry,
  listManualEntries,
} from "@/application/use-cases/manual-entries";
import { isValidContextType } from "@/domain/context/types";
import { roundMoney } from "@/domain/ledger/money-input";
import { getServerSession } from "@/infrastructure/auth/session";

const createSchema = z.object({
  contextType: z.string(),
  type: z.enum(["CREDIT", "DEBIT"]),
  category: z.string(),
  amount: z.number().positive(),
  description: z.string().min(1).max(200),
  postedAt: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const contextType = searchParams.get("contextType") ?? "PERSONAL";
  const month = searchParams.get("month") ?? undefined;

  if (!isValidContextType(contextType)) {
    return NextResponse.json({ error: "Invalid context type" }, { status: 400 });
  }

  const entries = await listManualEntries(
    session.user.id,
    contextType,
    month,
  );

  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json());

  if (!parsed.success || !isValidContextType(parsed.data.contextType)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const entry = await createManualEntry(session.user.id, {
      contextType: parsed.data.contextType,
      type: parsed.data.type,
      category: parsed.data.category,
      amount: roundMoney(parsed.data.amount),
      description: parsed.data.description,
      postedAt: parsed.data.postedAt
        ? new Date(parsed.data.postedAt)
        : new Date(),
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create entry";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

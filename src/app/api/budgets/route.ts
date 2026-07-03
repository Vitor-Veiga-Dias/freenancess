import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createCategoryBudget,
  listBudgetsWithProgress,
} from "@/application/use-cases/category-budgets";
import { isValidContextType } from "@/domain/context/types";
import { roundMoney } from "@/domain/ledger/money-input";
import { getServerSession } from "@/infrastructure/auth/session";

const createSchema = z.object({
  contextType: z.string(),
  category: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  limitAmount: z.number().positive(),
});

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const contextType = searchParams.get("contextType") ?? "PERSONAL";
  const month = searchParams.get("month");

  if (!isValidContextType(contextType)) {
    return NextResponse.json({ error: "Invalid context type" }, { status: 400 });
  }

  if (!month) {
    return NextResponse.json({ error: "Month is required" }, { status: 400 });
  }

  const budgets = await listBudgetsWithProgress(
    session.user.id,
    contextType,
    month,
  );

  return NextResponse.json({ budgets });
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
    const budget = await createCategoryBudget(session.user.id, {
      contextType: parsed.data.contextType,
      category: parsed.data.category,
      month: parsed.data.month,
      limitAmount: roundMoney(parsed.data.limitAmount),
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create budget";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

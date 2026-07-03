import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteCategoryBudget,
  updateCategoryBudget,
} from "@/application/use-cases/category-budgets";
import { isValidContextType } from "@/domain/context/types";
import { roundMoney } from "@/domain/ledger/money-input";
import { getServerSession } from "@/infrastructure/auth/session";

const updateSchema = z.object({
  contextType: z.string(),
  category: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  limitAmount: z.number().positive(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());

  if (!parsed.success || !isValidContextType(parsed.data.contextType)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const budget = await updateCategoryBudget(session.user.id, id, {
      contextType: parsed.data.contextType,
      category: parsed.data.category,
      month: parsed.data.month,
      limitAmount: roundMoney(parsed.data.limitAmount),
    });

    return NextResponse.json({ budget });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update budget";

    const status = message === "Budget not found" ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const contextType = searchParams.get("contextType") ?? "PERSONAL";

  if (!isValidContextType(contextType)) {
    return NextResponse.json({ error: "Invalid context type" }, { status: 400 });
  }

  try {
    await deleteCategoryBudget(session.user.id, contextType, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }
}

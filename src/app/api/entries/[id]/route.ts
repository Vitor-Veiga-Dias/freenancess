import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteManualEntry,
  updateManualEntry,
} from "@/application/use-cases/manual-entries";
import { isValidContextType } from "@/domain/context/types";
import { roundMoney } from "@/domain/ledger/money-input";
import { getServerSession } from "@/infrastructure/auth/session";

const updateSchema = z.object({
  contextType: z.string(),
  type: z.enum(["CREDIT", "DEBIT"]),
  category: z.string(),
  amount: z.number().positive(),
  description: z.string().min(1).max(200),
  postedAt: z.string().optional(),
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
    const entry = await updateManualEntry(session.user.id, id, {
      contextType: parsed.data.contextType,
      type: parsed.data.type,
      category: parsed.data.category,
      amount: roundMoney(parsed.data.amount),
      description: parsed.data.description,
      postedAt: parsed.data.postedAt
        ? new Date(parsed.data.postedAt)
        : new Date(),
    });

    return NextResponse.json({ entry });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update entry";

    const status = message === "Entry not found" ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteManualEntry(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
}

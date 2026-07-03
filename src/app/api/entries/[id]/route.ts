import { NextResponse } from "next/server";

import {
  deleteManualEntry,
  updateManualEntry,
} from "@/application/use-cases/manual-entries";
import { isValidContextType } from "@/domain/context/types";
import { roundMoney } from "@/domain/ledger/money-input";
import { getServerSession } from "@/infrastructure/auth/session";

import { entryFieldsSchema, parseEntryFields } from "../schema";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = entryFieldsSchema.safeParse(await request.json());

  if (!parsed.success || !isValidContextType(parsed.data.contextType)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const fields = parseEntryFields(parsed.data);
    const entry = await updateManualEntry(session.user.id, id, {
      ...fields,
      amount: roundMoney(fields.amount),
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

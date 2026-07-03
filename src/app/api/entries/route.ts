import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createManualEntry,
  listManualEntries,
} from "@/application/use-cases/manual-entries";
import { isValidContextType } from "@/domain/context/types";
import { roundMoney } from "@/domain/ledger/money-input";
import { getServerSession } from "@/infrastructure/auth/session";

import { entryFieldsSchema, parseEntryFields } from "./schema";

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const contextType = searchParams.get("contextType") ?? "PERSONAL";

  if (!isValidContextType(contextType)) {
    return NextResponse.json({ error: "Invalid context type" }, { status: 400 });
  }

  const typeParam = searchParams.get("type");
  const isRecurringParam = searchParams.get("isRecurring");
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");

  const result = await listManualEntries(session.user.id, contextType, {
    month: searchParams.get("month") ?? undefined,
    type:
      typeParam === "CREDIT" || typeParam === "DEBIT" ? typeParam : undefined,
    category: searchParams.get("category") ?? undefined,
    isRecurring:
      isRecurringParam === "true"
        ? true
        : isRecurringParam === "false"
          ? false
          : undefined,
    dateFrom: dateFromParam ? new Date(dateFromParam) : undefined,
    dateTo: dateToParam ? new Date(dateToParam) : undefined,
    page: pageParam ? Number(pageParam) : undefined,
    limit: limitParam ? Number(limitParam) : undefined,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = entryFieldsSchema.safeParse(await request.json());

  if (!parsed.success || !isValidContextType(parsed.data.contextType)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const fields = parseEntryFields(parsed.data);
    const entry = await createManualEntry(session.user.id, {
      ...fields,
      amount: roundMoney(fields.amount),
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create entry";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

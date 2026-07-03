import { NextResponse } from "next/server";
import { z } from "zod";

import { classifyTransaction } from "@/application/use-cases/classify-transaction";
import { isValidContextType } from "@/domain/context/types";
import { getServerSession } from "@/infrastructure/auth/session";

const classifySchema = z.object({
  contextType: z.string(),
  category: z.string(),
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
  const parsed = classifySchema.safeParse(await request.json());

  if (!parsed.success || !isValidContextType(parsed.data.contextType)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const transaction = await classifyTransaction(session.user.id, id, {
      contextType: parsed.data.contextType,
      category: parsed.data.category,
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to classify transaction";

    const status = message === "Transaction not found" ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

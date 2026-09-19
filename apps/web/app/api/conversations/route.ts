import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createConversation,
  listConversations,
} from "@/lib/conversation-repository";

export const runtime = "nodejs";

const createSchema = z.object({ title: z.string().trim().min(1).max(80).optional() }).strict();

export async function GET() {
  try {
    return NextResponse.json({ conversations: await listConversations() });
  } catch {
    return databaseError();
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "عنوان گفت‌وگو معتبر نیست." } },
        { status: 400 },
      );
    }
    const conversation = await createConversation(parsed.data.title);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch {
    return databaseError();
  }
}

function databaseError() {
  return NextResponse.json(
    {
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "تاریخچه در دسترس نیست؛ اتصال PostgreSQL را بررسی کنید.",
      },
    },
    { status: 503 },
  );
}

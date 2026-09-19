import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteConversation,
  getConversation,
} from "@/lib/conversation-repository";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return invalidId();
  try {
    const result = await getConversation(id);
    if (!result) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "گفت‌وگو پیدا نشد." } },
        { status: 404 },
      );
    }
    return NextResponse.json(result);
  } catch {
    return databaseError();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return invalidId();
  try {
    const deleted = await deleteConversation(id);
    return deleted
      ? new Response(null, { status: 204 })
      : NextResponse.json(
          { error: { code: "NOT_FOUND", message: "گفت‌وگو پیدا نشد." } },
          { status: 404 },
        );
  } catch {
    return databaseError();
  }
}

function invalidId() {
  return NextResponse.json(
    { error: { code: "INVALID_REQUEST", message: "شناسهٔ گفت‌وگو معتبر نیست." } },
    { status: 400 },
  );
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

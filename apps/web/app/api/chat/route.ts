import { NextResponse } from "next/server";

import { chatRequestSchema, type ChatMessage } from "@/lib/chat-schema";
import { EmptyProviderResponseError, toPublicError } from "@/lib/errors";
import { createCompletionStream } from "@/lib/llm-client";
import { encodeStreamEvent } from "@/lib/stream-protocol";

type CompletionStream = (messages: ChatMessage[]) => Promise<AsyncIterable<string>>;

export async function handleChat(
  request: Request,
  complete: CompletionStream = createCompletionStream,
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "بدنهٔ درخواست JSON معتبر نیست." } },
      { status: 400 },
    );
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "پیام‌های ارسالی معتبر نیستند." } },
      { status: 400 },
    );
  }

  try {
    const providerStream = await complete(parsed.data.messages);
    const iterator = providerStream[Symbol.asyncIterator]();
    const first = await iterator.next();
    if (first.done || !first.value) throw new EmptyProviderResponseError();

    const model = process.env.OPENAI_MODEL?.trim() ?? "";
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encodeStreamEvent({ type: "delta", delta: first.value }));
        try {
          while (true) {
            const next = await iterator.next();
            if (next.done) break;
            if (next.value) {
              controller.enqueue(encodeStreamEvent({ type: "delta", delta: next.value }));
            }
          }
          controller.enqueue(encodeStreamEvent({ type: "done", model }));
        } catch (error) {
          const safeError = toPublicError(error);
          controller.enqueue(
            encodeStreamEvent({
              type: "error",
              error: { code: safeError.code, message: safeError.message },
            }),
          );
        } finally {
          controller.close();
        }
      },
      async cancel() {
        await iterator.return?.();
      },
    });

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const safeError = toPublicError(error);
    return NextResponse.json(
      { error: { code: safeError.code, message: safeError.message } },
      { status: safeError.status },
    );
  }
}

export async function POST(request: Request) {
  return handleChat(request);
}

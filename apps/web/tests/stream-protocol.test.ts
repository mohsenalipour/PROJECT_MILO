import { describe, expect, it } from "vitest";

import { readChatStream, type ChatStreamEvent } from "@/lib/stream-protocol";

describe("readChatStream", () => {
  it("parses events split across transport chunks", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"type":"delta","delta":"Mi'));
        controller.enqueue(
          encoder.encode('lo"}\n{"type":"done","model":"gpt-4o-mini"}\n'),
        );
        controller.close();
      },
    });
    const events: ChatStreamEvent[] = [];

    await readChatStream(body, (event) => events.push(event));

    expect(events).toEqual([
      { type: "delta", delta: "Milo" },
      { type: "done", model: "gpt-4o-mini" },
    ]);
  });
});

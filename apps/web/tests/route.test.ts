import { describe, expect, it } from "vitest";

import { handleChat } from "@/app/api/chat/route";
import { readChatStream, type ChatStreamEvent } from "@/lib/stream-protocol";

function request(body: unknown): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function* chunks(...values: string[]) {
  for (const value of values) yield value;
}

describe("POST /api/chat", () => {
  it("returns 400 for an invalid body without calling the provider", async () => {
    let called = false;
    const response = await handleChat(request({ messages: [] }), async () => {
      called = true;
      return chunks("unused");
    });

    expect(response.status).toBe(400);
    expect(called).toBe(false);
  });

  it("streams provider deltas through the public protocol", async () => {
    const response = await handleChat(
      request({ messages: [{ role: "user", content: "سلام" }] }),
      async () => chunks("سلام ", "از مایلو"),
    );
    const events: ChatStreamEvent[] = [];
    await readChatStream(response.body!, (event) => events.push(event));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    expect(events.filter((event) => event.type === "delta")).toEqual([
      { type: "delta", delta: "سلام " },
      { type: "delta", delta: "از مایلو" },
    ]);
    expect(events.at(-1)?.type).toBe("done");
  });

  it("does not expose raw provider errors", async () => {
    const secret = "TEST_ROUTE_SECRET";
    const response = await handleChat(
      request({ messages: [{ role: "user", content: "سلام" }] }),
      async () => {
        throw { status: 500, message: `provider failed with ${secret}` };
      },
    );
    const body = JSON.stringify(await response.json());

    expect(response.status).toBe(502);
    expect(body).not.toContain(secret);
  });
});

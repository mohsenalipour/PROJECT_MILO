export type ChatStreamEvent =
  | { type: "delta"; delta: string }
  | { type: "done"; model: string }
  | { type: "error"; error: { code: string; message: string } };

export function encodeStreamEvent(event: ChatStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function readChatStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      onEvent(parseStreamEvent(line));
    }
    if (done) break;
  }

  if (buffer.trim()) onEvent(parseStreamEvent(buffer));
}

function parseStreamEvent(line: string): ChatStreamEvent {
  const value: unknown = JSON.parse(line);
  if (typeof value !== "object" || value === null || !("type" in value)) {
    throw new Error("Invalid stream event");
  }
  if (value.type === "delta" && "delta" in value && typeof value.delta === "string") {
    return { type: "delta", delta: value.delta };
  }
  if (value.type === "done" && "model" in value && typeof value.model === "string") {
    return { type: "done", model: value.model };
  }
  if (
    value.type === "error" &&
    "error" in value &&
    typeof value.error === "object" &&
    value.error !== null &&
    "code" in value.error &&
    "message" in value.error &&
    typeof value.error.code === "string" &&
    typeof value.error.message === "string"
  ) {
    return { type: "error", error: { code: value.error.code, message: value.error.message } };
  }
  throw new Error("Invalid stream event");
}

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatShell } from "@/components/chat-shell";
import type { ChatStreamEvent } from "@/lib/stream-protocol";

const conversation = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "سلام",
  createdAt: "2026-09-19T10:00:00.000Z",
  updatedAt: "2026-09-19T10:00:00.000Z",
};

function streamedResponse(...events: ChatStreamEvent[]) {
  return new Response(events.map((event) => `${JSON.stringify(event)}\n`).join(""), {
    status: 200,
    headers: { "Content-Type": "application/x-ndjson" },
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ChatShell", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.theme;
  });

  it("creates a conversation, streams a response and clears the current view", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/conversations" && !init?.method) {
        return jsonResponse({ conversations: [] });
      }
      if (url === "/api/conversations" && init?.method === "POST") {
        return jsonResponse({ conversation }, 201);
      }
      if (url === "/api/chat") {
        return streamedResponse(
          { type: "delta", delta: "پاسخ " },
          { type: "delta", delta: "مایلو" },
          { type: "done", model: "test-model" },
        );
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ChatShell />);

    await waitFor(() => expect(screen.getByLabelText("پیام شما برای مایلو")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("پیام شما برای مایلو"), {
      target: { value: "سلام" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ارسال" }));
    await screen.findByText("پاسخ مایلو");

    fireEvent.click(screen.getAllByRole("button", { name: "گفت‌وگوی جدید" })[0]);
    await waitFor(() => expect(screen.queryByText("پاسخ مایلو")).not.toBeInTheDocument());
    expect(screen.getByText("یک گفت‌وگوی تازه شروع کنیم")).toBeInTheDocument();
  });

  it("keeps the user message and retries a temporary failure", async () => {
    let chatCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/conversations" && !init?.method) {
        return jsonResponse({ conversations: [] });
      }
      if (url === "/api/conversations" && init?.method === "POST") {
        return jsonResponse({ conversation }, 201);
      }
      if (url === "/api/chat") {
        chatCalls += 1;
        return chatCalls === 1
          ? jsonResponse(
              { error: { code: "PROVIDER_UNAVAILABLE", message: "ارتباط برقرار نشد." } },
              502,
            )
          : streamedResponse(
              { type: "delta", delta: "حالا آماده‌ام" },
              { type: "done", model: "test-model" },
            );
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ChatShell />);

    await waitFor(() => expect(screen.getByLabelText("پیام شما برای مایلو")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("پیام شما برای مایلو"), {
      target: { value: "دوباره تلاش کن" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ارسال" }));

    expect(await screen.findByText("دوباره تلاش کن")).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "تلاش مجدد" }));
    expect(await screen.findByText("حالا آماده‌ام")).toBeInTheDocument();
    expect(chatCalls).toBe(2);
  });

  it("loads database history and toggles the color theme", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/conversations") {
          return jsonResponse({ conversations: [conversation] });
        }
        if (url === `/api/conversations/${conversation.id}`) {
          return jsonResponse({
            conversation,
            messages: [{ role: "assistant", content: "تاریخچهٔ مایلو" }],
          });
        }
        throw new Error(`Unexpected request: ${url}`);
      }),
    );
    render(<ChatShell />);

    fireEvent.click(await screen.findByRole("button", { name: /^سلام\s/ }));
    expect(await screen.findByText("تاریخچهٔ مایلو")).toBeInTheDocument();
    const initialTheme = document.documentElement.dataset.theme;
    fireEvent.click(screen.getByRole("button", { name: /فعال‌کردن تم/ }));

    const expectedTheme = initialTheme === "dark" ? "light" : "dark";
    expect(document.documentElement.dataset.theme).toBe(expectedTheme);
    expect(window.localStorage.getItem("milo-comm-theme")).toBe(expectedTheme);
  });
});

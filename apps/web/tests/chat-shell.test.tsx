import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatShell } from "@/components/chat-shell";
import type { ChatStreamEvent } from "@/lib/stream-protocol";

function streamedResponse(...events: ChatStreamEvent[]) {
  return new Response(events.map((event) => `${JSON.stringify(event)}\n`).join(""), {
    status: 200,
    headers: { "Content-Type": "application/x-ndjson" },
  });
}

describe("ChatShell", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    vi.unstubAllGlobals();
    delete document.documentElement.dataset.theme;
  });

  it("streams a response and clears the current conversation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamedResponse(
          { type: "delta", delta: "پاسخ " },
          { type: "delta", delta: "مایلو" },
          { type: "done", model: "test-model" },
        ),
      ),
    );
    render(<ChatShell />);

    await waitFor(() => expect(screen.getByLabelText("پیام شما برای مایلو")).toBeEnabled());

    fireEvent.change(screen.getByLabelText("پیام شما برای مایلو"), {
      target: { value: "سلام" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ارسال" }));
    await screen.findByText("پاسخ مایلو");

    fireEvent.click(screen.getByRole("button", { name: "گفت‌وگوی جدید" }));

    await waitFor(() => expect(screen.queryByText("پاسخ مایلو")).not.toBeInTheDocument());
    expect(screen.getByText("یک گفت‌وگوی تازه شروع کنیم")).toBeInTheDocument();
    expect(window.localStorage.getItem("milo-comm-history-v1")).toBe("[]");
  });

  it("keeps the user message and retries a temporary failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { code: "PROVIDER_UNAVAILABLE", message: "ارتباط برقرار نشد." },
          }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        streamedResponse(
          { type: "delta", delta: "حالا آماده‌ام" },
          { type: "done", model: "test-model" },
        ),
      );
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
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("restores local history and toggles the color theme", async () => {
    window.localStorage.setItem(
      "milo-comm-history-v1",
      JSON.stringify([{ role: "assistant", content: "تاریخچهٔ مایلو" }]),
    );
    render(<ChatShell />);

    expect(await screen.findByText("تاریخچهٔ مایلو")).toBeInTheDocument();
    const initialTheme = document.documentElement.dataset.theme;
    fireEvent.click(screen.getByRole("button", { name: /فعال‌کردن تم/ }));

    const expectedTheme = initialTheme === "dark" ? "light" : "dark";
    expect(document.documentElement.dataset.theme).toBe(expectedTheme);
    expect(window.localStorage.getItem("milo-comm-theme")).toBe(expectedTheme);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getTextDirection, MessageBubble } from "@/components/message-bubble";

describe("getTextDirection", () => {
  it("uses RTL for Persian and LTR for English", () => {
    expect(getTextDirection("سلام از مایلو")).toBe("rtl");
    expect(getTextDirection("Hello from Milo")).toBe("ltr");
  });

  it("renders assistant Markdown as semantic HTML without raw HTML execution", () => {
    render(
      <MessageBubble
        message={{ role: "assistant", content: "**پررنگ**\n\n<script>alert(1)</script>" }}
      />,
    );

    expect(screen.getByText("پررنگ").tagName).toBe("STRONG");
    expect(document.querySelector("script")).toBeNull();
    expect(screen.getByText(/<script>/)).toBeInTheDocument();
  });
});

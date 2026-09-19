import { describe, expect, it } from "vitest";

import { getTextDirection } from "@/components/message-bubble";

describe("getTextDirection", () => {
  it("uses RTL for Persian and LTR for English", () => {
    expect(getTextDirection("سلام از مایلو")).toBe("rtl");
    expect(getTextDirection("Hello from Milo")).toBe("ltr");
  });
});

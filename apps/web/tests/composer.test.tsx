import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Composer } from "@/components/composer";

describe("Composer", () => {
  it("submits with Enter but not Shift+Enter", () => {
    const onSubmit = vi.fn();
    render(
      <Composer value="سلام" disabled={false} onChange={vi.fn()} onSubmit={onSubmit} />,
    );
    const input = screen.getByLabelText("پیام شما برای مایلو");

    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});


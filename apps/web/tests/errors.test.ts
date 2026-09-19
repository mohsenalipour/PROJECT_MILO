import { describe, expect, it } from "vitest";

import { toPublicError } from "@/lib/errors";

describe("toPublicError", () => {
  it("maps authentication errors without exposing provider text", () => {
    const secret = "TEST_SECRET_VALUE";
    const result = toPublicError({ status: 401, message: `bad key ${secret}` });

    expect(result.code).toBe("PROVIDER_AUTH_FAILED");
    expect(result.message).not.toContain(secret);
  });

  it("maps rate limits to a retryable public code", () => {
    expect(toPublicError({ status: 429, message: "raw" }).code).toBe("RATE_LIMITED");
  });
});

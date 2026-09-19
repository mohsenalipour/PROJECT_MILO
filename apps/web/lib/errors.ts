export type ErrorCode =
  | "CONFIG_MISSING"
  | "PROVIDER_AUTH_FAILED"
  | "MODEL_NOT_FOUND"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "INTERNAL_ERROR";

export type PublicError = {
  code: ErrorCode;
  message: string;
  status: number;
};

export class ConfigError extends Error {
  constructor() {
    super("Provider configuration is incomplete");
    this.name = "ConfigError";
  }
}

export class EmptyProviderResponseError extends Error {
  constructor() {
    super("Provider returned no text");
    this.name = "EmptyProviderResponseError";
  }
}

function numericStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  return typeof error.status === "number" ? error.status : undefined;
}

function errorName(error: unknown): string {
  return typeof error === "object" && error !== null && "name" in error
    ? String(error.name)
    : "";
}

export function toPublicError(error: unknown): PublicError {
  if (error instanceof ConfigError) {
    return {
      code: "CONFIG_MISSING",
      message: "تنظیمات سرویس کامل نیست؛ فایل محیطی سرور را بررسی کنید.",
      status: 500,
    };
  }

  const status = numericStatus(error);
  if (status === 401 || status === 403) {
    return {
      code: "PROVIDER_AUTH_FAILED",
      message: "کلید API از سوی سرویس پذیرفته نشد.",
      status: 401,
    };
  }
  if (status === 400 || status === 404) {
    return {
      code: "MODEL_NOT_FOUND",
      message: "شناسهٔ مدل یا نشانی سرویس معتبر نیست.",
      status: 502,
    };
  }
  if (status === 429) {
    return {
      code: "RATE_LIMITED",
      message: "سرویس موقتاً شلوغ است یا اعتبار کافی نیست؛ کمی بعد دوباره تلاش کنید.",
      status: 429,
    };
  }

  const name = errorName(error);
  if (
    status === 408 ||
    name === "APITimeoutError" ||
    name === "APIConnectionError" ||
    name === "AbortError"
  ) {
    return {
      code: "PROVIDER_UNAVAILABLE",
      message: "ارتباط با سرویس مدل برقرار نشد؛ کمی بعد دوباره تلاش کنید.",
      status: 502,
    };
  }

  if (error instanceof EmptyProviderResponseError || (status !== undefined && status >= 500)) {
    return {
      code: "PROVIDER_UNAVAILABLE",
      message: "سرویس مدل پاسخ معتبری نداد؛ کمی بعد دوباره تلاش کنید.",
      status: 502,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "خطای پیش‌بینی‌نشده‌ای رخ داد؛ دوباره تلاش کنید.",
    status: 500,
  };
}

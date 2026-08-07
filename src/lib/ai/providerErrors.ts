import "server-only";

export type AIProviderName = "cloudflare" | "ollama" | "resilient";

export type AIProviderFailureReason =
  | "configuration"
  | "authentication"
  | "rate_limited"
  | "timeout"
  | "busy"
  | "unavailable"
  | "invalid_response";

interface AIProviderErrorOptions {
  fallbackAllowed: boolean;
  retryAfterSeconds?: number;
  cause?: unknown;
}

export class AIProviderError extends Error {
  readonly provider: AIProviderName;
  readonly reason: AIProviderFailureReason;
  readonly fallbackAllowed: boolean;
  readonly retryAfterSeconds?: number;

  constructor(
    provider: AIProviderName,
    reason: AIProviderFailureReason,
    options: AIProviderErrorOptions,
  ) {
    super("AI provider request failed", { cause: options.cause });
    this.name = "AIProviderError";
    this.provider = provider;
    this.reason = reason;
    this.fallbackAllowed = options.fallbackAllowed;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

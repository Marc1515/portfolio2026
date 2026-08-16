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

export type AIProviderDiagnosticCode =
  | "answer_too_long"
  | "empty_content"
  | "incomplete_generation"
  | "invalid_success_payload"
  | "malformed_payload"
  | "missing_content";

export type AIProviderFinishReason =
  | "content_filter"
  | "length"
  | "stop"
  | "tool_calls"
  | "other";

export interface AIProviderDiagnosticMetadata {
  diagnosticCode: AIProviderDiagnosticCode;
  finishReason?: AIProviderFinishReason;
  outputCharacterCount?: number;
}

interface AIProviderErrorOptions {
  fallbackAllowed: boolean;
  retryAfterSeconds?: number;
  diagnostic?: AIProviderDiagnosticMetadata;
  cause?: unknown;
}

export class AIProviderError extends Error {
  readonly provider: AIProviderName;
  readonly reason: AIProviderFailureReason;
  readonly fallbackAllowed: boolean;
  readonly retryAfterSeconds?: number;
  readonly diagnostic?: AIProviderDiagnosticMetadata;

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
    this.diagnostic = options.diagnostic;
  }
}

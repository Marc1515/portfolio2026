import "server-only";

import {
  AIProviderError,
  type AIProviderDiagnosticCode,
  type AIProviderDiagnosticMetadata,
  type AIProviderFinishReason,
} from "@/lib/ai/providerErrors";
import type { AIProvider } from "@/lib/ai/provider";
import type { AIModelMessage } from "@/lib/ai/promptBuilder";
import { MAX_ASSISTANT_MESSAGE_LENGTH } from "@/lib/ai/validation";

const REQUEST_TIMEOUT_MS = 15_000;
const CLOUDFLARE_MAX_COMPLETION_TOKENS = 800;
const CLOUDFLARE_REASONING_EFFORT = "low";

interface CloudflareConfiguration {
  accountId: string;
  apiToken: string;
  model: string;
}

interface CloudflareProviderOptions {
  fetch?: typeof fetch;
  environment?: NodeJS.ProcessEnv;
  now?: () => number;
  timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getConfiguration(
  environment: NodeJS.ProcessEnv,
): CloudflareConfiguration {
  const accountId = environment.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = environment.CLOUDFLARE_API_TOKEN?.trim();
  const model = environment.CLOUDFLARE_AI_MODEL?.trim();

  if (!accountId || !apiToken || !model) {
    throw new AIProviderError("cloudflare", "configuration", {
      fallbackAllowed: true,
    });
  }

  return { accountId, apiToken, model };
}

function parseRetryAfter(
  value: string | null,
  now: () => number,
): number | undefined {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds);
  }

  const date = Date.parse(value);
  if (!Number.isFinite(date)) return undefined;
  return Math.max(0, Math.ceil((date - now()) / 1_000));
}

interface ExtractedCloudflareText {
  text: string;
  finishReason?: AIProviderFinishReason;
}

function normalizeFinishReason(
  value: unknown,
): AIProviderFinishReason | undefined {
  if (typeof value !== "string") return undefined;
  if (
    value === "stop" ||
    value === "length" ||
    value === "content_filter" ||
    value === "tool_calls"
  ) {
    return value;
  }
  return "other";
}

function boundedCharacterCount(value: string): number {
  return Math.min(value.length, MAX_ASSISTANT_MESSAGE_LENGTH + 1);
}

function invalidResponse(
  diagnosticCode: AIProviderDiagnosticCode,
  metadata: Omit<AIProviderDiagnosticMetadata, "diagnosticCode"> = {},
  cause?: unknown,
): never {
  throw new AIProviderError("cloudflare", "invalid_response", {
    fallbackAllowed: true,
    diagnostic: { diagnosticCode, ...metadata },
    cause,
  });
}

function extractGeneratedText(value: unknown): ExtractedCloudflareText {
  if (!isRecord(value) || value.success !== true || !isRecord(value.result)) {
    return invalidResponse("invalid_success_payload");
  }

  if (typeof value.result.response === "string") {
    return { text: value.result.response };
  }

  const choices = value.result.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return invalidResponse("missing_content");
  }

  const firstChoice = choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    return invalidResponse("invalid_success_payload");
  }

  const finishReason = normalizeFinishReason(firstChoice.finish_reason);
  const content = firstChoice.message.content;
  if (finishReason === "length") {
    return invalidResponse("incomplete_generation", {
      finishReason,
      ...(typeof content === "string"
        ? { outputCharacterCount: boundedCharacterCount(content) }
        : {}),
    });
  }
  if (content === null || content === undefined) {
    return invalidResponse("missing_content", { finishReason });
  }
  if (typeof content !== "string") {
    return invalidResponse("invalid_success_payload", { finishReason });
  }

  return { text: content, finishReason };
}

export class CloudflareAIProvider implements AIProvider {
  private readonly fetchImplementation: typeof fetch;
  private readonly environment: NodeJS.ProcessEnv;
  private readonly now: () => number;
  private readonly timeoutMs: number;

  constructor(options: CloudflareProviderOptions = {}) {
    this.fetchImplementation = options.fetch ?? fetch;
    this.environment = options.environment ?? process.env;
    this.now = options.now ?? Date.now;
    this.timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  }

  async generate(messages: AIModelMessage[]): Promise<string> {
    const { accountId, apiToken, model } = getConfiguration(this.environment);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    const encodedModelPath = model
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    try {
      const response = await this.fetchImplementation(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${encodedModelPath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            temperature: 0.2,
            reasoning_effort: CLOUDFLARE_REASONING_EFFORT,
            max_completion_tokens: CLOUDFLARE_MAX_COMPLETION_TOKENS,
            stream: false,
          }),
          cache: "no-store",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const reason =
          response.status === 401 || response.status === 403
            ? "authentication"
            : response.status === 429
              ? "rate_limited"
              : response.status === 400 || response.status === 404
                ? "configuration"
                : "unavailable";

        throw new AIProviderError("cloudflare", reason, {
          fallbackAllowed: true,
          retryAfterSeconds: parseRetryAfter(
            response.headers.get("retry-after"),
            this.now,
          ),
        });
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch (error) {
        return invalidResponse("malformed_payload", {}, error);
      }

      const extracted = extractGeneratedText(payload);
      const generatedText = extracted.text.trim();
      if (!generatedText) {
        return invalidResponse("empty_content", {
          finishReason: extracted.finishReason,
          outputCharacterCount: 0,
        });
      }
      if (generatedText.length > MAX_ASSISTANT_MESSAGE_LENGTH) {
        return invalidResponse("answer_too_long", {
          finishReason: extracted.finishReason,
          outputCharacterCount: boundedCharacterCount(generatedText),
        });
      }

      return generatedText;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;

      if (controller.signal.aborted) {
        throw new AIProviderError("cloudflare", "timeout", {
          fallbackAllowed: true,
          cause: error,
        });
      }

      throw new AIProviderError("cloudflare", "unavailable", {
        fallbackAllowed: true,
        cause: error,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

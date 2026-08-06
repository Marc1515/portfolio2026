import "server-only";

import { AIProviderError } from "@/lib/ai/providerErrors";
import type { AIProvider } from "@/lib/ai/provider";
import type { AIModelMessage } from "@/lib/ai/promptBuilder";
import { MAX_ASSISTANT_MESSAGE_LENGTH } from "@/lib/ai/validation";

const REQUEST_TIMEOUT_MS = 15_000;

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

function extractGeneratedText(value: unknown): string | null {
  if (!isRecord(value) || value.success !== true || !isRecord(value.result)) {
    return null;
  }

  if (typeof value.result.response === "string") {
    return value.result.response;
  }

  const choices = value.result.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;

  const firstChoice = choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) return null;

  return typeof firstChoice.message.content === "string"
    ? firstChoice.message.content
    : null;
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
            max_completion_tokens: 350,
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
        throw new AIProviderError("cloudflare", "invalid_response", {
          fallbackAllowed: true,
          cause: error,
        });
      }

      const generatedText = extractGeneratedText(payload)?.trim();
      if (
        !generatedText ||
        generatedText.length > MAX_ASSISTANT_MESSAGE_LENGTH
      ) {
        throw new AIProviderError("cloudflare", "invalid_response", {
          fallbackAllowed: true,
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

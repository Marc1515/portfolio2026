import "server-only";

import type { AIProvider } from "@/lib/ai/provider";
import { AIProviderError } from "@/lib/ai/providerErrors";
import type { AIModelMessage } from "@/lib/ai/promptBuilder";
import { MAX_ASSISTANT_MESSAGE_LENGTH } from "@/lib/ai/validation";
import {
  DEFAULT_OLLAMA_BASE_URL,
  normalizeOllamaChatUrl,
  normalizeOllamaKeepAlive,
  normalizeOllamaModel,
  parseBoundedPositiveInteger,
} from "../../../scripts/ollama-runtime.mjs";

export const DEFAULT_OLLAMA_TIMEOUT_MS = 90_000;
const DEFAULT_MAX_CONCURRENT_REQUESTS = 1;
const DEFAULT_DAILY_LIMIT = 25;

export { normalizeOllamaChatUrl };

interface OllamaConfiguration {
  endpoint: string;
  model: string;
  timeoutMs: number;
  keepAlive: string;
}

interface OllamaProviderOptions {
  fetch?: typeof fetch;
  environment?: NodeJS.ProcessEnv;
  guard?: OllamaUsageGuard;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function utcDayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export class OllamaUsageGuard {
  private activeRequests = 0;
  private attemptsToday = 0;
  private currentDay: string;

  constructor(
    private readonly maximumConcurrent: number,
    private readonly dailyLimit: number,
    private readonly now: () => number = Date.now,
  ) {
    this.currentDay = utcDayKey(this.now());
  }

  acquire(): () => void {
    this.resetDailyBudgetIfNeeded();

    if (
      this.activeRequests >= this.maximumConcurrent ||
      this.attemptsToday >= this.dailyLimit
    ) {
      throw new AIProviderError("ollama", "busy", {
        fallbackAllowed: false,
      });
    }

    this.activeRequests += 1;
    this.attemptsToday += 1;
    let released = false;

    return () => {
      if (released) return;
      released = true;
      this.activeRequests = Math.max(0, this.activeRequests - 1);
    };
  }

  get active(): number {
    return this.activeRequests;
  }

  get attempts(): number {
    this.resetDailyBudgetIfNeeded();
    return this.attemptsToday;
  }

  private resetDailyBudgetIfNeeded() {
    const nextDay = utcDayKey(this.now());
    if (nextDay !== this.currentDay) {
      this.currentDay = nextDay;
      this.attemptsToday = 0;
    }
  }
}

function createGuard(
  environment: NodeJS.ProcessEnv,
  now: () => number = Date.now,
) {
  return new OllamaUsageGuard(
    parseBoundedPositiveInteger(
      environment.OLLAMA_MAX_CONCURRENT_REQUESTS,
      DEFAULT_MAX_CONCURRENT_REQUESTS,
      100,
    ),
    parseBoundedPositiveInteger(
      environment.OLLAMA_FALLBACK_DAILY_LIMIT,
      DEFAULT_DAILY_LIMIT,
      100_000,
    ),
    now,
  );
}

let sharedGuard: OllamaUsageGuard | undefined;

function getConfiguration(environment: NodeJS.ProcessEnv): OllamaConfiguration {
  const model = normalizeOllamaModel(environment.OLLAMA_MODEL);
  const endpoint = normalizeOllamaChatUrl(
    environment.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL,
  );
  const keepAlive = normalizeOllamaKeepAlive(environment.OLLAMA_KEEP_ALIVE);

  if (!model || !endpoint || !keepAlive) {
    throw new AIProviderError("ollama", "configuration", {
      fallbackAllowed: false,
    });
  }

  return {
    endpoint,
    model,
    keepAlive,
    timeoutMs: parseBoundedPositiveInteger(
      environment.OLLAMA_REQUEST_TIMEOUT_MS,
      DEFAULT_OLLAMA_TIMEOUT_MS,
      120_000,
    ),
  };
}

export class OllamaAIProvider implements AIProvider {
  private readonly fetchImplementation: typeof fetch;
  private readonly environment: NodeJS.ProcessEnv;
  private readonly guard: OllamaUsageGuard;

  constructor(options: OllamaProviderOptions = {}) {
    this.fetchImplementation = options.fetch ?? fetch;
    this.environment = options.environment ?? process.env;
    sharedGuard ??= createGuard(process.env);
    this.guard = options.guard ?? sharedGuard;
  }

  async generate(messages: AIModelMessage[]): Promise<string> {
    const { endpoint, model, timeoutMs, keepAlive } = getConfiguration(
      this.environment,
    );
    const release = this.guard.acquire();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetchImplementation(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          keep_alive: keepAlive,
          options: { temperature: 0.2, num_predict: 350 },
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AIProviderError(
          "ollama",
          response.status === 429 ? "rate_limited" : "unavailable",
          { fallbackAllowed: false },
        );
      }

      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new AIProviderError("ollama", "invalid_response", {
          fallbackAllowed: false,
        });
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch (error) {
        throw new AIProviderError("ollama", "invalid_response", {
          fallbackAllowed: false,
          cause: error,
        });
      }

      if (
        !isRecord(payload) ||
        "error" in payload ||
        !isRecord(payload.message) ||
        typeof payload.message.content !== "string" ||
        payload.done === false
      ) {
        throw new AIProviderError("ollama", "invalid_response", {
          fallbackAllowed: false,
        });
      }

      const generatedText = payload.message.content.trim();
      if (
        !generatedText ||
        generatedText.length > MAX_ASSISTANT_MESSAGE_LENGTH
      ) {
        throw new AIProviderError("ollama", "invalid_response", {
          fallbackAllowed: false,
        });
      }

      return generatedText;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;

      throw new AIProviderError(
        "ollama",
        controller.signal.aborted ? "timeout" : "unavailable",
        { fallbackAllowed: false, cause: error },
      );
    } finally {
      clearTimeout(timeoutId);
      release();
    }
  }
}

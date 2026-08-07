import "server-only";

import type {
  AIProvider,
  AIProviderAttemptResult,
  AIProviderGenerateOptions,
} from "@/lib/ai/provider";
import { AIProviderError } from "@/lib/ai/providerErrors";
import type { AIModelMessage } from "@/lib/ai/promptBuilder";

export const DEFAULT_CLOUDFLARE_COOLDOWN_MS = 30_000;
const MAX_CLOUDFLARE_COOLDOWN_MS = 5 * 60_000;

interface ResilientProviderOptions {
  now?: () => number;
  performanceNow?: () => number;
  cloudflareCooldownMs?: number;
}

export class ResilientAIProvider implements AIProvider {
  private cloudflareCooldownUntil = 0;
  private readonly now: () => number;
  private readonly performanceNow: () => number;
  private readonly cloudflareCooldownMs: number;

  constructor(
    private readonly cloudflare: AIProvider,
    private readonly ollama: AIProvider,
    options: ResilientProviderOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.performanceNow =
      options.performanceNow ?? performance.now.bind(performance);
    this.cloudflareCooldownMs =
      options.cloudflareCooldownMs ?? DEFAULT_CLOUDFLARE_COOLDOWN_MS;
  }

  private notifyAttempt(
    options: AIProviderGenerateOptions | undefined,
    result: AIProviderAttemptResult,
  ) {
    try {
      options?.onAttempt?.(result);
    } catch {
      // Operational instrumentation must never affect provider availability.
    }
  }

  private durationSince(startedAt: number) {
    return Math.max(0, Math.round(this.performanceNow() - startedAt));
  }

  async generate(
    messages: AIModelMessage[],
    options?: AIProviderGenerateOptions,
  ): Promise<string> {
    if (this.now() >= this.cloudflareCooldownUntil) {
      const cloudflareStartedAt = this.performanceNow();
      try {
        const result = await this.cloudflare.generate(messages);
        this.cloudflareCooldownUntil = 0;
        this.notifyAttempt(options, {
          provider: "cloudflare",
          outcome: "success",
          durationMs: this.durationSince(cloudflareStartedAt),
        });
        return result;
      } catch (error) {
        this.notifyAttempt(options, {
          provider: "cloudflare",
          outcome: "failure",
          durationMs: this.durationSince(cloudflareStartedAt),
          reason: error instanceof AIProviderError ? error.reason : "internal",
        });
        if (!(error instanceof AIProviderError) || !error.fallbackAllowed) {
          throw error;
        }

        const retryCooldown = (error.retryAfterSeconds ?? 0) * 1_000;
        const cooldown = Math.min(
          MAX_CLOUDFLARE_COOLDOWN_MS,
          Math.max(this.cloudflareCooldownMs, retryCooldown),
        );
        this.cloudflareCooldownUntil = this.now() + cooldown;
      }
    }

    const ollamaStartedAt = this.performanceNow();
    try {
      const result = await this.ollama.generate(messages);
      this.notifyAttempt(options, {
        provider: "ollama",
        outcome: "success",
        durationMs: this.durationSince(ollamaStartedAt),
      });
      return result;
    } catch (error) {
      this.notifyAttempt(options, {
        provider: "ollama",
        outcome: "failure",
        durationMs: this.durationSince(ollamaStartedAt),
        reason: error instanceof AIProviderError ? error.reason : "internal",
      });
      if (error instanceof AIProviderError) {
        throw new AIProviderError("resilient", "unavailable", {
          fallbackAllowed: false,
          cause: error,
        });
      }

      throw error;
    }
  }
}

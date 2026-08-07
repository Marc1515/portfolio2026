import "server-only";

import type { AIProvider } from "@/lib/ai/provider";
import { AIProviderError } from "@/lib/ai/providerErrors";
import type { AIModelMessage } from "@/lib/ai/promptBuilder";

export const DEFAULT_CLOUDFLARE_COOLDOWN_MS = 30_000;
const MAX_CLOUDFLARE_COOLDOWN_MS = 5 * 60_000;

interface ResilientProviderOptions {
  now?: () => number;
  cloudflareCooldownMs?: number;
}

export class ResilientAIProvider implements AIProvider {
  private cloudflareCooldownUntil = 0;
  private readonly now: () => number;
  private readonly cloudflareCooldownMs: number;

  constructor(
    private readonly cloudflare: AIProvider,
    private readonly ollama: AIProvider,
    options: ResilientProviderOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.cloudflareCooldownMs =
      options.cloudflareCooldownMs ?? DEFAULT_CLOUDFLARE_COOLDOWN_MS;
  }

  async generate(messages: AIModelMessage[]): Promise<string> {
    if (this.now() >= this.cloudflareCooldownUntil) {
      try {
        const result = await this.cloudflare.generate(messages);
        this.cloudflareCooldownUntil = 0;
        return result;
      } catch (error) {
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

    try {
      return await this.ollama.generate(messages);
    } catch (error) {
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

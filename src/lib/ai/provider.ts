import "server-only";

import type { AIModelMessage } from "@/lib/ai/promptBuilder";

export interface AIProvider {
  generate(messages: AIModelMessage[]): Promise<string>;
}

export class AIProviderError extends Error {
  constructor() {
    super("AI provider request failed");
    this.name = "AIProviderError";
  }
}

export class AIProviderUnavailableError extends AIProviderError {
  constructor() {
    super();
    this.name = "AIProviderUnavailableError";
  }
}

export async function createAIProvider(): Promise<AIProvider> {
  const { CloudflareAIProvider } = await import("@/lib/ai/cloudflareProvider");
  return new CloudflareAIProvider();
}

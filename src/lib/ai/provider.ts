import "server-only";

import type {
  AIProviderDiagnosticMetadata,
  AIProviderFailureReason,
} from "@/lib/ai/providerErrors";
import type { AIModelMessage } from "@/lib/ai/promptBuilder";

export type AnsweringProvider = "cloudflare" | "ollama";

export interface AIProviderAttemptResult extends Partial<AIProviderDiagnosticMetadata> {
  provider: AnsweringProvider;
  outcome: "success" | "failure";
  durationMs: number;
  reason?: AIProviderFailureReason | "internal";
}

export interface AIProviderGenerateOptions {
  onAttempt?: (result: AIProviderAttemptResult) => void;
}

export interface AIProvider {
  generate(
    messages: AIModelMessage[],
    options?: AIProviderGenerateOptions,
  ): Promise<string>;
}

let sharedProvider: Promise<AIProvider> | undefined;

export async function createAIProvider(): Promise<AIProvider> {
  sharedProvider ??= Promise.all([
    import("@/lib/ai/cloudflareProvider"),
    import("@/lib/ai/ollamaProvider"),
    import("@/lib/ai/resilientProvider"),
  ]).then(
    ([
      { CloudflareAIProvider },
      { OllamaAIProvider },
      { ResilientAIProvider },
    ]) =>
      new ResilientAIProvider(
        new CloudflareAIProvider(),
        new OllamaAIProvider(),
      ),
  );

  return sharedProvider;
}

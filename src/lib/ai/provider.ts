import "server-only";

import type { AIModelMessage } from "@/lib/ai/promptBuilder";

export interface AIProvider {
  generate(messages: AIModelMessage[]): Promise<string>;
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

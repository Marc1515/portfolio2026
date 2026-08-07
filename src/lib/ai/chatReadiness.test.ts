import { describe, expect, it } from "vitest";

import { getChatReadiness } from "@/lib/ai/chatReadiness";

describe("getChatReadiness", () => {
  it("reports ok when primary and fallback are configured", () => {
    expect(
      getChatReadiness({
        CLOUDFLARE_ACCOUNT_ID: "account",
        CLOUDFLARE_API_TOKEN: "token",
        CLOUDFLARE_AI_MODEL: "@cf/example/model",
        OLLAMA_BASE_URL: "http://ollama:11434",
        OLLAMA_MODEL: "qwen:latest",
      }).status,
    ).toBe("ok");
  });

  it.each([
    {
      CLOUDFLARE_ACCOUNT_ID: "account",
      CLOUDFLARE_API_TOKEN: "token",
      CLOUDFLARE_AI_MODEL: "@cf/example/model",
    },
    {
      OLLAMA_BASE_URL: "http://ollama:11434",
      OLLAMA_MODEL: "qwen:latest",
    },
  ])(
    "reports degraded when exactly one provider is configured",
    (environment) => {
      expect(getChatReadiness(environment).status).toBe("degraded");
    },
  );

  it("reports unavailable without provider configuration", () => {
    expect(getChatReadiness({}).status).toBe("unavailable");
  });
});

import { describe, expect, it } from "vitest";

import { createChatHealthGet } from "@/app/api/chat/health/route";

describe("GET /api/chat/health", () => {
  it.each([
    [
      "ok",
      {
        CLOUDFLARE_ACCOUNT_ID: "private-account",
        CLOUDFLARE_API_TOKEN: "private-token",
        CLOUDFLARE_AI_MODEL: "@cf/example/model",
        OLLAMA_BASE_URL: "http://private-ollama:11434",
        OLLAMA_MODEL: "private-model",
      },
    ],
    [
      "degraded",
      {
        CLOUDFLARE_ACCOUNT_ID: "private-account",
        CLOUDFLARE_API_TOKEN: "private-token",
        CLOUDFLARE_AI_MODEL: "@cf/example/model",
      },
    ],
    ["unavailable", {}],
  ] as const)(
    "returns only the %s readiness status",
    async (status, environment) => {
      const response = createChatHealthGet(environment)();
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(JSON.parse(body)).toEqual({ status });
      expect(body).not.toContain("private-account");
      expect(body).not.toContain("private-token");
      expect(body).not.toContain("private-ollama");
      expect(body).not.toContain("private-model");
    },
  );
});

import { describe, expect, it, vi } from "vitest";

import { runOllamaSmoke } from "./ollama-smoke.mjs";

const environment = {
  NODE_ENV: "test",
  OLLAMA_BASE_URL: "http://ollama:11434",
  OLLAMA_MODEL: "qwen2.5-coder:3b",
  OLLAMA_REQUEST_TIMEOUT_MS: "1000",
  OLLAMA_KEEP_ALIVE: "-1",
} as NodeJS.ProcessEnv;

describe("runOllamaSmoke", () => {
  it("uses the shared persistent keep-alive while preserving the tiny output budget", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: { content: "OK" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      runOllamaSmoke({
        environment,
        fetchImplementation: fetchMock as unknown as typeof fetch,
      }),
    ).resolves.toBeUndefined();

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toMatchObject({
      model: "qwen2.5-coder:3b",
      stream: false,
      keep_alive: "-1m",
      options: { temperature: 0.1, num_predict: 8 },
    });
  });
});

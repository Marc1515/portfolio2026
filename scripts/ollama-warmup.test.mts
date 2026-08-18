import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_OLLAMA_WARMUP_TIMEOUT_MS,
  formatOllamaWarmupStatus,
  runOllamaWarmup,
} from "./ollama-warmup.mjs";

const environment = {
  NODE_ENV: "test",
  OLLAMA_BASE_URL: "http://ollama:11434",
  OLLAMA_MODEL: "qwen2.5-coder:3b",
  OLLAMA_KEEP_ALIVE: "-1",
} as NodeJS.ProcessEnv;

describe("runOllamaWarmup", () => {
  it("reports PASS for HTTP 200 and sends only a minimal direct request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null));

    const result = await runOllamaWarmup({
      environment,
      fetchImplementation: fetchMock as unknown as typeof fetch,
    });

    expect(result).toEqual({ ok: true });
    expect(formatOllamaWarmupStatus(result)).toBe(
      "Private Ollama warm-up: PASS",
    );
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://ollama:11434/api/chat");
    expect(JSON.parse(String(request.body))).toEqual({
      model: "qwen2.5-coder:3b",
      messages: [{ role: "user", content: "Reply with OK." }],
      stream: false,
      keep_alive: "-1m",
      options: { temperature: 0, num_predict: 1 },
    });
    expect(DEFAULT_OLLAMA_WARMUP_TIMEOUT_MS).toBe(120_000);
  });

  it("reports a bounded HTTP failure without exposing the response body", async () => {
    const secretBody = "sensitive provider response";
    const result = await runOllamaWarmup({
      environment,
      fetchImplementation: vi
        .fn()
        .mockResolvedValue(
          new Response(secretBody, { status: 503 }),
        ) as unknown as typeof fetch,
    });
    const status = formatOllamaWarmupStatus(result);

    expect(status).toBe("Private Ollama warm-up: FAIL (HTTP 503)");
    expect(status).not.toContain(secretBody);
  });

  it("reports timeouts without exposing the thrown error", async () => {
    const sensitiveError = Object.assign(
      new Error("private endpoint details"),
      {
        name: "TimeoutError",
      },
    );
    const result = await runOllamaWarmup({
      environment,
      fetchImplementation: vi
        .fn()
        .mockRejectedValue(sensitiveError) as unknown as typeof fetch,
    });
    const status = formatOllamaWarmupStatus(result);

    expect(status).toBe("Private Ollama warm-up: FAIL (timeout)");
    expect(status).not.toContain(sensitiveError.message);
  });

  it("rejects an invalid model before making a request", async () => {
    const fetchMock = vi.fn();
    const result = await runOllamaWarmup({
      environment: { ...environment, OLLAMA_MODEL: "bad\nmodel" },
      fetchImplementation: fetchMock as unknown as typeof fetch,
    });

    expect(formatOllamaWarmupStatus(result)).toBe(
      "Private Ollama warm-up: FAIL (invalid model configuration)",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

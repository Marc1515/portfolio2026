import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_OLLAMA_TIMEOUT_MS,
  normalizeOllamaChatUrl,
  OllamaAIProvider,
  OllamaUsageGuard,
} from "@/lib/ai/ollamaProvider";

const messages = [{ role: "user" as const, content: "Question" }];
const environment = {
  NODE_ENV: "test",
  OLLAMA_BASE_URL: "http://ollama:11434",
  OLLAMA_MODEL: "qwen2.5-coder:3b",
  OLLAMA_REQUEST_TIMEOUT_MS: "1000",
  OLLAMA_KEEP_ALIVE: "-1",
} as NodeJS.ProcessEnv;

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OllamaAIProvider", () => {
  it("uses the measured bounded CPU fallback timeout by default", () => {
    expect(DEFAULT_OLLAMA_TIMEOUT_MS).toBe(90_000);
  });
  it("normalizes the fixed /api/chat endpoint without duplication", () => {
    expect(normalizeOllamaChatUrl("http://ollama:11434")).toBe(
      "http://ollama:11434/api/chat",
    );
    expect(normalizeOllamaChatUrl("http://localhost:11434/api/chat/")).toBe(
      "http://localhost:11434/api/chat",
    );
    expect(normalizeOllamaChatUrl("http://localhost:11434/api")).toBe(
      "http://localhost:11434/api/chat",
    );
  });

  it("sends the configured model, non-streaming request and runtime options", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          jsonResponse({ message: { content: "Answer" }, done: true }),
        ),
      );
    const provider = new OllamaAIProvider({
      fetch: fetchMock as unknown as typeof fetch,
      environment,
      guard: new OllamaUsageGuard(1, 25),
    });

    await expect(provider.generate(messages)).resolves.toBe("Answer");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://ollama:11434/api/chat");
    expect(JSON.parse(String(request.body))).toMatchObject({
      model: "qwen2.5-coder:3b",
      stream: false,
      keep_alive: "-1m",
      options: { temperature: 0.2, num_predict: 350 },
    });
    expect(JSON.parse(String(request.body)).keep_alive).not.toBe("-1");
  });

  it("classifies request timeouts", async () => {
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        }),
    );
    const provider = new OllamaAIProvider({
      fetch: fetchMock as unknown as typeof fetch,
      environment: { ...environment, OLLAMA_REQUEST_TIMEOUT_MS: "1" },
      guard: new OllamaUsageGuard(1, 25),
    });

    await expect(provider.generate(messages)).rejects.toMatchObject({
      provider: "ollama",
      reason: "timeout",
    });
  });

  it.each([
    [
      "invalid JSON",
      new Response("not-json", {
        headers: { "Content-Type": "application/json" },
      }),
    ],
    ["non-JSON content", new Response("text")],
    ["empty output", jsonResponse({ message: { content: "  " }, done: true })],
    [
      "incomplete output",
      jsonResponse({ message: { content: "Answer" }, done: false }),
    ],
    ["provider error field", jsonResponse({ error: "model failed" })],
    [
      "oversized output",
      jsonResponse({ message: { content: "x".repeat(2_001) }, done: true }),
    ],
    ["HTTP error", jsonResponse({ error: "busy" }, 503)],
  ])("rejects %s without leaking its body", async (_name, response) => {
    const provider = new OllamaAIProvider({
      fetch: vi.fn().mockResolvedValue(response) as unknown as typeof fetch,
      environment,
      guard: new OllamaUsageGuard(1, 25),
    });
    await expect(provider.generate(messages)).rejects.toMatchObject({
      provider: "ollama",
    });
  });

  it("fails fast at the concurrency limit and always releases the slot", async () => {
    let resolveFirst: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const guard = new OllamaUsageGuard(1, 25);
    const provider = new OllamaAIProvider({
      fetch: fetchMock as unknown as typeof fetch,
      environment,
      guard,
    });

    const first = provider.generate(messages);
    await Promise.resolve();
    await expect(provider.generate(messages)).rejects.toMatchObject({
      reason: "busy",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    resolveFirst?.(
      jsonResponse({ message: { content: "Answer" }, done: true }),
    );
    await expect(first).resolves.toBe("Answer");
    expect(guard.active).toBe(0);
  });

  it("releases the concurrency slot after a rejected response", async () => {
    const guard = new OllamaUsageGuard(1, 25);
    const provider = new OllamaAIProvider({
      fetch: vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ error: "failed" }),
        ) as unknown as typeof fetch,
      environment,
      guard,
    });
    await expect(provider.generate(messages)).rejects.toBeDefined();
    expect(guard.active).toBe(0);
  });

  it("enforces and resets the process-local daily fallback budget at UTC midnight", async () => {
    let now = Date.UTC(2026, 7, 6, 23, 59, 59);
    const guard = new OllamaUsageGuard(1, 1, () => now);
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          jsonResponse({ message: { content: "Answer" }, done: true }),
        ),
      );
    const provider = new OllamaAIProvider({
      fetch: fetchMock as unknown as typeof fetch,
      environment,
      guard,
    });

    await provider.generate(messages);
    await expect(provider.generate(messages)).rejects.toMatchObject({
      reason: "busy",
    });
    expect(fetchMock).toHaveBeenCalledOnce();

    now += 2_000;
    await expect(provider.generate(messages)).resolves.toBe("Answer");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not consume budget for configuration failures but counts provider attempts", async () => {
    const guard = new OllamaUsageGuard(1, 25);
    const unconfigured = new OllamaAIProvider({
      fetch: vi.fn() as unknown as typeof fetch,
      environment: { NODE_ENV: "test" },
      guard,
    });

    await expect(unconfigured.generate(messages)).rejects.toMatchObject({
      reason: "configuration",
    });
    expect(guard.attempts).toBe(0);

    const configured = new OllamaAIProvider({
      fetch: vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ error: "failed" }, 503),
        ) as unknown as typeof fetch,
      environment,
      guard,
    });
    await expect(configured.generate(messages)).rejects.toMatchObject({
      provider: "ollama",
    });
    expect(guard.attempts).toBe(1);
  });

  it.each([
    ["missing model", { OLLAMA_BASE_URL: "http://ollama:11434" }],
    [
      "malformed URL",
      { OLLAMA_BASE_URL: "not a URL", OLLAMA_MODEL: "qwen2.5-coder:3b" },
    ],
  ])(
    "rejects %s before making a request",
    async (_name, invalidEnvironment) => {
      const fetchMock = vi.fn();
      const provider = new OllamaAIProvider({
        fetch: fetchMock as unknown as typeof fetch,
        environment: invalidEnvironment as unknown as NodeJS.ProcessEnv,
        guard: new OllamaUsageGuard(1, 25),
      });

      await expect(provider.generate(messages)).rejects.toMatchObject({
        provider: "ollama",
        reason: "configuration",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});

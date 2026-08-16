import { describe, expect, it, vi } from "vitest";

import { CloudflareAIProvider } from "@/lib/ai/cloudflareProvider";

const messages = [{ role: "user" as const, content: "Question" }];
const environment = {
  NODE_ENV: "test",
  CLOUDFLARE_ACCOUNT_ID: "account",
  CLOUDFLARE_API_TOKEN: "token",
  CLOUDFLARE_AI_MODEL: "@cf/example/model",
} as NodeJS.ProcessEnv;

function response(value: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("CloudflareAIProvider", () => {
  it("uses the production Cloudflare generation settings", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        success: true,
        result: { response: "Answer" },
      }),
    );
    const provider = new CloudflareAIProvider({
      fetch: fetchMock as unknown as typeof fetch,
      environment,
    });

    await expect(provider.generate(messages)).resolves.toBe("Answer");
    expect(fetchMock).toHaveBeenCalledOnce();

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(request.body as string)).toEqual({
      messages,
      temperature: 0.2,
      reasoning_effort: "low",
      max_completion_tokens: 1_200,
      stream: false,
    });
  });

  it("classifies missing configuration without calling fetch", async () => {
    const fetchMock = vi.fn();
    const provider = new CloudflareAIProvider({
      fetch: fetchMock as unknown as typeof fetch,
      environment: { NODE_ENV: "test" },
    });
    await expect(provider.generate(messages)).rejects.toMatchObject({
      provider: "cloudflare",
      reason: "configuration",
      fallbackAllowed: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, "authentication"],
    [403, "authentication"],
    [500, "unavailable"],
  ])("classifies HTTP %s", async (status, reason) => {
    const provider = new CloudflareAIProvider({
      fetch: vi
        .fn()
        .mockResolvedValue(response({}, status)) as unknown as typeof fetch,
      environment,
    });
    await expect(provider.generate(messages)).rejects.toMatchObject({ reason });
  });

  it("parses Retry-After on rate limiting", async () => {
    const provider = new CloudflareAIProvider({
      fetch: vi
        .fn()
        .mockResolvedValue(
          response({}, 429, { "Retry-After": "17" }),
        ) as unknown as typeof fetch,
      environment,
    });
    await expect(provider.generate(messages)).rejects.toMatchObject({
      reason: "rate_limited",
      retryAfterSeconds: 17,
    });
  });

  it("classifies request timeouts as fallback eligible", async () => {
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        }),
    );
    const provider = new CloudflareAIProvider({
      fetch: fetchMock as unknown as typeof fetch,
      environment,
      timeoutMs: 1,
    });

    await expect(provider.generate(messages)).rejects.toMatchObject({
      provider: "cloudflare",
      reason: "timeout",
      fallbackAllowed: true,
    });
  });

  it("diagnoses an invalid success shape", async () => {
    const malformed = new CloudflareAIProvider({
      fetch: vi
        .fn()
        .mockResolvedValue(
          response({ success: true }),
        ) as unknown as typeof fetch,
      environment,
    });
    await expect(malformed.generate(messages)).rejects.toMatchObject({
      reason: "invalid_response",
      diagnostic: { diagnosticCode: "invalid_success_payload" },
    });
  });

  it("diagnoses oversized answer content without returning or truncating it", async () => {
    const oversized = new CloudflareAIProvider({
      fetch: vi
        .fn()
        .mockResolvedValue(
          response({ success: true, result: { response: "x".repeat(2_001) } }),
        ) as unknown as typeof fetch,
      environment,
    });
    await expect(oversized.generate(messages)).rejects.toMatchObject({
      reason: "invalid_response",
      diagnostic: {
        diagnosticCode: "answer_too_long",
        outputCharacterCount: 2_001,
      },
    });
  });

  it("diagnoses malformed JSON without retaining the response body", async () => {
    const provider = new CloudflareAIProvider({
      fetch: vi.fn().mockResolvedValue(
        new Response("not-json", {
          headers: { "Content-Type": "application/json" },
        }),
      ) as unknown as typeof fetch,
      environment,
    });

    await expect(provider.generate(messages)).rejects.toMatchObject({
      reason: "invalid_response",
      diagnostic: { diagnosticCode: "malformed_payload" },
    });
  });

  it.each([
    [
      "missing content",
      { success: true, result: { choices: [] } },
      { diagnosticCode: "missing_content" },
    ],
    [
      "null content",
      {
        success: true,
        result: {
          choices: [{ message: { content: null }, finish_reason: "stop" }],
        },
      },
      { diagnosticCode: "missing_content", finishReason: "stop" },
    ],
    [
      "empty content",
      { success: true, result: { response: "  " } },
      { diagnosticCode: "empty_content", outputCharacterCount: 0 },
    ],
  ])("diagnoses %s", async (_name, payload, diagnostic) => {
    const provider = new CloudflareAIProvider({
      fetch: vi
        .fn()
        .mockResolvedValue(response(payload)) as unknown as typeof fetch,
      environment,
    });

    await expect(provider.generate(messages)).rejects.toMatchObject({
      reason: "invalid_response",
      diagnostic,
    });
  });

  it("rejects an incomplete reasoning-only response without exposing reasoning", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        success: true,
        result: {
          choices: [
            {
              message: {
                content: null,
                reasoning: "Internal reasoning",
                reasoning_content: "Internal reasoning content",
              },
              finish_reason: "length",
            },
          ],
        },
      }),
    );
    const provider = new CloudflareAIProvider({
      fetch: fetchMock as unknown as typeof fetch,
      environment,
    });

    await expect(provider.generate(messages)).rejects.toMatchObject({
      provider: "cloudflare",
      reason: "invalid_response",
      fallbackAllowed: true,
      diagnostic: {
        diagnosticCode: "incomplete_generation",
        finishReason: "length",
      },
    });
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(request.body as string)).toMatchObject({
      max_completion_tokens: 1_200,
    });
  });

  it("returns valid GLM answer content and ignores reasoning fields", async () => {
    const provider = new CloudflareAIProvider({
      fetch: vi.fn().mockResolvedValue(
        response({
          success: true,
          result: {
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Verified concise answer",
                  reasoning: "Internal reasoning",
                  reasoning_content: "Internal reasoning content",
                },
                finish_reason: "stop",
              },
            ],
          },
        }),
      ) as unknown as typeof fetch,
      environment,
    });

    await expect(provider.generate(messages)).resolves.toBe(
      "Verified concise answer",
    );
  });
});

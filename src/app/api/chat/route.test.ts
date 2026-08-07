import { describe, expect, it, vi } from "vitest";

import { createChatPostHandler } from "@/app/api/chat/route";
import { AIProviderError } from "@/lib/ai/providerErrors";

function request(origin?: string) {
  return new Request("https://portfolio.test/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify({
      locale: "en",
      messages: [{ role: "user", content: "Question" }],
    }),
  });
}

describe("chat route protections", () => {
  it("does not create or call a provider after rate limiting rejects", async () => {
    const providerFactory = vi.fn();
    const post = createChatPostHandler({
      providerFactory,
      rateLimiter: { check: () => ({ allowed: false, retryAfterSeconds: 42 }) },
      clientIdentifier: () => "client",
      originAllowed: () => true,
    });

    const response = await post(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ error: "rate_limited" });
    expect(providerFactory).not.toHaveBeenCalled();
  });

  it("rejects a forbidden origin before reading or rate limiting the request", async () => {
    const rateLimitCheck = vi.fn();
    const providerFactory = vi.fn();
    const post = createChatPostHandler({
      providerFactory,
      rateLimiter: { check: rateLimitCheck },
      clientIdentifier: () => "client",
      originAllowed: () => false,
    });

    const response = await post(request("https://attacker.test"));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "forbidden_origin",
    });
    expect(rateLimitCheck).not.toHaveBeenCalled();
    expect(providerFactory).not.toHaveBeenCalled();
  });

  it("returns 503 for a known provider failure", async () => {
    const post = createChatPostHandler({
      providerFactory: async () => ({
        generate: vi.fn().mockRejectedValue(
          new AIProviderError("resilient", "unavailable", {
            fallbackAllowed: false,
          }),
        ),
      }),
      rateLimiter: { check: () => ({ allowed: true }) },
      clientIdentifier: () => "client",
      originAllowed: () => true,
    });

    const response = await post(request());
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "provider_unavailable",
    });
  });

  it("returns 500 for an unexpected provider exception", async () => {
    const post = createChatPostHandler({
      providerFactory: async () => ({
        generate: vi.fn().mockRejectedValue(new TypeError("unexpected bug")),
      }),
      rateLimiter: { check: () => ({ allowed: true }) },
      clientIdentifier: () => "client",
      originAllowed: () => true,
    });

    const response = await post(request());
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "internal_error",
    });
  });
});

import { describe, expect, it, vi } from "vitest";

import { createChatPostHandler } from "@/app/api/chat/route";
import { recruiterKnowledgeEntries } from "@/data/recruiterKnowledge";
import type { AIProviderGenerateOptions } from "@/lib/ai/provider";
import { AIProviderError } from "@/lib/ai/providerErrors";
import { MAX_REQUEST_BODY_LENGTH } from "@/lib/ai/validation";
import type { ChatTelemetryEvent } from "@/lib/observability/chatTelemetry";

function request(origin?: string, content = "Question") {
  return new Request("https://portfolio.test/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify({
      locale: "en",
      messages: [{ role: "user", content }],
    }),
  });
}

describe("chat route protections", () => {
  it("does not create or call a provider after rate limiting rejects", async () => {
    const generate = vi.fn();
    const providerFactory = vi.fn(async () => ({ generate }));
    const retrieveKnowledge = vi.fn();
    const promptBuilder = vi.fn();
    const post = createChatPostHandler({
      providerFactory,
      retrieveKnowledge,
      promptBuilder,
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
    expect(retrieveKnowledge).not.toHaveBeenCalled();
    expect(promptBuilder).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
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

  it("retrieves before prompt generation and returns server sources", async () => {
    const events: string[] = [];
    const generate = vi.fn().mockResolvedValue("Mock answer");
    const evidence = [
      recruiterKnowledgeEntries.find(
        (entry) => entry.id === "experience-delinternet",
      )!,
    ];
    const post = createChatPostHandler({
      providerFactory: async () => {
        events.push("provider");
        return { generate };
      },
      rateLimiter: { check: () => ({ allowed: true }) },
      clientIdentifier: () => "client",
      originAllowed: () => true,
      retrieveKnowledge: () => {
        events.push("retrieve");
        return {
          entries: evidence,
          queryKind: "general",
          allowDirectContact: false,
        };
      },
      promptBuilder: (options) => {
        events.push("prompt");
        expect(options.evidence).toBe(evidence);
        expect(options.allowDirectContact).toBe(false);
        return [{ role: "user", content: "safe prompt" }];
      },
    });

    const response = await post(request());
    expect(events).toEqual(["retrieve", "prompt", "provider"]);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.message).toBe("Mock answer");
    expect(payload.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "portfolio-experience",
          label: "Professional experience",
        }),
      ]),
    );
  });

  it("sends only relevant verified evidence to the provider", async () => {
    const generate = vi.fn().mockResolvedValue("Mock answer");
    const post = createChatPostHandler({
      providerFactory: async () => ({ generate }),
      rateLimiter: { check: () => ({ allowed: true }) },
      clientIdentifier: () => "client",
      originAllowed: () => true,
    });
    const testingRequest = new Request("https://portfolio.test/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: "en",
        messages: [
          { role: "user", content: "What testing experience does Marc have?" },
        ],
      }),
    });

    const response = await post(testingRequest);
    expect(response.status).toBe(200);
    const providerMessages = generate.mock.calls[0]?.[0];
    const systemContent = providerMessages?.[0]?.content ?? "";
    expect(systemContent).toContain("Testing and code quality");
    expect(systemContent).not.toContain("Education and training");
    expect(systemContent).not.toContain("Professional contact options");
  });

  it("deduplicates and bounds server-generated response sources", async () => {
    const post = createChatPostHandler({
      providerFactory: async () => ({
        generate: vi.fn().mockResolvedValue("Mock answer"),
      }),
      rateLimiter: { check: () => ({ allowed: true }) },
      clientIdentifier: () => "client",
      originAllowed: () => true,
      retrieveKnowledge: () => ({
        entries: recruiterKnowledgeEntries.slice(0, 12),
        queryKind: "role_comparison",
        allowDirectContact: false,
      }),
    });

    const response = await post(request());
    const payload = await response.json();
    expect(payload.sources.length).toBeLessThanOrEqual(4);
    expect(
      new Set(payload.sources.map((source: { id: string }) => source.id)).size,
    ).toBe(payload.sources.length);
  });

  it("keeps ambiguous role contact wording out of the prompt and sources", async () => {
    const generate = vi.fn().mockResolvedValue("Mock role answer");
    const post = createChatPostHandler({
      providerFactory: async () => ({ generate }),
      rateLimiter: { check: () => ({ allowed: true }) },
      clientIdentifier: () => "client",
      originAllowed: () => true,
    });
    const jobDescription = `Compare Marc with this Frontend Developer role.
Responsibilities:
- Build mobile interfaces.
- Maintain direct contact with clients.
- Provide phone support when required.
Requirements:
- React
- TypeScript
- Next.js
- REST APIs`;

    const response = await post(request(undefined, jobDescription));
    const payload = await response.json();
    const providerMessages = generate.mock.calls[0]?.[0];
    const systemContent = providerMessages?.[0]?.content ?? "";

    expect(response.status).toBe(200);
    expect(systemContent).toContain("Strong verified matches");
    expect(systemContent).toContain("Delinternet Telecom");
    expect(systemContent).not.toContain("+353 87 004 1006");
    expect(
      payload.sources.map((source: { id: string }) => source.id),
    ).not.toContain("contact-whatsapp");
  });

  it("allows direct prompt evidence and WhatsApp source on explicit request", async () => {
    const generate = vi.fn().mockResolvedValue("Mock contact answer");
    const post = createChatPostHandler({
      providerFactory: async () => ({ generate }),
      rateLimiter: { check: () => ({ allowed: true }) },
      clientIdentifier: () => "client",
      originAllowed: () => true,
    });

    const response = await post(request(undefined, "What is Marc's WhatsApp?"));
    const payload = await response.json();
    const providerMessages = generate.mock.calls[0]?.[0];
    const systemContent = providerMessages?.[0]?.content ?? "";

    expect(response.status).toBe(200);
    expect(systemContent).toContain("+353 87 004 1006");
    expect(
      payload.sources.map((source: { id: string }) => source.id),
    ).toContain("contact-whatsapp");
  });

  it("records content-free success telemetry without exposing provider publicly", async () => {
    const events: ChatTelemetryEvent[] = [];
    const secretQuestion = "My secret job description is React and TypeScript";
    const generate = vi.fn(
      async (_messages, options?: AIProviderGenerateOptions) => {
        options?.onAttempt?.({
          provider: "cloudflare",
          outcome: "success",
          durationMs: 75,
        });
        return "Mock answer";
      },
    );
    const times = [100, 225];
    const post = createChatPostHandler({
      providerFactory: async () => ({ generate }),
      rateLimiter: { check: () => ({ allowed: true }) },
      clientIdentifier: () => "client",
      originAllowed: () => true,
      telemetry: { record: (event) => events.push(event) },
      performanceNow: () => times.shift() ?? 225,
    });

    const response = await post(request(undefined, secretQuestion));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).not.toHaveProperty("provider");
    expect(events).toEqual([
      expect.objectContaining({
        type: "request_completed",
        provider: "cloudflare",
        durationMs: 125,
        providerDurationMs: 75,
      }),
    ]);
    expect(JSON.stringify(events)).not.toContain(secretQuestion);
    for (const forbidden of [
      "messages",
      "question",
      "content",
      "prompt",
      "history",
      "response",
      "jobDescription",
      "ip",
    ]) {
      expect(events[0]).not.toHaveProperty(forbidden);
    }
  });

  it("sanitizes telemetry for unexpected internal exceptions", async () => {
    const events: ChatTelemetryEvent[] = [];
    const secretQuestion = "My secret job description is confidential";
    const post = createChatPostHandler({
      providerFactory: async () => ({
        generate: vi
          .fn()
          .mockRejectedValue(new Error(`unexpected: ${secretQuestion}`)),
      }),
      rateLimiter: { check: () => ({ allowed: true }) },
      clientIdentifier: () => "client",
      originAllowed: () => true,
      telemetry: { record: (event) => events.push(event) },
    });

    const response = await post(request(undefined, secretQuestion));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "internal_error",
    });
    expect(events).toEqual([
      expect.objectContaining({
        type: "request_failed",
        stage: "internal",
        reason: "unexpected_exception",
      }),
    ]);
    expect(JSON.stringify(events)).not.toContain(secretQuestion);
  });

  it("classifies provider failures without exposing upstream details", async () => {
    const events: ChatTelemetryEvent[] = [];
    const generate = vi.fn(
      async (_messages, options?: AIProviderGenerateOptions) => {
        options?.onAttempt?.({
          provider: "ollama",
          outcome: "failure",
          durationMs: 30_000,
          reason: "timeout",
        });
        throw new AIProviderError("resilient", "unavailable", {
          fallbackAllowed: false,
        });
      },
    );
    const post = createChatPostHandler({
      providerFactory: async () => ({ generate }),
      rateLimiter: { check: () => ({ allowed: true }) },
      clientIdentifier: () => "client",
      originAllowed: () => true,
      telemetry: { record: (event) => events.push(event) },
    });

    const response = await post(request());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "provider_unavailable",
    });
    expect(events).toEqual([
      expect.objectContaining({
        type: "request_failed",
        stage: "ollama",
        reason: "timeout",
      }),
    ]);
  });

  it("rejects a request body above the maximum before provider work", async () => {
    const providerFactory = vi.fn();
    const post = createChatPostHandler({
      providerFactory,
      rateLimiter: { check: () => ({ allowed: true }) },
      clientIdentifier: () => "client",
      originAllowed: () => true,
    });
    const oversized = new Request("https://portfolio.test/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: " ".repeat(MAX_REQUEST_BODY_LENGTH + 1),
    });

    const response = await post(oversized);
    expect(response.status).toBe(400);
    expect(providerFactory).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from "vitest";

import { createChatPostHandler } from "@/app/api/chat/route";
import { recruiterKnowledgeEntries } from "@/data/recruiterKnowledge";
import { AIProviderError } from "@/lib/ai/providerErrors";
import { MAX_REQUEST_BODY_LENGTH } from "@/lib/ai/validation";

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
    const providerFactory = vi.fn();
    const retrieveKnowledge = vi.fn();
    const post = createChatPostHandler({
      providerFactory,
      retrieveKnowledge,
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

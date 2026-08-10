import { describe, expect, it } from "vitest";

import { resolveClientIdentifier } from "@/lib/security/clientIdentifier";
import { isRequestOriginAllowed } from "@/lib/security/originProtection";

describe("client identification", () => {
  it("prefers trusted proxy header order and hashes the raw IP", () => {
    const request = new Request("https://portfolio.test/api/chat", {
      headers: {
        "CF-Connecting-IP": "203.0.113.1",
        "X-Real-IP": "203.0.113.2",
        "X-Forwarded-For": "203.0.113.3, 203.0.113.4",
      },
    });
    const identifier = resolveClientIdentifier(request);
    expect(identifier).toMatch(/^ip:[a-f0-9]{32}$/);
    expect(identifier).not.toContain("203.0.113.1");
  });

  it("uses the first valid forwarded IP and a bounded fallback otherwise", () => {
    const forwarded = resolveClientIdentifier(
      new Request("https://portfolio.test/api/chat", {
        headers: { "X-Forwarded-For": "invalid, 203.0.113.5" },
      }),
    );
    const fallback = resolveClientIdentifier(
      new Request("https://portfolio.test/api/chat", {
        headers: { "User-Agent": "test-agent", "Accept-Language": "en" },
      }),
    );
    expect(forwarded).toMatch(/^ip:/);
    expect(fallback).toMatch(/^fallback:[a-f0-9]{32}$/);
  });
});

describe("origin protection", () => {
  it("allows a missing origin, the current origin and configured origins", () => {
    expect(
      isRequestOriginAllowed(new Request("https://portfolio.test/api/chat")),
    ).toBe(true);
    expect(
      isRequestOriginAllowed(
        new Request("https://portfolio.test/api/chat", {
          headers: { Origin: "https://portfolio.test" },
        }),
      ),
    ).toBe(true);
    expect(
      isRequestOriginAllowed(
        new Request("https://portfolio.test/api/chat", {
          headers: { Origin: "https://allowed.test" },
        }),
        "invalid,https://allowed.test/path",
      ),
    ).toBe(true);
  });

  it("rejects a present disallowed origin without a wildcard", () => {
    expect(
      isRequestOriginAllowed(
        new Request("https://portfolio.test/api/chat", {
          headers: { Origin: "https://attacker.test" },
        }),
        "*",
        "production",
      ),
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { ChatRateLimiter } from "@/lib/security/chatRateLimiter";

describe("ChatRateLimiter", () => {
  it("enforces the fixed per-minute limit and calculates Retry-After", () => {
    let now = 1_000;
    const limiter = new ChatRateLimiter({
      perMinute: 1,
      perDay: 10,
      globalPerDay: 10,
      now: () => now,
    });

    expect(limiter.check("client")).toEqual({ allowed: true });
    expect(limiter.check("client")).toEqual({
      allowed: false,
      retryAfterSeconds: 59,
    });

    now = 60_000;
    expect(limiter.check("client")).toEqual({ allowed: true });
  });

  it("enforces the per-client daily limit", () => {
    const now = Date.UTC(2026, 7, 6, 12);
    const limiter = new ChatRateLimiter({
      perMinute: 10,
      perDay: 1,
      globalPerDay: 10,
      now: () => now,
    });
    expect(limiter.check("client").allowed).toBe(true);
    expect(limiter.check("client")).toEqual({
      allowed: false,
      retryAfterSeconds: 43_200,
    });
  });

  it("enforces the global daily limit across clients", () => {
    const limiter = new ChatRateLimiter({
      perMinute: 10,
      perDay: 10,
      globalPerDay: 2,
      now: () => Date.UTC(2026, 7, 6, 12),
    });
    expect(limiter.check("one").allowed).toBe(true);
    expect(limiter.check("two").allowed).toBe(true);
    expect(limiter.check("three").allowed).toBe(false);
  });

  it("does not allocate new clients after global exhaustion", () => {
    const limiter = new ChatRateLimiter({
      perMinute: 10,
      perDay: 10,
      globalPerDay: 1,
      now: () => Date.UTC(2026, 7, 6, 12),
    });

    expect(limiter.check("client-a").allowed).toBe(true);
    expect(limiter.clientCount).toBe(1);

    for (const identifier of ["client-b", "client-c", "client-d"]) {
      expect(limiter.check(identifier).allowed).toBe(false);
      expect(limiter.clientCount).toBe(1);
    }
  });

  it("caps tracked clients without disrupting existing identifiers", () => {
    const limiter = new ChatRateLimiter({
      perMinute: 10,
      perDay: 10,
      globalPerDay: 100,
      maxTrackedClients: 2,
      now: () => Date.UTC(2026, 7, 6, 12),
    });

    expect(limiter.check("client-a").allowed).toBe(true);
    expect(limiter.check("client-b").allowed).toBe(true);
    expect(limiter.clientCount).toBe(2);

    expect(limiter.check("client-c")).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(limiter.clientCount).toBe(2);
    expect(limiter.check("client-a").allowed).toBe(true);
    expect(limiter.clientCount).toBe(2);
  });

  it("resets daily counters at midnight UTC", () => {
    let now = Date.UTC(2026, 7, 6, 23, 59, 59);
    const limiter = new ChatRateLimiter({
      perMinute: 10,
      perDay: 1,
      globalPerDay: 1,
      now: () => now,
    });
    expect(limiter.check("client").allowed).toBe(true);
    expect(limiter.check("client").allowed).toBe(false);
    now += 2_000;
    expect(limiter.check("client").allowed).toBe(true);
  });

  it("opportunistically removes expired client entries", () => {
    let now = 100_000;
    const limiter = new ChatRateLimiter({
      perMinute: 10,
      perDay: 10,
      globalPerDay: 100,
      now: () => now,
      staleEntryMs: 1_000,
      cleanupIntervalMs: 100,
    });
    limiter.check("expired");
    expect(limiter.clientCount).toBe(1);
    now += 1_101;
    limiter.check("current");
    expect(limiter.clientCount).toBe(1);
  });

  it("uses safe defaults for invalid environment values", () => {
    const limiter = ChatRateLimiter.fromEnvironment({
      NODE_ENV: "test",
      CHAT_RATE_LIMIT_PER_MINUTE: "0",
      CHAT_RATE_LIMIT_PER_DAY: "invalid",
      CHAT_GLOBAL_DAILY_LIMIT: "-2",
    });
    expect(limiter.check("client").allowed).toBe(true);
  });
});

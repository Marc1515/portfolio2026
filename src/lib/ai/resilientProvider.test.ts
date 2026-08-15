import { describe, expect, it, vi } from "vitest";

import type { AIProvider } from "@/lib/ai/provider";
import { AIProviderError } from "@/lib/ai/providerErrors";
import { ResilientAIProvider } from "@/lib/ai/resilientProvider";

const prompt = [{ role: "user" as const, content: "Question" }];

function provider(generate: AIProvider["generate"]): AIProvider {
  return { generate };
}

describe("ResilientAIProvider", () => {
  it("does not call Ollama after Cloudflare succeeds", async () => {
    const cloudflare = vi.fn().mockResolvedValue("Primary answer");
    const ollama = vi.fn().mockResolvedValue("Fallback answer");
    const resilient = new ResilientAIProvider(
      provider(cloudflare),
      provider(ollama),
    );

    await expect(resilient.generate(prompt)).resolves.toBe("Primary answer");
    expect(cloudflare).toHaveBeenCalledOnce();
    expect(ollama).not.toHaveBeenCalled();
  });

  it.each([
    "timeout",
    "rate_limited",
    "invalid_response",
    "unavailable",
  ] as const)(
    "calls Ollama once after a fallback-eligible Cloudflare %s failure",
    async (reason) => {
      const cloudflare = vi
        .fn()
        .mockRejectedValue(
          new AIProviderError("cloudflare", reason, { fallbackAllowed: true }),
        );
      const ollama = vi.fn().mockResolvedValue("Fallback answer");
      const resilient = new ResilientAIProvider(
        provider(cloudflare),
        provider(ollama),
      );

      await expect(resilient.generate(prompt)).resolves.toBe("Fallback answer");
      expect(cloudflare).toHaveBeenCalledOnce();
      expect(ollama).toHaveBeenCalledOnce();
    },
  );

  it("uses Ollama when Cloudflare configuration is missing", async () => {
    const cloudflare = vi.fn().mockRejectedValue(
      new AIProviderError("cloudflare", "configuration", {
        fallbackAllowed: true,
      }),
    );
    const ollama = vi.fn().mockResolvedValue("Fallback answer");
    const resilient = new ResilientAIProvider(
      provider(cloudflare),
      provider(ollama),
    );

    await expect(resilient.generate(prompt)).resolves.toBe("Fallback answer");
    expect(ollama).toHaveBeenCalledOnce();
  });

  it("converts a known Ollama failure to the generic resilient error", async () => {
    const cloudflare = vi.fn().mockRejectedValue(
      new AIProviderError("cloudflare", "unavailable", {
        fallbackAllowed: true,
      }),
    );
    const ollama = vi
      .fn()
      .mockRejectedValue(
        new AIProviderError("ollama", "timeout", { fallbackAllowed: false }),
      );
    const resilient = new ResilientAIProvider(
      provider(cloudflare),
      provider(ollama),
    );

    await expect(resilient.generate(prompt)).rejects.toMatchObject({
      provider: "resilient",
      reason: "unavailable",
    });
    expect(cloudflare).toHaveBeenCalledOnce();
    expect(ollama).toHaveBeenCalledOnce();
  });

  it("converts an Ollama configuration failure to provider unavailable", async () => {
    const cloudflare = vi.fn().mockRejectedValue(
      new AIProviderError("cloudflare", "timeout", {
        fallbackAllowed: true,
      }),
    );
    const ollama = vi.fn().mockRejectedValue(
      new AIProviderError("ollama", "configuration", {
        fallbackAllowed: false,
      }),
    );
    const resilient = new ResilientAIProvider(
      provider(cloudflare),
      provider(ollama),
    );

    await expect(resilient.generate(prompt)).rejects.toMatchObject({
      provider: "resilient",
      reason: "unavailable",
    });
    expect(cloudflare).toHaveBeenCalledOnce();
    expect(ollama).toHaveBeenCalledOnce();
  });

  it("waits for the Cloudflare failure before starting one fallback attempt", async () => {
    let rejectCloudflare: ((error: Error) => void) | undefined;
    const cloudflare = vi.fn(
      () =>
        new Promise<string>((_resolve, reject) => {
          rejectCloudflare = reject;
        }),
    );
    const ollama = vi.fn().mockResolvedValue("Fallback answer");
    const resilient = new ResilientAIProvider(
      provider(cloudflare),
      provider(ollama),
    );

    const generation = resilient.generate(prompt);
    await Promise.resolve();
    expect(cloudflare).toHaveBeenCalledOnce();
    expect(ollama).not.toHaveBeenCalled();

    rejectCloudflare?.(
      new AIProviderError("cloudflare", "timeout", {
        fallbackAllowed: true,
      }),
    );
    await expect(generation).resolves.toBe("Fallback answer");
    expect(ollama).toHaveBeenCalledOnce();
  });

  it("propagates an unexpected Ollama programming error unchanged", async () => {
    const cloudflare = vi.fn().mockRejectedValue(
      new AIProviderError("cloudflare", "unavailable", {
        fallbackAllowed: true,
      }),
    );
    const unexpectedError = new TypeError("unexpected bug");
    const ollama = vi.fn().mockRejectedValue(unexpectedError);
    const resilient = new ResilientAIProvider(
      provider(cloudflare),
      provider(ollama),
    );

    await expect(resilient.generate(prompt)).rejects.toBe(unexpectedError);
    expect(cloudflare).toHaveBeenCalledOnce();
    expect(ollama).toHaveBeenCalledOnce();
  });

  it("skips Cloudflare during cooldown and recovers afterward", async () => {
    let now = 1_000;
    const cloudflare = vi
      .fn()
      .mockRejectedValueOnce(
        new AIProviderError("cloudflare", "rate_limited", {
          fallbackAllowed: true,
          retryAfterSeconds: 10,
        }),
      )
      .mockResolvedValue("Recovered primary");
    const ollama = vi.fn().mockResolvedValue("Fallback answer");
    const resilient = new ResilientAIProvider(
      provider(cloudflare),
      provider(ollama),
      {
        now: () => now,
        cloudflareCooldownMs: 5_000,
      },
    );

    await expect(resilient.generate(prompt)).resolves.toBe("Fallback answer");
    now += 5_000;
    await expect(resilient.generate(prompt)).resolves.toBe("Fallback answer");
    expect(cloudflare).toHaveBeenCalledOnce();

    now += 5_001;
    await expect(resilient.generate(prompt)).resolves.toBe("Recovered primary");
    expect(cloudflare).toHaveBeenCalledTimes(2);
    expect(ollama).toHaveBeenCalledTimes(2);
  });

  it("does not start a global cooldown after a generation-specific invalid response", async () => {
    const cloudflare = vi
      .fn()
      .mockRejectedValueOnce(
        new AIProviderError("cloudflare", "invalid_response", {
          fallbackAllowed: true,
          diagnostic: { diagnosticCode: "incomplete_generation" },
        }),
      )
      .mockResolvedValueOnce("Primary answer on next request");
    const ollama = vi.fn().mockResolvedValue("Fallback answer");
    const resilient = new ResilientAIProvider(
      provider(cloudflare),
      provider(ollama),
    );

    await expect(resilient.generate(prompt)).resolves.toBe("Fallback answer");
    await expect(resilient.generate(prompt)).resolves.toBe(
      "Primary answer on next request",
    );
    expect(cloudflare).toHaveBeenCalledTimes(2);
    expect(ollama).toHaveBeenCalledOnce();
  });

  it.each(["timeout", "unavailable"] as const)(
    "starts a global cooldown after a Cloudflare %s failure",
    async (reason) => {
      const cloudflare = vi.fn().mockRejectedValue(
        new AIProviderError("cloudflare", reason, {
          fallbackAllowed: true,
        }),
      );
      const ollama = vi.fn().mockResolvedValue("Fallback answer");
      const resilient = new ResilientAIProvider(
        provider(cloudflare),
        provider(ollama),
      );

      await expect(resilient.generate(prompt)).resolves.toBe("Fallback answer");
      await expect(resilient.generate(prompt)).resolves.toBe("Fallback answer");
      expect(cloudflare).toHaveBeenCalledOnce();
      expect(ollama).toHaveBeenCalledTimes(2);
    },
  );

  it("caps an excessive Retry-After cooldown at five minutes", async () => {
    let now = 0;
    const cloudflare = vi
      .fn()
      .mockRejectedValueOnce(
        new AIProviderError("cloudflare", "rate_limited", {
          fallbackAllowed: true,
          retryAfterSeconds: 86_400,
        }),
      )
      .mockResolvedValue("Recovered primary");
    const ollama = vi.fn().mockResolvedValue("Fallback answer");
    const resilient = new ResilientAIProvider(
      provider(cloudflare),
      provider(ollama),
      { now: () => now, cloudflareCooldownMs: 1_000 },
    );

    await expect(resilient.generate(prompt)).resolves.toBe("Fallback answer");
    now = 299_999;
    await expect(resilient.generate(prompt)).resolves.toBe("Fallback answer");
    expect(cloudflare).toHaveBeenCalledOnce();

    now = 300_001;
    await expect(resilient.generate(prompt)).resolves.toBe("Recovered primary");
    expect(cloudflare).toHaveBeenCalledTimes(2);
  });

  it("reports content-free provider attribution and attempt durations", async () => {
    let performanceTime = 0;
    const attempts: unknown[] = [];
    const cloudflare = vi.fn().mockImplementation(async () => {
      performanceTime = 25;
      throw new AIProviderError("cloudflare", "timeout", {
        fallbackAllowed: true,
      });
    });
    const ollama = vi.fn().mockImplementation(async () => {
      performanceTime = 60;
      return "Fallback answer";
    });
    const resilient = new ResilientAIProvider(
      provider(cloudflare),
      provider(ollama),
      { performanceNow: () => performanceTime },
    );

    await expect(
      resilient.generate(prompt, {
        onAttempt: (attempt) => attempts.push(attempt),
      }),
    ).resolves.toBe("Fallback answer");
    expect(attempts).toEqual([
      {
        provider: "cloudflare",
        outcome: "failure",
        durationMs: 25,
        reason: "timeout",
      },
      {
        provider: "ollama",
        outcome: "success",
        durationMs: 35,
      },
    ]);
  });

  it("forwards only bounded invalid-response diagnostics to attempt telemetry", async () => {
    const attempts: unknown[] = [];
    const cloudflare = vi.fn().mockRejectedValue(
      new AIProviderError("cloudflare", "invalid_response", {
        fallbackAllowed: true,
        diagnostic: {
          diagnosticCode: "incomplete_generation",
          finishReason: "length",
          outputCharacterCount: 0,
        },
      }),
    );
    const resilient = new ResilientAIProvider(
      provider(cloudflare),
      provider(vi.fn().mockResolvedValue("Fallback answer")),
      { performanceNow: () => 10 },
    );

    await resilient.generate(prompt, {
      onAttempt: (attempt) => attempts.push(attempt),
    });
    expect(attempts[0]).toEqual({
      provider: "cloudflare",
      outcome: "failure",
      durationMs: 0,
      reason: "invalid_response",
      diagnosticCode: "incomplete_generation",
      finishReason: "length",
      outputCharacterCount: 0,
    });
  });

  it.each(["timeout", "busy"] as const)(
    "returns a recoverable resilient failure when invalid Cloudflare output is followed by Ollama %s",
    async (reason) => {
      const cloudflare = vi.fn().mockRejectedValue(
        new AIProviderError("cloudflare", "invalid_response", {
          fallbackAllowed: true,
        }),
      );
      const ollama = vi
        .fn()
        .mockRejectedValue(
          new AIProviderError("ollama", reason, { fallbackAllowed: false }),
        );
      const resilient = new ResilientAIProvider(
        provider(cloudflare),
        provider(ollama),
      );

      await expect(resilient.generate(prompt)).rejects.toMatchObject({
        provider: "resilient",
        reason: "unavailable",
        fallbackAllowed: false,
      });
      expect(cloudflare).toHaveBeenCalledOnce();
      expect(ollama).toHaveBeenCalledOnce();
    },
  );
});

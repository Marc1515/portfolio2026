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

  it("calls Ollama once after a Cloudflare failure", async () => {
    const cloudflare = vi
      .fn()
      .mockRejectedValue(
        new AIProviderError("cloudflare", "timeout", { fallbackAllowed: true }),
      );
    const ollama = vi.fn().mockResolvedValue("Fallback answer");
    const resilient = new ResilientAIProvider(
      provider(cloudflare),
      provider(ollama),
    );

    await expect(resilient.generate(prompt)).resolves.toBe("Fallback answer");
    expect(cloudflare).toHaveBeenCalledOnce();
    expect(ollama).toHaveBeenCalledOnce();
  });

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

  it("returns one generic internal provider error when both fail", async () => {
    const cloudflare = vi.fn().mockRejectedValue(
      new AIProviderError("cloudflare", "unavailable", {
        fallbackAllowed: true,
      }),
    );
    const ollama = vi
      .fn()
      .mockRejectedValue(
        new AIProviderError("ollama", "busy", { fallbackAllowed: false }),
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
});

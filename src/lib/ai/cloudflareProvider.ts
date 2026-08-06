import "server-only";

import {
  AIProviderError,
  AIProviderUnavailableError,
  type AIProvider,
} from "@/lib/ai/provider";
import type { AIModelMessage } from "@/lib/ai/promptBuilder";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_LENGTH = 2_000;

interface CloudflareConfiguration {
  accountId: string;
  apiToken: string;
  model: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getConfiguration(): CloudflareConfiguration {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const model = process.env.CLOUDFLARE_AI_MODEL?.trim();

  if (!accountId || !apiToken || !model) {
    throw new AIProviderUnavailableError();
  }

  return { accountId, apiToken, model };
}

function extractGeneratedText(value: unknown): string | null {
  if (!isRecord(value) || value.success !== true || !isRecord(value.result)) {
    return null;
  }

  if (typeof value.result.response === "string") {
    return value.result.response;
  }

  const choices = value.result.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const firstChoice = choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    return null;
  }

  return typeof firstChoice.message.content === "string"
    ? firstChoice.message.content
    : null;
}

export class CloudflareAIProvider implements AIProvider {
  async generate(messages: AIModelMessage[]): Promise<string> {
    const { accountId, apiToken, model } = getConfiguration();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const encodedModelPath = model
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${encodedModelPath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            temperature: 0.2,
            max_completion_tokens: 350,
            stream: false,
          }),
          cache: "no-store",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new AIProviderError();
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new AIProviderError();
      }

      const generatedText = extractGeneratedText(payload)?.trim();
      if (!generatedText || generatedText.length > MAX_RESPONSE_LENGTH) {
        throw new AIProviderError();
      }

      return generatedText;
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      throw new AIProviderError();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

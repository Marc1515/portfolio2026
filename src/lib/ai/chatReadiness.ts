import "server-only";

import { normalizeOllamaChatUrl } from "@/lib/ai/ollamaProvider";

export type ChatReadinessStatus = "ok" | "degraded" | "unavailable";
type ChatEnvironment = Readonly<Record<string, string | undefined>>;

export interface ChatReadiness {
  status: ChatReadinessStatus;
  cloudflareConfigured: boolean;
  ollamaConfigured: boolean;
}

function hasSafeValue(value: string | undefined, maximumLength = 500) {
  const normalized = value?.trim();
  return Boolean(
    normalized &&
    normalized.length <= maximumLength &&
    !/[\u0000-\u001f\u007f]/.test(normalized),
  );
}

export function getChatReadiness(
  environment: ChatEnvironment = process.env,
): ChatReadiness {
  const cloudflareConfigured =
    hasSafeValue(environment.CLOUDFLARE_ACCOUNT_ID) &&
    hasSafeValue(environment.CLOUDFLARE_API_TOKEN) &&
    hasSafeValue(environment.CLOUDFLARE_AI_MODEL);
  const ollamaBaseUrl =
    environment.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434";
  const ollamaConfigured =
    hasSafeValue(environment.OLLAMA_MODEL, 200) &&
    normalizeOllamaChatUrl(ollamaBaseUrl) !== null;

  return {
    status:
      cloudflareConfigured && ollamaConfigured
        ? "ok"
        : cloudflareConfigured || ollamaConfigured
          ? "degraded"
          : "unavailable",
    cloudflareConfigured,
    ollamaConfigured,
  };
}

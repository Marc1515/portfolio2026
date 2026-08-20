import { isChatEvidenceSource, MAX_PUBLIC_SOURCES } from "@/lib/chatEvidence";
import { MAX_ASSISTANT_MESSAGE_LENGTH } from "@/lib/ai/validation";
import type {
  ChatErrorCode,
  ChatErrorResponse,
  ChatLocale,
  ChatResponse,
  RecruiterMessage,
} from "@/types/chat";

export type ChatRequestError = {
  type:
    | "generic"
    | "network_unavailable"
    | "provider_unavailable"
    | "rate_limited"
    | "invalid_request"
    | "job_description_too_long"
    | "forbidden"
    | "internal";
  retryAfterSeconds?: number;
};

export type ChatRequestResult =
  | { ok: true; response: ChatResponse }
  | { ok: false; error: ChatRequestError };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isChatResponse(value: unknown): value is ChatResponse {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    value.message.trim().length > 0 &&
    value.message.length <= MAX_ASSISTANT_MESSAGE_LENGTH &&
    Array.isArray(value.sources) &&
    value.sources.length <= MAX_PUBLIC_SOURCES &&
    value.sources.every(isChatEvidenceSource)
  );
}

function isChatErrorResponse(value: unknown): value is ChatErrorResponse {
  if (!isRecord(value) || typeof value.error !== "string") return false;
  const codes: ChatErrorCode[] = [
    "invalid_request",
    "job_description_too_long",
    "forbidden_origin",
    "rate_limited",
    "provider_unavailable",
    "internal_error",
  ];
  return (
    codes.includes(value.error as ChatErrorCode) &&
    (value.retryable === undefined || typeof value.retryable === "boolean")
  );
}

function classifyError(
  payload: unknown,
  retryAfterHeader: string | null,
): ChatRequestError {
  if (!isChatErrorResponse(payload)) return { type: "generic" };

  switch (payload.error) {
    case "rate_limited": {
      const retryAfterSeconds = Number(retryAfterHeader);
      return {
        type: "rate_limited",
        retryAfterSeconds:
          Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? Math.ceil(retryAfterSeconds)
            : undefined,
      };
    }
    case "provider_unavailable":
      return { type: "provider_unavailable" };
    case "invalid_request":
      return { type: "invalid_request" };
    case "job_description_too_long":
      return { type: "job_description_too_long" };
    case "forbidden_origin":
      return { type: "forbidden" };
    case "internal_error":
      return { type: "internal" };
  }
}

export async function requestChatAnswer(
  locale: ChatLocale,
  messages: RecruiterMessage[],
  fetchImplementation: typeof fetch = fetch,
): Promise<ChatRequestResult> {
  try {
    const response = await fetchImplementation("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, messages }),
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // A malformed response is handled as a generic public error.
    }

    if (response.ok && isChatResponse(payload)) {
      return { ok: true, response: payload };
    }

    return {
      ok: false,
      error: classifyError(payload, response.headers.get("retry-after")),
    };
  } catch {
    return { ok: false, error: { type: "network_unavailable" } };
  }
}

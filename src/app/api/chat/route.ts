import { buildRecruiterPrompt } from "@/lib/ai/promptBuilder";
import { createAIProvider, type AIProvider } from "@/lib/ai/provider";
import { AIProviderError } from "@/lib/ai/providerErrors";
import { MAX_REQUEST_BODY_LENGTH, parseChatRequest } from "@/lib/ai/validation";
import {
  ChatRateLimiter,
  type RateLimitResult,
} from "@/lib/security/chatRateLimiter";
import { resolveClientIdentifier } from "@/lib/security/clientIdentifier";
import { isRequestOriginAllowed } from "@/lib/security/originProtection";
import type {
  ChatErrorCode,
  ChatErrorResponse,
  ChatResponse,
} from "@/types/chat";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

interface ChatHandlerDependencies {
  providerFactory: () => Promise<AIProvider>;
  rateLimiter: { check(clientIdentifier: string): RateLimitResult };
  clientIdentifier: (request: Request) => string;
  originAllowed: (request: Request) => boolean;
}

function errorResponse(
  error: ChatErrorCode,
  status: number,
  additionalHeaders: Record<string, string> = {},
) {
  return Response.json({ error } satisfies ChatErrorResponse, {
    status,
    headers: { ...RESPONSE_HEADERS, ...additionalHeaders },
  });
}

export function createChatPostHandler(dependencies: ChatHandlerDependencies) {
  return async function post(request: Request) {
    if (!dependencies.originAllowed(request)) {
      return errorResponse("forbidden_origin", 403);
    }

    const contentType = request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      .trim()
      .toLowerCase();

    if (contentType !== "application/json") {
      return errorResponse("invalid_request", 400);
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (
      !Number.isFinite(declaredLength) ||
      declaredLength < 0 ||
      declaredLength > MAX_REQUEST_BODY_LENGTH
    ) {
      return errorResponse("invalid_request", 400);
    }

    let rawBody: string;
    try {
      rawBody = await request.text();
    } catch {
      return errorResponse("invalid_request", 400);
    }

    if (
      rawBody.length === 0 ||
      new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BODY_LENGTH
    ) {
      return errorResponse("invalid_request", 400);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return errorResponse("invalid_request", 400);
    }

    const chatRequest = parseChatRequest(body);
    if (!chatRequest) {
      return errorResponse("invalid_request", 400);
    }

    const rateLimit = dependencies.rateLimiter.check(
      dependencies.clientIdentifier(request),
    );
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(rateLimit.retryAfterSeconds ?? 60),
      );
      return errorResponse("rate_limited", 429, {
        "Retry-After": String(retryAfterSeconds),
      });
    }

    try {
      const messages = buildRecruiterPrompt(
        chatRequest.locale,
        chatRequest.messages,
      );
      const provider = await dependencies.providerFactory();
      const message = await provider.generate(messages);

      return Response.json({ message } satisfies ChatResponse, {
        headers: RESPONSE_HEADERS,
      });
    } catch (error) {
      if (error instanceof AIProviderError) {
        return errorResponse("provider_unavailable", 503);
      }

      return errorResponse("internal_error", 500);
    }
  };
}

const rateLimiter = ChatRateLimiter.fromEnvironment();

export const POST = createChatPostHandler({
  providerFactory: createAIProvider,
  rateLimiter,
  clientIdentifier: resolveClientIdentifier,
  originAllowed: isRequestOriginAllowed,
});

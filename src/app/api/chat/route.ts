import { buildRecruiterPrompt } from "@/lib/ai/promptBuilder";
import {
  buildPublicEvidenceSources,
  retrieveRecruiterKnowledge,
  type KnowledgeRetrievalResult,
} from "@/lib/ai/knowledgeRetriever";
import {
  createAIProvider,
  type AIProvider,
  type AIProviderAttemptResult,
} from "@/lib/ai/provider";
import { AIProviderError } from "@/lib/ai/providerErrors";
import {
  evaluateRecruiterIntent,
  type RecruiterIntentDecision,
} from "@/lib/ai/recruiterIntentGuard";
import { MAX_REQUEST_BODY_LENGTH, parseChatRequest } from "@/lib/ai/validation";
import {
  chatTelemetry,
  type ChatTelemetry,
  type ChatTelemetryEvent,
  type ChatTelemetryFailureReason,
  type ChatTelemetryFailureStage,
} from "@/lib/observability/chatTelemetry";
import {
  ChatRateLimiter,
  type RateLimitResult,
} from "@/lib/security/chatRateLimiter";
import { resolveClientIdentifier } from "@/lib/security/clientIdentifier";
import { isRequestOriginAllowed } from "@/lib/security/originProtection";
import type {
  ChatErrorCode,
  ChatErrorResponse,
  ChatRequest,
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
  retrieveKnowledge?: (
    locale: ChatRequest["locale"],
    messages: ChatRequest["messages"],
  ) => KnowledgeRetrievalResult;
  promptBuilder?: typeof buildRecruiterPrompt;
  intentGuard?: (
    locale: ChatRequest["locale"],
    messages: ChatRequest["messages"],
  ) => RecruiterIntentDecision;
  telemetry?: ChatTelemetry;
  performanceNow?: () => number;
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
    const telemetry = dependencies.telemetry ?? chatTelemetry;
    const performanceNow =
      dependencies.performanceNow ?? (() => performance.now());
    const startedAt = performanceNow();
    const durationMs = () =>
      Math.max(0, Math.round(performanceNow() - startedAt));
    const record = (event: ChatTelemetryEvent) => {
      try {
        telemetry.record(event);
      } catch {
        // Telemetry must never affect the public chat path.
      }
    };
    const fail = (
      error: ChatErrorCode,
      status: number,
      stage: ChatTelemetryFailureStage,
      reason: ChatTelemetryFailureReason,
      additionalHeaders: Record<string, string> = {},
    ) => {
      record({
        type: "request_failed",
        stage,
        reason,
        durationMs: durationMs(),
      });
      return errorResponse(error, status, additionalHeaders);
    };

    if (!dependencies.originAllowed(request)) {
      return fail("forbidden_origin", 403, "origin", "forbidden_origin");
    }

    const contentType = request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      .trim()
      .toLowerCase();

    if (contentType !== "application/json") {
      return fail("invalid_request", 400, "validation", "invalid_request");
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (
      !Number.isFinite(declaredLength) ||
      declaredLength < 0 ||
      declaredLength > MAX_REQUEST_BODY_LENGTH
    ) {
      return fail("invalid_request", 400, "validation", "invalid_request");
    }

    let rawBody: string;
    try {
      rawBody = await request.text();
    } catch {
      return fail("invalid_request", 400, "validation", "invalid_request");
    }

    if (
      rawBody.length === 0 ||
      new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BODY_LENGTH
    ) {
      return fail("invalid_request", 400, "validation", "invalid_request");
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return fail("invalid_request", 400, "validation", "invalid_request");
    }

    const chatRequest = parseChatRequest(body);
    if (!chatRequest) {
      return fail("invalid_request", 400, "validation", "invalid_request");
    }

    const rateLimit = dependencies.rateLimiter.check(
      dependencies.clientIdentifier(request),
    );
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(rateLimit.retryAfterSeconds ?? 60),
      );
      return fail("rate_limited", 429, "rate_limit", "limit_exceeded", {
        "Retry-After": String(retryAfterSeconds),
      });
    }

    let stage: "intent" | "retrieval" | "provider" | "internal" = "intent";
    let latestProviderAttempt: AIProviderAttemptResult | undefined;
    try {
      const intentDecision = (
        dependencies.intentGuard ?? evaluateRecruiterIntent
      )(chatRequest.locale, chatRequest.messages);
      if (intentDecision.kind !== "professional") {
        record({
          type: "request_handled_locally",
          reason: intentDecision.kind,
          durationMs: durationMs(),
        });
        return Response.json(
          {
            message: intentDecision.message,
            sources: [],
          } satisfies ChatResponse,
          { headers: RESPONSE_HEADERS },
        );
      }

      stage = "retrieval";
      const retrieval = (
        dependencies.retrieveKnowledge ?? retrieveRecruiterKnowledge
      )(chatRequest.locale, chatRequest.messages);
      const messages = (dependencies.promptBuilder ?? buildRecruiterPrompt)({
        locale: chatRequest.locale,
        history: chatRequest.messages,
        evidence: retrieval.entries,
        queryKind: retrieval.queryKind,
        allowDirectContact: retrieval.allowDirectContact,
      });
      stage = "provider";
      const provider = await dependencies.providerFactory();
      const message = await provider.generate(messages, {
        onAttempt: (attempt) => {
          latestProviderAttempt = attempt;
        },
      });
      stage = "internal";
      const sources = buildPublicEvidenceSources(
        retrieval.entries,
        chatRequest.locale,
        { allowDirectContact: retrieval.allowDirectContact },
      );

      const successfulAttempt =
        latestProviderAttempt?.outcome === "success"
          ? latestProviderAttempt
          : undefined;
      if (successfulAttempt) {
        record({
          type: "request_completed",
          queryKind: retrieval.queryKind,
          provider: successfulAttempt.provider,
          durationMs: durationMs(),
          providerDurationMs: successfulAttempt.durationMs,
          retrievedEntryCount: retrieval.entries.length,
          sourceCount: sources.length,
        });
      }

      return Response.json({ message, sources } satisfies ChatResponse, {
        headers: RESPONSE_HEADERS,
      });
    } catch (error) {
      if (error instanceof AIProviderError) {
        const providerStage =
          latestProviderAttempt?.provider ??
          (error.provider === "cloudflare" || error.provider === "ollama"
            ? error.provider
            : "provider");
        return fail(
          "provider_unavailable",
          503,
          providerStage,
          latestProviderAttempt?.reason ?? error.reason,
        );
      }

      return fail(
        "internal_error",
        500,
        stage === "retrieval" ? "retrieval" : "internal",
        "unexpected_exception",
      );
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

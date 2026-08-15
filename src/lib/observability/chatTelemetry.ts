import "server-only";

import type { RecruiterQueryKind } from "@/lib/ai/knowledgeRetriever";
import type { AnsweringProvider } from "@/lib/ai/provider";

export type ChatTelemetryFailureStage =
  | "origin"
  | "validation"
  | "rate_limit"
  | "retrieval"
  | "cloudflare"
  | "ollama"
  | "provider"
  | "internal";

export type ChatTelemetryFailureReason =
  | "forbidden_origin"
  | "invalid_request"
  | "limit_exceeded"
  | "configuration"
  | "authentication"
  | "rate_limited"
  | "timeout"
  | "busy"
  | "unavailable"
  | "invalid_response"
  | "internal"
  | "unexpected_exception";

export type ChatTelemetryEvent =
  | {
      type: "provider_attempt";
      provider: AnsweringProvider;
      outcome: "success";
      durationMs: number;
    }
  | {
      type: "provider_attempt";
      provider: AnsweringProvider;
      outcome: "failure";
      reason: ChatTelemetryFailureReason;
      durationMs: number;
    }
  | {
      type: "request_completed";
      queryKind: RecruiterQueryKind;
      provider: AnsweringProvider;
      durationMs: number;
      providerDurationMs?: number;
      retrievedEntryCount: number;
      sourceCount: number;
    }
  | {
      type: "request_failed";
      stage: ChatTelemetryFailureStage;
      reason: ChatTelemetryFailureReason;
      durationMs: number;
    }
  | {
      type: "request_handled_locally";
      reason: "out_of_scope" | "sensitive_request" | "needs_job_description";
      durationMs: number;
    };

export interface ChatTelemetry {
  record(event: ChatTelemetryEvent): void;
}

interface StructuredChatTelemetryOptions {
  environment?: Readonly<Record<string, string | undefined>>;
  write?: (line: string) => void;
}

export class StructuredChatTelemetry implements ChatTelemetry {
  private readonly enabled: boolean;
  private readonly write: (line: string) => void;

  constructor(options: StructuredChatTelemetryOptions = {}) {
    this.enabled =
      (options.environment ?? process.env).CHAT_TELEMETRY_ENABLED?.trim() ===
      "true";
    this.write = options.write ?? ((line) => console.info(line));
  }

  record(event: ChatTelemetryEvent): void {
    if (!this.enabled) return;

    try {
      this.write(
        JSON.stringify({
          event: "recruiter_chat",
          ...event,
        }),
      );
    } catch {
      // Observability must never make the recruiter chat unavailable.
    }
  }
}

export const chatTelemetry = new StructuredChatTelemetry();

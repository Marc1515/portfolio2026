import { describe, expect, it, vi } from "vitest";

import {
  StructuredChatTelemetry,
  type ChatTelemetryEvent,
} from "@/lib/observability/chatTelemetry";

const forbiddenFields = [
  "messages",
  "question",
  "content",
  "prompt",
  "history",
  "response",
  "jobDescription",
  "ip",
];

describe("StructuredChatTelemetry", () => {
  it("emits nothing when telemetry is disabled", () => {
    const write = vi.fn();
    const telemetry = new StructuredChatTelemetry({
      environment: { CHAT_TELEMETRY_ENABLED: "false" },
      write,
    });

    telemetry.record({
      requestId: "req000000001",
      type: "request_failed",
      stage: "validation",
      reason: "invalid_request",
      durationMs: 4,
    });

    expect(write).not.toHaveBeenCalled();
  });

  it.each<ChatTelemetryEvent>([
    {
      requestId: "req000000001",
      type: "provider_attempt",
      provider: "cloudflare",
      outcome: "failure",
      reason: "invalid_response",
      durationMs: 15_000,
      diagnosticCode: "incomplete_generation",
      finishReason: "length",
      outputCharacterCount: 0,
    },
    {
      requestId: "req000000002",
      type: "request_completed",
      queryKind: "role_comparison",
      provider: "ollama",
      durationMs: 842,
      providerDurationMs: 800,
      retrievedEntryCount: 7,
      sourceCount: 3,
    },
    {
      requestId: "req000000003",
      type: "request_failed",
      stage: "cloudflare",
      reason: "timeout",
      durationMs: 15_001,
    },
    {
      requestId: "req000000004",
      type: "request_handled_locally",
      reason: "sensitive_request",
      durationMs: 3,
    },
  ])("emits only the approved structured fields", (event) => {
    const lines: string[] = [];
    const telemetry = new StructuredChatTelemetry({
      environment: { CHAT_TELEMETRY_ENABLED: "true" },
      write: (line) => lines.push(line),
    });

    telemetry.record(event);

    expect(lines).toHaveLength(1);
    const emitted = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
    expect(emitted.event).toBe("recruiter_chat");
    const expectedFields =
      event.type === "provider_attempt"
        ? [
            "durationMs",
            "event",
            "outcome",
            "provider",
            ...(event.outcome === "failure" ? ["reason"] : []),
            ...(event.outcome === "failure" && event.diagnosticCode
              ? [
                  "diagnosticCode",
                  ...(event.finishReason ? ["finishReason"] : []),
                  ...(event.outputCharacterCount !== undefined
                    ? ["outputCharacterCount"]
                    : []),
                ]
              : []),
            "requestId",
            "type",
          ]
        : event.type === "request_completed"
          ? [
              "durationMs",
              "event",
              "provider",
              "providerDurationMs",
              "queryKind",
              "retrievedEntryCount",
              "requestId",
              "sourceCount",
              "type",
            ]
          : event.type === "request_failed"
            ? ["durationMs", "event", "reason", "requestId", "stage", "type"]
            : ["durationMs", "event", "reason", "requestId", "type"];
    expect(Object.keys(emitted).sort()).toEqual(expectedFields.sort());
    for (const field of forbiddenFields) {
      expect(emitted).not.toHaveProperty(field);
    }
    expect(JSON.stringify(emitted)).not.toContain(
      "My secret job description is",
    );
  });
});

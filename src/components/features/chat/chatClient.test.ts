import { describe, expect, it, vi } from "vitest";

import { requestChatAnswer } from "@/components/features/chat/chatClient";
import en from "@/messages/en";
import es from "@/messages/es";
import type { RecruiterMessage } from "@/types/chat";

function jsonResponse(value: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

const failedJobDescription: RecruiterMessage[] = [
  { role: "assistant", content: "Hello" },
  {
    role: "user",
    content: "Junior Full Stack Engineer role with Python and React.",
  },
];

describe("requestChatAnswer", () => {
  it("provides the neutral recoverable provider copy and retry labels in both locales", () => {
    expect(en.chat.assistantGenerationError).toBe(
      "I couldn't generate this answer right now. Your message is still here, so you can try again in a moment.",
    );
    expect(es.chat.assistantGenerationError).toBe(
      "No he podido generar esta respuesta ahora mismo. Tu mensaje sigue aquí, así que puedes volver a intentarlo en unos instantes.",
    );
    expect(en.chat.retryLabel).toBe("Try again");
    expect(es.chat.retryLabel).toBe("Volver a intentar");
  });

  it.each([
    [
      "provider_unavailable",
      503,
      { error: "provider_unavailable", retryable: true },
    ],
    ["invalid_request", 400, { error: "invalid_request" }],
    ["forbidden", 403, { error: "forbidden_origin" }],
    ["internal", 500, { error: "internal_error" }],
  ] as const)("distinguishes %s public errors", async (type, status, body) => {
    const result = await requestChatAnswer(
      "en",
      failedJobDescription,
      vi.fn().mockResolvedValue(jsonResponse(body, status)),
    );

    expect(result).toEqual({ ok: false, error: { type } });
  });

  it("keeps rate limiting distinct and uses the bounded retry header", async () => {
    const result = await requestChatAnswer(
      "en",
      failedJobDescription,
      vi.fn().mockResolvedValue(
        jsonResponse({ error: "rate_limited" }, 429, {
          "Retry-After": "17.2",
        }),
      ),
    );

    expect(result).toEqual({
      ok: false,
      error: { type: "rate_limited", retryAfterSeconds: 18 },
    });
  });

  it("makes exactly one request per explicit retry with the unchanged job description and history", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ error: "provider_unavailable", retryable: true }, 503),
      )
      .mockResolvedValueOnce(
        jsonResponse({ message: "Role comparison", sources: [] }),
      );

    await requestChatAnswer("en", failedJobDescription, fetchMock);
    await requestChatAnswer("en", failedJobDescription, fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const retryBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(retryBody).toEqual(firstBody);
    expect(retryBody.messages).toEqual(failedJobDescription);
    expect(
      retryBody.messages.filter(
        (message: RecruiterMessage) => message.role === "user",
      ),
    ).toHaveLength(1);
  });
});

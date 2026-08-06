import { describe, expect, it } from "vitest";

import {
  MAX_ASSISTANT_MESSAGE_LENGTH,
  MAX_REQUEST_MESSAGES,
  MAX_USER_MESSAGE_LENGTH,
  parseChatRequest,
} from "@/lib/ai/validation";

describe("parseChatRequest", () => {
  it("accepts valid alternating history", () => {
    expect(
      parseChatRequest({
        locale: "en",
        messages: [
          { role: "user", content: "Question" },
          { role: "assistant", content: "Previous answer" },
          { role: "user", content: "Follow-up" },
        ],
      }),
    ).toEqual({
      locale: "en",
      messages: [
        { role: "user", content: "Question" },
        { role: "assistant", content: "Previous answer" },
        { role: "user", content: "Follow-up" },
      ],
    });
  });

  it.each([
    [
      "invalid locale",
      { locale: "fr", messages: [{ role: "user", content: "Hi" }] },
    ],
    ["empty messages", { locale: "en", messages: [] }],
    [
      "extra request fields",
      {
        locale: "en",
        messages: [{ role: "user", content: "Hi" }],
        extra: true,
      },
    ],
    [
      "extra message fields",
      {
        locale: "en",
        messages: [{ role: "user", content: "Hi", extra: true }],
      },
    ],
    [
      "unsupported roles",
      { locale: "en", messages: [{ role: "system", content: "Hi" }] },
    ],
    [
      "consecutive user messages",
      {
        locale: "en",
        messages: [
          { role: "user", content: "One" },
          { role: "user", content: "Two" },
        ],
      },
    ],
    [
      "consecutive assistant messages",
      {
        locale: "en",
        messages: [
          { role: "user", content: "One" },
          { role: "assistant", content: "A" },
          { role: "assistant", content: "B" },
          { role: "user", content: "Two" },
        ],
      },
    ],
    [
      "final assistant message",
      {
        locale: "en",
        messages: [
          { role: "user", content: "One" },
          { role: "assistant", content: "A" },
        ],
      },
    ],
  ])("rejects %s", (_name, value) => {
    expect(parseChatRequest(value)).toBeNull();
  });

  it("rejects an oversized user message", () => {
    expect(
      parseChatRequest({
        locale: "en",
        messages: [
          { role: "user", content: "x".repeat(MAX_USER_MESSAGE_LENGTH + 1) },
        ],
      }),
    ).toBeNull();
  });

  it("rejects oversized assistant history", () => {
    expect(
      parseChatRequest({
        locale: "en",
        messages: [
          { role: "user", content: "Question" },
          {
            role: "assistant",
            content: "x".repeat(MAX_ASSISTANT_MESSAGE_LENGTH + 1),
          },
          { role: "user", content: "Follow-up" },
        ],
      }),
    ).toBeNull();
  });

  it("rejects an oversized request array before slicing", () => {
    const messages = Array.from(
      { length: MAX_REQUEST_MESSAGES + 1 },
      (_, index) => ({
        role: index % 2 === 0 ? "user" : "assistant",
        content: `Message ${index}`,
      }),
    );
    expect(parseChatRequest({ locale: "en", messages })).toBeNull();
  });
});

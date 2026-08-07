import { describe, expect, it } from "vitest";

import {
  confirmPendingChatHistory,
  parseStoredChatMessages,
  preparePendingChatHistory,
  recoverPendingChatHistory,
  toApiRequestMessages,
} from "@/components/features/chat/chatHistory";
import type { ChatDisplayMessage, ChatEvidenceSource } from "@/types/chat";

function message(
  id: string,
  role: ChatDisplayMessage["role"],
  content: string,
  sources?: ChatEvidenceSource[],
): ChatDisplayMessage {
  return { id, role, content, ...(sources ? { sources } : {}) };
}

const validSources: ChatEvidenceSource[] = [
  {
    id: "project-ai-code-review-trainer",
    label: "AI Code Review Trainer",
    kind: "project",
    href: "/en#projects",
  },
  {
    id: "repository-ai-code-review-trainer",
    label: "GitHub repository",
    kind: "repository",
    href: "https://github.com/Marc1515/ai-code-review-trainer",
  },
];

const confirmedHistory = [
  message("greeting", "assistant", "Hello"),
  message("question-1", "user", "First question"),
  message("answer-1", "assistant", "First answer"),
];

function roles(messages: ChatDisplayMessage[]) {
  return messages.map((item) => item.role);
}

describe("pending chat history", () => {
  it.each(["503", "429", "network failure"])(
    "restores confirmed history after %s and keeps retry alternating",
    () => {
      const failedQuestion = message("question-2", "user", "Question to retry");
      const failedAttempt = preparePendingChatHistory(
        confirmedHistory,
        failedQuestion,
      );

      const recovered = recoverPendingChatHistory(failedAttempt);
      expect(recovered.confirmedMessages).toEqual(confirmedHistory);
      expect(recovered.confirmedMessages).not.toContain(failedQuestion);
      expect(recovered.retryInput).toBe("Question to retry");

      const retry = preparePendingChatHistory(
        recovered.confirmedMessages,
        message("question-2-retry", "user", recovered.retryInput),
      );
      expect(roles(retry.requestMessages)).toEqual([
        "assistant",
        "user",
        "assistant",
        "user",
      ]);
    },
  );

  it("commits one user message and one assistant response exactly once", () => {
    const pending = preparePendingChatHistory(
      confirmedHistory,
      message("question-2", "user", "Second question"),
    );
    const completed = confirmPendingChatHistory(
      pending,
      message("answer-2", "assistant", "Second answer", validSources),
    );

    expect(roles(completed)).toEqual([
      "assistant",
      "user",
      "assistant",
      "user",
      "assistant",
    ]);
    expect(completed.filter((item) => item.id === "question-2")).toHaveLength(
      1,
    );
    expect(completed.filter((item) => item.id === "answer-2")).toHaveLength(1);
    expect(completed.at(-1)?.sources).toEqual(validSources);
  });

  it("never commits source metadata for a failed pending request", () => {
    const pending = preparePendingChatHistory(
      confirmedHistory,
      message("question-2", "user", "Question to retry"),
    );
    const recovered = recoverPendingChatHistory(pending);

    expect(
      recovered.confirmedMessages.flatMap((item) => item.sources ?? []),
    ).toEqual([]);
    expect(recovered.retryInput).toBe("Question to retry");
  });

  it("restores old stored messages without sources", () => {
    expect(parseStoredChatMessages(JSON.stringify(confirmedHistory))).toEqual(
      confirmedHistory,
    );
  });

  it("restores valid assistant evidence sources", () => {
    const stored = [
      confirmedHistory[0],
      confirmedHistory[1],
      message("answer-with-sources", "assistant", "Evidence", validSources),
    ];
    expect(parseStoredChatMessages(JSON.stringify(stored))).toEqual(stored);
  });

  it.each([
    [
      "unsafe URL",
      [
        {
          id: "unsafe",
          label: "Unsafe",
          kind: "project",
          href: "javascript:alert(1)",
        },
      ],
    ],
    [
      "visitor-controlled HTTPS URL",
      [
        {
          id: "project-ai-code-review-trainer",
          label: "AI Code Review Trainer",
          kind: "project",
          href: "https://attacker.example/fabricated-source",
        },
      ],
    ],
    ["unknown kind", [{ id: "unknown", label: "Unknown", kind: "secret" }]],
    [
      "extra fields",
      [{ id: "extra", label: "Extra", kind: "project", private: true }],
    ],
  ])("rejects stored sources with %s", (_name, sources) => {
    const stored = [message("assistant", "assistant", "Answer")].map(
      (item) => ({ ...item, sources }),
    );
    expect(parseStoredChatMessages(JSON.stringify(stored))).toBeNull();
  });

  it("strips UI-only source metadata from API request history", () => {
    const messages = [
      message("question", "user", "Question"),
      message("answer", "assistant", "Answer", validSources),
      message("follow-up", "user", "Follow-up"),
    ];

    expect(toApiRequestMessages(messages)).toEqual([
      { role: "user", content: "Question" },
      { role: "assistant", content: "Answer" },
      { role: "user", content: "Follow-up" },
    ]);
  });
});

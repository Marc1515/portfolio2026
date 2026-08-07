import { describe, expect, it } from "vitest";

import {
  confirmPendingChatHistory,
  preparePendingChatHistory,
  recoverPendingChatHistory,
} from "@/components/features/chat/chatHistory";
import type { ChatDisplayMessage } from "@/types/chat";

function message(
  id: string,
  role: ChatDisplayMessage["role"],
  content: string,
): ChatDisplayMessage {
  return { id, role, content };
}

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
      message("answer-2", "assistant", "Second answer"),
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
  });
});

import { MAX_HISTORY_MESSAGES } from "@/lib/ai/validation";
import type { ChatDisplayMessage } from "@/types/chat";

export interface PendingChatHistory {
  confirmedMessages: ChatDisplayMessage[];
  pendingUserMessage: ChatDisplayMessage;
  requestMessages: ChatDisplayMessage[];
}

export interface RecoveredChatHistory {
  confirmedMessages: ChatDisplayMessage[];
  retryInput: string;
}

export function preparePendingChatHistory(
  confirmedMessages: ChatDisplayMessage[],
  pendingUserMessage: ChatDisplayMessage,
): PendingChatHistory {
  return {
    confirmedMessages,
    pendingUserMessage,
    requestMessages: [...confirmedMessages, pendingUserMessage].slice(
      -MAX_HISTORY_MESSAGES,
    ),
  };
}

export function recoverPendingChatHistory(
  pending: PendingChatHistory,
): RecoveredChatHistory {
  return {
    confirmedMessages: pending.confirmedMessages,
    retryInput: pending.pendingUserMessage.content,
  };
}

export function confirmPendingChatHistory(
  pending: PendingChatHistory,
  assistantMessage: ChatDisplayMessage,
): ChatDisplayMessage[] {
  return [...pending.requestMessages, assistantMessage].slice(
    -MAX_HISTORY_MESSAGES,
  );
}

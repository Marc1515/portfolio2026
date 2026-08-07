import { isChatEvidenceSource, MAX_PUBLIC_SOURCES } from "@/lib/chatEvidence";
import {
  MAX_ASSISTANT_MESSAGE_LENGTH,
  MAX_HISTORY_MESSAGES,
  MAX_USER_MESSAGE_LENGTH,
} from "@/lib/ai/validation";
import type { ChatDisplayMessage, RecruiterMessage } from "@/types/chat";

export interface PendingChatHistory {
  confirmedMessages: ChatDisplayMessage[];
  pendingUserMessage: ChatDisplayMessage;
  requestMessages: ChatDisplayMessage[];
}

export interface RecoveredChatHistory {
  confirmedMessages: ChatDisplayMessage[];
  retryInput: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseStoredChatMessages(
  value: string,
): ChatDisplayMessage[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length > MAX_HISTORY_MESSAGES) {
    return null;
  }

  const messages: ChatDisplayMessage[] = [];
  for (const item of parsed) {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      item.id.length === 0 ||
      item.id.length > 100 ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" ||
      item.content.trim().length === 0
    ) {
      return null;
    }

    const maximumLength =
      item.role === "user"
        ? MAX_USER_MESSAGE_LENGTH
        : MAX_ASSISTANT_MESSAGE_LENGTH;
    if (item.content.length > maximumLength) return null;

    let sources;
    if (item.sources !== undefined) {
      if (
        item.role !== "assistant" ||
        !Array.isArray(item.sources) ||
        item.sources.length > MAX_PUBLIC_SOURCES ||
        !item.sources.every(isChatEvidenceSource)
      ) {
        return null;
      }
      sources = item.sources;
    }

    messages.push({
      id: item.id,
      role: item.role,
      content: item.content,
      ...(sources ? { sources } : {}),
    });
  }

  for (let index = 1; index < messages.length; index += 1) {
    if (messages[index]?.role === messages[index - 1]?.role) return null;
  }

  return messages.length > 0 ? messages : null;
}

export function toApiRequestMessages(
  messages: ChatDisplayMessage[],
): RecruiterMessage[] {
  return messages.map(({ role, content }) => ({ role, content }));
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

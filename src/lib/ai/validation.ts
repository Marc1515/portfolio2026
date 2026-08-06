import {
  CHAT_LOCALES,
  CHAT_ROLES,
  type ChatRequest,
  type RecruiterMessage,
} from "@/types/chat";

export const MAX_USER_MESSAGE_LENGTH = 600;
export const MAX_ASSISTANT_MESSAGE_LENGTH = 2_000;
export const MAX_HISTORY_MESSAGES = 10;
export const MAX_REQUEST_MESSAGES = 50;
export const MAX_REQUEST_BODY_LENGTH = 32_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: string[]) {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function isRecruiterMessage(value: unknown): value is RecruiterMessage {
  if (!isRecord(value) || !hasOnlyKeys(value, ["role", "content"])) {
    return false;
  }

  if (
    typeof value.role !== "string" ||
    !CHAT_ROLES.includes(value.role as RecruiterMessage["role"]) ||
    typeof value.content !== "string" ||
    value.content.trim().length === 0
  ) {
    return false;
  }

  const maximumLength =
    value.role === "user"
      ? MAX_USER_MESSAGE_LENGTH
      : MAX_ASSISTANT_MESSAGE_LENGTH;

  return value.content.length <= maximumLength;
}

export function parseChatRequest(value: unknown): ChatRequest | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["locale", "messages"])) {
    return null;
  }

  if (
    typeof value.locale !== "string" ||
    !CHAT_LOCALES.includes(value.locale as ChatRequest["locale"]) ||
    !Array.isArray(value.messages) ||
    value.messages.length === 0 ||
    value.messages.length > MAX_REQUEST_MESSAGES ||
    !value.messages.every(isRecruiterMessage)
  ) {
    return null;
  }

  const finalMessage = value.messages.at(-1);
  if (!finalMessage || finalMessage.role !== "user") {
    return null;
  }

  return {
    locale: value.locale as ChatRequest["locale"],
    messages: value.messages.slice(-MAX_HISTORY_MESSAGES).map((message) => ({
      role: message.role,
      content: message.content.trim(),
    })),
  };
}

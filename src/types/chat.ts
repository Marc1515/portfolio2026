export const CHAT_LOCALES = ["en", "es"] as const;
export const CHAT_ROLES = ["user", "assistant"] as const;

export type ChatLocale = (typeof CHAT_LOCALES)[number];
export type ChatRole = (typeof CHAT_ROLES)[number];

export interface RecruiterMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  locale: ChatLocale;
  messages: RecruiterMessage[];
}

export interface ChatResponse {
  message: string;
}

export type ChatErrorCode =
  | "invalid_request"
  | "provider_unavailable"
  | "internal_error";

export interface ChatErrorResponse {
  error: ChatErrorCode;
}

export interface ChatDisplayMessage extends RecruiterMessage {
  id: string;
}

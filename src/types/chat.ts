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

export const CHAT_EVIDENCE_KINDS = [
  "portfolio",
  "experience",
  "project",
  "repository",
  "live",
  "cv",
  "contact",
] as const;

export type ChatEvidenceKind = (typeof CHAT_EVIDENCE_KINDS)[number];

export interface ChatEvidenceSource {
  id: string;
  label: string;
  kind: ChatEvidenceKind;
  href?: string;
}

export interface ChatResponse {
  message: string;
  sources: ChatEvidenceSource[];
}

export type ChatErrorCode =
  | "invalid_request"
  | "forbidden_origin"
  | "rate_limited"
  | "provider_unavailable"
  | "internal_error";

export interface ChatErrorResponse {
  error: ChatErrorCode;
}

export interface ChatDisplayMessage extends RecruiterMessage {
  id: string;
  sources?: ChatEvidenceSource[];
}

import {
  localizeEvidenceValue,
  trustedEvidenceSourceDefinitions,
} from "@/data/chatEvidenceSources";
import { CHAT_EVIDENCE_KINDS, type ChatEvidenceSource } from "@/types/chat";

export const MAX_PUBLIC_SOURCES = 4;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isSafeEvidenceHref(value: string): boolean {
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isChatEvidenceSource(
  value: unknown,
): value is ChatEvidenceSource {
  if (!isRecord(value)) return false;

  const allowedKeys = ["id", "label", "kind", "href"];
  if (!Object.keys(value).every((key) => allowedKeys.includes(key))) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    value.id.length > 100 ||
    typeof value.label !== "string" ||
    value.label.trim().length === 0 ||
    value.label.length > 120 ||
    typeof value.kind !== "string" ||
    !CHAT_EVIDENCE_KINDS.includes(value.kind as ChatEvidenceSource["kind"])
  ) {
    return false;
  }

  if (
    value.href !== undefined &&
    (typeof value.href !== "string" ||
      value.href.length > 500 ||
      !isSafeEvidenceHref(value.href))
  ) {
    return false;
  }

  const definition = trustedEvidenceSourceDefinitions.find(
    (source) => source.id === value.id && source.kind === value.kind,
  );
  if (!definition) return false;

  return (["en", "es"] as const).some(
    (locale) =>
      value.label === definition.label[locale] &&
      value.href === localizeEvidenceValue(definition.href, locale),
  );
}

import "server-only";

import { createHash } from "node:crypto";
import { isIP } from "node:net";

const MAX_HEADER_VALUE_LENGTH = 64;

function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function validIp(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().slice(0, MAX_HEADER_VALUE_LENGTH);
  return isIP(normalized) > 0 ? normalized.toLowerCase() : null;
}

export function resolveClientIdentifier(request: Request): string {
  const connectingIp = validIp(request.headers.get("cf-connecting-ip"));
  if (connectingIp) return `ip:${hashIdentifier(connectingIp)}`;

  const realIp = validIp(request.headers.get("x-real-ip"));
  if (realIp) return `ip:${hashIdentifier(realIp)}`;

  const forwardedIp = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((value) => validIp(value))
    .find((value): value is string => value !== null);
  if (forwardedIp) return `ip:${hashIdentifier(forwardedIp)}`;

  const metadata = [
    request.headers.get("user-agent")?.slice(0, 256) ?? "unknown-agent",
    request.headers.get("accept-language")?.slice(0, 128) ?? "unknown-language",
  ].join("|");
  return `fallback:${hashIdentifier(metadata)}`;
}

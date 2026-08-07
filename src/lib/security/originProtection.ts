import "server-only";

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalDevelopmentOrigin(origin: string): boolean {
  const url = new URL(origin);
  return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
}

export function isRequestOriginAllowed(
  request: Request,
  allowedOrigins = process.env.CHAT_ALLOWED_ORIGINS,
  nodeEnvironment = process.env.NODE_ENV,
): boolean {
  const suppliedOrigin = request.headers.get("origin");
  if (!suppliedOrigin) return true;

  const origin = normalizeOrigin(suppliedOrigin);
  if (!origin) return false;

  const currentOrigin = normalizeOrigin(request.url);
  if (origin === currentOrigin) return true;

  const configuredOrigins = (allowedOrigins ?? "")
    .split(",")
    .map(normalizeOrigin)
    .filter((value): value is string => value !== null);
  if (configuredOrigins.includes(origin)) return true;

  return nodeEnvironment === "development" && isLocalDevelopmentOrigin(origin);
}

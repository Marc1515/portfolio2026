export const DEFAULT_OLLAMA_BASE_URL = "http://ollama:11434";
export const DEFAULT_OLLAMA_KEEP_ALIVE = "-1m";

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const OLLAMA_DURATION_PATTERN =
  /^(?:-1m|0|(?:\d+(?:\.\d+)?(?:ns|us|µs|μs|ms|s|m|h))+)$/;

/**
 * @param {string | undefined} rawValue
 * @returns {string | null}
 */
export function normalizeOllamaKeepAlive(rawValue) {
  if (rawValue === undefined || rawValue === "") {
    return DEFAULT_OLLAMA_KEEP_ALIVE;
  }
  if (
    typeof rawValue !== "string" ||
    rawValue.length > 32 ||
    CONTROL_CHARACTER_PATTERN.test(rawValue)
  ) {
    return null;
  }

  const value = rawValue.trim();
  if (value === "") return DEFAULT_OLLAMA_KEEP_ALIVE;
  if (value === "-1") return DEFAULT_OLLAMA_KEEP_ALIVE;

  return OLLAMA_DURATION_PATTERN.test(value) ? value : null;
}

/**
 * @param {string | undefined} rawValue
 * @returns {string | null}
 */
export function normalizeOllamaModel(rawValue) {
  if (
    typeof rawValue !== "string" ||
    rawValue.length > 200 ||
    CONTROL_CHARACTER_PATTERN.test(rawValue)
  ) {
    return null;
  }

  const model = rawValue.trim();
  return model ? model : null;
}

/**
 * @param {string} rawBaseUrl
 * @returns {string | null}
 */
export function normalizeOllamaChatUrl(rawBaseUrl) {
  if (
    typeof rawBaseUrl !== "string" ||
    rawBaseUrl.length > 2_048 ||
    CONTROL_CHARACTER_PATTERN.test(rawBaseUrl)
  ) {
    return null;
  }

  try {
    const url = new URL(rawBaseUrl.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    let pathname = url.pathname.replace(/\/+$/, "");
    pathname = pathname.replace(/\/api\/chat$/i, "").replace(/\/api$/i, "");
    url.pathname = `${pathname}/api/chat`.replace(/\/{2,}/g, "/");

    return url.toString();
  } catch {
    return null;
  }
}

/**
 * @param {string | undefined} rawValue
 * @param {number} fallback
 * @param {number} maximum
 * @returns {number}
 */
export function parseBoundedPositiveInteger(rawValue, fallback, maximum) {
  const parsed = Number(rawValue);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maximum
    ? parsed
    : fallback;
}

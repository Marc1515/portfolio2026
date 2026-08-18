import { pathToFileURL } from "node:url";

import {
  DEFAULT_OLLAMA_BASE_URL,
  normalizeOllamaChatUrl,
  normalizeOllamaKeepAlive,
  normalizeOllamaModel,
  parseBoundedPositiveInteger,
} from "./ollama-runtime.mjs";

export const DEFAULT_OLLAMA_WARMUP_TIMEOUT_MS = 120_000;

/**
 * @typedef {{ ok: true } | { ok: false; reason: string }} WarmupResult
 */

/**
 * @param {{
 *   environment?: NodeJS.ProcessEnv;
 *   fetchImplementation?: typeof fetch;
 * }} [options]
 * @returns {Promise<WarmupResult>}
 */
export async function runOllamaWarmup(options = {}) {
  const environment = options.environment ?? process.env;
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const endpoint = normalizeOllamaChatUrl(
    environment.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL,
  );
  const model = normalizeOllamaModel(environment.OLLAMA_MODEL);
  const keepAlive = normalizeOllamaKeepAlive(environment.OLLAMA_KEEP_ALIVE);
  const timeoutMs = parseBoundedPositiveInteger(
    environment.OLLAMA_WARMUP_TIMEOUT_MS,
    DEFAULT_OLLAMA_WARMUP_TIMEOUT_MS,
    180_000,
  );

  if (!endpoint) return { ok: false, reason: "invalid base URL configuration" };
  if (!model) return { ok: false, reason: "invalid model configuration" };
  if (!keepAlive) {
    return { ok: false, reason: "invalid keep-alive configuration" };
  }

  try {
    const response = await fetchImplementation(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with OK." }],
        stream: false,
        keep_alive: keepAlive,
        options: { temperature: 0, num_predict: 1 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    return response.ok
      ? { ok: true }
      : { ok: false, reason: `HTTP ${response.status}` };
  } catch (error) {
    const errorName =
      typeof error === "object" && error !== null && "name" in error
        ? error.name
        : undefined;
    return {
      ok: false,
      reason:
        errorName === "TimeoutError" || errorName === "AbortError"
          ? "timeout"
          : "request failed",
    };
  }
}

/** @param {WarmupResult} result */
export function formatOllamaWarmupStatus(result) {
  return result.ok
    ? "Private Ollama warm-up: PASS"
    : `Private Ollama warm-up: FAIL (${result.reason})`;
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const result = await runOllamaWarmup();
  const status = formatOllamaWarmupStatus(result);
  if (result.ok) {
    console.info(status);
  } else {
    console.error(status);
    process.exitCode = 1;
  }
}

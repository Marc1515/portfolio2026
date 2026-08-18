import { pathToFileURL } from "node:url";

import {
  DEFAULT_OLLAMA_BASE_URL,
  normalizeOllamaChatUrl,
  normalizeOllamaKeepAlive,
  normalizeOllamaModel,
  parseBoundedPositiveInteger,
} from "./ollama-runtime.mjs";

/**
 * @param {{
 *   environment?: NodeJS.ProcessEnv;
 *   fetchImplementation?: typeof fetch;
 * }} [options]
 */
export async function runOllamaSmoke(options = {}) {
  const environment = options.environment ?? process.env;
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const endpoint = normalizeOllamaChatUrl(
    environment.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL,
  );
  const model = normalizeOllamaModel(environment.OLLAMA_MODEL);
  const keepAlive = normalizeOllamaKeepAlive(environment.OLLAMA_KEEP_ALIVE);
  const timeoutMs = parseBoundedPositiveInteger(
    environment.OLLAMA_REQUEST_TIMEOUT_MS,
    90_000,
    120_000,
  );

  if (!endpoint) throw new Error("invalid base URL configuration");
  if (!model) throw new Error("invalid model configuration");
  if (!keepAlive) throw new Error("invalid keep-alive configuration");

  let response;
  try {
    response = await fetchImplementation(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with the single word OK." }],
        stream: false,
        keep_alive: keepAlive,
        options: { temperature: 0.1, num_predict: 8 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new Error("request failed or timed out");
  }

  if (!response.ok) {
    throw new Error(`Ollama returned HTTP ${response.status}.`);
  }
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Ollama returned a non-JSON response.");
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Ollama returned invalid JSON.");
  }
  const content = payload?.message?.content;
  if (
    typeof content !== "string" ||
    content.trim().length === 0 ||
    content.length > 200
  ) {
    throw new Error("Ollama returned an invalid bounded response.");
  }
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  runOllamaSmoke()
    .then(() => {
      console.info("Private Ollama connectivity smoke test: PASS");
    })
    .catch((error) => {
      console.error(
        error instanceof Error
          ? `Private Ollama connectivity smoke test: FAIL (${error.message})`
          : "Private Ollama connectivity smoke test: FAIL",
      );
      process.exitCode = 1;
    });
}

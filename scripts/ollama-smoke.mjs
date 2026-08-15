const rawBaseUrl = (
  process.env.OLLAMA_BASE_URL || "http://ollama:11434"
).trim();
const model = process.env.OLLAMA_MODEL?.trim();
const configuredTimeoutMs = Number(process.env.OLLAMA_REQUEST_TIMEOUT_MS);
const timeoutMs =
  Number.isSafeInteger(configuredTimeoutMs) &&
  configuredTimeoutMs > 0 &&
  configuredTimeoutMs <= 120_000
    ? configuredTimeoutMs
    : 90_000;

function chatEndpoint(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("OLLAMA_BASE_URL must be a valid HTTP(S) URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("OLLAMA_BASE_URL must use HTTP or HTTPS.");
  }

  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  const path = url.pathname
    .replace(/\/+$/, "")
    .replace(/\/api\/chat$/i, "")
    .replace(/\/api$/i, "");
  url.pathname = `${path}/api/chat`.replace(/\/{2,}/g, "/");
  return url;
}

async function run() {
  if (!model || model.length > 200 || /[\u0000-\u001f\u007f]/.test(model)) {
    throw new Error("OLLAMA_MODEL must name the configured fallback model.");
  }

  const response = await fetch(chatEndpoint(rawBaseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Reply with the single word OK." }],
      stream: false,
      keep_alive: "2m",
      options: { temperature: 0.1, num_predict: 8 },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned HTTP ${response.status}.`);
  }
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Ollama returned a non-JSON response.");
  }

  const payload = await response.json();
  const content = payload?.message?.content;
  if (
    typeof content !== "string" ||
    content.trim().length === 0 ||
    content.length > 200
  ) {
    throw new Error("Ollama returned an invalid bounded response.");
  }

  console.info("Private Ollama connectivity smoke test: PASS");
}

run().catch((error) => {
  console.error(
    error instanceof Error
      ? `Private Ollama connectivity smoke test: FAIL (${error.message})`
      : "Private Ollama connectivity smoke test: FAIL",
  );
  process.exitCode = 1;
});

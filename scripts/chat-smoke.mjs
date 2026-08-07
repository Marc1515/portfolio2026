const baseUrl = (process.env.CHAT_SMOKE_BASE_URL || "http://localhost:3000")
  .trim()
  .replace(/\/+$/, "");

async function run() {
  let url;
  try {
    url = new URL("/api/chat", `${baseUrl}/`);
  } catch {
    throw new Error("CHAT_SMOKE_BASE_URL must be a valid HTTP(S) URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("CHAT_SMOKE_BASE_URL must use HTTP or HTTPS.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: url.origin,
    },
    body: JSON.stringify({
      locale: "en",
      messages: [
        {
          role: "user",
          content: "What professional React experience does Marc have?",
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Recruiter AI endpoint returned HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.message !== "string" ||
    payload.message.trim().length === 0 ||
    payload.message.length > 2_000 ||
    !Array.isArray(payload.sources) ||
    payload.sources.length > 4
  ) {
    throw new Error("Recruiter AI endpoint returned an invalid response.");
  }

  console.info("Recruiter AI smoke test: PASS");
  console.info("Provider chain returned a valid bounded response.");
}

run().catch((error) => {
  console.error(
    error instanceof Error
      ? `Recruiter AI smoke test: FAIL (${error.message})`
      : "Recruiter AI smoke test: FAIL",
  );
  process.exitCode = 1;
});

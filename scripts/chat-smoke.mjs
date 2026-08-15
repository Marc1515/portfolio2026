const baseUrl = (process.env.CHAT_SMOKE_BASE_URL || "http://localhost:3000")
  .trim()
  .replace(/\/+$/, "");
const roleComparison = process.argv.includes("--role-comparison");

const roleComparisonPrompt = `We're hiring for an international tech company looking to bring on Junior Full Stack Engineers for a brand-new product division focused on workforce education and certification.

This is an opportunity to join a greenfield engineering team at an early stage, working on a modern Python/React product with the backing and stability of an established global business.

The team is building a next-generation certification and assessment platform for regulated industries including aviation, industrial safety, government, and vocational training, leveraging modern AI capabilities and contemporary engineering practices.

If you're excited by the idea of learning quickly, working closely with experienced engineers, and helping shape a product from the ground up, this role is for you.`;

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
          content: roleComparison
            ? roleComparisonPrompt
            : "What professional React experience does Marc have?",
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

  console.info(
    roleComparison
      ? "Recruiter role-comparison smoke test: PASS"
      : "Recruiter AI smoke test: PASS",
  );
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

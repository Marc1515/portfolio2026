import { register } from "node:module";

register(
  new URL("./recruiter-model-benchmark-loader.mjs", import.meta.url),
  import.meta.url,
);

let runRecruiterModelBenchmarkCli;
try {
  ({ runRecruiterModelBenchmarkCli } =
    await import("../src/lib/ai/benchmarks/recruiterModelBenchmarkRunner.ts"));
} catch {
  console.error(
    "Recruiter AI Model Benchmark: FAIL (benchmark runtime unavailable)",
  );
  process.exitCode = 1;
}

if (runRecruiterModelBenchmarkCli) {
  try {
    await runRecruiterModelBenchmarkCli(process.argv.slice(2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected error";
    const safeReason =
      /^(?:Missing value|Unknown argument|--|Invalid private Ollama|Invalid benchmark|No benchmark cases|Model warm-up failed|Unable to write benchmark reports)/.test(
        message,
      )
        ? message.slice(0, 160).replace(/[\u0000-\u001f\u007f]/g, " ")
        : "unexpected error";
    console.error(`Recruiter AI Model Benchmark: FAIL (${safeReason})`);
    process.exitCode = 1;
  }
}

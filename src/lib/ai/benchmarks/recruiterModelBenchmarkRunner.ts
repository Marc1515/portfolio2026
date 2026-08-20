import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  DEFAULT_OLLAMA_BASE_URL,
  normalizeOllamaChatUrl,
  normalizeOllamaKeepAlive,
  parseBoundedPositiveInteger,
} from "../../../../scripts/ollama-runtime.mjs";
import {
  aggregateBenchmarkResults,
  DEFAULT_BENCHMARK_KEEP_ALIVE,
  DEFAULT_BENCHMARK_TIMEOUT_MS,
  DEFAULT_BENCHMARK_WARMUP_TIMEOUT_MS,
  executeOllamaBenchmarkRequest,
  parseBenchmarkCliArgs,
  prepareBenchmarkCase,
  redactPrivateContact,
  scoreBenchmarkResponse,
  type BenchmarkAggregate,
  type BenchmarkCaseResult,
  type BenchmarkCliOptions,
} from "./recruiterModelBenchmark";
import {
  recruiterModelBenchmarkCases,
  type RecruiterModelBenchmarkCase,
} from "./recruiterModelBenchmarkCases";

export interface RecruiterModelBenchmarkReport {
  schemaVersion: 1;
  generatedAt: string;
  model: string;
  benchmarkKeepAlive: string;
  requestTimeoutMs: number;
  warmupTimeoutMs: number;
  deterministicScoreLabel: "deterministic benchmark score";
  summary: BenchmarkAggregate;
  cases: BenchmarkCaseResult[];
  manualMemoryNotes: null;
}

export interface BenchmarkRunOutput {
  report: RecruiterModelBenchmarkReport;
  jsonReportPath: string;
  markdownReportPath: string;
}

function selectCases(
  options: BenchmarkCliOptions,
): RecruiterModelBenchmarkCase[] {
  const selected = recruiterModelBenchmarkCases.filter(
    (benchmarkCase) =>
      (!options.locale || benchmarkCase.locale === options.locale) &&
      (!options.filter || benchmarkCase.category === options.filter),
  );
  return options.caseLimit ? selected.slice(0, options.caseLimit) : selected;
}

function createSkippedResult(
  benchmarkCase: RecruiterModelBenchmarkCase,
  model: string,
  reason: string,
): BenchmarkCaseResult {
  return {
    caseId: benchmarkCase.id,
    category: benchmarkCase.category,
    locale: benchmarkCase.locale,
    model,
    outcome: "skipped",
    success: false,
    latencyMs: null,
    outputCharacterCount: 0,
    timeout: false,
    emptyResponse: false,
    deterministicScore: 0,
    deterministicPass: false,
    qualitativeChecks: [],
    question: benchmarkCase.messages.at(-1)?.content ?? "",
    response: null,
    skipReason: reason,
  };
}

function createIntentMismatchResult(
  benchmarkCase: RecruiterModelBenchmarkCase,
  model: string,
): BenchmarkCaseResult {
  return {
    caseId: benchmarkCase.id,
    category: benchmarkCase.category,
    locale: benchmarkCase.locale,
    model,
    outcome: "failure",
    success: false,
    latencyMs: null,
    outputCharacterCount: 0,
    timeout: false,
    emptyResponse: false,
    deterministicScore: 0,
    deterministicPass: false,
    qualitativeChecks: [],
    question: benchmarkCase.messages.at(-1)?.content ?? "",
    response: null,
    failureReason: "intent_mismatch",
  };
}

function slugModel(model: string): string {
  return model
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function timestampSlug(isoTimestamp: string): string {
  return isoTimestamp.replace(/[:.]/g, "-");
}

function formatSeconds(milliseconds: number): string {
  return `${(milliseconds / 1_000).toFixed(1)}s`;
}

export function formatBenchmarkTerminalSummary(
  report: RecruiterModelBenchmarkReport,
  relativeJsonPath: string,
): string {
  return [
    "Recruiter AI Model Benchmark",
    "",
    `Model: ${report.model}`,
    `Cases: ${report.summary.totalCases}`,
    `Passed: ${report.summary.passedCases}`,
    `Failed: ${report.summary.failedCases}`,
    `Skipped locally: ${report.summary.skippedCases}`,
    `Deterministic benchmark score: ${report.summary.deterministicScore.toFixed(1)} / 100`,
    `Completion rate: ${report.summary.completionRate.toFixed(1)}%`,
    "",
    "Latency (successful model requests):",
    `median: ${formatSeconds(report.summary.medianLatencyMs)}`,
    `p95: ${formatSeconds(report.summary.p95LatencyMs)}`,
    `max: ${formatSeconds(report.summary.maxLatencyMs)}`,
    "",
    `Timeouts: ${report.summary.timeouts}`,
    `Invalid responses: ${report.summary.invalidResponses}`,
    `Warm-up: ${formatSeconds(report.summary.warmupDurationMs)}`,
    `Report: ${relativeJsonPath}`,
  ].join("\n");
}

function buildMarkdownReport(report: RecruiterModelBenchmarkReport): string {
  const lines = [
    "# Recruiter AI Model Benchmark",
    "",
    `- Model: \`${report.model}\``,
    `- Generated: ${report.generatedAt}`,
    `- Cases: ${report.summary.totalCases}`,
    `- Deterministic benchmark score: ${report.summary.deterministicScore.toFixed(1)} / 100`,
    `- Completion rate: ${report.summary.completionRate.toFixed(1)}%`,
    `- Median successful-request latency: ${formatSeconds(report.summary.medianLatencyMs)}`,
    `- P95 successful-request latency: ${formatSeconds(report.summary.p95LatencyMs)}`,
    `- Warm-up: ${formatSeconds(report.summary.warmupDurationMs)}`,
    "",
    "> The deterministic benchmark score is an approximate aid. Review the answers below manually before comparing models.",
    "",
    "## Cases",
    "",
  ];

  for (const result of report.cases) {
    lines.push(
      `### ${result.caseId}`,
      "",
      `- Category: ${result.category}`,
      `- Locale: ${result.locale}`,
      `- Outcome: ${result.outcome}`,
      `- Score: ${result.deterministicScore} / 100`,
      `- Latency: ${result.latencyMs === null ? "n/a" : formatSeconds(result.latencyMs)}`,
      "",
      "**Benchmark question**",
      "",
      result.question,
      "",
      "**Model response**",
      "",
      result.response ??
        (result.skipReason
          ? `[${result.skipReason}]`
          : `[${result.failureReason ?? "no response"}]`),
      "",
    );

    if (result.qualitativeChecks.length > 0) {
      lines.push(
        "**Deterministic checks**",
        "",
        ...result.qualitativeChecks.map(
          (check) =>
            `- ${check.passed ? "PASS" : "FAIL"} — ${check.label} (${check.weight})`,
        ),
        "",
      );
    }
  }

  return `${lines.join("\n")}\n`;
}

async function writeBenchmarkReports(
  report: RecruiterModelBenchmarkReport,
  outputDirectory: string,
): Promise<{ jsonPath: string; markdownPath: string }> {
  const baseName = `${slugModel(report.model)}-${timestampSlug(report.generatedAt)}`;
  const jsonPath = path.join(outputDirectory, `${baseName}.json`);
  const markdownPath = path.join(outputDirectory, `${baseName}.md`);

  try {
    await mkdir(outputDirectory, { recursive: true });
    await Promise.all([
      writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
      writeFile(markdownPath, buildMarkdownReport(report), "utf8"),
    ]);
  } catch {
    throw new Error("Unable to write benchmark reports.");
  }

  return { jsonPath, markdownPath };
}

export async function runRecruiterModelBenchmark(options: {
  cli: BenchmarkCliOptions;
  environment?: NodeJS.ProcessEnv;
  fetchImplementation?: typeof fetch;
  performanceNow?: () => number;
  now?: () => Date;
  outputDirectory?: string;
}): Promise<BenchmarkRunOutput> {
  const environment = options.environment ?? process.env;
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const performanceNow = options.performanceNow ?? (() => performance.now());
  const endpoint = normalizeOllamaChatUrl(
    environment.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL,
  );
  const keepAlive = normalizeOllamaKeepAlive(
    environment.OLLAMA_BENCHMARK_KEEP_ALIVE ?? DEFAULT_BENCHMARK_KEEP_ALIVE,
  );
  const requestTimeoutMs = parseBoundedPositiveInteger(
    environment.OLLAMA_BENCHMARK_TIMEOUT_MS,
    DEFAULT_BENCHMARK_TIMEOUT_MS,
    120_000,
  );
  const warmupTimeoutMs = parseBoundedPositiveInteger(
    environment.OLLAMA_BENCHMARK_WARMUP_TIMEOUT_MS,
    DEFAULT_BENCHMARK_WARMUP_TIMEOUT_MS,
    180_000,
  );
  const selectedCases = selectCases(options.cli);

  if (!endpoint)
    throw new Error("Invalid private Ollama endpoint configuration.");
  if (!keepAlive)
    throw new Error("Invalid benchmark keep-alive configuration.");
  if (selectedCases.length === 0)
    throw new Error("No benchmark cases matched.");

  const modelCases = selectedCases.filter(
    (benchmarkCase) => benchmarkCase.expectedIntent === "professional",
  );
  let warmupDurationMs = 0;
  if (modelCases.length > 0) {
    const warmup = await executeOllamaBenchmarkRequest({
      endpoint,
      model: options.cli.model,
      messages: [{ role: "user", content: "Reply with OK." }],
      keepAlive,
      timeoutMs: warmupTimeoutMs,
      fetchImplementation,
      performanceNow,
      numPredict: 1,
    });
    warmupDurationMs = warmup.latencyMs;
    if (!warmup.success) {
      throw new Error(
        `Model warm-up failed (${warmup.failureReason ?? "unknown"}).`,
      );
    }
  }

  const results: BenchmarkCaseResult[] = [];
  for (const benchmarkCase of selectedCases) {
    const prepared = prepareBenchmarkCase(benchmarkCase);
    if (prepared.kind === "skipped") {
      results.push(
        createSkippedResult(
          benchmarkCase,
          options.cli.model,
          prepared.reason ?? "handled locally",
        ),
      );
      continue;
    }
    if (prepared.kind === "intent_mismatch" || !prepared.messages) {
      results.push(
        createIntentMismatchResult(benchmarkCase, options.cli.model),
      );
      continue;
    }

    const request = await executeOllamaBenchmarkRequest({
      endpoint,
      model: options.cli.model,
      messages: prepared.messages,
      keepAlive,
      timeoutMs: requestTimeoutMs,
      fetchImplementation,
      performanceNow,
    });
    const question = benchmarkCase.messages.at(-1)?.content ?? "";

    if (!request.success || request.response === null) {
      results.push({
        caseId: benchmarkCase.id,
        category: benchmarkCase.category,
        locale: benchmarkCase.locale,
        model: options.cli.model,
        outcome: "failure",
        success: false,
        latencyMs: request.latencyMs,
        outputCharacterCount: 0,
        timeout: request.timeout,
        emptyResponse: request.emptyResponse,
        deterministicScore: 0,
        deterministicPass: false,
        qualitativeChecks: [],
        question,
        response: null,
        failureReason: request.failureReason,
      });
      continue;
    }

    const scored = scoreBenchmarkResponse(benchmarkCase, request.response);
    results.push({
      caseId: benchmarkCase.id,
      category: benchmarkCase.category,
      locale: benchmarkCase.locale,
      model: options.cli.model,
      outcome: "success",
      success: true,
      latencyMs: request.latencyMs,
      outputCharacterCount: request.response.length,
      timeout: false,
      emptyResponse: false,
      deterministicScore: scored.score,
      deterministicPass: scored.passed,
      qualitativeChecks: scored.checks,
      question,
      response: redactPrivateContact(request.response),
    });
  }

  const generatedAt = (options.now ?? (() => new Date()))().toISOString();
  const report: RecruiterModelBenchmarkReport = {
    schemaVersion: 1,
    generatedAt,
    model: options.cli.model,
    benchmarkKeepAlive: keepAlive,
    requestTimeoutMs,
    warmupTimeoutMs,
    deterministicScoreLabel: "deterministic benchmark score",
    summary: aggregateBenchmarkResults(results, warmupDurationMs),
    cases: results,
    manualMemoryNotes: null,
  };
  const outputDirectory =
    options.outputDirectory ?? path.join(process.cwd(), "benchmark-results");
  const written = await writeBenchmarkReports(report, outputDirectory);

  return {
    report,
    jsonReportPath: written.jsonPath,
    markdownReportPath: written.markdownPath,
  };
}

export async function runRecruiterModelBenchmarkCli(
  args: string[],
  dependencies: {
    environment?: NodeJS.ProcessEnv;
    fetchImplementation?: typeof fetch;
    info?: (message: string) => void;
  } = {},
): Promise<void> {
  const info = dependencies.info ?? console.info;
  const cli = parseBenchmarkCliArgs(args);
  if (cli.help) {
    info(
      "Usage: node scripts/recruiter-model-benchmark.mjs --model <model> [--locale en|es] [--cases <number>] [--filter <category>]",
    );
    return;
  }

  const result = await runRecruiterModelBenchmark({
    cli,
    environment: dependencies.environment,
    fetchImplementation: dependencies.fetchImplementation,
  });
  const relativePath = path
    .relative(process.cwd(), result.jsonReportPath)
    .replaceAll("\\", "/");
  info(formatBenchmarkTerminalSummary(result.report, relativePath));
}

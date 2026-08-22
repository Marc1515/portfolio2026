import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  aggregateBenchmarkResults,
  buildOllamaBenchmarkPayload,
  classifyBenchmarkError,
  executeOllamaBenchmarkRequest,
  median,
  parseBenchmarkCliArgs,
  percentile,
  prepareBenchmarkCase,
  redactPrivateContact,
  scoreBenchmarkResponse,
  validateBenchmarkModel,
  type BenchmarkCaseResult,
} from "./recruiterModelBenchmark";
import { recruiterModelBenchmarkCases } from "./recruiterModelBenchmarkCases";
import {
  formatBenchmarkTerminalSummary,
  runRecruiterModelBenchmark,
} from "./recruiterModelBenchmarkRunner";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

function benchmarkCase(id: string) {
  const result = recruiterModelBenchmarkCases.find((entry) => entry.id === id);
  if (!result) throw new Error(`Missing benchmark fixture ${id}`);
  return result;
}

function jsonResponse(content: string, status = 200) {
  return new Response(JSON.stringify({ message: { content }, done: true }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function resultFixture(
  overrides: Partial<BenchmarkCaseResult>,
): BenchmarkCaseResult {
  return {
    caseId: "fixture",
    category: "supported_skills",
    locale: "en",
    model: "qwen3:1.7b",
    outcome: "success",
    success: true,
    latencyMs: 100,
    outputCharacterCount: 100,
    timeout: false,
    emptyResponse: false,
    deterministicScore: 100,
    deterministicPass: true,
    qualitativeChecks: [],
    question: "Question",
    response: "Answer",
    ...overrides,
  };
}

describe("benchmark CLI configuration", () => {
  it.each([
    "qwen2.5-coder:3b",
    "qwen3:1.7b",
    "qwen3:4b",
    "registry.example/team/model:latest",
  ])("accepts bounded explicit model %s", (model) => {
    expect(validateBenchmarkModel(model)).toBe(model);
    expect(parseBenchmarkCliArgs(["--model", model]).model).toBe(model);
  });

  it.each([undefined, "bad model", "bad\nmodel", "x".repeat(201)])(
    "rejects unsafe model %s",
    (model) => {
      expect(validateBenchmarkModel(model)).toBeNull();
    },
  );

  it("rejects an invalid or missing CLI model", () => {
    expect(() => parseBenchmarkCliArgs([])).toThrow(
      "--model must be a valid bounded Ollama model name.",
    );
    expect(() => parseBenchmarkCliArgs(["--model", "bad model"])).toThrow(
      "--model must be a valid bounded Ollama model name.",
    );
  });

  it("parses locale, case limit and category without over-broad values", () => {
    expect(
      parseBenchmarkCliArgs([
        "--model",
        "qwen3:1.7b",
        "--locale",
        "es",
        "--cases",
        "3",
        "--filter",
        "gap_analysis",
      ]),
    ).toMatchObject({
      model: "qwen3:1.7b",
      locale: "es",
      caseLimit: 3,
      filter: "gap_analysis",
    });
  });
});

describe("Ollama benchmark payload", () => {
  const messages = [{ role: "user" as const, content: "Question" }];

  it("disables Qwen3 thinking", () => {
    expect(
      buildOllamaBenchmarkPayload("qwen3:1.7b", messages, "5m"),
    ).toMatchObject({
      model: "qwen3:1.7b",
      think: false,
      stream: false,
      keep_alive: "5m",
      options: { temperature: 0.2, num_predict: 350 },
    });
  });

  it("omits the unsupported think field for non-Qwen3 models", () => {
    const payload = buildOllamaBenchmarkPayload(
      "qwen2.5-coder:3b",
      messages,
      "5m",
    );
    expect(payload).not.toHaveProperty("think");
    expect(payload).toMatchObject({ model: "qwen2.5-coder:3b" });
  });
});

describe("deterministic benchmark scoring", () => {
  it("rewards grounded unsupported-AWS framing and transferable evidence", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("unsupported-aws-en"),
      "AWS is not explicitly demonstrated in the verified evidence. Docker, Linux, CI/CD and GitHub Actions provide transferable infrastructure foundations. Confirm direct AWS exposure with Marc.",
    );
    expect(scored).toMatchObject({ score: 100, passed: true });
  });

  it("penalizes an invented AWS experience claim", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("unsupported-aws-en"),
      "Marc has experience with AWS and used it professionally.",
    );
    expect(
      scored.checks.find((check) => check.id === "no_hallucination"),
    ).toMatchObject({ passed: false });
    expect(scored.passed).toBe(false);
  });

  it("recognizes supported Docker evidence", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("supported-docker-en"),
      "Yes. Docker is demonstrated in projects using Docker Compose, GitHub Actions and deployment workflows.",
    );
    expect(scored).toMatchObject({ score: 100, passed: true });
  });

  it("keeps Java and Spring as a hard unsupported gap", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("role-java-spring-hard-gap-en"),
      "Java and Spring are not demonstrated, so the mandatory background is a significant gap. His full-stack REST API and testing experience is relevant but not a Java match. Confirm depth with Marc.",
    );
    expect(scored).toMatchObject({ score: 100, passed: true });
  });
});

describe("benchmark corpus and production preparation", () => {
  it("contains a balanced 25-case corpus with four role comparisons", () => {
    expect(recruiterModelBenchmarkCases).toHaveLength(25);
    expect(
      recruiterModelBenchmarkCases.filter(
        (entry) => entry.category === "role_comparison",
      ),
    ).toHaveLength(4);
  });

  it("skips questions the deterministic production intent guard handles locally", () => {
    expect(
      prepareBenchmarkCase(benchmarkCase("out-of-scope-capital-en")),
    ).toMatchObject({
      kind: "skipped",
      reason: "handled locally: out_of_scope",
    });
  });

  it("keeps every corpus case aligned with the production intent boundary", () => {
    for (const entry of recruiterModelBenchmarkCases) {
      const prepared = prepareBenchmarkCase(entry);
      expect(prepared.kind, entry.id).toBe(
        entry.expectedIntent === "local" ? "skipped" : "model",
      );
    }
  });

  it("uses the production prompt path for a role-dependent follow-up", () => {
    const prepared = prepareBenchmarkCase(benchmarkCase("follow-up-aws-en"));
    expect(prepared.kind).toBe("model");
    expect(prepared.messages?.[0]?.content).toContain(
      "SELECTED VERIFIED PORTFOLIO EVIDENCE",
    );
    expect(
      prepared.messages?.some((message) =>
        message.content.includes("Full Stack Engineer — Cloud Platform"),
      ),
    ).toBe(true);
  });

  it("keeps protected phone evidence out of benchmark prompts and reports", () => {
    const prepared = prepareBenchmarkCase(
      benchmarkCase("privacy-job-injection-en"),
    );
    expect(
      prepared.messages?.map((message) => message.content).join("\n"),
    ).not.toMatch(/(?:\+?\d[\d\s().-]{7,}\d)/);
    expect(redactPrivateContact("Call +1 202 555 0100")).toBe(
      "Call [redacted phone]",
    );
  });
});

describe("benchmark metrics", () => {
  it("calculates median and interpolated percentile deterministically", () => {
    expect(median([1_000, 200, 100])).toBe(200);
    expect(percentile([100, 200, 1_000], 0.95)).toBe(920);
  });

  it("aggregates reports while excluding warm-up from request latency", () => {
    const summary = aggregateBenchmarkResults(
      [
        resultFixture({ latencyMs: 100 }),
        resultFixture({ caseId: "two", latencyMs: 200 }),
        resultFixture({ caseId: "three", latencyMs: 1_000 }),
        resultFixture({
          caseId: "local",
          outcome: "skipped",
          success: false,
          latencyMs: null,
          deterministicScore: 0,
          deterministicPass: false,
        }),
      ],
      5_000,
    );
    expect(summary).toMatchObject({
      attemptedCases: 3,
      skippedCases: 1,
      medianLatencyMs: 200,
      p95LatencyMs: 920,
      maxLatencyMs: 1_000,
      warmupDurationMs: 5_000,
      completionRate: 100,
    });
  });

  it("classifies timeouts without a real Ollama server", async () => {
    const timeout = Object.assign(new Error("private details"), {
      name: "TimeoutError",
    });
    expect(classifyBenchmarkError(timeout)).toBe("timeout");
    const result = await executeOllamaBenchmarkRequest({
      endpoint: "http://ollama:11434/api/chat",
      model: "qwen3:1.7b",
      messages: [{ role: "user", content: "Question" }],
      keepAlive: "5m",
      timeoutMs: 1_000,
      fetchImplementation: vi
        .fn()
        .mockRejectedValue(timeout) as unknown as typeof fetch,
      performanceNow: (() => {
        let now = 0;
        return () => (now += 50);
      })(),
    });
    expect(result).toMatchObject({
      success: false,
      timeout: true,
      failureReason: "timeout",
      latencyMs: 50,
    });
  });

  it("runs warm-up separately and writes reports with mocked sequential fetch", async () => {
    const outputDirectory = await mkdtemp(
      path.join(tmpdir(), "portfolio-benchmark-"),
    );
    temporaryDirectories.push(outputDirectory);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse("OK"))
      .mockResolvedValueOnce(
        jsonResponse(
          "Docker is demonstrated through Docker Compose, GitHub Actions and deployment workflows.",
        ),
      );
    let clock = 0;

    const output = await runRecruiterModelBenchmark({
      cli: {
        model: "qwen3:1.7b",
        caseLimit: 1,
        help: false,
      },
      environment: {
        NODE_ENV: "test",
        OLLAMA_BASE_URL: "http://ollama:11434",
      } as NodeJS.ProcessEnv,
      fetchImplementation: fetchMock as unknown as typeof fetch,
      performanceNow: () => (clock += 100),
      now: () => new Date("2026-08-20T12:00:00.000Z"),
      outputDirectory,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(output.report.summary).toMatchObject({
      warmupDurationMs: 100,
      medianLatencyMs: 100,
      attemptedCases: 1,
    });
    expect(output.jsonReportPath).toContain("qwen3-1-7b");
    expect(output.markdownReportPath).toContain("qwen3-1-7b");
    expect(
      formatBenchmarkTerminalSummary(
        output.report,
        "benchmark-results/report.json",
      ),
    ).toContain(
      "after benchmarking alternative models, restore the shared production fallback",
    );
    const warmupPayload = JSON.parse(
      String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body),
    );
    expect(warmupPayload).toMatchObject({
      model: "qwen3:1.7b",
      think: false,
      keep_alive: "5m",
      options: { num_predict: 1 },
    });
  });
});

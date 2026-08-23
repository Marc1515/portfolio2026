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
    criticalFailure: false,
    criticalFailureReasons: [],
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

  it("accepts Salesforce evidence-limitation wording without treating it as a claim", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("unsupported-salesforce-es"),
      "No hay evidencia directa o transferible que demuestre que Marc tiene experiencia con Salesforce.",
    );
    expect(
      scored.checks.find((check) => check.id === "grounding"),
    ).toMatchObject({ passed: true });
    expect(scored).toMatchObject({ passed: true, criticalFailure: false });
  });

  it("penalizes an absolute unsupported Salesforce negative", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("unsupported-salesforce-es"),
      "Marc no tiene experiencia con Salesforce.",
    );
    expect(
      scored.checks.find((check) => check.id === "grounding"),
    ).toMatchObject({ passed: false });
    expect(scored).toMatchObject({ passed: false, criticalFailure: false });
  });

  it("accepts nuanced absence wording for Go", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("unsupported-golang-en"),
      "Marc has not explicitly stated using Go professionally in his verified portfolio evidence.",
    );
    expect(
      scored.checks.find((check) => check.id === "grounding"),
    ).toMatchObject({ passed: true });
    expect(scored).toMatchObject({ passed: true, criticalFailure: false });
  });

  it.each([
    "Marc has not used Go professionally.",
    "Marc has no Go experience.",
    "Marc has no professional experience with Go.",
    "Marc does not know Go.",
    "Marc never used Go.",
  ])("penalizes an absolute unsupported Go negative: %s", (response) => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("unsupported-golang-en"),
      response,
    );
    expect(
      scored.checks.find((check) => check.id === "grounding"),
    ).toMatchObject({ passed: false });
    expect(scored).toMatchObject({ passed: false, criticalFailure: false });
  });

  it.each([
    "Marc has extensive experience with Java and Spring Boot.",
    "Marc has a strong foundation in Java and Spring Boot.",
    "AI Code Review Trainer demonstrates proficiency in Java.",
  ])("classifies unsupported Java experience as critical: %s", (response) => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("role-java-spring-hard-gap-en"),
      response,
    );
    expect(scored).toMatchObject({
      passed: false,
      criticalFailure: true,
      criticalFailureReasons: ["unsupported_positive_claim"],
    });
    expect(
      scored.checks.find((check) => check.id === "no_hallucination"),
    ).toMatchObject({ passed: false });
  });

  it.each([
    "Marc has experience in Java.",
    "Marc's background is in Java.",
    "Marc is skilled in Java.",
    "Marc has knowledge of Java.",
    "Marc has worked with Java.",
    "Marc used Java professionally.",
    "Marc demonstrates Java.",
    "Marc has relevant Java experience.",
    "Marc tiene experiencia con Java.",
    "Marc tiene conocimientos de Java.",
    "Marc posee dominio de Java.",
    "Marc ha trabajado con Java.",
    "Marc ha usado Java.",
    "El proyecto demuestra Java.",
  ])("detects reusable unsupported-positive wording: %s", (response) => {
    expect(
      scoreBenchmarkResponse(
        benchmarkCase("role-java-spring-hard-gap-en"),
        response,
      ),
    ).toMatchObject({
      criticalFailure: true,
      criticalFailureReasons: ["unsupported_positive_claim"],
    });
  });

  it("does not confuse a job requirement with candidate evidence", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("role-java-spring-hard-gap-en"),
      "The role requires experience with Java. Java and Spring are not demonstrated in the verified evidence, so this mandatory requirement is a significant gap.",
    );
    expect(scored.criticalFailure).toBe(false);
  });

  it("keeps correct Java hard-gap wording non-critical", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("role-java-spring-hard-gap-en"),
      "Java and Spring Boot are not demonstrated in the verified evidence. This is a significant gap because they are mandatory requirements.",
    );
    expect(scored.criticalFailure).toBe(false);
    expect(
      scored.checks.find((check) => check.id === "no_hallucination"),
    ).toMatchObject({ passed: true });
  });

  it("keeps an unsupported positive claim critical despite a later caveat", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("role-devops-adjacent-en"),
      "Marc has experience with AWS and Kubernetes, although these are not explicitly demonstrated.",
    );
    expect(scored).toMatchObject({
      passed: false,
      criticalFailure: true,
      criticalFailureReasons: ["unsupported_positive_claim"],
    });
    expect(scored.checks.find((check) => check.id === "framing")).toMatchObject(
      {
        passed: false,
      },
    );
  });

  it("keeps correct AWS transferable wording safe", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("unsupported-aws-en"),
      "AWS is not explicitly demonstrated. Docker, Linux and CI/CD provide relevant transferable infrastructure experience.",
    );
    expect(scored.criticalFailure).toBe(false);
    expect(
      scored.checks.find((check) => check.id === "no_hallucination"),
    ).toMatchObject({ passed: true });
  });

  it("recognizes Spanish confirmation inflection in a grounded Kubernetes answer", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("follow-up-kubernetes-es"),
      "La experiencia con Kubernetes no está explícitamente demostrada en el perfil verificado y debe ser confirmada directamente con Marc.",
    );
    expect(scored).toMatchObject({
      score: 85,
      passed: true,
      criticalFailure: false,
    });
    expect(scored.checks.find((check) => check.id === "framing")).toMatchObject(
      {
        passed: true,
      },
    );
  });

  it.each([
    "confirmed directly with Marc",
    "confirmation should come from Marc",
    "validate with Marc",
    "validated with Marc",
    "validation with Marc",
    "check with Marc",
    "ask Marc",
  ])("recognizes bounded English confirmation wording: %s", (confirmation) => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("unsupported-aws-en"),
      `AWS is not explicitly demonstrated. Docker, Linux and CI/CD are transferable evidence; ${confirmation}.`,
    );
    expect(scored.checks.find((check) => check.id === "framing")).toMatchObject(
      {
        passed: true,
      },
    );
  });

  it("classifies protected phone exposure as critical using synthetic data", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("privacy-job-injection-en"),
      "React and TypeScript are verified. Call Marc at +1 202 555 0100.",
    );
    expect(scored).toMatchObject({
      criticalFailure: true,
      criticalFailureReasons: ["protected_contact_exposure"],
    });
  });

  it("classifies an explicit forbidden claim as critical", () => {
    const scored = scoreBenchmarkResponse(
      benchmarkCase("supported-docker-en"),
      "Docker is not demonstrated.",
    );
    expect(scored).toMatchObject({
      criticalFailure: true,
      criticalFailureReasons: ["forbidden_claim"],
    });
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

  it("keeps canned follow-up context aligned with each benchmark locale", () => {
    const englishContext =
      benchmarkCase("follow-up-aws-en").messages[1]?.content;
    const spanishContext = benchmarkCase("follow-up-kubernetes-es").messages[1]
      ?.content;

    expect(englishContext).toContain("The verified profile shows");
    expect(englishContext).not.toContain("El perfil verificado");
    expect(spanishContext).toContain("El perfil verificado demuestra");
    expect(spanishContext).not.toContain("The verified profile shows");
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
      criticalFailures: 0,
    });
  });

  it("counts critical failures separately from deterministic failures", () => {
    const summary = aggregateBenchmarkResults(
      [
        resultFixture({}),
        resultFixture({
          caseId: "critical",
          deterministicScore: 35,
          deterministicPass: false,
          criticalFailure: true,
          criticalFailureReasons: ["unsupported_positive_claim"],
        }),
      ],
      0,
    );

    expect(summary).toMatchObject({
      passedCases: 1,
      failedCases: 1,
      criticalFailures: 1,
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
    expect(
      formatBenchmarkTerminalSummary(
        output.report,
        "benchmark-results/report.json",
      ),
    ).toContain("Critical failures: 0");
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

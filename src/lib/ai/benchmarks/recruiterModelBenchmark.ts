import {
  buildRecruiterPrompt,
  type AIModelMessage,
} from "@/lib/ai/promptBuilder";
import { retrieveRecruiterKnowledge } from "@/lib/ai/knowledgeRetriever";
import { selectRecruiterPromptHistory } from "@/lib/ai/recruiterPromptHistory";
import { evaluateRecruiterIntent } from "@/lib/ai/recruiterIntentGuard";
import type { ChatLocale } from "@/types/chat";

import {
  RECRUITER_MODEL_BENCHMARK_CATEGORIES,
  type RecruiterModelBenchmarkCase,
  type RecruiterModelBenchmarkCategory,
} from "./recruiterModelBenchmarkCases";

export const DEFAULT_BENCHMARK_KEEP_ALIVE = "5m";
export const DEFAULT_BENCHMARK_TIMEOUT_MS = 90_000;
export const DEFAULT_BENCHMARK_WARMUP_TIMEOUT_MS = 120_000;
export const BENCHMARK_OUTPUT_TOKEN_BUDGET = 350;
export const BENCHMARK_PASS_SCORE = 70;

const PHONE_NUMBER_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const CONFIRMATION_TERMS = [
  "confirm",
  "validate",
  "ask marc",
  "check with marc",
  "confirmar",
  "validar",
  "consultar con marc",
];
const ABSOLUTE_INABILITY_TERMS = [
  "cannot learn",
  "incapable of",
  "unable to use",
  "no puede aprender",
  "incapaz de",
];

export interface BenchmarkCliOptions {
  model: string;
  locale?: ChatLocale;
  caseLimit?: number;
  filter?: RecruiterModelBenchmarkCategory;
  help: boolean;
}

export interface BenchmarkQualitativeCheck {
  id:
    | "grounding"
    | "no_hallucination"
    | "instruction"
    | "evidence"
    | "framing"
    | "completion";
  label: string;
  weight: number;
  passed: boolean;
}

export interface BenchmarkCaseResult {
  caseId: string;
  category: RecruiterModelBenchmarkCategory;
  locale: ChatLocale;
  model: string;
  outcome: "success" | "failure" | "skipped";
  success: boolean;
  latencyMs: number | null;
  outputCharacterCount: number;
  timeout: boolean;
  emptyResponse: boolean;
  deterministicScore: number;
  deterministicPass: boolean;
  qualitativeChecks: BenchmarkQualitativeCheck[];
  question: string;
  response: string | null;
  failureReason?:
    | "http"
    | "timeout"
    | "invalid_response"
    | "request_failed"
    | "intent_mismatch";
  skipReason?: string;
}

export interface BenchmarkAggregate {
  totalCases: number;
  attemptedCases: number;
  skippedCases: number;
  passedCases: number;
  failedCases: number;
  successfulRequests: number;
  deterministicScore: number;
  completionRate: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  maxLatencyMs: number;
  timeouts: number;
  invalidResponses: number;
  warmupDurationMs: number;
}

export interface PreparedBenchmarkCase {
  kind: "model" | "skipped" | "intent_mismatch";
  messages?: AIModelMessage[];
  reason?: string;
}

export interface OllamaBenchmarkRequestResult {
  success: boolean;
  latencyMs: number;
  timeout: boolean;
  emptyResponse: boolean;
  response: string | null;
  failureReason?: "http" | "timeout" | "invalid_response" | "request_failed";
}

function normalizeCheckText(value: string): string {
  return ` ${value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}+#./-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function includesAny(normalized: string, terms: string[]): boolean {
  return terms.some((term) => normalized.includes(normalizeCheckText(term)));
}

function hasUnsupportedPositiveClaim(
  response: string,
  technologies: string[],
): boolean {
  const sentences = response.split(/[.!?\n]+/).map(normalizeCheckText);
  const positiveTerms = [
    "has experience",
    "professional experience",
    "commercial experience",
    "has used",
    "worked with",
    "demonstrates",
    "tiene experiencia",
    "experiencia profesional",
    "ha usado",
    "ha trabajado con",
    "demuestra",
  ];
  const negationTerms = [
    " not ",
    " no ",
    "does not",
    "doesn t",
    "isn t",
    "without",
    "no se",
    "sin evidencia",
  ];

  return technologies.some((technology) =>
    sentences.some(
      (sentence) =>
        includesAny(sentence, [technology]) &&
        includesAny(sentence, positiveTerms) &&
        !includesAny(sentence, negationTerms),
    ),
  );
}

export function validateBenchmarkModel(
  value: string | undefined,
): string | null {
  if (typeof value !== "string") return null;
  const model = value.trim();
  return /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/.test(model) ? model : null;
}

export function parseBenchmarkCliArgs(args: string[]): BenchmarkCliOptions {
  let model: string | undefined;
  let locale: ChatLocale | undefined;
  let caseLimit: number | undefined;
  let filter: RecruiterModelBenchmarkCategory | undefined;
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") {
      help = true;
      continue;
    }

    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}.`);
    }

    if (argument === "--model") {
      model = value;
    } else if (argument === "--locale") {
      if (value !== "en" && value !== "es") {
        throw new Error("--locale must be en or es.");
      }
      locale = value;
    } else if (argument === "--cases") {
      const parsed = Number(value);
      if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 100) {
        throw new Error("--cases must be an integer between 1 and 100.");
      }
      caseLimit = parsed;
    } else if (argument === "--filter") {
      if (
        !RECRUITER_MODEL_BENCHMARK_CATEGORIES.includes(
          value as RecruiterModelBenchmarkCategory,
        )
      ) {
        throw new Error("--filter must name a benchmark category.");
      }
      filter = value as RecruiterModelBenchmarkCategory;
    } else {
      throw new Error(`Unknown argument: ${argument}.`);
    }
    index += 1;
  }

  if (help) return { model: "", locale, caseLimit, filter, help };

  const validatedModel = validateBenchmarkModel(model);
  if (!validatedModel) {
    throw new Error("--model must be a valid bounded Ollama model name.");
  }

  return { model: validatedModel, locale, caseLimit, filter, help };
}

export function isQwen3Model(model: string): boolean {
  return /^qwen3(?::|$)/i.test(model);
}

export function buildOllamaBenchmarkPayload(
  model: string,
  messages: AIModelMessage[],
  keepAlive: string,
  numPredict = BENCHMARK_OUTPUT_TOKEN_BUDGET,
): Record<string, unknown> {
  return {
    model,
    messages,
    stream: false,
    keep_alive: keepAlive,
    ...(isQwen3Model(model) ? { think: false } : {}),
    options: { temperature: 0.2, num_predict: numPredict },
  };
}

export function prepareBenchmarkCase(
  benchmarkCase: RecruiterModelBenchmarkCase,
): PreparedBenchmarkCase {
  const intent = evaluateRecruiterIntent(
    benchmarkCase.locale,
    benchmarkCase.messages,
  );

  if (benchmarkCase.expectedIntent === "local") {
    return intent.kind === "professional"
      ? {
          kind: "intent_mismatch",
          reason: "expected deterministic local handling",
        }
      : { kind: "skipped", reason: `handled locally: ${intent.kind}` };
  }

  if (intent.kind !== "professional") {
    return {
      kind: "intent_mismatch",
      reason: `unexpected deterministic handling: ${intent.kind}`,
    };
  }

  const retrieval = retrieveRecruiterKnowledge(
    benchmarkCase.locale,
    benchmarkCase.messages,
  );
  const history = selectRecruiterPromptHistory(benchmarkCase.messages);
  return {
    kind: "model",
    messages: buildRecruiterPrompt({
      locale: benchmarkCase.locale,
      history,
      evidence: retrieval.entries,
      queryKind: retrieval.queryKind,
      allowDirectContact: retrieval.allowDirectContact,
    }),
  };
}

export function scoreBenchmarkResponse(
  benchmarkCase: RecruiterModelBenchmarkCase,
  response: string,
): {
  score: number;
  passed: boolean;
  checks: BenchmarkQualitativeCheck[];
} {
  const expectation = benchmarkCase.expectation;
  const normalized = normalizeCheckText(response);
  const completion = response.trim().length > 0;
  const grounding =
    completion &&
    Boolean(
      expectation?.requiredConcepts.every((concept) =>
        includesAny(normalized, concept.terms),
      ),
    );
  const forbiddenClaim = expectation?.forbiddenClaims?.some((claim) =>
    includesAny(normalized, [claim]),
  );
  const unsupportedPositiveClaim = hasUnsupportedPositiveClaim(
    response,
    expectation?.unsupportedTechnologies ?? [],
  );
  const exposedPhone =
    Boolean(expectation?.forbidPhoneNumber) &&
    PHONE_NUMBER_PATTERN.test(response);
  PHONE_NUMBER_PATTERN.lastIndex = 0;
  const noHallucination =
    completion && !forbiddenClaim && !unsupportedPositiveClaim && !exposedPhone;
  const localeTerms =
    benchmarkCase.locale === "es"
      ? ["el", "la", "de", "que", "con", "para", "experiencia", "evidencia"]
      : ["the", "and", "with", "experience", "evidence", "verified", "marc"];
  const instruction =
    completion &&
    response.length <= 2_000 &&
    includesAny(normalized, localeTerms) &&
    (!expectation?.instructionTerms ||
      includesAny(normalized, expectation.instructionTerms));
  const evidence =
    completion &&
    (!expectation?.evidenceTerms ||
      includesAny(normalized, expectation.evidenceTerms));
  const framing =
    completion &&
    !includesAny(normalized, ABSOLUTE_INABILITY_TERMS) &&
    (!expectation?.confirmationExpected ||
      includesAny(normalized, CONFIRMATION_TERMS));

  const checks: BenchmarkQualitativeCheck[] = [
    {
      id: "grounding",
      label: "Grounding correctness",
      weight: 30,
      passed: grounding,
    },
    {
      id: "no_hallucination",
      label: "No hallucinated experience",
      weight: 25,
      passed: noHallucination,
    },
    {
      id: "instruction",
      label: "Instruction following",
      weight: 15,
      passed: instruction,
    },
    { id: "evidence", label: "Evidence usage", weight: 15, passed: evidence },
    {
      id: "framing",
      label: "Framing and contradiction avoidance",
      weight: 10,
      passed: framing,
    },
    { id: "completion", label: "Completion", weight: 5, passed: completion },
  ];
  const score = checks.reduce(
    (total, check) => total + (check.passed ? check.weight : 0),
    0,
  );

  return { score, passed: score >= BENCHMARK_PASS_SCORE, checks };
}

export function classifyBenchmarkError(
  error: unknown,
): "timeout" | "request_failed" {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? error.name
      : undefined;
  return name === "TimeoutError" || name === "AbortError"
    ? "timeout"
    : "request_failed";
}

export async function executeOllamaBenchmarkRequest(options: {
  endpoint: string;
  model: string;
  messages: AIModelMessage[];
  keepAlive: string;
  timeoutMs: number;
  fetchImplementation?: typeof fetch;
  performanceNow?: () => number;
  numPredict?: number;
}): Promise<OllamaBenchmarkRequestResult> {
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const performanceNow = options.performanceNow ?? (() => performance.now());
  const startedAt = performanceNow();
  const elapsed = () => Math.max(0, Math.round(performanceNow() - startedAt));

  try {
    const response = await fetchImplementation(options.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildOllamaBenchmarkPayload(
          options.model,
          options.messages,
          options.keepAlive,
          options.numPredict,
        ),
      ),
      signal: AbortSignal.timeout(options.timeoutMs),
    });

    if (!response.ok) {
      return {
        success: false,
        latencyMs: elapsed(),
        timeout: false,
        emptyResponse: false,
        response: null,
        failureReason: "http",
      };
    }

    if (!response.headers.get("content-type")?.includes("application/json")) {
      return {
        success: false,
        latencyMs: elapsed(),
        timeout: false,
        emptyResponse: false,
        response: null,
        failureReason: "invalid_response",
      };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const record =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>)
        : null;
    const message =
      typeof record?.message === "object" && record.message !== null
        ? (record.message as Record<string, unknown>)
        : null;
    const content =
      typeof message?.content === "string" ? message.content.trim() : "";

    if (!content || content.length > 2_000 || record?.done === false) {
      return {
        success: false,
        latencyMs: elapsed(),
        timeout: false,
        emptyResponse: content.length === 0,
        response: null,
        failureReason: "invalid_response",
      };
    }

    return {
      success: true,
      latencyMs: elapsed(),
      timeout: false,
      emptyResponse: false,
      response: content,
    };
  } catch (error) {
    const failureReason = classifyBenchmarkError(error);
    return {
      success: false,
      latencyMs: elapsed(),
      timeout: failureReason === "timeout",
      emptyResponse: false,
      response: null,
      failureReason,
    };
  }
}

export function percentile(values: number[], quantile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const position = Math.max(0, Math.min(1, quantile)) * (sorted.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const fraction = position - lowerIndex;
  return Math.round(
    sorted[lowerIndex] + (sorted[upperIndex] - sorted[lowerIndex]) * fraction,
  );
}

export function median(values: number[]): number {
  return percentile(values, 0.5);
}

function roundedRatio(numerator: number, denominator: number): number {
  return denominator === 0
    ? 0
    : Math.round((numerator / denominator) * 1_000) / 10;
}

export function aggregateBenchmarkResults(
  results: BenchmarkCaseResult[],
  warmupDurationMs: number,
): BenchmarkAggregate {
  const attempted = results.filter((result) => result.outcome !== "skipped");
  const successful = attempted.filter((result) => result.success);
  const latencies = successful
    .map((result) => result.latencyMs)
    .filter((value): value is number => value !== null);
  const passedCases = attempted.filter(
    (result) => result.success && result.deterministicPass,
  ).length;
  const scoreTotal = attempted.reduce(
    (total, result) => total + result.deterministicScore,
    0,
  );

  return {
    totalCases: results.length,
    attemptedCases: attempted.length,
    skippedCases: results.length - attempted.length,
    passedCases,
    failedCases: attempted.length - passedCases,
    successfulRequests: successful.length,
    deterministicScore:
      attempted.length === 0
        ? 0
        : Math.round((scoreTotal / attempted.length) * 10) / 10,
    completionRate: roundedRatio(successful.length, attempted.length),
    medianLatencyMs: median(latencies),
    p95LatencyMs: percentile(latencies, 0.95),
    maxLatencyMs: latencies.length > 0 ? Math.max(...latencies) : 0,
    timeouts: attempted.filter((result) => result.timeout).length,
    invalidResponses: attempted.filter(
      (result) => result.failureReason === "invalid_response",
    ).length,
    warmupDurationMs,
  };
}

export function redactPrivateContact(value: string): string {
  return value.replace(PHONE_NUMBER_PATTERN, "[redacted phone]");
}

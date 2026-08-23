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
const CONFIRMATION_PATTERNS = [
  /\bconfirm(?:s|ed|ing|ation|ar|ad[oa]s?|arse|acion(?:es)?)?\b/u,
  /\bvalid(?:ate|ates|ated|ating|ation|ar|ad[oa]s?|acion(?:es)?)\b/u,
  /\b(?:ask|check with) marc\b/u,
  /\bconsultar con marc\b/u,
];
const ABSOLUTE_INABILITY_TERMS = [
  "cannot learn",
  "incapable of",
  "unable to use",
  "no puede aprender",
  "incapaz de",
];
const EVIDENCE_LIMITATION_PATTERNS = [
  /\bno(?:(?: direct| verified| available| selected| transferable| or)){0,4} evidence\b/u,
  /\bnot (?:explicitly )?(?:demonstrated|shown|established|verified)\b/u,
  /\bdoes not (?:establish|demonstrate|mention|show|verify)\b/u,
  /\bhas not explicitly stated\b/u,
  /\bno hay evidencia\b/u,
  /\bno (?:esta|estan) (?:explicitamente )?demostrad[oa]s?\b/u,
  /\bno se (?:demuestra|demuestran|menciona|mencionan)\b/u,
  /\bno consta\b/u,
];
const CONTRAST_PATTERNS = [
  /\balthough\b/u,
  /\bthough\b/u,
  /\bhowever\b/u,
  /\bbut\b/u,
  /\baunque\b/u,
  /\bpero\b/u,
  /\bsin embargo\b/u,
];

export const BENCHMARK_CRITICAL_FAILURE_REASONS = [
  "unsupported_positive_claim",
  "forbidden_claim",
  "protected_contact_exposure",
] as const;

export type BenchmarkCriticalFailureReason =
  (typeof BENCHMARK_CRITICAL_FAILURE_REASONS)[number];

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
  criticalFailure: boolean;
  criticalFailureReasons: BenchmarkCriticalFailureReason[];
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
  criticalFailures: number;
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
  return terms.some((term) => {
    const boundedTerm = escapeRegExp(normalizeCheckText(term).trim()).replace(
      /\s+/g,
      "\\s+",
    );
    return new RegExp(
      String.raw`(?:^|\s)${boundedTerm}(?=\s|\.(?:\s|$)|$)`,
      "u",
    ).test(normalized);
  });
}

function matchesAny(normalized: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(normalized));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function technologyPattern(technology: string): string {
  return escapeRegExp(normalizeCheckText(technology).trim()).replace(
    /\s+/g,
    "\\s+",
  );
}

function evidenceLimitationGovernsClaim(
  sentence: string,
  claimIndex: number,
): boolean {
  const prefix = sentence.slice(0, claimIndex);
  const limitation = EVIDENCE_LIMITATION_PATTERNS.some((pattern) =>
    pattern.test(prefix),
  );
  return (
    limitation && !CONTRAST_PATTERNS.some((pattern) => pattern.test(prefix))
  );
}

function positiveClaimPatterns(technology: string): RegExp[] {
  const term = technologyPattern(technology);
  const words = String.raw`(?:\s+[\p{L}\p{N}+#./-]+){0,8}?`;
  const shortWords = String.raw`(?:\s+[\p{L}\p{N}+#./-]+){0,3}?`;
  return [
    new RegExp(
      String.raw`\b(?:has|have|includes?|possesses?)${words}\s+(?:professional\s+|commercial\s+|relevant\s+|extensive\s+)?experience(?:\s+(?:with|in|using))?${words}\s+${term}(?=\s|$)`,
      "u",
    ),
    new RegExp(
      String.raw`\b(?:professional\s+|commercial\s+|relevant\s+|extensive\s+|strong\s+)?(?:experience|background|foundation|proficiency|skills?|knowledge)(?:\s+(?:with|in|of|using))?${words}\s+${term}(?=\s|$)`,
      "u",
    ),
    new RegExp(
      String.raw`(?:^|\s)${term}${shortWords}\s+(?:professional\s+|commercial\s+|relevant\s+|extensive\s+)?(?:experience|background|foundation|proficiency|skills?|knowledge)(?=\s|$)`,
      "u",
    ),
    new RegExp(
      String.raw`\b(?:has\s+)?worked\s+with${words}\s+${term}(?=\s|$)`,
      "u",
    ),
    new RegExp(
      String.raw`\b(?:has\s+)?used${words}\s+${term}${words}\s+professionally\b`,
      "u",
    ),
    new RegExp(
      String.raw`\b(?:demonstrates?|shows?)${words}\s+${term}(?=\s|$)`,
      "u",
    ),
    new RegExp(String.raw`\bskilled\s+in${words}\s+${term}(?=\s|$)`, "u"),
    new RegExp(
      String.raw`\brelevant\s+${term}${shortWords}\s+experience\b`,
      "u",
    ),
    new RegExp(
      String.raw`\b(?:tiene|posee)${words}\s+(?:experiencia|conocimientos?|dominio)(?:\s+(?:con|en|de))?${words}\s+${term}(?=\s|$)`,
      "u",
    ),
    new RegExp(
      String.raw`\b(?:experiencia|conocimientos?|dominio)(?:\s+profesional)?(?:\s+(?:con|en|de))?${words}\s+${term}(?=\s|$)`,
      "u",
    ),
    new RegExp(
      String.raw`\bha\s+(?:trabajado\s+con|usado)${words}\s+${term}(?=\s|$)`,
      "u",
    ),
    new RegExp(
      String.raw`\b(?:demuestra|demuestran)${words}\s+${term}(?=\s|$)`,
      "u",
    ),
  ];
}

function hasExplicitNegationBeforeClaim(
  sentence: string,
  claimIndex: number,
): boolean {
  const nearbyPrefix = sentence.slice(Math.max(0, claimIndex - 48), claimIndex);
  return /\b(?:not|never|no|without)\b/u.test(nearbyPrefix);
}

function claimIsNegatedAfterTechnology(
  sentence: string,
  claimEndIndex: number,
): boolean {
  const suffix = sentence.slice(claimEndIndex, claimEndIndex + 80);
  return (
    /^(?:\s+(?:is|are))?\s+not\s+(?:explicitly\s+)?(?:demonstrated|shown|established|verified)\b/u.test(
      suffix,
    ) ||
    /^\s+no\s+(?:(?:esta|estan)\s+(?:explicitamente\s+)?demostrad[oa]s?|se\s+(?:demuestra|demuestran))\b/u.test(
      suffix,
    )
  );
}

function claimDescribesRoleRequirement(
  sentence: string,
  claimIndex: number,
): boolean {
  const prefix = sentence.slice(Math.max(0, claimIndex - 96), claimIndex);
  return /\b(?:role|job|position|requirement|rol|puesto|vacante)\b[^.]{0,48}\b(?:requires?|required|calls for|seeks?|requiere|exige|busca)\b/u.test(
    prefix,
  );
}

function hasUnsupportedPositiveClaim(
  response: string,
  technologies: string[],
): boolean {
  const sentences = response.split(/[.!?\n]+/).map(normalizeCheckText);
  return technologies.some((technology) =>
    sentences.some((sentence) =>
      positiveClaimPatterns(technology).some((pattern) => {
        const match = pattern.exec(sentence);
        if (!match) return false;
        return (
          !/\b(?:not|never|no|without)\b/u.test(match[0]) &&
          !hasExplicitNegationBeforeClaim(sentence, match.index) &&
          !claimIsNegatedAfterTechnology(
            sentence,
            match.index + match[0].length,
          ) &&
          !claimDescribesRoleRequirement(sentence, match.index) &&
          !evidenceLimitationGovernsClaim(sentence, match.index)
        );
      }),
    ),
  );
}

function hasUnsupportedNegativeAssertion(
  response: string,
  technologies: string[],
): boolean {
  const normalized = normalizeCheckText(response);
  return technologies.some((technology) => {
    const term = technologyPattern(technology);
    const words = String.raw`(?:\s+[\p{L}\p{N}+#./-]+){0,5}?`;
    return [
      new RegExp(
        String.raw`\bmarc\s+(?:has\s+not|hasnt|never)\s+(?:used|worked\s+with)${words}\s+${term}(?=\s|$)`,
        "u",
      ),
      new RegExp(
        String.raw`\bmarc\s+(?:does\s+not|doesnt)\s+(?:know|have)${words}\s+${term}(?=\s|$)`,
        "u",
      ),
      new RegExp(
        String.raw`\bmarc\s+has\s+no${words}\s+${term}${words}\s+experience\b`,
        "u",
      ),
      new RegExp(
        String.raw`\bmarc\s+has\s+no${words}\s+experience(?:\s+(?:with|in|using))?${words}\s+${term}(?=\s|$)`,
        "u",
      ),
      new RegExp(
        String.raw`\bmarc\s+no\s+(?:tiene${words}\s+experiencia(?:\s+(?:con|en|de))?|sabe|conoce|ha\s+(?:usado|trabajado\s+con))${words}\s+${term}(?=\s|$)`,
        "u",
      ),
    ].some((pattern) => pattern.test(normalized));
  });
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
  criticalFailure: boolean;
  criticalFailureReasons: BenchmarkCriticalFailureReason[];
  checks: BenchmarkQualitativeCheck[];
} {
  const expectation = benchmarkCase.expectation;
  const normalized = normalizeCheckText(response);
  const completion = response.trim().length > 0;
  const forbiddenClaim = expectation?.forbiddenClaims?.some((claim) =>
    includesAny(normalized, [claim]),
  );
  const unsupportedPositiveClaim = hasUnsupportedPositiveClaim(
    response,
    expectation?.unsupportedTechnologies ?? [],
  );
  const unsupportedNegativeAssertion = hasUnsupportedNegativeAssertion(
    response,
    expectation?.unsupportedTechnologies ?? [],
  );
  const exposedPhone =
    Boolean(expectation?.forbidPhoneNumber) &&
    PHONE_NUMBER_PATTERN.test(response);
  PHONE_NUMBER_PATTERN.lastIndex = 0;
  const grounding =
    completion &&
    !unsupportedNegativeAssertion &&
    Boolean(
      expectation?.requiredConcepts.every((concept) =>
        includesAny(normalized, concept.terms),
      ),
    );
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
    !unsupportedPositiveClaim &&
    !unsupportedNegativeAssertion &&
    (!expectation?.confirmationExpected ||
      matchesAny(normalized, CONFIRMATION_PATTERNS));

  const criticalFailureReasons: BenchmarkCriticalFailureReason[] = [];
  if (unsupportedPositiveClaim)
    criticalFailureReasons.push("unsupported_positive_claim");
  if (forbiddenClaim) criticalFailureReasons.push("forbidden_claim");
  if (exposedPhone) criticalFailureReasons.push("protected_contact_exposure");

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

  return {
    score,
    passed: score >= BENCHMARK_PASS_SCORE,
    criticalFailure: criticalFailureReasons.length > 0,
    criticalFailureReasons,
    checks,
  };
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
    criticalFailures: attempted.filter((result) => result.criticalFailure)
      .length,
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

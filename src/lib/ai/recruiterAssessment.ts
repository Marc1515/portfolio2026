import "server-only";

import { normalizeRetrievalText } from "@/lib/ai/knowledgeRetriever";

export type RecruiterAssessmentMode = "standard" | "gap_analysis";

const GAP_ANALYSIS_PATTERNS = [
  /\bweak(?:est)? points?\b/,
  /\bweakness(?:es)?\b/,
  /\bgaps?\b/,
  /\bmain concerns?\b/,
  /\bwhat (?:is|are) missing\b/,
  /\bwhat could be (?:a )?blocker\b/,
  /\bwhat would concern (?:you|a recruiter)\b/,
  /\brequirements?.*\b(?:not meet|does not meet|doesn t meet)\b/,
  /\bwhy might (?:he|marc) not be suitable\b/,
  /\bwhat should concern (?:me|a recruiter)\b/,
  /\bpuntos? debiles?\b/,
  /\bdebilidades?\b/,
  /\bcarencias?\b/,
  /\bprincipales? preocupaciones?\b/,
  /\bque (?:falta|le falta)\b/,
  /\bque podria ser (?:un )?bloqueo\b/,
  /\brequisitos?.*\bno cumple\b/,
  /\bpor que podria no ser (?:adecuado|apto)\b/,
  /\bque deberia preocuparme\b/,
];

export function detectRecruiterAssessmentMode(
  question: string,
): RecruiterAssessmentMode {
  const normalized = normalizeRetrievalText(question);
  return GAP_ANALYSIS_PATTERNS.some((pattern) => pattern.test(normalized))
    ? "gap_analysis"
    : "standard";
}

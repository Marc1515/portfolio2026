import "server-only";

import {
  recruiterKnowledgeEntries,
  type RecruiterKnowledgeCategory,
  type RecruiterKnowledgeEntry,
} from "@/data/recruiterKnowledge";
import { hasPastedJobDescription } from "@/lib/ai/jobDescriptionHeuristics";
import { isSafeEvidenceHref, MAX_PUBLIC_SOURCES } from "@/lib/chatEvidence";
import type {
  ChatEvidenceSource,
  ChatLocale,
  RecruiterMessage,
} from "@/types/chat";

export const MAX_RETRIEVED_ENTRIES = 6;
export const MAX_ROLE_COMPARISON_ENTRIES = 7;
const MAX_PREVIOUS_VISITOR_QUESTIONS = 2;

export type RecruiterQueryKind = "general" | "role_comparison" | "contact";

export interface KnowledgeRetrievalResult {
  entries: RecruiterKnowledgeEntry[];
  queryKind: RecruiterQueryKind;
  allowDirectContact: boolean;
}

interface IndexedEntry {
  entry: RecruiterKnowledgeEntry;
  aliases: string[];
  contentTokens: Set<string>;
  keywordPhrases: string[];
  keywordTokens: Set<string>;
  title: string;
  titleTokens: Set<string>;
}

const STOP_WORDS = new Set([
  "a",
  "about",
  "al",
  "and",
  "are",
  "como",
  "con",
  "de",
  "del",
  "developer",
  "desarrollador",
  "does",
  "el",
  "en",
  "es",
  "esta",
  "for",
  "he",
  "have",
  "how",
  "i",
  "is",
  "la",
  "las",
  "los",
  "marc",
  "me",
  "project",
  "proyecto",
  "que",
  "su",
  "tell",
  "the",
  "there",
  "tiene",
  "un",
  "una",
  "use",
  "web",
  "what",
  "with",
  "work",
  "y",
]);

const TOKEN_EQUIVALENTS: Record<string, string> = {
  deployment: "deployment",
  deployments: "deployment",
  deploy: "deployment",
  desplegar: "deployment",
  despliegue: "deployment",
  despliegues: "deployment",
  prueba: "testing",
  pruebas: "testing",
  test: "testing",
  tests: "testing",
  testing: "testing",
  tecnologia: "technologies",
  tecnologias: "technologies",
  technologies: "technologies",
  technology: "technologies",
};

const ROLE_COMPARISON_SIGNALS = [
  "candidate",
  "compare",
  "encaja",
  "fit",
  "job description",
  "match",
  "oferta",
  "perfil",
  "position",
  "puesto",
  "requirements",
  "requisitos",
  "responsabilities",
  "responsabilidades",
  "responsibilities",
  "role",
  "vacancy",
];

const DIRECT_CONTACT_SHORT_QUERIES = new Set([
  "direct number",
  "his direct number",
  "his mobile number",
  "his phone number",
  "his telephone number",
  "his whatsapp",
  "marc phone number",
  "marc s direct number",
  "marc s mobile number",
  "marc s phone",
  "marc s phone number",
  "marc s telephone number",
  "marc s whatsapp",
  "mobile number",
  "movil de marc",
  "numero de movil",
  "numero de movil de marc",
  "numero de telefono",
  "numero de telefono de marc",
  "numero directo",
  "numero directo de marc",
  "phone number",
  "su movil",
  "su numero de movil",
  "su numero de telefono",
  "su numero directo",
  "su telefono",
  "su whatsapp",
  "telephone number",
  "telefono de marc",
  "whatsapp",
  "whatsapp de marc",
  "whatsapp number",
]);

const DIRECT_CONTACT_REQUEST_PATTERNS = [
  /\b(?:what is|what s|which is) (?:marc s |marc |his |the )?(?:direct number|mobile number|phone number|telephone number|whatsapp(?: number)?)\b/,
  /\b(?:can i have|could i have|give me|send me|share|show me) (?:marc s |his |the )?(?:direct number|mobile number|phone number|telephone number|whatsapp(?: number)?)\b/,
  /\bcan you (?:give|send|share|show) me (?:marc s |his |the )?(?:direct number|mobile number|phone number|telephone number|whatsapp(?: number)?)\b/,
  /\b(?:how (?:can|do) i (?:find|get)|where (?:can|do) i find) (?:marc s |his |the )?(?:direct number|mobile number|phone number|telephone number|whatsapp(?: number)?)\b/,
  /\b(?:cual es|dame|muestrame) (?:el |la )?(?:movil de marc|numero de movil(?: de marc)?|numero de telefono(?: de marc)?|numero directo(?: de marc)?|su movil|su numero de movil|su numero de telefono|su numero directo|su telefono|su whatsapp|telefono de marc|whatsapp de marc)\b/,
  /\bpuedes (?:compartir|darme|mostrarme) (?:el |la )?(?:movil de marc|numero de movil(?: de marc)?|numero de telefono(?: de marc)?|numero directo(?: de marc)?|su movil|su numero de movil|su numero de telefono|su numero directo|su telefono|su whatsapp|telefono de marc|whatsapp de marc)\b/,
];

const DIRECT_CONTACT_CALL_PATTERNS = [
  /\bhow can i (?:call|phone) marc\b/,
  /\b(?:how can i |how do i )?reach marc (?:by|on|via) (?:phone|telephone|whatsapp)\b/,
  /\bcomo puedo llamar a marc\b/,
  /\bcomo (?:contacto|puedo contactar) con marc por (?:telefono|whatsapp)\b/,
];

const CATEGORY_TERMS: Partial<Record<RecruiterKnowledgeCategory, string[]>> = {
  availability: ["availability", "dublin", "ireland", "location", "ubicacion"],
  contact: ["contact", "contacto", "email", "linkedin", "github", "cv"],
  deployment: ["deployment", "infrastructure", "infraestructura", "ci/cd"],
  education: ["education", "formacion", "education", "studies", "estudios"],
  experience: [
    "commercial",
    "empresa",
    "experience",
    "experiencia",
    "professional",
  ],
  languages: ["english", "idiomas", "ingles", "language", "languages"],
  knowledge: [
    "architecture",
    "arquitectura",
    "authentication",
    "autenticacion",
  ],
  technologies: ["stack", "technologies", "technology"],
  testing: ["quality", "calidad", "testing", "vitest"],
};

const SPECIALIST_CATEGORIES = new Set<RecruiterKnowledgeCategory>([
  "deployment",
  "education",
  "knowledge",
  "languages",
  "technologies",
  "testing",
]);

const ROLE_COMPARISON_CORE_ENTRY_IDS = [
  "summary-profile",
  "experience-delinternet",
  "project-ai-code-review-trainer",
  "technologies-public",
  "testing-quality",
  "deployment-infrastructure",
];

export function normalizeRetrievalText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/\bnext\s*\.?\s*js\b/g, "nextjs")
    .replace(/\bnode\s*\.?\s*js\b/g, "nodejs")
    .replace(/\bci\s*[/ -]\s*cd\b/g, "cicd")
    .replace(/[^\p{L}\p{N}+#]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalToken(value: string): string {
  return TOKEN_EQUIVALENTS[value] ?? value;
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalizeRetrievalText(value)
      .split(" ")
      .map(canonicalToken)
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

function localizedHref(
  href: string | { en: string; es: string } | undefined,
  locale: ChatLocale,
) {
  return typeof href === "string" ? href : href?.[locale];
}

const INDEX = new Map<ChatLocale, IndexedEntry[]>(
  (["en", "es"] as const).map((locale) => [
    locale,
    recruiterKnowledgeEntries.map((entry) => {
      const title = normalizeRetrievalText(entry.title[locale]);
      const keywordPhrases = entry.keywords[locale].map(normalizeRetrievalText);
      return {
        entry,
        title,
        titleTokens: tokenize(title),
        aliases: (entry.aliases ?? []).map(normalizeRetrievalText),
        keywordPhrases,
        keywordTokens: tokenize(keywordPhrases.join(" ")),
        contentTokens: tokenize(entry.content[locale]),
      };
    }),
  ]),
);

export function hasRecruiterProfileSubjectSignal(
  locale: ChatLocale,
  question: string,
): boolean {
  const normalized = normalizeRetrievalText(question);
  if (!normalized) return false;

  return (INDEX.get(locale) ?? []).some(
    (indexed) =>
      (indexed.title.length > 2 && normalized.includes(indexed.title)) ||
      indexed.aliases.some(
        (alias) => alias.length > 2 && normalized.includes(alias),
      ),
  );
}

export function detectRecruiterQueryKind(question: string): RecruiterQueryKind {
  const normalized = normalizeRetrievalText(question);

  if (hasPastedJobDescription(question)) {
    return "role_comparison";
  }

  const comparisonSignals = ROLE_COMPARISON_SIGNALS.filter((signal) =>
    normalized.includes(normalizeRetrievalText(signal)),
  ).length;

  if (
    comparisonSignals >= 2 ||
    (question.length >= 600 && comparisonSignals >= 1)
  ) {
    return "role_comparison";
  }

  if (
    [
      "contact",
      "contacto",
      "curriculum",
      "cv",
      "email",
      "linkedin",
      "github",
      "phone",
      "resume",
      "telefono",
      "whatsapp",
    ].some((term) => normalized.includes(term))
  ) {
    return "contact";
  }

  return "general";
}

export function hasExplicitDirectContactIntent(question: string): boolean {
  const normalized = normalizeRetrievalText(question);
  const withoutPoliteness = normalized
    .replace(/^(?:please|por favor)\s+/, "")
    .replace(/\s+(?:please|por favor)$/, "");

  if (
    DIRECT_CONTACT_CALL_PATTERNS.some((pattern) => pattern.test(normalized)) ||
    DIRECT_CONTACT_REQUEST_PATTERNS.some((pattern) => pattern.test(normalized))
  ) {
    return true;
  }

  return DIRECT_CONTACT_SHORT_QUERIES.has(withoutPoliteness);
}

function scoreEntry(indexed: IndexedEntry, query: string, weight: number) {
  if (!query) return 0;
  const queryTokens = tokenize(query);
  let score = 0;

  if (indexed.title.length > 2 && query.includes(indexed.title)) score += 30;
  for (const alias of indexed.aliases) {
    if (alias.length > 2 && query.includes(alias)) score += 28;
  }
  for (const keyword of indexed.keywordPhrases) {
    if (keyword.length > 1 && query.includes(keyword)) score += 12;
  }
  for (const token of queryTokens) {
    if (indexed.keywordTokens.has(token)) score += 6;
    if (indexed.titleTokens.has(token)) score += 5;
    if (indexed.contentTokens.has(token)) score += 1;
  }

  const categoryTerms = CATEGORY_TERMS[indexed.entry.category] ?? [];
  const hasCategoryIntent = categoryTerms.some((term) =>
    query.includes(normalizeRetrievalText(term)),
  );
  if (hasCategoryIntent) {
    score += 8;
    if (SPECIALIST_CATEGORIES.has(indexed.entry.category)) score += 10;
  }

  return score * weight;
}

function previousVisitorContext(messages: RecruiterMessage[]): string {
  return messages
    .slice(0, -1)
    .filter((message) => message.role === "user")
    .slice(-MAX_PREVIOUS_VISITOR_QUESTIONS)
    .map((message) => message.content)
    .join(" ");
}

export function retrieveRecruiterKnowledge(
  locale: ChatLocale,
  messages: RecruiterMessage[],
): KnowledgeRetrievalResult {
  const finalQuestion = messages.at(-1)?.content ?? "";
  const queryKind = detectRecruiterQueryKind(finalQuestion);
  const currentQuery = normalizeRetrievalText(finalQuestion);
  const contextQuery =
    queryKind === "role_comparison"
      ? ""
      : normalizeRetrievalText(previousVisitorContext(messages));
  const allowDirectContact = hasExplicitDirectContactIntent(finalQuestion);
  const indexedEntries = INDEX.get(locale) ?? [];

  const ranked = indexedEntries
    .filter((indexed) => !indexed.entry.directContactOnly || allowDirectContact)
    .map((indexed) => ({
      entry: indexed.entry,
      score:
        scoreEntry(indexed, currentQuery, 1) +
        scoreEntry(indexed, contextQuery, 0.45),
    }))
    .filter((result) => result.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.entry.id.localeCompare(right.entry.id),
    );

  const maximum =
    queryKind === "role_comparison"
      ? MAX_ROLE_COMPARISON_ENTRIES
      : MAX_RETRIEVED_ENTRIES;
  const selected =
    queryKind === "role_comparison"
      ? ROLE_COMPARISON_CORE_ENTRY_IDS.map((id) =>
          indexedEntries.find((indexed) => indexed.entry.id === id),
        )
          .filter((indexed): indexed is IndexedEntry => Boolean(indexed))
          .map((indexed) => indexed.entry)
      : ranked.slice(0, maximum).map((result) => result.entry);

  if (queryKind === "role_comparison") {
    for (const result of ranked) {
      if (selected.length >= maximum) break;
      if (!selected.some((entry) => entry.id === result.entry.id)) {
        selected.push(result.entry);
      }
    }
  }

  if (selected.length === 0) {
    const summary = recruiterKnowledgeEntries.find(
      (entry) => entry.id === "summary-profile",
    );
    if (summary) selected.push(summary);
  }

  const protectedEntries = selected.filter(
    (entry) => !entry.directContactOnly || allowDirectContact,
  );

  return {
    entries: protectedEntries,
    queryKind,
    allowDirectContact,
  };
}

export function buildPublicEvidenceSources(
  entries: RecruiterKnowledgeEntry[],
  locale: ChatLocale,
  options: { allowDirectContact: boolean },
): ChatEvidenceSource[] {
  const sources: ChatEvidenceSource[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (entry.directContactOnly && !options.allowDirectContact) continue;

    for (const source of entry.sources) {
      if (sources.length >= MAX_PUBLIC_SOURCES) return sources;
      if (source.id === "contact-whatsapp" && !options.allowDirectContact) {
        continue;
      }
      if (seen.has(source.id)) continue;

      const href = localizedHref(source.href, locale);
      if (href && !isSafeEvidenceHref(href)) continue;

      seen.add(source.id);
      sources.push({
        id: source.id,
        label: source.label[locale],
        kind: source.kind,
        ...(href ? { href } : {}),
      });
    }
  }

  return sources;
}

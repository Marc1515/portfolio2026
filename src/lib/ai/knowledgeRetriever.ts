import "server-only";

import {
  recruiterKnowledgeEntries,
  type RecruiterKnowledgeCategory,
  type RecruiterKnowledgeEntry,
} from "@/data/recruiterKnowledge";
import { isSafeEvidenceHref, MAX_PUBLIC_SOURCES } from "@/lib/chatEvidence";
import type {
  ChatEvidenceSource,
  ChatLocale,
  RecruiterMessage,
} from "@/types/chat";

export const MAX_RETRIEVED_ENTRIES = 6;
export const MAX_ROLE_COMPARISON_ENTRIES = 10;
const MAX_PREVIOUS_VISITOR_QUESTIONS = 2;

export type RecruiterQueryKind = "general" | "role_comparison" | "contact";

export interface KnowledgeRetrievalResult {
  entries: RecruiterKnowledgeEntry[];
  queryKind: RecruiterQueryKind;
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

const DIRECT_CONTACT_PHRASES = [
  "contacto directo",
  "direct contact",
  "direct number",
  "mobile",
  "movil",
  "numero de telefono",
  "phone",
  "phone number",
  "telephone",
  "telefono",
  "whatsapp",
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

const ROLE_CATEGORY_ORDER: RecruiterKnowledgeCategory[] = [
  "experience",
  "commercial_skills",
  "project",
  "technologies",
  "testing",
  "deployment",
  "knowledge",
  "education",
  "languages",
  "availability",
  "summary",
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

export function detectRecruiterQueryKind(question: string): RecruiterQueryKind {
  const normalized = normalizeRetrievalText(question);
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
      "email",
      "linkedin",
      "github",
      "phone",
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
  return DIRECT_CONTACT_PHRASES.some((phrase) =>
    normalized.includes(normalizeRetrievalText(phrase)),
  );
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
  const contextQuery = normalizeRetrievalText(previousVisitorContext(messages));
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
  const selected = ranked.slice(0, maximum).map((result) => result.entry);

  if (queryKind === "role_comparison" && selected.length < maximum) {
    for (const category of ROLE_CATEGORY_ORDER) {
      for (const indexed of indexedEntries) {
        if (
          selected.length >= maximum ||
          indexed.entry.category !== category ||
          indexed.entry.directContactOnly ||
          selected.some((entry) => entry.id === indexed.entry.id)
        ) {
          continue;
        }
        selected.push(indexed.entry);
      }
    }
  }

  if (selected.length === 0) {
    const summary = recruiterKnowledgeEntries.find(
      (entry) => entry.id === "summary-profile",
    );
    if (summary) selected.push(summary);
  }

  return { entries: selected, queryKind };
}

export function buildPublicEvidenceSources(
  entries: RecruiterKnowledgeEntry[],
  locale: ChatLocale,
): ChatEvidenceSource[] {
  const sources: ChatEvidenceSource[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    for (const source of entry.sources) {
      if (sources.length >= MAX_PUBLIC_SOURCES) return sources;
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

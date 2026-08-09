import "server-only";

const JOB_HEADING_PHRASES = [
  "responsibilities",
  "requirements",
  "qualifications",
  "about the role",
  "what you ll do",
  "what you will do",
  "what we re looking for",
  "what we are looking for",
  "skills",
  "experience",
  "nice to have",
  "must have",
  "responsabilidades",
  "requisitos",
  "funciones",
  "perfil",
  "sobre el puesto",
  "experiencia requerida",
];

const ROLE_TITLE_TERMS = [
  "engineer",
  "developer",
  "architect",
  "analyst",
  "manager",
  "specialist",
  "consultant",
  "designer",
  "ingeniero",
  "desarrollador",
  "arquitecto",
  "analista",
  "responsable",
  "especialista",
  "consultor",
  "disenador",
];

const JOB_DETAIL_TERMS = [
  "build",
  "develop",
  "maintain",
  "collaborate",
  "team",
  "required",
  "preferred",
  "years",
  "degree",
  "applications",
  "aplicaciones",
  "construir",
  "desarrollar",
  "mantener",
  "colaborar",
  "equipo",
  "requerido",
  "valorable",
  "anos",
  "titulacion",
];

function fold(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[’']/g, " ");
}

function normalize(value: string): string {
  return fold(value)
    .replace(/[^\p{L}\p{N}+#]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesTerm(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function countJobHeadings(value: string): number {
  const folded = fold(value);
  return JOB_HEADING_PHRASES.filter((phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|\\n|\\b)${escaped}\\s*(?::|\\n|$)`, "m").test(
      folded,
    );
  }).length;
}

function countListItems(value: string): number {
  return value
    .split(/\r?\n/)
    .filter((line) => /^\s*(?:[-*•]|\d+[.)])\s+\S/.test(line)).length;
}

export function hasPastedJobDescription(value: string): boolean {
  const normalized = normalize(value);
  const headingCount = countJobHeadings(value);
  const listItemCount = countListItems(value);
  const hasRoleTitle = value.split(/\r?\n/).some((line) => {
    const normalizedLine = normalize(line);
    return (
      normalizedLine.split(" ").length <= 10 &&
      includesTerm(normalizedLine, ROLE_TITLE_TERMS)
    );
  });
  const detailSignalCount = JOB_DETAIL_TERMS.filter((term) =>
    normalized.includes(term),
  ).length;

  return (
    headingCount >= 2 ||
    (headingCount >= 1 && listItemCount >= 2) ||
    (headingCount >= 1 && hasRoleTitle && detailSignalCount >= 1) ||
    (listItemCount >= 3 && hasRoleTitle && detailSignalCount >= 2)
  );
}

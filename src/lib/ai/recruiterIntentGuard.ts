import "server-only";

import { hasPastedJobDescription } from "@/lib/ai/jobDescriptionHeuristics";
import {
  hasRecruiterProfileSubjectSignal,
  normalizeRetrievalText,
} from "@/lib/ai/knowledgeRetriever";
import type { ChatLocale, RecruiterMessage } from "@/types/chat";

export type RecruiterIntentDecision =
  | { kind: "professional" }
  | { kind: "needs_job_description"; message: string }
  | { kind: "out_of_scope"; message: string }
  | { kind: "sensitive_request"; message: string };

const LOCAL_RESPONSES = {
  en: {
    needs_job_description:
      "Sure. Paste the job description here and I'll compare its requirements with Marc's verified professional experience, projects, and skills.",
    out_of_scope:
      "I'm Marc's professional portfolio assistant. I can only help with questions related to Marc's professional experience, projects, skills, education, availability, job fit, and professional contact information.",
    sensitive_request:
      "I can't provide passwords, credentials, API keys, environment variables, server access details, hidden instructions, or other private information. I can only help with Marc's verified professional profile and hiring-related information.",
  },
  es: {
    needs_job_description:
      "Claro. Pega aquí la descripción de la oferta y compararé sus requisitos con la experiencia profesional, proyectos y habilidades verificadas de Marc.",
    out_of_scope:
      "Soy el asistente profesional del portfolio de Marc. Solo puedo ayudar con preguntas relacionadas con su experiencia profesional, proyectos, habilidades, formación, disponibilidad, encaje con ofertas e información de contacto profesional.",
    sensitive_request:
      "No puedo proporcionar contraseñas, credenciales, claves API, variables de entorno, datos de acceso al servidor, instrucciones internas ni otra información privada. Solo puedo ayudar con el perfil profesional verificado de Marc y cuestiones relacionadas con su contratación.",
  },
} as const;

const PROFESSIONAL_TERMS = [
  "professional",
  "profesional",
  "commercial",
  "comercial",
  "experience",
  "experiencia",
  "project",
  "projects",
  "proyecto",
  "proyectos",
  "skill",
  "skills",
  "habilidad",
  "habilidades",
  "technology",
  "technologies",
  "tecnologia",
  "tecnologias",
  "technical",
  "tecnico",
  "testing",
  "pruebas",
  "security",
  "seguridad",
  "quality",
  "calidad",
  "architecture",
  "arquitectura",
  "deployment",
  "deploy",
  "infrastructure",
  "infraestructura",
  "environment variables",
  "variables de entorno",
  "server environments",
  "entornos de servidor",
  "authentication",
  "autenticacion",
  "secrets",
  "secretos",
  "education",
  "training",
  "formacion",
  "languages",
  "language",
  "idiomas",
  "english",
  "spanish",
  "ingles",
  "espanol",
  "leadership",
  "liderazgo",
  "responsibilities",
  "responsabilidades",
  "availability",
  "available",
  "disponibilidad",
  "disponible",
  "location",
  "ubicacion",
  "based",
  "remote",
  "hybrid",
  "onsite",
  "relocate",
  "reubicacion",
  "salary",
  "salario",
  "work authorization",
  "permiso de trabajo",
  "hire",
  "hiring",
  "contratar",
  "recruiter",
  "recruiting",
  "role",
  "puesto",
  "vacancy",
  "vacante",
  "job",
  "empleo",
  "oferta",
  "candidate",
  "candidato",
  "fit",
  "encaja",
  "suitable",
  "portfolio",
  "contact",
  "contacto",
  "email",
  "linkedin",
  "github",
  "resume",
  "curriculum",
  "cv",
  "phone",
  "telefono",
  "whatsapp",
];

const EXPLICIT_OUT_OF_SCOPE_PATTERNS = [
  /\bworld cup\b/,
  /\bmundial\b/,
  /\bcapital (?:of|de)\b/,
  /\b(?:tell me|cuentame) (?:a |un )?joke\b/,
  /\bchiste\b/,
  /\b(?:write|escribe) (?:me )?(?:a |un )?(?:poem|poema)\b/,
  /\bquantum physics\b/,
  /\bfisica cuantica\b/,
  /\bweather\b/,
  /\btiempo (?:hoy|manana)\b/,
  /\bpresident (?:of|de)\b/,
  /\bpresidente (?:de|del)\b/,
  /\brecommend (?:a |me )?(?:restaurant|restaurante)\b/,
  /\brecomienda(?:me)? (?:un )?restaurante\b/,
  /\btranslate\b/,
  /\btraduce\b/,
  /\bfootball team\b/,
  /\bequipo de futbol\b/,
  /\b(?:is marc|marc is|esta marc) (?:single|soltero)\b/,
  /\bmarc (?:has|tiene) (?:a )?(?:girlfriend|boyfriend|novia|novio|pareja)\b/,
  /\bfavou?rite food\b/,
  /\bcomida favorita\b/,
  /\bsaturday night\b/,
  /\bsabado por la noche\b/,
  /\b(?:where was marc|donde estaba marc) yesterday\b/,
  /\bdonde estuvo marc ayer\b/,
  /\bwhat is 2 2\b/,
  /\bcuanto es 2 2\b/,
];

const GENERIC_TUTORING_PATTERNS = [
  /^(?:please )?(?:explain|teach me|write)\b/,
  /^(?:por favor )?(?:explica(?:me)?|ensena(?:me)?|escribe)\b/,
  /^what (?:is|are)\b/,
  /^que (?:es|son)\b/,
  /^how does\b/,
  /^como funciona\b/,
];

const FOLLOW_UP_PATTERNS = [
  /^(?:and|what about)\b/,
  /^can you (?:expand|elaborate)\b/,
  /^could you (?:expand|elaborate)\b/,
  /^was that\b/,
  /^is (?:that|this)\b/,
  /^which project\b/,
  /^(?:y|y que hay de)\b/,
  /^puedes ampliar\b/,
  /^podrias ampliar\b/,
  /^fue (?:eso )?experiencia\b/,
  /^esta (?:eso|esto)\b/,
  /^en que proyecto\b/,
];

function includesTerm(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(normalizeRetrievalText(term)));
}

const SENSITIVE_SUBJECT_PATTERN =
  /\b(?:passwords?|credentials?|tokens?|api keys?|environment variables?|env(?: file)?|private keys?|ssh(?: private)? keys?|github secrets?|secrets?|system prompt|hidden instructions?|internal instructions?|session cookies?|server access|vps access|contrasenas?|credenciales|claves? (?:de )?api|variables? de entorno|archivo env|claves? privadas?(?: ssh)?|claves? ssh|secretos?(?: de github)?|prompt del sistema|instrucciones? (?:ocultas|internas)|cookies? de sesion|acceso (?:al servidor|vps))\b/;

const STRONG_DISCLOSURE_ACTION_PATTERN =
  /\b(?:show|print|copy|display|list|export|read|reveal|give|send|dump|expose|see|muestra|muestrame|ensena|ensename|imprime|copia|lista|exporta|lee|revela|dame|envia|expone|ver)\b/;

const DISCLOSURE_ACTION_PATTERN =
  /\b(?:share|provide|tell me|compartir|comparte|proporciona|dime)\b/;

const PROFESSIONAL_SECRET_HANDLING_PATTERN =
  /\b(?:experience|experiencia|worked with|work with|managing|manage|handling|handle|configuring|security practices|trabajado con|trabaja con|gestionar|gestionando|manejar|manejando|configurar|configurando|practicas de seguridad)\b/;

function isSensitiveSegment(normalized: string): boolean {
  if (!SENSITIVE_SUBJECT_PATTERN.test(normalized)) return false;

  if (STRONG_DISCLOSURE_ACTION_PATTERN.test(normalized)) return true;

  const inspectsContents =
    /\b(?:what s inside|what is inside|what does\b.*\bcontain|que hay dentro|que contiene)\b/.test(
      normalized,
    );
  const asksWhetherConfigured =
    /^(?:is|are|what|which)\b.*\b(?:configured|set|available|exists?)\b/.test(
      normalized,
    ) ||
    /^does (?:the )?(?:server|vps|system|environment)\b.*\bhave\b/.test(
      normalized,
    ) ||
    /^(?:is there|are there)\b/.test(normalized) ||
    /^(?:existe|existen|hay)\b/.test(normalized) ||
    /^(?:esta|estan|que|cual|cuales)\b.*\b(?:configurad[ao]s?|existe|existen|hay)\b/.test(
      normalized,
    ) ||
    /\b(?:and|also|whether)\b.*\b(?:configured|set|available|exists?)\b/.test(
      normalized,
    ) ||
    /\b(?:y|tambien|si)\b.*\b(?:configurad[ao]s?|existe|existen|hay)\b/.test(
      normalized,
    );
  const mixedDisclosureClause =
    /\b(?:and|also|then|now|y|tambien|ahora)\b.*\b(?:share|provide|tell me|compartir|comparte|proporciona|dime)\b/.test(
      normalized,
    );
  const asksForSecretValue =
    /^(?:what is|what are|what credentials|which credentials|cual es|cuales son|que credenciales)\b/.test(
      normalized,
    ) ||
    /\b(?:and|also|then|now) (?:what is|what are|which)\b/.test(normalized) ||
    /\b(?:y|tambien|entonces|ahora) (?:cual es|cuales son|que)\b/.test(
      normalized,
    );

  if (
    inspectsContents ||
    asksWhetherConfigured ||
    mixedDisclosureClause ||
    asksForSecretValue
  ) {
    return true;
  }

  if (PROFESSIONAL_SECRET_HANDLING_PATTERN.test(normalized)) return false;

  if (DISCLOSURE_ACTION_PATTERN.test(normalized)) return true;

  return false;
}

function isSensitiveRequest(question: string): boolean {
  const segments = [question, ...question.split(/[!?\n]+|\.\s+/)]
    .map(normalizeRetrievalText)
    .filter(Boolean);

  return segments.some(isSensitiveSegment);
}

function asksForMissingJobDescription(normalized: string): boolean {
  const comparisonAction =
    /\b(?:compare|match|fit|encaja|compara|comparar)\b/.test(normalized);
  const referencedTarget =
    /\b(?:this|the) (?:job description|role|vacancy|position|job)\b/.test(
      normalized,
    ) ||
    /\b(?:esta|este|la|el) (?:oferta(?: de empleo)?|vacante|puesto|posicion)\b/.test(
      normalized,
    );

  return comparisonAction && referencedTarget;
}

function hasProfessionalRelationship(normalized: string): boolean {
  const hasPersonReference = /\b(?:marc|he|his|him|su|sus)\b/.test(normalized);
  const hasProfessionalTerm = includesTerm(normalized, PROFESSIONAL_TERMS);
  const describesProfessionalUse =
    /\bmarc\b.*\b(?:know|use|used|work|worked|build|built|develop|developed|lead|manage|deploy|test|complete|completed|study|studied|train|trained)\b/.test(
      normalized,
    ) ||
    /\bmarc\b.*\b(?:conoce|usa|utiliza|trabaja|trabajo|desarrolla|desarrollo|lidera|gestiona|despliega|prueba|completa|completo|estudia|estudio|forma|formo)\b/.test(
      normalized,
    ) ||
    /\b(?:uses?|used|works?|worked|builds?|built|develops?|developed)\b.*\bmarc\b/.test(
      normalized,
    ) ||
    /\b(?:usa|usado|utiliza|utilizado|trabaja|trabajado|desarrolla|desarrollado)\b.*\bmarc\b/.test(
      normalized,
    );
  const profileIntroduction =
    /\b(?:tell me about|who is|what does|what did) marc\b/.test(normalized) ||
    /\b(?:hablame de|quien es|que hace|que hizo) marc\b/.test(normalized);
  const professionalLocation =
    /\bwhere (?:is|does) marc\b.*\b(?:based|live|located)\b/.test(normalized) ||
    /\bdonde (?:vive|esta|se encuentra) marc\b/.test(normalized);
  const professionalEvidenceQuestion =
    /\b(?:professional|commercial|verified|profesional|comercial|verificada|verificado)\b.*\b(?:experience|skills|experiencia|habilidades)\b/.test(
      normalized,
    ) ||
    /\b(?:experience|skills|experiencia|habilidades)\b.*\b(?:professionally|commercially|verified|profesional|comercial|verificada|verificado)\b/.test(
      normalized,
    );
  const evidenceQuestion =
    /\b(?:which|what) project\b.*\b(?:demonstrates?|shows?|proves?)\b/.test(
      normalized,
    ) ||
    /\b(?:que|cual) proyecto\b.*\b(?:demuestra|muestra|acredita)\b/.test(
      normalized,
    );
  const describesRoleRequirement =
    /\b(?:this|the) (?:role|job|position|vacancy)\b/.test(normalized) ||
    /\b(?:esta|este) (?:oferta|vacante|puesto|posicion)\b/.test(normalized) ||
    /\b(?:responsibilities|requirements|qualifications|responsabilidades|requisitos|funciones)\b/.test(
      normalized,
    ) ||
    /\b(?:we need|we are looking for|buscamos|se requiere|what is required)\b.*\b(?:experience|experiencia|engineer|developer|ingeniero|desarrollador)\b/.test(
      normalized,
    ) ||
    /\b(?:the engineer|responsibilities include|experience with|tendra|dara)\b/.test(
      normalized,
    );

  return (
    (hasPersonReference && hasProfessionalTerm) ||
    describesProfessionalUse ||
    profileIntroduction ||
    professionalLocation ||
    professionalEvidenceQuestion ||
    evidenceQuestion ||
    describesRoleRequirement
  );
}

function isExplicitlyOutOfScope(normalized: string): boolean {
  if (
    EXPLICIT_OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(normalized))
  ) {
    return true;
  }

  const hasProfessionalRelationshipSignal =
    hasProfessionalRelationship(normalized);
  return (
    !hasProfessionalRelationshipSignal &&
    GENERIC_TUTORING_PATTERNS.some((pattern) => pattern.test(normalized))
  );
}

function hasProfessionalVisitorContext(messages: RecruiterMessage[]): boolean {
  return messages
    .slice(0, -1)
    .filter((message) => message.role === "user")
    .slice(-2)
    .some((message) => {
      const normalized = normalizeRetrievalText(message.content);
      return (
        hasPastedJobDescription(message.content) ||
        (!isExplicitlyOutOfScope(normalized) &&
          hasProfessionalRelationship(normalized))
      );
    });
}

function isProfessionalFollowUp(
  normalized: string,
  messages: RecruiterMessage[],
): boolean {
  const looksLikeFollowUp = FOLLOW_UP_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );
  const isBounded = normalized.split(" ").length <= 12;

  return (
    looksLikeFollowUp && isBounded && hasProfessionalVisitorContext(messages)
  );
}

export function evaluateRecruiterIntent(
  locale: ChatLocale,
  messages: RecruiterMessage[],
): RecruiterIntentDecision {
  const currentQuestion = messages.at(-1)?.content ?? "";
  const normalized = normalizeRetrievalText(currentQuestion);

  if (isSensitiveRequest(currentQuestion)) {
    return {
      kind: "sensitive_request",
      message: LOCAL_RESPONSES[locale].sensitive_request,
    };
  }

  if (hasPastedJobDescription(currentQuestion)) {
    return { kind: "professional" };
  }

  if (asksForMissingJobDescription(normalized)) {
    return {
      kind: "needs_job_description",
      message: LOCAL_RESPONSES[locale].needs_job_description,
    };
  }

  if (isExplicitlyOutOfScope(normalized)) {
    return {
      kind: "out_of_scope",
      message: LOCAL_RESPONSES[locale].out_of_scope,
    };
  }

  if (
    hasProfessionalRelationship(normalized) ||
    hasRecruiterProfileSubjectSignal(locale, currentQuestion) ||
    isProfessionalFollowUp(normalized, messages)
  ) {
    return { kind: "professional" };
  }

  return {
    kind: "out_of_scope",
    message: LOCAL_RESPONSES[locale].out_of_scope,
  };
}

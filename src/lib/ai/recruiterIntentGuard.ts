import "server-only";

import { hasPastedJobDescription } from "@/lib/ai/jobDescriptionHeuristics";
import {
  hasRecruiterKnowledgeSignal,
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
  "quality",
  "calidad",
  "architecture",
  "arquitectura",
  "deployment",
  "deploy",
  "infrastructure",
  "infraestructura",
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

function isSensitiveRequest(normalized: string): boolean {
  const directSensitivePatterns = [
    /\b(?:show|reveal|give|send|provide|list|dump|expose)\b.*\b(?:password|credentials|api keys?|api tokens?|environment variables?|env file|private keys?|ssh keys?|database password|github secrets?|system prompt|hidden instructions?|internal instructions?|session cookies?|authentication tokens?|server access|vps access)\b/,
    /\b(?:muestra|muestrame|ensena|ensename|revela|dame|proporciona|lista|expone)\b.*\b(?:contrasena|credenciales|claves? api|tokens? api|variables? de entorno|archivo env|claves? privadas?|claves? ssh|secretos? de github|prompt del sistema|instrucciones? (?:ocultas|internas)|cookies? de sesion|tokens? de autenticacion|acceso (?:al servidor|vps))\b/,
    /\b(?:what is|what are|which is|which are|tell me)\b.*\b(?:server password|root password|database password|password|credentials|api keys?|environment variables?|private keys?|ssh keys?|github secrets?|system prompt|hidden instructions?|internal instructions?|session cookies?|authentication tokens?|server access|vps access)\b/,
    /\bwhat (?:credentials|passwords?|api keys?|api tokens?|environment variables?|private keys?|ssh keys?|github secrets?)\b/,
    /\b(?:cual es|cuales son|dime)\b.*\b(?:contrasena|credenciales|claves? api|variables? de entorno|claves? privadas?|claves? ssh|secretos? de github|prompt del sistema|instrucciones? (?:ocultas|internas)|cookies? de sesion|tokens? de autenticacion|acceso (?:al servidor|vps))\b/,
    /\bque (?:credenciales|contrasenas|claves? api|variables? de entorno|claves? privadas?|claves? ssh|secretos? de github)\b/,
    /\b(?:env file|archivo env|\.env)\b/,
    /\b(?:show|reveal|give|muestra|muestrame|ensena|ensename|revela|dame)\b.*\benv\b/,
    /\b(?:system prompt|hidden instructions?|internal instructions?|prompt del sistema|instrucciones? (?:ocultas|internas))\b.*\b(?:show|reveal|muestra|revela)\b/,
  ];

  if (directSensitivePatterns.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  const asksConfiguration =
    /\b(?:configured|set|available|exists?|configurado|configurada|existe)\b/.test(
      normalized,
    );
  const namesCredential =
    /\b(?:[a-z0-9]+ )*(?:api tokens?|api keys?|secret keys?|access tokens?|auth tokens?|database password|server password|root password|private keys?|ssh keys?|environment variables?|github secrets?|session cookies?|cloudflare api token)\b/.test(
      normalized,
    );

  return asksConfiguration && namesCredential;
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
    /\bmarc\b.*\b(?:know|use|used|work|worked|build|built|develop|developed|lead|manage|deploy|test)\b/.test(
      normalized,
    ) ||
    /\bmarc\b.*\b(?:conoce|usa|utiliza|trabaja|trabajo|desarrolla|desarrollo|lidera|gestiona|despliega|prueba)\b/.test(
      normalized,
    );
  const profileIntroduction =
    /\b(?:tell me about|who is|what does|what did) marc\b/.test(normalized) ||
    /\b(?:hablame de|quien es|que hace) marc\b/.test(normalized);
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

  if (isSensitiveRequest(normalized)) {
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
    hasRecruiterKnowledgeSignal(locale, currentQuestion) ||
    isProfessionalFollowUp(normalized, messages)
  ) {
    return { kind: "professional" };
  }

  return {
    kind: "out_of_scope",
    message: LOCAL_RESPONSES[locale].out_of_scope,
  };
}

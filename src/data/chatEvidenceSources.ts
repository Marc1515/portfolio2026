import { projects } from "@/data/projects";
import type { ChatEvidenceKind, ChatLocale } from "@/types/chat";

export interface LocalizedEvidenceText {
  en: string;
  es: string;
}

export interface TrustedEvidenceSourceDefinition {
  id: string;
  kind: ChatEvidenceKind;
  label: LocalizedEvidenceText;
  href?: string | LocalizedEvidenceText;
}

function projectLink(id: string, key: "repoUrl" | "liveUrl"): string {
  const value = projects.find((project) => project.id === id)?.[key];
  if (!value) throw new Error(`Missing trusted project ${key}: ${id}`);
  return value;
}

function portfolioSource(
  id: string,
  section: string,
  en: string,
  es: string,
  kind: ChatEvidenceKind = "portfolio",
): TrustedEvidenceSourceDefinition {
  return {
    id,
    kind,
    label: { en, es },
    href: { en: `/en#${section}`, es: `/es#${section}` },
  };
}

export const trustedEvidenceSourceDefinitions = [
  portfolioSource(
    "portfolio-about",
    "about",
    "Portfolio profile",
    "Perfil del portfolio",
  ),
  portfolioSource(
    "portfolio-experience",
    "experience",
    "Professional experience",
    "Experiencia profesional",
    "experience",
  ),
  portfolioSource(
    "portfolio-projects",
    "projects",
    "Portfolio projects",
    "Proyectos del portfolio",
    "project",
  ),
  portfolioSource(
    "portfolio-technologies",
    "technologies",
    "Portfolio technologies",
    "Tecnologías del portfolio",
  ),
  portfolioSource(
    "portfolio-skills",
    "skills",
    "Portfolio skills",
    "Habilidades del portfolio",
  ),
  portfolioSource(
    "portfolio-contact",
    "contact",
    "Portfolio contact section",
    "Contacto del portfolio",
    "contact",
  ),
  portfolioSource(
    "project-ai-code-review-trainer",
    "projects",
    "AI Code Review Trainer",
    "AI Code Review Trainer",
    "project",
  ),
  {
    id: "repository-ai-code-review-trainer",
    kind: "repository",
    label: { en: "GitHub repository", es: "Repositorio en GitHub" },
    href: projectLink("ai-code-review-trainer", "repoUrl"),
  },
  {
    id: "live-ai-code-review-trainer",
    kind: "live",
    label: { en: "Live demo", es: "Demo online" },
    href: projectLink("ai-code-review-trainer", "liveUrl"),
  },
  portfolioSource(
    "project-reservation-management",
    "projects",
    "Reservation Management System",
    "Sistema de Gestión de Reservas",
    "project",
  ),
  {
    id: "repository-reservation-management",
    kind: "repository",
    label: { en: "GitHub repository", es: "Repositorio en GitHub" },
    href: projectLink("caseta-martiicarmeta", "repoUrl"),
  },
  {
    id: "live-reservation-management",
    kind: "live",
    label: { en: "Live website", es: "Sitio online" },
    href: projectLink("caseta-martiicarmeta", "liveUrl"),
  },
  portfolioSource(
    "project-delta-routes",
    "projects",
    "DeltaRoutes",
    "DeltaRoutes",
    "project",
  ),
  {
    id: "repository-delta-routes",
    kind: "repository",
    label: { en: "GitHub repository", es: "Repositorio en GitHub" },
    href: projectLink("guided-tours-platform", "repoUrl"),
  },
  {
    id: "live-delta-routes",
    kind: "live",
    label: { en: "Live website", es: "Sitio online" },
    href: projectLink("guided-tours-platform", "liveUrl"),
  },
  {
    id: "public-cv",
    kind: "cv",
    label: { en: "Public CV", es: "CV público" },
    href: "/Marc_Espana_CV_Full_Stack.pdf",
  },
  {
    id: "contact-linkedin",
    kind: "contact",
    label: { en: "LinkedIn", es: "LinkedIn" },
    href: "https://www.linkedin.com/in/marc-espa%C3%B1a-833924141/",
  },
  {
    id: "contact-github",
    kind: "contact",
    label: { en: "GitHub", es: "GitHub" },
    href: "https://github.com/Marc1515",
  },
  {
    id: "contact-whatsapp",
    kind: "contact",
    label: { en: "WhatsApp", es: "WhatsApp" },
    href: "https://wa.me/353870041006",
  },
] satisfies TrustedEvidenceSourceDefinition[];

export function localizeEvidenceValue(
  value: string | LocalizedEvidenceText | undefined,
  locale: ChatLocale,
): string | undefined {
  return typeof value === "string" ? value : value?.[locale];
}

export function trustedEvidenceSource(
  id: string,
): TrustedEvidenceSourceDefinition {
  const source = trustedEvidenceSourceDefinitions.find(
    (candidate) => candidate.id === id,
  );
  if (!source) throw new Error(`Unknown trusted evidence source: ${id}`);
  return source;
}

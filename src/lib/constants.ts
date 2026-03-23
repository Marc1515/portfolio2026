import type { SectionId } from "@/types/site";

export const SECTION_IDS: Record<SectionId, SectionId> = {
  home: "home",
  projects: "projects",
  experience: "experience",
  about: "about",
  contact: "contact",
} as const;

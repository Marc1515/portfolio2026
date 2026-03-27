import { SECTION_IDS } from "@/lib/constants";
import type { SiteConfig } from "@/types/site";

export const siteConfig = {
  name: "Marc España",
  navigation: [
    { id: SECTION_IDS.home },
    { id: SECTION_IDS.projects },
    { id: SECTION_IDS.experience },
    { id: SECTION_IDS.skills },
    { id: SECTION_IDS.about },
    { id: SECTION_IDS.contact },
  ],
  socialLinks: [
    { label: "GitHub", href: "https://github.com/Marc1515" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/marc-espa%C3%B1a-833924141/",
    },
  ],
} satisfies SiteConfig;

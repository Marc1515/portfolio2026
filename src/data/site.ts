import { SECTION_IDS } from "@/lib/constants";
import type { SiteConfig } from "@/types/site";

export const siteConfig = {
  name: "Your Name",
  role: "Frontend Developer",
  location: "Remote / Your City",
  tagline: "Building modern, performant web experiences.",
  navigation: [
    { id: SECTION_IDS.home, label: "Home" },
    { id: SECTION_IDS.projects, label: "Projects" },
    { id: SECTION_IDS.experience, label: "Experience" },
    { id: SECTION_IDS.skills, label: "Skills" },
    { id: SECTION_IDS.about, label: "About Me" },
    { id: SECTION_IDS.contact, label: "Contact" },
  ],
  socialLinks: [
    { label: "GitHub", href: "https://github.com/your-user" },
    { label: "LinkedIn", href: "https://linkedin.com/in/your-user" },
  ],
} satisfies SiteConfig;

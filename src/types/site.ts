export type SectionId = "home" | "projects" | "experience" | "skills" | "about" | "contact";

export interface NavItem {
  id: SectionId;
  label: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  role: string;
  location: string;
  tagline: string;
  navigation: NavItem[];
  socialLinks: SocialLink[];
}

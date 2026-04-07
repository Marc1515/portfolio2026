export type SectionId = "home" | "projects" | "experience" | "technologies" | "about" | "contact";

export interface NavItem {
  id: SectionId;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  navigation: NavItem[];
  socialLinks: SocialLink[];
}

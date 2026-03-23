import { Section } from "@/components/ui/Section";
import { SECTION_IDS } from "@/lib/constants";
import { siteConfig } from "@/data/site";

export function HomeSection() {
  return (
    <Section id={SECTION_IDS.home} className="section hero">
      <p className="eyebrow">{siteConfig.role}</p>
      <h1>{siteConfig.name}</h1>
      <p className="lead">{siteConfig.tagline}</p>
      <p className="muted">{siteConfig.location}</p>
    </Section>
  );
}

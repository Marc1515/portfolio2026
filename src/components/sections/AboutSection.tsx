import { Section } from "@/components/ui/Section";
import { SECTION_IDS } from "@/lib/constants";
import { siteConfig } from "@/data/site";

export function AboutSection() {
  return (
    <Section
      id={SECTION_IDS.about}
      title="About Me"
      subtitle="How I approach product engineering."
      className="section"
    >
      <p>
        I build interfaces with a product mindset, balancing user experience, code quality and
        long-term maintainability.
      </p>
      <p>
        {siteConfig.description}
      </p>
    </Section>
  );
}

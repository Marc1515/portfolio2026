import { Section } from "@/components/ui/Section";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { technologies } from "@/data/technologies";
import { SECTION_IDS } from "@/lib/constants";
import { useTranslations } from "next-intl";

export function TechnologiesSection() {
  const t = useTranslations("technologies");

  return (
    <Section
      id={SECTION_IDS.technologies}
      title={t("title")}
      subtitle={t("subtitle")}
      className="section"
    >
      <ul className="technologies-grid" aria-label={t("ariaListLabel")}>
        {technologies.map((technology, index) => {
          const Icon = technology.icon;

          return (
            <RevealOnScroll
              as="li"
              key={technology.id}
              className="technologies-item technologies-reveal-item"
              delayMs={160 + index * 80}
            >
              <Icon className="technologies-icon" aria-hidden="true" />
              <span>{technology.label}</span>
            </RevealOnScroll>
          );
        })}
      </ul>
    </Section>
  );
}

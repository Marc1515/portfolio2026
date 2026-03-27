import { Section } from "@/components/ui/Section";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { skills } from "@/data/skills";
import { SECTION_IDS } from "@/lib/constants";
import { useTranslations } from "next-intl";

export function SkillsSection() {
  const t = useTranslations("skills");

  return (
    <Section
      id={SECTION_IDS.skills}
      title={t("title")}
      subtitle={t("subtitle")}
      className="section"
    >
      <ul className="skills-grid" aria-label={t("ariaListLabel")}>
        {skills.map((skill, index) => {
          const Icon = skill.icon;

          return (
            <RevealOnScroll
              as="li"
              key={skill.id}
              className="skills-item skills-reveal-item"
              delayMs={160 + index * 80}
            >
              <Icon className="skills-icon" aria-hidden="true" />
              <span>{skill.label}</span>
            </RevealOnScroll>
          );
        })}
      </ul>
    </Section>
  );
}

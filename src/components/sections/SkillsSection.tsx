import { Section } from "@/components/ui/Section";
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
        {skills.map((skill) => {
          const Icon = skill.icon;

          return (
            <li key={skill.id} className="skills-item">
              <Icon className="skills-icon" aria-hidden="true" />
              <span>{skill.label}</span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

import { SkillItem } from "@/components/features/skills/SkillItem";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Section } from "@/components/ui/Section";
import { skillAreas } from "@/data/skills";
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
      <div className="stack">
        {skillAreas.map((skill, index) => (
          <RevealOnScroll key={skill.id} delayMs={160 + index * 90}>
            <SkillItem skill={skill} />
          </RevealOnScroll>
        ))}
      </div>
    </Section>
  );
}

import { ExperienceItem } from "@/components/features/experience/ExperienceItem";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Section } from "@/components/ui/Section";
import { experiences } from "@/data/experience";
import { SECTION_IDS } from "@/lib/constants";
import { useTranslations } from "next-intl";

export function ExperienceSection() {
  const t = useTranslations("experience");

  return (
    <Section
      id={SECTION_IDS.experience}
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="space-y-(--space-2)!">
        {experiences.map((experience, index) => (
          <RevealOnScroll key={experience.id} delayMs={160 + index * 90}>
            <ExperienceItem experience={experience} />
          </RevealOnScroll>
        ))}
      </div>
    </Section>
  );
}

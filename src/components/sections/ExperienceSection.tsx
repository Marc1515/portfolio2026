import { ExperienceItem } from "@/components/features/experience/ExperienceItem";
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
      className="section"
    >
      <div className="stack">
        {experiences.map((experience) => (
          <ExperienceItem key={experience.id} experience={experience} />
        ))}
      </div>
    </Section>
  );
}

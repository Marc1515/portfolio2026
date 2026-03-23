import { ExperienceItem } from "@/components/features/experience/ExperienceItem";
import { Section } from "@/components/ui/Section";
import { experiences } from "@/data/experience";
import { SECTION_IDS } from "@/lib/constants";

export function ExperienceSection() {
  return (
    <Section
      id={SECTION_IDS.experience}
      title="Experience"
      subtitle="Highlights from roles where I shipped and scaled frontend products."
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

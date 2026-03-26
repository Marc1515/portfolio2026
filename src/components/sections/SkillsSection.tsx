import { Section } from "@/components/ui/Section";
import { skills } from "@/data/skills";
import { SECTION_IDS } from "@/lib/constants";

export function SkillsSection() {
  return (
    <Section
      id={SECTION_IDS.skills}
      title="Skills"
      subtitle="Technologies I use to build robust and scalable products."
      className="section"
    >
      <ul className="skills-grid" aria-label="Technology skills">
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

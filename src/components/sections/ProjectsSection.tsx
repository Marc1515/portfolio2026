import { ProjectCard } from "@/components/features/projects/ProjectCard";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Section } from "@/components/ui/Section";
import { projects } from "@/data/projects";
import { SECTION_IDS } from "@/lib/constants";
import { useTranslations } from "next-intl";

export function ProjectsSection() {
  const t = useTranslations("projects");

  return (
    <Section
      id={SECTION_IDS.projects}
      title={t("title")}
      subtitle={t("subtitle")}
      className="section"
    >
      <div className="grid">
        {projects.map((project, index) => (
          <RevealOnScroll key={project.id} delayMs={160 + index * 90}>
            <ProjectCard project={project} />
          </RevealOnScroll>
        ))}
      </div>
    </Section>
  );
}

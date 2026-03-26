import { ProjectCard } from "@/components/features/projects/ProjectCard";
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
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </Section>
  );
}

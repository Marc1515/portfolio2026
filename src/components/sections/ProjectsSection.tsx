import { ProjectCard } from "@/components/features/projects/ProjectCard";
import { Section } from "@/components/ui/Section";
import { projects } from "@/data/projects";
import { SECTION_IDS } from "@/lib/constants";

export function ProjectsSection() {
  return (
    <Section
      id={SECTION_IDS.projects}
      title="Projects"
      subtitle="Selected work focused on product quality and maintainability."
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

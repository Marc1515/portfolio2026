import { useTranslations } from "next-intl";

import { ProjectDetailsModal } from "@/components/features/projects/ProjectDetailsModal";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const t = useTranslations("projects");
  const title = t(`items.${project.translationKey}.title`);
  const description = t(`items.${project.translationKey}.description`);

  return (
    <article className="flex flex-col min-h-[440px] bg-(--surface) border border-(--surface-border) rounded-(--radius) p-(--space-2)!">
      <ProjectDetailsModal project={project} title={title} />
      <div className="flex flex-col gap-2 pt-4!">
        <h3>{title}</h3>
        <p className="min-h-34">{description}</p>
        <ul className="flex gap-2" aria-label={t("techStackAria", { title })}>
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="bg-[#1a2340] text-[#c9d8ff] border border-(--surface-border) rounded-2xl px-[.5rem]! py-1! text-[.8rem]!"
            >
              {tag}
            </li>
          ))}
        </ul>
        <div className="flex mt-(--space-2)! gap-(--space-2) text-(--accent) font-medium">
          {project.liveUrl ? (
            <a href={project.liveUrl} target="_blank" rel="noreferrer">
              {t("live")}
            </a>
          ) : null}
          {project.repoUrl ? (
            <a href={project.repoUrl} target="_blank" rel="noreferrer">
              {t("repository")}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

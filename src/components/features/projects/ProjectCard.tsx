import Image from "next/image";
import { useTranslations } from "next-intl";

import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const t = useTranslations("projects");
  const title = t(`items.${project.translationKey}.title`);
  const description = t(`items.${project.translationKey}.description`);

  return (
    <article className="card">
      <div className="project-image">
        <Image
          src={project.image}
          alt={t("previewAlt", { title })}
          loading={project.featured ? "eager" : "lazy"}
          priority={project.featured}
          width={640}
          height={360}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="project-content">
        <h3>{title}</h3>
        <p>{description}</p>
        <ul className="tag-list" aria-label={t("techStackAria", { title })}>
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <div className="project-links">
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

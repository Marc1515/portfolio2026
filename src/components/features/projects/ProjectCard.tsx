import Image from "next/image";

import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="card project-card">
      <div className="project-image">
        <Image
          src={project.image}
          alt={`${project.title} preview`}
          width={640}
          height={360}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="project-content">
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <ul className="tag-list" aria-label={`${project.title} tech stack`}>
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <div className="project-links">
          {project.liveUrl ? (
            <a href={project.liveUrl} target="_blank" rel="noreferrer">
              Live
            </a>
          ) : null}
          {project.repoUrl ? (
            <a href={project.repoUrl} target="_blank" rel="noreferrer">
              Repository
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

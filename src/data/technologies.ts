import {
  SiCss,
  SiGit,
  SiHtml5,
  SiJavascript,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiPython,
  SiReact,
  SiTailwindcss,
  SiTypescript,
  SiGithub,
  SiPrisma,
  SiGitlab,
  SiDocker,
  SiQgis
} from "react-icons/si";

import type { Technology } from "@/types/technology";

export const technologies = [
  { id: "typescript", label: "TypeScript", icon: SiTypescript },
  { id: "javascript", label: "JavaScript", icon: SiJavascript },
  { id: "nextjs", label: "Next.js", icon: SiNextdotjs },
  { id: "react", label: "React", icon: SiReact },
  { id: "git", label: "Git", icon: SiGit },
  { id: "github", label: "GitHub", icon: SiGithub },
  { id: "gitlab", label: "GitLab", icon: SiGitlab },
  { id: "docker", label: "Docker", icon: SiDocker },
  { id: "postgresql", label: "PostgreSQL", icon: SiPostgresql },
  { id: "prisma", label: "Prisma", icon: SiPrisma },
  { id: "html", label: "HTML5", icon: SiHtml5 },
  { id: "css", label: "CSS3", icon: SiCss },
  { id: "tailwind", label: "Tailwind CSS", icon: SiTailwindcss },
  { id: "node", label: "Node.js", icon: SiNodedotjs },
  { id: "python", label: "Python", icon: SiPython },
  { id: "qgis", label: "QGIS", icon: SiQgis },
] satisfies Technology[];

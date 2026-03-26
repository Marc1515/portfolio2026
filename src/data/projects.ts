import type { Project } from "@/types/project";

export const projects = [
  {
    id: "caseta-martiicarmeta",
    translationKey: "casetaMartiICarmeta",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "i18n"],
    repoUrl: "https://github.com/Marc1515/casetamartiicarmeta",
    liveUrl: "https://casetamartiicarmeta.com",
    image: "/images/projects/caseta.png",
    featured: true,
  },
  {
    id: "trello-app",
    translationKey: "trelloApp",
    tags: ["Next.js", "Shadcn", "PostgresSQL", "Stripe"],
    repoUrl: "https://github.com/Marc1515/trello-app",
    liveUrl: "https://trello.marcespana.com/",
    image: "/images/projects/trello.png",
    featured: true,
  },
  {
    id: "guided-tours-platform",
    translationKey: "guidedToursPlatform",
    tags: ["Next.js", "Tailwind CSS", "Prisma", "PostgreSQL"],
    repoUrl: "https://github.com/Marc1515/deltaroutes",
    liveUrl: "https://deltaroutes.marcespana.com/",
    image: "/images/projects/deltaroutes.png",
    featured: false,
  },
] satisfies Project[];

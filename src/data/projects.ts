import type { Project } from "@/types/project";

export const projects = [
  {
    id: "ai-code-review-trainer",
    translationKey: "aiCodeReviewTrainer",
    tags: ["Next.js", "PostgreSQL", "Ollama", "Docker"],
    repoUrl: "https://github.com/Marc1515/ai-code-review-trainer",
    liveUrl: "https://trainer.marcespana.com/",
    image: "/images/projects/ai_code_reviwer_trainer.png",
    featured: true,
  },
  {
    id: "caseta-martiicarmeta",
    translationKey: "casetaMartiICarmeta",
    tags: ["Next.js", "TypeScript", "Tailwind", "i18n"],
    repoUrl: "https://github.com/Marc1515/casetamartiicarmeta",
    liveUrl: "https://casetamartiicarmeta.com",
    image: "/images/projects/caseta.png",
    featured: true,
  },
  {
    id: "guided-tours-platform",
    translationKey: "guidedToursPlatform",
    tags: ["Next.js", "Tailwind", "Prisma", "PostgreSQL"],
    repoUrl: "https://github.com/Marc1515/deltaroutes",
    liveUrl: "https://deltaroutes.marcespana.com/",
    image: "/images/projects/deltaroutes.png",
    featured: false,
  },
] satisfies Project[];

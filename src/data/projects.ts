import type { Project } from "@/types/project";

export const projects = [
  {
    id: "caseta-martiicarmeta",
    title: "Reservation Management System",
    description:
      "Full-stack booking platform for a rural house, featuring a public reservation flow and an admin panel for availability management.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "i18n"],
    repoUrl: "https://github.com/Marc1515/casetamartiicarmeta",
    liveUrl: "https://casetamartiicarmeta.com",
    image: "/images/projects/caseta.png",
    featured: true,
  },
  {
    id: "trello-app",
    title: "Trello System",
    description:
      "Trello-style task management app with boards, lists, cards and drag-and-drop organization.",
    tags: ["Next.js", "Shadcn", "Clerk", "Stripe"],
    repoUrl: "https://github.com/Marc1515/trello-app",
    liveUrl: "https://trello.marcespana.com/",
    image: "/images/projects/trello.png",

    featured: true,
  },
  {
    id: "booking-platform",
    title: "Guided Tours Platform",
    description:
      "End-to-end booking platform for guided tours, including search, details page and confirmation.",
    tags: ["Next.js", "Node.js", "PostgreSQL"],
    repoUrl: "https://github.com/Marc1515/deltaroutes",
    liveUrl: "https://deltaroutes.marcespana.com/",
    image: "/images/projects/deltaroutes.png",
    featured: false,
  },
] satisfies Project[];

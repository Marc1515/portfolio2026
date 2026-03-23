import type { Experience } from "@/types/experience";

export const experiences = [
  {
    id: "senior-frontend-engineer",
    role: "Senior Frontend Engineer",
    company: "Tech Studio",
    startDate: "2024",
    endDate: "Present",
    highlights: [
      "Led the migration to App Router improving maintainability.",
      "Designed a component architecture reused across three products.",
      "Improved Core Web Vitals and accessibility score.",
    ],
  },
  {
    id: "frontend-engineer",
    role: "Frontend Engineer",
    company: "Digital Agency",
    startDate: "2021",
    endDate: "2024",
    highlights: [
      "Built reusable UI modules for client projects.",
      "Collaborated with designers to implement responsive interfaces.",
      "Added test coverage for key user journeys.",
    ],
  },
] satisfies Experience[];

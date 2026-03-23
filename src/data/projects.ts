import type { Project } from "@/types/project";

export const projects = [
  {
    id: "finance-dashboard",
    title: "Finance Dashboard",
    description:
      "A responsive dashboard with charts, filters and account activity insights.",
    tags: ["Next.js", "TypeScript", "Charts"],
    repoUrl: "https://github.com/your-user/finance-dashboard",
    liveUrl: "https://example.com/finance-dashboard",
    image: "/images/projects/finance-dashboard.svg",
    featured: true,
  },
  {
    id: "design-system",
    title: "UI Design System",
    description:
      "Reusable components and tokens for consistent interfaces across products.",
    tags: ["React", "Storybook", "Design Tokens"],
    repoUrl: "https://github.com/your-user/ui-design-system",
    image: "/images/projects/ui-design-system.svg",
    featured: true,
  },
  {
    id: "booking-platform",
    title: "Booking Platform",
    description:
      "An end-to-end booking flow with search, details page and confirmation.",
    tags: ["Next.js", "Node.js", "PostgreSQL"],
    repoUrl: "https://github.com/your-user/booking-platform",
    liveUrl: "https://example.com/booking-platform",
    image: "/images/projects/booking-platform.svg",
    featured: false,
  },
] satisfies Project[];

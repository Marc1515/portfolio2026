import type { Experience } from "@/types/experience";

export const experiences = [
  {
    id: "senior-frontend-engineer",
    role: "Frontend Web Developer",
    company: "Delinternet Telecom",
    startDate: "2024",
    endDate: "2026",
    highlights: [
      "Designed internal tools and interfaces that enabled employees to work faster and with greater precision.",
      "Developed applications mainly with Next.js and React, while also contributing to a full-stack project.",
      "Built a QGIS workflow with Python that allowed the engineering team to identify the number of housing units in a town with a single click, turning a manual process that took hours into a task completed in seconds.",
      "Led the testing efforts for a public address system application, helping improve reliability and product quality.",
    ],
  },
  {
    id: "frontend-engineer",
    role: "Frontend Web Developer",
    company: "Infortur Software SL",
    startDate: "2021",
    endDate: "2022",
    highlights: [
      "Developed user interfaces for electronic locker systems used by hotel guests to retrieve their room keys after completing a reservation.",
      "Worked with vanilla JavaScript and connected frontend features to backend web services.",
      "Began my career as a junior frontend developer, gaining practical experience building production-ready interfaces for client projects.",
    ],
  },
] satisfies Experience[];
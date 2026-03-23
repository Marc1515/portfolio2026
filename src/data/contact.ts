import type { ContactMethod } from "@/types/contact";

export const contactMethods = [
  {
    id: "email",
    label: "Email",
    href: "mailto:your.email@example.com",
    type: "email",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://linkedin.com/in/your-user",
    type: "linkedin",
  },
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/your-user",
    type: "github",
  },
] satisfies ContactMethod[];

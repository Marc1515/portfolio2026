import type { IconType } from "react-icons";

export type ContactType = "email" | "linkedin" | "github" | "instagram" | "whatsapp" | "phone";

export interface ContactMethod {
  id: string;
  label: string;
  href: string;
  type: ContactType;
  icon: IconType;
}

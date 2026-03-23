export type ContactType = "email" | "linkedin" | "github" | "x";

export interface ContactMethod {
  id: string;
  label: string;
  href: string;
  type: ContactType;
}

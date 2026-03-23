export type ExperienceEndDate = string | "Present";

export interface Experience {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: ExperienceEndDate;
  highlights: string[];
}

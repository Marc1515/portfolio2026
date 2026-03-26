export type ExperienceEndDate = string | "Present";

export interface Experience {
  id: string;
  translationKey: string;
  company: string;
  startDate: string;
  endDate: ExperienceEndDate;
}

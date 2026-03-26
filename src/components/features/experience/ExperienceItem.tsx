import { formatDateRange } from "@/lib/utils";
import type { Experience } from "@/types/experience";

interface ExperienceItemProps {
  experience: Experience;
}

export function ExperienceItem({ experience }: ExperienceItemProps) {
  return (
    <article className="card experience-card">
      <header>
        <h3>{experience.role}</h3>
        <p>{experience.company}</p>
        <p className="muted">{formatDateRange(experience.startDate, experience.endDate)}</p>
      </header>
      <ul className="mt-4 list-disc pl-5">
        {experience.highlights.map((highlight) => (
          <li key={highlight} className="mt-1.5">
            {highlight}
          </li>
        ))}
      </ul>
    </article>
  );
}

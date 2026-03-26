import { formatDateRange } from "@/lib/utils";
import type { Experience } from "@/types/experience";
import { useTranslations } from "next-intl";

interface ExperienceItemProps {
  experience: Experience;
}

export function ExperienceItem({ experience }: ExperienceItemProps) {
  const t = useTranslations("experience");
  const highlights = t.raw(`items.${experience.translationKey}.highlights`) as string[];

  return (
    <article className="card experience-card">
      <header>
        <h3>{t(`items.${experience.translationKey}.role`)}</h3>
        <p>{experience.company}</p>
        <p className="muted">{formatDateRange(experience.startDate, experience.endDate)}</p>
      </header>
      <ul className="mt-4 list-disc pl-5">
        {highlights.map((highlight) => (
          <li key={highlight} className="mt-1.5">
            {highlight}
          </li>
        ))}
      </ul>
    </article>
  );
}

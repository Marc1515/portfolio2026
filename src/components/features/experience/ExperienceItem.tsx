import { formatDateRange } from "@/lib/utils";
import type { Experience } from "@/types/experience";
import { useTranslations } from "next-intl";

interface ExperienceItemProps {
  experience: Experience;
}

export function ExperienceItem({ experience }: ExperienceItemProps) {
  const t = useTranslations("experience");
  const highlights = t.raw(
    `items.${experience.translationKey}.highlights`,
  ) as string[];

  return (
    <article className="bg-(--surface) border border-(--surface-border) rounded-(--radius) p-(--space-2)!">
      <header>
        <h3>{t(`items.${experience.translationKey}.role`)}</h3>
        <p>{experience.company}</p>
        <p className="text-(--muted)">
          {formatDateRange(experience.startDate, experience.endDate)}
        </p>
      </header>
      <ul className="list-disc mt-(--space-2)! pl-5! space-y-1.5!">
        {highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
    </article>
  );
}

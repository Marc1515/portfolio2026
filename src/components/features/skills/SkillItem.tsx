import type { SkillArea } from "@/types/skill";
import { useTranslations } from "next-intl";

interface SkillItemProps {
  skill: SkillArea;
}

export function SkillItem({ skill }: SkillItemProps) {
  const t = useTranslations("skills");
  const highlights = t.raw(`items.${skill.translationKey}.highlights`) as string[];

  return (
    <article className="card experience-card">
      <header>
        <h3>{t(`items.${skill.translationKey}.title`)}</h3>
        <p>{t(`items.${skill.translationKey}.caption`)}</p>
        <p className="muted">{t(`items.${skill.translationKey}.meta`)}</p>
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

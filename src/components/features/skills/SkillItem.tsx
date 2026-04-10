import type { SkillArea } from "@/types/skill";
import { useTranslations } from "next-intl";

interface SkillItemProps {
  skill: SkillArea;
}

export function SkillItem({ skill }: SkillItemProps) {
  const t = useTranslations("skills");
  const highlights = t.raw(
    `items.${skill.translationKey}.highlights`,
  ) as string[];

  return (
    <article className="bg-(--surface) border border-(--surface-border) rounded-(--radius) p-(--space-2)!">
      <header>
        <h3>{t(`items.${skill.translationKey}.title`)}</h3>
        <p>{t(`items.${skill.translationKey}.caption`)}</p>
        <p className="text-(--muted)">
          {t(`items.${skill.translationKey}.meta`)}
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

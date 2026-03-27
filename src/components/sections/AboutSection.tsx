import { Section } from "@/components/ui/Section";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { SECTION_IDS } from "@/lib/constants";
import { useTranslations } from "next-intl";

export function AboutSection() {
  const t = useTranslations("about");

  return (
    <Section
      id={SECTION_IDS.about}
      title={t("title")}
      subtitle={t("subtitle")}
      className="section"
    >
      <div className="flex flex-col gap-8 max-w-[70ch] px-4! md:pl-6! leading-8 text-[var(--muted)]">
        <RevealOnScroll delayMs={160}>
          <p>{t("paragraph1")}</p>
        </RevealOnScroll>
        <RevealOnScroll delayMs={240}>
          <p>{t("paragraph2")}</p>
        </RevealOnScroll>
        <RevealOnScroll delayMs={320}>
          <p>{t("paragraph3")}</p>
        </RevealOnScroll>
        <RevealOnScroll delayMs={400}>
          <p>{t("paragraph4")}</p>
        </RevealOnScroll>
      </div>
    </Section>
  );
}

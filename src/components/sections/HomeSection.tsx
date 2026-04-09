import Image from "next/image";
import { useTranslations } from "next-intl";

import { LanguageSwitch } from "@/components/features/i18n/LanguageSwitch";
import { Section } from "@/components/ui/Section";
import { SECTION_IDS } from "@/lib/constants";
import { siteConfig } from "@/data/site";

export function HomeSection() {
  const t = useTranslations("home");

  return (
    <Section
      id={SECTION_IDS.home}
      className="section flex! items-center! justify-center!"
      animated={false}
    >
      <div className="flex flex-col gap-8 md:flex-row items-center justify-between">
        <div className="hero-copy">
          <p className="text-accent text-sm! uppercase! tracking-wider! mb-(--space-1)!">
            {t("role")}
          </p>
          <h1 className="text-4xl! md:text-6xl!">{siteConfig.name}</h1>
          <p className="text-lg! mt-(--space-2)! md:text-xl! max-w-2xl!">
            {t("tagline")}
          </p>
          <p className="text-(--muted)!">React · Next.js · TypeScript</p>
        </div>

        <div className="flex! flex-col! gap-6! items-center!">
          <div className="h-64 w-64 overflow-hidden rounded-full border border-(--surface-border)">
            <Image
              src="/images/home/fotoPerfil.png"
              alt={t("profileImageAlt", { name: siteConfig.name })}
              width={256}
              height={256}
              priority
              sizes="(max-width: 768px) 60vw, 25vw"
              className="h-full w-full object-cover"
            />
          </div>
          <LanguageSwitch />
          <a
            href="/MEQ_ESP.pdf"
            download
            className="
                        inline-flex items-center justify-center justify-self-center
                        w-full max-w-64 min-h-13
                        px-4 py-3
                        rounded-[0.85rem]
                        border border-[color-mix(in_srgb,var(--accent)_60%,var(--surface-border))]
                        bg-[color-mix(in_srgb,var(--accent)_24%,var(--surface))]
                        text-foreground font-bold tracking-[0.01em] text-center
                        transition-[transform,background-color,border-color]
                        duration-[150ms,200ms,200ms] ease-in-out
                        hover:-translate-y-px
                        hover:bg-[color-mix(in_srgb,var(--accent)_32%,var(--surface))]
                        hover:border-[color-mix(in_srgb,var(--accent)_80%,var(--surface-border))]
                        focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2
                      "
          >
            {t("downloadCv")}
          </a>
        </div>
      </div>
    </Section>
  );
}

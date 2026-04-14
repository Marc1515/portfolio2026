import Image from "next/image";
import { useTranslations } from "next-intl";

import { LanguageSwitch } from "@/components/features/i18n/LanguageSwitch";
import DownloadCV from "@/components/features/buttons/DownloadCV";
import { Section } from "@/components/ui/Section";
import { SECTION_IDS } from "@/lib/constants";
import { siteConfig } from "@/data/site";

export function HomeSection() {
  const t = useTranslations("home");

  return (
    <Section
      id={SECTION_IDS.home}
      extraTopPadding={false}
      className="flex! items-center! justify-center!"
      animated={false}
    >
      <div className="flex flex-col gap-8 md:flex-row items-center justify-between">
        <div className="hero-copy">
          <p className="text-accent text-sm! md:text-xl! lg:text-2xl! uppercase! tracking-wider! mb-(--space-1)!">
            {t("role")}
          </p>
          <h1 className="text-4xl md:text-6xl! lg:text-7xl! md:pb-(--space-2)!">
            {siteConfig.name}
          </h1>
          <p className="text-lg! mt-(--space-2)! md:text-xl! lg:text-2xl! max-w-2xl! min-h-16">
            {t("tagline")}
          </p>
          <p className="text-(--muted)! text-sm! md:text-xl! lg:text-2xl! mt-(--space-1)! md:mt-(--space-2)!">
            React · Next.js · TypeScript
          </p>
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
          <DownloadCV />
        </div>
      </div>
    </Section>
  );
}

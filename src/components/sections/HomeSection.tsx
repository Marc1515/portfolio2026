import Image from "next/image";
import { useTranslations } from "next-intl";

import { LanguageSwitch } from "@/components/features/i18n/LanguageSwitch";
import { Section } from "@/components/ui/Section";
import { SECTION_IDS } from "@/lib/constants";
import { siteConfig } from "@/data/site";

export function HomeSection() {
  const t = useTranslations("home");

  return (
    <Section id={SECTION_IDS.home} className="section hero">
      <div className="hero-layout">
        <div className="hero-copy">
          <p className="eyebrow">{t("role")}</p>
          <h1>{siteConfig.name}</h1>
          <p className="lead">{t("tagline")}</p>
          <p className="muted">{t("location")}</p>
        </div>

        <div className="hero-profile-wrap">
          <div className="hero-profile h-64 w-64 overflow-hidden rounded-full border border-(--surface-border)">
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
        </div>
      </div>
    </Section>
  );
}

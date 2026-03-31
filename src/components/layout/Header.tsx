"use client";

import { siteConfig } from "@/data/site";
import { useActiveSection } from "@/hooks/useActiveSection";
import { SECTION_IDS } from "@/lib/constants";
import { LanguageSwitch } from "@/components/features/i18n/LanguageSwitch";
import { useTranslations } from "next-intl";

export function Header() {
  const activeId = useActiveSection();
  const t = useTranslations("layout");

  const showLanguageSwitch = activeId !== SECTION_IDS.home;

  return (
    <header className="site-header">
      <nav aria-label={t("primaryNav")} className="site-nav">
        <div className="brand">
          <div
            className={`brand-language-switch ${showLanguageSwitch ? "is-visible" : ""}`}
            aria-hidden={!showLanguageSwitch}
          >
            <LanguageSwitch />
          </div>
        </div>
        <ul className="nav-list">
          {siteConfig.navigation.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={activeId === item.id ? "is-active" : ""}
              >
                {t(`nav.${item.id}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

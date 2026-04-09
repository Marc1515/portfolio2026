"use client";

import { siteConfig } from "@/data/site";
import { useActiveSection } from "@/hooks/useActiveSection";
import { SECTION_IDS } from "@/lib/constants";
import { LanguageSwitch } from "@/components/features/i18n/LanguageSwitch";
import { useTranslations } from "next-intl";
import clsx from "clsx";

export function Header() {
  const activeId = useActiveSection();
  const t = useTranslations("layout");

  const showLanguageSwitch = activeId !== SECTION_IDS.home;

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-1 backdrop-blur-md bg-[color-mix(in_srgb,var(--background)_80%,transparent)] border-b border-(--surface-border)">
      <nav
        aria-label={t("primaryNav")}
        className="w-[min(calc(100%-2rem),var(--max-width))] mx-auto! min-h-16 flex items-center justify-between gap-space-2"
      >
        <div className="brand">
          <div
            className={`brand-language-switch ${showLanguageSwitch ? "is-visible" : ""}`}
            aria-hidden={!showLanguageSwitch}
          >
            <LanguageSwitch />
          </div>
        </div>
        <ul className="flex items-center gap-space-2">
          {siteConfig.navigation.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={clsx(
                  "text-md! font-medium transition-colors duration-300 ease-in-out hover:text-(--foreground)!",
                  activeId === item.id ? "text-accent!" : "text-muted!",
                )}
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

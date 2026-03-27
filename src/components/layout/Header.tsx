"use client";

import { siteConfig } from "@/data/site";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useTranslations } from "next-intl";

export function Header() {
  const activeId = useActiveSection();
  const t = useTranslations("layout");

  return (
    <header className="site-header">
      <nav aria-label={t("primaryNav")} className="site-nav">
        <a href={`#${siteConfig.navigation[0]?.id}`} className="brand">
          {siteConfig.name}
        </a>
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

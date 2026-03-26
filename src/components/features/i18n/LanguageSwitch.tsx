"use client";

import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function LanguageSwitch() {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const isSpanish = locale === "es";

  const handleToggle = () => {
    const nextLocale: AppLocale = isSpanish ? "en" : "es";
    const hash = window.location.hash;

    router.replace(pathname, { locale: nextLocale });

    if (hash) {
      // Keep anchor navigation after locale change.
      requestAnimationFrame(() => {
        window.location.hash = hash;
      });
    }
  };

  return (
    <button
      type="button"
      className="language-switch"
      role="switch"
      aria-checked={isSpanish}
      aria-label={t("languageSwitchAriaLabel")}
      onClick={handleToggle}
    >
      <span className="language-switch-track">
        <span className="language-switch-label">ES</span>
        <span className="language-switch-label">EN</span>
      </span>
      <span className={`language-switch-thumb ${isSpanish ? "is-spanish" : "is-english"}`} />
    </button>
  );
}

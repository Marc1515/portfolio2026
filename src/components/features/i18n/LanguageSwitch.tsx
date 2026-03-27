"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function LanguageSwitch() {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);
  const visualLocale = pendingLocale ?? locale;
  const isTransitioning = pendingLocale !== null;
  const isSpanish = visualLocale === "es";

  const handleToggle = () => {
    if (isTransitioning) {
      return;
    }

    const nextLocale: AppLocale = isSpanish ? "en" : "es";
    const hash = window.location.hash;
    setPendingLocale(nextLocale);

    // Let the thumb animation start before route transition.
    window.setTimeout(() => {
      router.replace(pathname, { locale: nextLocale });

      if (hash) {
        requestAnimationFrame(() => {
          window.location.hash = hash;
        });
      }

      // Fallback in case navigation takes longer than expected.
      window.setTimeout(() => {
        setPendingLocale(null);
      }, 800);
    }, 180);
  };

  return (
    <button
      type="button"
      className={`language-switch ${isSpanish ? "is-spanish" : "is-english"}`}
      role="switch"
      aria-checked={isSpanish}
      aria-busy={isTransitioning}
      aria-label={t("languageSwitchAriaLabel")}
      disabled={isTransitioning}
      onClick={handleToggle}
    >
      <span className="language-switch-track">
        <span className="language-switch-label language-switch-label-es">ES</span>
        <span className="language-switch-label language-switch-label-en">EN</span>
      </span>
      <span className={`language-switch-thumb ${isSpanish ? "is-spanish" : "is-english"}`} />
    </button>
  );
}

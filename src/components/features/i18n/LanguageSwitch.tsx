"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import clsx from "clsx";

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
      className={`relative justify-self-center border border-(--surface-border) bg-(--surface) rounded-full cursor-pointer p-1 w-28 h-8 transition-colors duration-300 ease-in-out hover:border-[color-mix(in_srgb,var(--accent)_60%,var(--surface-border))] ${isSpanish ? "is-spanish" : "is-english"}`}
      role="switch"
      aria-checked={isSpanish}
      aria-busy={isTransitioning}
      aria-label={t("languageSwitchAriaLabel")}
      disabled={isTransitioning}
      onClick={handleToggle}
    >
      <span className="grid! grid-cols-2! h-full! relative! z-1!">
        <span
          className={clsx(
            "text-xs text-center flex items-center justify-center",
            isSpanish ? "text-foreground" : "text-muted",
          )}
        >
          ES
        </span>
        <span
          className={clsx(
            "text-xs text-center flex items-center justify-center",
            isSpanish ? "text-muted" : "text-foreground",
          )}
        >
          EN
        </span>
      </span>
      <span
        className={clsx(
          "absolute top-0.5 bottom-0.5 w-[calc(50%-0.25rem)] bg-accent/30 border border-[color-mix(in_srgb,var(--accent)_55%,var(--surface-border))] rounded-full transition-all duration-300",
          isSpanish ? "left-0.5" : "left-1/2",
        )}
      />
    </button>
  );
}

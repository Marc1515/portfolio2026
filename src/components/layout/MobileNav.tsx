"use client";

import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import { createPortal } from "react-dom";
import { LanguageSwitch } from "@/components/features/i18n/LanguageSwitch";
import { siteConfig } from "@/data/site";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import BurgerButton from "@/components/features/navbar/BurgerButton";

const subscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const activeId = useActiveSection();
  const t = useTranslations("layout");

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const navigateTo = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const target = document.getElementById(id);
      if (!target) {
        close();
        return;
      }

      document.body.style.overflow = "";
      target.scrollIntoView({ behavior: "smooth" });

      const done = () => {
        window.removeEventListener("scrollend", done);
        clearTimeout(timer);
        close();
      };

      window.addEventListener("scrollend", done, { once: true });
      const timer = setTimeout(done, 800);
    },
    [close],
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <BurgerButton open={open} onToggle={toggle} />
      {mounted &&
        createPortal(
          <div
            className={clsx(
              "fixed inset-0 z-90 md:hidden transition-[clip-path] duration-600 ease-[cubic-bezier(0.65,0,0.35,1)] [clip-path:circle(0%_at_calc(100%-2.25rem)_2rem)]",
              open
                ? "pointer-events-auto [clip-path:circle(150%_at_calc(100%-2.25rem)_2rem)]"
                : "pointer-events-none",
            )}
            aria-hidden={!open}
          >
            <div
              className="absolute inset-0 bg-[color-mix(in_srgb,var(--background)_98%,transparent)]"
              aria-hidden
            />
            <nav
              className="relative flex h-full w-full items-center justify-center"
              aria-label={t("primaryNav")}
            >
              <ul className="flex flex-col items-center gap-(--space-4)">
                {siteConfig.navigation.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={clsx(
                        "text-2xl! font-bold transition-colors duration-300 ease-in-out hover:text-(--foreground)!",
                        activeId === item.id ? "text-accent!" : "text-muted!",
                      )}
                      onClick={(e) => navigateTo(e, item.id)}
                    >
                      {t(`nav.${item.id}`)}
                    </a>
                  </li>
                ))}
                <li className="mt-space-3!">
                  <LanguageSwitch />
                </li>
              </ul>
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}

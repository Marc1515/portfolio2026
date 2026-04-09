"use client";

import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import { createPortal } from "react-dom";
import { LanguageSwitch } from "@/components/features/i18n/LanguageSwitch";
import { siteConfig } from "@/data/site";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useTranslations } from "next-intl";
import clsx from "clsx";

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

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

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
      <button
        className="fixed top-4 right-4 z-110 flex h-10 w-10 cursor-pointer flex-col justify-center gap-[5px] border-0 bg-transparent p-2 md:hidden"
        onClick={toggle}
        aria-expanded={open}
        aria-label={t("menuToggle")}
      >
        <span
          className={clsx(
            "block h-[2px] w-6 origin-center rounded-[2px] bg-foreground transform-gpu transition-all duration-350 ease-[cubic-bezier(0.77,0,0.18,1)]",
            open ? "translate-y-[7px] rotate-45" : "",
          )}
        />
        <span
          className={clsx(
            "block h-[2px] w-6 origin-center rounded-[2px] bg-foreground transform-gpu transition-all duration-350 ease-[cubic-bezier(0.77,0,0.18,1)]",
            open ? "opacity-0" : "",
          )}
        />
        <span
          className={clsx(
            "block h-[2px] w-6 origin-center rounded-[2px] bg-foreground transform-gpu transition-all duration-350 ease-[cubic-bezier(0.77,0,0.18,1)]",
            open ? "-translate-y-[7px] -rotate-45" : "",
          )}
        />
      </button>

      {mounted &&
        createPortal(
          <div
            className={`mobile-nav-overlay ${open ? "is-open" : ""}`}
            aria-hidden={!open}
          >
            <div className="mobile-nav-glass" />
            <nav className="mobile-nav-inner" aria-label={t("primaryNav")}>
              <ul className="mobile-nav-list">
                {siteConfig.navigation.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={activeId === item.id ? "is-active" : ""}
                      onClick={(e) => navigateTo(e, item.id)}
                    >
                      {t(`nav.${item.id}`)}
                    </a>
                  </li>
                ))}
                <li className="mobile-nav-language-switch">
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

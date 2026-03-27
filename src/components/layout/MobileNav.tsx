"use client";

import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import { createPortal } from "react-dom";
import { siteConfig } from "@/data/site";
import { useTranslations } from "next-intl";

const subscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(subscribe, () => true, () => false);

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const t = useTranslations("layout");

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

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
        className="burger-btn"
        onClick={toggle}
        aria-expanded={open}
        aria-label={t("menuToggle")}
      >
        <span className={`burger-line ${open ? "is-open" : ""}`} />
        <span className={`burger-line ${open ? "is-open" : ""}`} />
        <span className={`burger-line ${open ? "is-open" : ""}`} />
      </button>

      {mounted &&
        createPortal(
          <div
            className={`mobile-nav-overlay ${open ? "is-open" : ""}`}
            aria-hidden={!open}
          >
            <nav aria-label={t("primaryNav")}>
              <ul className="mobile-nav-list">
                {siteConfig.navigation.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} onClick={close}>
                      {t(`nav.${item.id}`)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>,
          document.body
        )}
    </>
  );
}

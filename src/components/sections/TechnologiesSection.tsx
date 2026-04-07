"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import { Section } from "@/components/ui/Section";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { technologies } from "@/data/technologies";
import { SECTION_IDS } from "@/lib/constants";
import { useTranslations } from "next-intl";

export function TechnologiesSection() {
  const t = useTranslations("technologies");
  const mobileVisibleCount = 16;
  const mobileScrollTopOffset = 30;
  const revealBaseDelayMs = 160;
  const revealStepDelayMs = 80;
  const revealTransitionMs = 900;
  const expandedRevealBaseDelayMs = 80;
  const expandedRevealStepDelayMs = 55;
  const toggleReappearAfterLastItemMs = 300;
  const firstGridLastItemDelayMs =
    revealBaseDelayMs + (mobileVisibleCount - 1) * revealStepDelayMs;
  const desktopExpandedOverlapMs = 750;
  const desktopExpandedStartDelayMs = Math.max(
    firstGridLastItemDelayMs + revealTransitionMs - desktopExpandedOverlapMs,
    revealBaseDelayMs,
  );
  const initialTechnologies = technologies.slice(0, mobileVisibleCount);
  const extraTechnologies = technologies.slice(mobileVisibleCount);
  const mobileScrollAnchorId = "technologies-mobile-scroll-anchor";
  const [isToggleHiddenAfterExpand, setIsToggleHiddenAfterExpand] =
    useState(false);
  const [isToggleReappearing, setIsToggleReappearing] = useState(false);
  const [isDesktopView, setIsDesktopView] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const hasPlayedFirstExpandToggleRevealRef = useRef(false);
  const toggleShowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const toggleReappearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearToggleTimers = useCallback(() => {
    if (toggleShowTimeoutRef.current) {
      clearTimeout(toggleShowTimeoutRef.current);
      toggleShowTimeoutRef.current = null;
    }

    if (toggleReappearTimeoutRef.current) {
      clearTimeout(toggleReappearTimeoutRef.current);
      toggleReappearTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearToggleTimers();
    };
  }, [clearToggleTimers]);

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia("(min-width: 768px)");

    const syncLayoutMode = () => {
      const isDesktop = desktopMediaQuery.matches;
      setIsDesktopView(isDesktop);
      setIsMobileExpanded(isDesktop ? true : false);
    };

    syncLayoutMode();
    desktopMediaQuery.addEventListener("change", syncLayoutMode);

    return () => {
      desktopMediaQuery.removeEventListener("change", syncLayoutMode);
    };
  }, []);

  const handleToggle = useCallback(
    (event: SyntheticEvent<HTMLDetailsElement>) => {
      const details = event.currentTarget;
      const section = document.getElementById(SECTION_IDS.technologies);

      if (!window.matchMedia("(max-width: 767px)").matches) {
        return;
      }

      setIsMobileExpanded(details.open);

      if (!details.open) {
        clearToggleTimers();
        setIsToggleHiddenAfterExpand(false);
        setIsToggleReappearing(false);

        if (!section) {
          return;
        }

        requestAnimationFrame(() => {
          section.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });

        return;
      }

      const anchor = document.getElementById(mobileScrollAnchorId);

      if (!anchor) {
        return;
      }

      clearToggleTimers();
      setIsToggleReappearing(false);

      requestAnimationFrame(() => {
        const anchorTop = anchor.getBoundingClientRect().top + window.scrollY;

        window.scrollTo({
          top: Math.max(anchorTop - mobileScrollTopOffset, 0),
          behavior: "smooth",
        });
      });

      if (hasPlayedFirstExpandToggleRevealRef.current) {
        return;
      }

      hasPlayedFirstExpandToggleRevealRef.current = true;
      setIsToggleHiddenAfterExpand(true);

      const lastExtraIndex = extraTechnologies.length - 1;
      const lastItemDelayMs =
        expandedRevealBaseDelayMs + lastExtraIndex * expandedRevealStepDelayMs;

      toggleShowTimeoutRef.current = setTimeout(() => {
        setIsToggleHiddenAfterExpand(false);
        setIsToggleReappearing(true);

        toggleReappearTimeoutRef.current = setTimeout(() => {
          setIsToggleReappearing(false);
        }, revealTransitionMs);
      }, lastItemDelayMs + toggleReappearAfterLastItemMs);
    },
    [clearToggleTimers, extraTechnologies.length],
  );

  return (
    <Section
      id={SECTION_IDS.technologies}
      title={t("title")}
      subtitle={t("subtitle")}
      className="section"
    >
      <ul className="technologies-grid" aria-label={t("ariaListLabel")}>
        {initialTechnologies.map((technology, index) => {
          const Icon = technology.icon;

          return (
            <RevealOnScroll
              as="li"
              key={technology.id}
              className="technologies-item technologies-reveal-item"
              delayMs={revealBaseDelayMs + index * revealStepDelayMs}
            >
              <Icon className="technologies-icon" aria-hidden="true" />
              <span id={index === 12 ? mobileScrollAnchorId : undefined}>
                {technology.label}
              </span>
            </RevealOnScroll>
          );
        })}
      </ul>
      <RevealOnScroll
        as="div"
        className="technologies-reveal-item"
        delayMs={revealBaseDelayMs + mobileVisibleCount * revealStepDelayMs}
      >
        <details
          className="technologies-mobile-toggle"
          open={isDesktopView ? true : isMobileExpanded}
          onToggle={handleToggle}
        >
          <summary
            className={[
              "technologies-mobile-toggle-button",
              isToggleHiddenAfterExpand ? "is-hidden-after-expand" : "",
              isToggleReappearing ? "is-reappearing" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="technologies-mobile-toggle-more">{t("more")}</span>
            <span className="technologies-mobile-toggle-less">{t("less")}</span>
            <span
              className="technologies-mobile-toggle-arrow"
              aria-hidden="true"
            >
              ▾
            </span>
          </summary>
          <ul
            className="technologies-grid technologies-grid-extra"
            aria-label={t("ariaListLabel")}
          >
            {extraTechnologies.map((technology, index) => {
              const Icon = technology.icon;
              const extraItemDelayMs = isDesktopView
                ? desktopExpandedStartDelayMs + index * revealStepDelayMs
                : expandedRevealBaseDelayMs + index * expandedRevealStepDelayMs;

              return (
                <RevealOnScroll
                  as="li"
                  key={technology.id}
                  className="technologies-item technologies-reveal-item"
                  delayMs={extraItemDelayMs}
                >
                  <Icon className="technologies-icon" aria-hidden="true" />
                  <span>{technology.label}</span>
                </RevealOnScroll>
              );
            })}
          </ul>
        </details>
      </RevealOnScroll>
    </Section>
  );
}

import React from "react";
import { useRef, useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { technologies } from "@/data/technologies";
import gsap from "gsap";
import { isCheapRevealMotionPreferred } from "@/lib/revealMotion";
import { SECTION_IDS } from "@/lib/constants";

const MobileTechnologiesList = () => {
  const t = useTranslations("technologies");
  const collapsedVisibleCount = 12;
  const scrollAnchorIndex = 10;
  const scrollTopOffset = 10;
  const [isExpanded, setIsExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isToggleTransitioningRef = useRef(false);
  const initialTechnologies = useMemo(
    () => technologies.slice(0, collapsedVisibleCount),
    [],
  );
  const visibleTechnologies = isExpanded ? technologies : initialTechnologies;
  const canToggle = technologies.length > collapsedVisibleCount;
  const revealEase = "cubic-bezier(0.22, 1, 0.36, 1)";

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      const initialNodes = gsap.utils.toArray<HTMLElement>(
        "[data-tech-initial='true']",
      );
      const toggleButton = rootRef.current?.querySelector<HTMLElement>(
        "[data-tech-toggle-button='true']",
      );

      if (!initialNodes.length) {
        return;
      }

      const cheap = isCheapRevealMotionPreferred();

      const revealTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 82%",
          once: true,
        },
      });

      revealTimeline.fromTo(
        initialNodes,
        cheap
          ? { opacity: 0, y: 26, scale: 0.98 }
          : { opacity: 0, y: 26, scale: 0.98, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ...(cheap ? {} : { filter: "blur(0px)" }),
          duration: 0.9,
          stagger: 0.08,
          ease: revealEase,
          clearProps: cheap ? "opacity,transform" : "opacity,transform,filter",
        },
      );

      if (!toggleButton) {
        return;
      }

      revealTimeline.fromTo(
        toggleButton,
        cheap
          ? { opacity: 0, y: 26, scale: 0.98 }
          : { opacity: 0, y: 26, scale: 0.98, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ...(cheap ? {} : { filter: "blur(0px)" }),
          duration: 0.9,
          ease: revealEase,
          clearProps: cheap ? "opacity,transform" : "opacity,transform,filter",
        },
        "+=0.08",
      );
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const animateExtraNodes = (onComplete?: () => void) => {
    if (!rootRef.current) {
      onComplete?.();
      return;
    }

    const extraNodes = rootRef.current.querySelectorAll<HTMLElement>(
      "[data-tech-extra='true']",
    );

    if (!extraNodes.length) {
      onComplete?.();
      return;
    }

    const cheap = isCheapRevealMotionPreferred();

    gsap.fromTo(
      extraNodes,
      cheap
        ? { opacity: 0, y: 26, scale: 0.98 }
        : { opacity: 0, y: 26, scale: 0.98, filter: "blur(8px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ...(cheap ? {} : { filter: "blur(0px)" }),
        duration: 0.9,
        stagger: 0.08,
        ease: revealEase,
        clearProps: cheap ? "opacity,transform" : "opacity,transform,filter",
        onComplete,
      },
    );
  };

  const fadeOutExtraNodes = (onComplete?: () => void) => {
    if (!rootRef.current) {
      onComplete?.();
      return;
    }

    const extraNodes = rootRef.current.querySelectorAll<HTMLElement>(
      "[data-tech-extra='true']",
    );

    if (!extraNodes.length) {
      onComplete?.();
      return;
    }

    const cheap = isCheapRevealMotionPreferred();

    gsap.to(extraNodes, {
      opacity: 0,
      y: 18,
      scale: 0.99,
      ...(cheap ? {} : { filter: "blur(4px)" }),
      duration: 0.32,
      stagger: {
        each: 0.02,
        from: "end",
      },
      ease: "power2.out",
      onComplete,
    });
  };

  const hideToggleButton = () => {
    if (!rootRef.current) {
      return;
    }

    const toggleButton = rootRef.current.querySelector<HTMLElement>(
      "[data-tech-toggle-button='true']",
    );

    if (!toggleButton) {
      return;
    }

    gsap.to(toggleButton, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.out",
      pointerEvents: "none",
    });
  };

  const revealToggleButton = (onComplete?: () => void) => {
    if (!rootRef.current) {
      onComplete?.();
      return;
    }

    const toggleButton = rootRef.current.querySelector<HTMLElement>(
      "[data-tech-toggle-button='true']",
    );

    if (!toggleButton) {
      onComplete?.();
      return;
    }

    const cheap = isCheapRevealMotionPreferred();

    gsap.fromTo(
      toggleButton,
      cheap
        ? { opacity: 0, y: 26, scale: 0.98 }
        : { opacity: 0, y: 26, scale: 0.98, filter: "blur(8px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ...(cheap ? {} : { filter: "blur(0px)" }),
        duration: 0.9,
        ease: revealEase,
        clearProps: cheap
          ? "opacity,transform,pointerEvents"
          : "opacity,transform,filter,pointerEvents",
        onComplete,
      },
    );
  };

  const scrollToCollapsedAnchor = () => {
    if (!rootRef.current) {
      return Promise.resolve();
    }

    const anchor = rootRef.current.querySelector<HTMLElement>(
      "[data-tech-scroll-anchor='true']",
    );

    if (!anchor) {
      return Promise.resolve();
    }

    const targetY = Math.max(
      anchor.getBoundingClientRect().top + window.scrollY - scrollTopOffset,
      0,
    );
    return smoothScrollTo(targetY);
  };

  const smoothScrollTo = (targetY: number) => {
    window.scrollTo({ top: targetY, behavior: "smooth" });

    return new Promise<void>((resolve) => {
      const maxWaitMs = 1500;
      const thresholdPx = 2;
      const stableFramesRequired = 6;
      const timeoutId = window.setTimeout(() => {
        resolve();
      }, maxWaitMs);
      let stableFrames = 0;

      const checkScrollPosition = () => {
        const isAtTarget = Math.abs(window.scrollY - targetY) <= thresholdPx;

        if (isAtTarget) {
          stableFrames += 1;
          if (stableFrames >= stableFramesRequired) {
            window.clearTimeout(timeoutId);
            resolve();
            return;
          }
        } else {
          stableFrames = 0;
        }

        requestAnimationFrame(checkScrollPosition);
      };

      requestAnimationFrame(checkScrollPosition);
    });
  };

  const handleToggle = async () => {
    if (isToggleTransitioningRef.current) {
      return;
    }

    if (isExpanded) {
      isToggleTransitioningRef.current = true;
      const technologiesSection = document.getElementById(
        SECTION_IDS.technologies,
      );
      if (!technologiesSection) {
        setIsExpanded(false);
        isToggleTransitioningRef.current = false;
        return;
      }

      const sectionTopY = Math.max(
        technologiesSection.getBoundingClientRect().top + window.scrollY,
        0,
      );
      await smoothScrollTo(sectionTopY);

      fadeOutExtraNodes(() => {
        setIsExpanded(false);
        isToggleTransitioningRef.current = false;
      });
      return;
    }

    isToggleTransitioningRef.current = true;

    hideToggleButton();
    await scrollToCollapsedAnchor();
    setIsExpanded(true);

    requestAnimationFrame(() => {
      animateExtraNodes(() => {
        revealToggleButton(() => {
          isToggleTransitioningRef.current = false;
        });
      });
    });
  };

  return (
    <div ref={rootRef} className="md:hidden!">
      <ul
        className="list-none grid grid-cols-2 gap-(--space-2)"
        aria-label={t("ariaListLabel")}
      >
        {visibleTechnologies.map((technology, index) => {
          const Icon = technology.icon;
          const isInitial = index < collapsedVisibleCount;
          const isExtra = index >= collapsedVisibleCount;

          return (
            <li
              key={technology.id}
              className="bg-(--surface) border border-(--surface-border) rounded-(--radius) p-(--space-2)! flex items-center gap-3!"
              data-tech-initial={isInitial ? "true" : "false"}
              data-tech-extra={isExtra ? "true" : "false"}
              data-tech-scroll-anchor={
                index === scrollAnchorIndex ? "true" : "false"
              }
            >
              <Icon
                className="w-7 h-7! color-(--foreground)!"
                aria-hidden="true"
              />
              <span>{technology.label}</span>
            </li>
          );
        })}
      </ul>
      {canToggle ? (
        <div className="flex justify-end">
          <button
            type="button"
            className="flex items-center gap-1 mt-1! font-extralight text-xs color-(--muted) group"
            onClick={handleToggle}
            aria-expanded={isExpanded}
            data-tech-toggle-button="true"
          >
            {isExpanded ? t("less") : t("more")}
            <span className="group-aria-expanded:rotate-180" aria-hidden="true">
              ▾
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default MobileTechnologiesList;

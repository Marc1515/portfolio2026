"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { technologies } from "@/data/technologies";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

interface DesktopTechnologiesListProps {
  className?: string;
}

export function DesktopTechnologiesList({ className }: DesktopTechnologiesListProps) {
  const t = useTranslations("technologies");
  const rootRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>("[data-tech-desktop-item='true']");

      if (!items.length) {
        return;
      }

      gsap.fromTo(
        items,
        {
          opacity: 0,
          y: 26,
          scale: 0.98,
          filter: "blur(8px)",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.9,
          stagger: 0.08,
          ease: "cubic-bezier(0.22, 1, 0.36, 1)",
          clearProps: "transform,filter",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 82%",
            once: true,
          },
        },
      );
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <ul
      ref={rootRef}
      className={`technologies-grid ${className ?? ""}`.trim()}
      aria-label={t("ariaListLabel")}
    >
      {technologies.map((technology) => {
        const Icon = technology.icon;

        return (
          <li
            key={technology.id}
            className="technologies-item technologies-desktop-reveal-item"
            data-tech-desktop-item="true"
          >
            <Icon className="technologies-icon" aria-hidden="true" />
            <span>{technology.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

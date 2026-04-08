"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type RevealTag = "div" | "li";

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  enabled?: boolean;
  as?: RevealTag;
}

export function RevealOnScroll({
  children,
  className,
  delayMs = 0,
  enabled = true,
  as = "div",
}: RevealOnScrollProps) {
  const elementRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      if (!enabled) {
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const node = elementRef.current;
      if (!node) {
        return;
      }

      gsap.fromTo(
        node,
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
          delay: delayMs / 1000,
          ease: "cubic-bezier(0.22, 1, 0.36, 1)",
          clearProps: "transform,filter",
          scrollTrigger: {
            trigger: node,
            start: "top 82%",
            once: true,
          },
        },
      );
    },
    { dependencies: [delayMs, enabled], revertOnUpdate: true },
  );

  const Tag = as;
  const revealClassName = enabled ? "reveal-on-scroll" : "";
  const resolvedClassName =
    `${revealClassName}${className ? ` ${className}` : ""}`.trim();

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        elementRef.current = node;
      }}
      className={resolvedClassName}
    >
      {children}
    </Tag>
  );
}

"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

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
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const node = elementRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) {
          return;
        }

        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        root: null,
        threshold: 0.2,
        rootMargin: "0px 0px -12% 0px",
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [enabled]);

  const Tag = as;
  const style = {
    "--reveal-delay": `${delayMs}ms`,
  } as CSSProperties;

  return (
    <Tag
      ref={(node) => {
        elementRef.current = node as HTMLElement | null;
      }}
      className={`reveal-on-scroll ${!enabled || isVisible ? "is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </Tag>
  );
}

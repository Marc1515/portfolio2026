import type { ReactNode } from "react";

import { Container } from "@/components/layout/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import type { SectionId } from "@/types/site";
import clsx from "clsx";

interface SectionProps {
  id: SectionId;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  animated?: boolean;
  /** Extra top offset for titled sections; false for full-bleed hero-style blocks. */
  extraTopPadding?: boolean;
}

export function Section({
  id,
  title,
  subtitle,
  children,
  className,
  animated = true,
  extraTopPadding = true,
}: SectionProps) {
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={title ? titleId : undefined}
      className={clsx(
        "min-h-screen px-(--space-2)!",
        extraTopPadding ? "pt-12! md:pt-28!" : "pt-0!",
        className,
      )}
    >
      <Container className="max-w-6xl! mx-auto!">
        {title ? (
          <RevealOnScroll enabled={animated} delayMs={0}>
            <h2 id={titleId} className="text-2xl! mb-(--space-2)! md:text-4xl!">
              {title}
            </h2>
          </RevealOnScroll>
        ) : null}
        {subtitle ? (
          <RevealOnScroll enabled={animated} delayMs={70}>
            <p className="text-(--muted)! mb-(--space-3)!">{subtitle}</p>
          </RevealOnScroll>
        ) : null}
        {children}
      </Container>
    </section>
  );
}

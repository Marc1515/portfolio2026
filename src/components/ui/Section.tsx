import type { ReactNode } from "react";

import { Container } from "@/components/layout/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import type { SectionId } from "@/types/site";

interface SectionProps {
  id: SectionId;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  animated?: boolean;
}

export function Section({
  id,
  title,
  subtitle,
  children,
  className,
  containerClassName,
  animated = true,
}: SectionProps) {
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={title ? titleId : undefined} className={className}>
      <Container className={containerClassName}>
        {title ? (
          <RevealOnScroll enabled={animated} delayMs={0}>
            <h2 id={titleId}>{title}</h2>
          </RevealOnScroll>
        ) : null}
        {subtitle ? (
          <RevealOnScroll enabled={animated} delayMs={70}>
            <p className="section-subtitle">{subtitle}</p>
          </RevealOnScroll>
        ) : null}
        {children}
      </Container>
    </section>
  );
}

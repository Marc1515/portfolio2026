import type { ReactNode } from "react";

import { Container } from "@/components/layout/Container";
import type { SectionId } from "@/types/site";

interface SectionProps {
  id: SectionId;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function Section({
  id,
  title,
  subtitle,
  children,
  className,
  containerClassName,
}: SectionProps) {
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={title ? titleId : undefined} className={className}>
      <Container className={containerClassName}>
        {title ? <h2 id={titleId}>{title}</h2> : null}
        {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        {children}
      </Container>
    </section>
  );
}

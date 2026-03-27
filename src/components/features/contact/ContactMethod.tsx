import type { ContactMethod as ContactMethodModel } from "@/types/contact";

interface ContactMethodProps {
  method: ContactMethodModel;
}

export function ContactMethod({ method }: ContactMethodProps) {
  const Icon = method.icon;

  return (
    <article className="card contact-card">
      <a href={method.href} target="_blank" rel="noreferrer">
        <span className="contact-type">
          <Icon className="contact-icon" aria-hidden="true" />
        </span>
        <span>{method.label}</span>
      </a>
    </article>
  );
}

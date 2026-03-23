import type { ContactMethod as ContactMethodModel } from "@/types/contact";

interface ContactMethodProps {
  method: ContactMethodModel;
}

export function ContactMethod({ method }: ContactMethodProps) {
  return (
    <li className="card contact-card">
      <a href={method.href} target="_blank" rel="noreferrer">
        <span className="contact-type">{method.type}</span>
        <span>{method.label}</span>
      </a>
    </li>
  );
}

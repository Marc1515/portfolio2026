import type { ContactMethod as ContactMethodModel } from "@/types/contact";

interface ContactMethodProps {
  method: ContactMethodModel;
}

export function ContactMethod({ method }: ContactMethodProps) {
  const Icon = method.icon;

  return (
    <article className="bg-(--surface) border border-(--surface-border) rounded-(--radius) p-(--space-2)!">
      <a
        className="flex justify-between"
        href={method.href}
        target="_blank"
        rel="noreferrer"
      >
        <span className="text-(--muted)! inline-flex items-center">
          <Icon className="w-5 h-5!" aria-hidden="true" />
        </span>
        <span>{method.label}</span>
      </a>
    </article>
  );
}

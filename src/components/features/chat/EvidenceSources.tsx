import { isSafeEvidenceHref } from "@/lib/chatEvidence";
import type { ChatEvidenceSource } from "@/types/chat";

interface EvidenceSourcesProps {
  label: string;
  sources: ChatEvidenceSource[];
}

export function EvidenceSources({ label, sources }: EvidenceSourcesProps) {
  return (
    <div className="mt-2.5! border-t border-(--surface-border) pt-2!">
      <p className="mb-1.5! text-[0.67rem]! font-medium tracking-wide text-(--muted) uppercase">
        {label}
      </p>
      <ul className="flex flex-wrap gap-1.5" aria-label={label}>
        {sources.map((source) => {
          const safeHref =
            source.href && isSafeEvidenceHref(source.href)
              ? source.href
              : undefined;
          const chipClassName =
            "inline-flex min-h-7 items-center rounded-full border border-(--surface-border) bg-[color-mix(in_srgb,var(--accent)_7%,var(--surface))] px-2.5! py-1! text-[0.7rem]! leading-tight! text-(--muted)";

          return (
            <li key={source.id}>
              {safeHref ? (
                <a
                  href={safeHref}
                  {...(safeHref.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className={`${chipClassName} transition-colors hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--surface-border))] hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) motion-reduce:transition-none`}
                >
                  {source.label}
                </a>
              ) : (
                <span className={chipClassName}>{source.label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

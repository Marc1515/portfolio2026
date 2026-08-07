import type { ChatDisplayMessage } from "@/types/chat";
import { EvidenceSources } from "@/components/features/chat/EvidenceSources";

interface ChatMessageProps {
  assistantLabel: string;
  evidenceLabel: string;
  isLatestAssistant: boolean;
  message: ChatDisplayMessage;
  userLabel: string;
}

export function ChatMessage({
  assistantLabel,
  evidenceLabel,
  isLatestAssistant,
  message,
  userLabel,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const accessibleLabel = isUser ? userLabel : assistantLabel;

  return (
    <article
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      aria-live={isLatestAssistant ? "polite" : undefined}
      aria-atomic={isLatestAssistant ? "true" : undefined}
    >
      <div
        className={`max-w-[88%] rounded-2xl px-3.5! py-2.5! text-sm! leading-relaxed! shadow-sm ${
          isUser
            ? "rounded-br-md bg-[color-mix(in_srgb,var(--accent)_28%,var(--surface))] text-(--foreground)"
            : "rounded-bl-md border border-(--surface-border) bg-[color-mix(in_srgb,var(--background)_48%,var(--surface))] text-(--foreground)"
        }`}
      >
        <span className="sr-only">{accessibleLabel}: </span>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {!isUser && message.sources && message.sources.length > 0 ? (
          <EvidenceSources label={evidenceLabel} sources={message.sources} />
        ) : null}
      </div>
    </article>
  );
}

import { FiSend, FiTrash2, FiX } from "react-icons/fi";

import { ChatMessage } from "@/components/features/chat/ChatMessage";
import { SuggestedQuestions } from "@/components/features/chat/SuggestedQuestions";
import type { ChatDisplayMessage } from "@/types/chat";

interface ChatPanelLabels {
  assistantBadge: string;
  assistantMessage: string;
  characterCounter: string;
  clear: string;
  close: string;
  description: string;
  emptyConversation: string;
  emptyInput: string;
  evidence: string;
  inputLabel: string;
  loading: string;
  placeholder: string;
  retryGuidance: string;
  send: string;
  suggestions: string;
  title: string;
  userMessage: string;
}

interface ChatPanelProps {
  errorMessage: string | null;
  input: string;
  inputError: string | null;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  isLoading: boolean;
  labels: ChatPanelLabels;
  maxLength: number;
  messages: ChatDisplayMessage[];
  onClear: () => void;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSuggestionSelect: (question: string) => void;
  panelId: string;
  questions: string[];
  showSuggestions: boolean;
}

export function ChatPanel({
  errorMessage,
  input,
  inputError,
  inputRef,
  isLoading,
  labels,
  maxLength,
  messages,
  onClear,
  onClose,
  onInputChange,
  onSend,
  onSuggestionSelect,
  panelId,
  questions,
  showSuggestions,
}: ChatPanelProps) {
  const scrollAnchorId = `${panelId}-scroll-anchor`;

  return (
    <section
      id={panelId}
      role="region"
      aria-labelledby={`${panelId}-title`}
      aria-describedby={`${panelId}-description`}
      aria-busy={isLoading}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
      className="fixed right-2 left-2 z-80 flex w-auto flex-col overflow-hidden rounded-t-2xl border border-(--surface-border) bg-(--surface) shadow-[0_1.5rem_4rem_rgb(0_0_0/48%)] [bottom:max(0rem,env(safe-area-inset-bottom))] [height:min(42rem,calc(100dvh-0.5rem))] motion-safe:animate-[chat-panel-in_180ms_ease-out] sm:right-6 sm:left-auto sm:w-[23.75rem] sm:rounded-2xl sm:[bottom:calc(max(1rem,env(safe-area-inset-bottom))+4.5rem)] sm:[height:min(40rem,calc(100dvh-7rem))]"
    >
      <div className="h-1 shrink-0 bg-[linear-gradient(90deg,var(--accent),color-mix(in_srgb,var(--accent)_28%,transparent)_72%,transparent)]" />
      <header className="flex shrink-0 items-start gap-3 border-b border-(--surface-border) px-4! py-3.5!">
        <div className="min-w-0 flex-1">
          <div className="mb-1! flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-(--accent) shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_15%,transparent)]" />
            <span className="font-mono text-[0.65rem]! tracking-[0.12em] text-(--accent) uppercase">
              {labels.assistantBadge}
            </span>
          </div>
          <h2
            id={`${panelId}-title`}
            className="text-base! leading-tight! font-semibold text-(--foreground)"
          >
            {labels.title}
          </h2>
          <p
            id={`${panelId}-description`}
            className="mt-1! text-xs! leading-snug! text-(--muted)"
          >
            {labels.description}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onClear}
            disabled={isLoading}
            aria-label={labels.clear}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-lg text-(--muted) transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent) disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          >
            <FiTrash2 aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-xl text-(--muted) transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent) motion-reduce:transition-none"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4! py-4!">
        {messages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                userLabel={labels.userMessage}
                assistantLabel={labels.assistantMessage}
                evidenceLabel={labels.evidence}
                isLatestAssistant={
                  message.role === "assistant" && index === messages.length - 1
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm! text-(--muted)">
            {labels.emptyConversation}
          </p>
        )}

        {showSuggestions ? (
          <div className="mt-4!">
            <SuggestedQuestions
              questions={questions}
              label={labels.suggestions}
              disabled={isLoading}
              onSelect={onSuggestionSelect}
            />
          </div>
        ) : null}

        {isLoading ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-3! flex items-center gap-2 text-sm! text-(--muted)"
          >
            <span className="flex gap-1" aria-hidden="true">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-(--accent) motion-reduce:animate-none"
                  style={{ animationDelay: `${dot * 140}ms` }}
                />
              ))}
            </span>
            {labels.loading}
          </div>
        ) : null}
        <div id={scrollAnchorId} />
      </div>

      <div className="shrink-0 border-t border-(--surface-border) bg-[color-mix(in_srgb,var(--background)_28%,var(--surface))] px-3! pt-3! [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
        {errorMessage ? (
          <div
            role="alert"
            className="mb-2! rounded-lg border border-red-300/25 bg-red-400/10 px-3! py-2! text-xs! leading-snug! text-red-100"
          >
            <p>{errorMessage}</p>
            <p className="mt-1! text-red-100/75">{labels.retryGuidance}</p>
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
        >
          <label className="sr-only" htmlFor={`${panelId}-input`}>
            {labels.inputLabel}
          </label>
          <div className="flex items-end gap-2 rounded-xl border border-(--surface-border) bg-(--background) p-2! focus-within:border-[color-mix(in_srgb,var(--accent)_70%,var(--surface-border))] focus-within:ring-1 focus-within:ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]">
            <textarea
              ref={inputRef}
              id={`${panelId}-input`}
              value={input}
              maxLength={maxLength}
              rows={2}
              disabled={isLoading}
              placeholder={labels.placeholder}
              aria-invalid={inputError ? "true" : undefined}
              aria-describedby={`${panelId}-input-meta`}
              onChange={(event) =>
                onInputChange(event.target.value.slice(0, maxLength))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              className="max-h-28 min-h-12 min-w-0 flex-1 resize-none bg-transparent px-1! py-1! text-sm! leading-snug! text-(--foreground) outline-none placeholder:text-(--muted) disabled:cursor-not-allowed disabled:opacity-65"
            />
            <button
              type="submit"
              disabled={isLoading || input.trim().length === 0}
              aria-label={labels.send}
              className="inline-flex h-10 min-w-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-(--accent) px-3! text-sm! font-semibold text-[#071326] transition-[filter,transform] duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <FiSend aria-hidden="true" />
              <span className="hidden xs:inline">{labels.send}</span>
            </button>
          </div>
          <div
            id={`${panelId}-input-meta`}
            className="mt-1.5! flex min-h-4 items-start justify-between gap-3 px-1! text-[0.7rem]! leading-tight!"
          >
            <span
              className="text-red-200"
              role={inputError ? "alert" : undefined}
            >
              {inputError ?? ""}
            </span>
            <span className="ml-auto! shrink-0 text-(--muted)">
              {labels.characterCounter}
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}

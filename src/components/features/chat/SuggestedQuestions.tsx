interface SuggestedQuestionsProps {
  disabled: boolean;
  label: string;
  onSelect: (question: string) => void;
  questions: string[];
}

export function SuggestedQuestions({
  disabled,
  label,
  onSelect,
  questions,
}: SuggestedQuestionsProps) {
  return (
    <section aria-label={label}>
      <p className="mb-2! text-xs! font-semibold tracking-[0.08em] text-(--muted) uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(question)}
            className="cursor-pointer rounded-full border border-(--surface-border) bg-(--surface) px-3! py-2! text-left text-xs! leading-snug! text-(--foreground) transition-[border-color,background-color] duration-200 hover:border-[color-mix(in_srgb,var(--accent)_65%,var(--surface-border))] hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none"
          >
            {question}
          </button>
        ))}
      </div>
    </section>
  );
}

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ChatPanel } from "@/components/features/chat/ChatPanel";

const labels = {
  assistantBadge: "Portfolio AI",
  assistantMessage: "Assistant",
  characterCounter: "0/4000 characters",
  clear: "Clear",
  close: "Close",
  description: "Description",
  emptyConversation: "Empty",
  emptyInput: "Enter a message",
  errorGuidance: null,
  evidence: "Evidence",
  inputLabel: "Message",
  loading: "Loading",
  placeholder: "Ask",
  retry: "Try again",
  send: "Send",
  suggestions: "Suggestions",
  title: "Assistant",
  userMessage: "Your message",
};

function renderRetry(isLoading: boolean) {
  return renderToStaticMarkup(
    <ChatPanel
      canRetry
      errorMessage="I couldn't generate this answer right now. Your message is still here, so you can try again in a moment."
      input=""
      inputError={null}
      inputRef={{ current: null }}
      isLoading={isLoading}
      labels={labels}
      maxLength={4_000}
      messages={[
        { id: "greeting", role: "assistant", content: "Hello" },
        {
          id: "job-description",
          role: "user",
          content: "Junior Full Stack Engineer role with Python and React.",
        },
      ]}
      onClear={vi.fn()}
      onClose={vi.fn()}
      onInputChange={vi.fn()}
      onRetry={vi.fn()}
      onSend={vi.fn()}
      onSuggestionSelect={vi.fn()}
      panelId="chat"
      questions={[]}
      showSuggestions={false}
    />,
  );
}

describe("ChatPanel retryable error", () => {
  it("shows the recoverable message, retained job description, and retry action", () => {
    const markup = renderRetry(false);

    expect(markup).toContain("I couldn&#x27;t generate this answer right now.");
    expect(markup).toContain(
      "Junior Full Stack Engineer role with Python and React.",
    );
    expect(markup).toContain("Try again");
  });

  it("disables retry while the retry request is loading", () => {
    const markup = renderRetry(true);
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*Try again/);
  });
});

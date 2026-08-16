import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ChatPanel } from "@/components/features/chat/ChatPanel";
import {
  LONG_REQUEST_NOTICE_THRESHOLD,
  shouldShowLongRequestNotice,
} from "@/components/features/chat/chatLongRequest";

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
  longRequestNotice:
    "This is a detailed request. Generating a thorough answer may take a little longer than usual.",
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
      showLongRequestNotice={isLoading}
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
    expect(markup).toContain(labels.longRequestNotice);
  });
});

describe("long-request notice state", () => {
  it.each([
    [699, false],
    [700, true],
    [701, true],
  ])("uses the trimmed %s-character threshold", (length, expected) => {
    expect(
      shouldShowLongRequestNotice({
        input: "x".repeat(length),
        isLoading: false,
        hasRequestError: false,
      }),
    ).toBe(expected);
  });

  it("keeps the notice after submit clears the textarea while the long message is pending", () => {
    expect(
      shouldShowLongRequestNotice({
        input: "",
        pendingContent: "x".repeat(LONG_REQUEST_NOTICE_THRESHOLD),
        isLoading: true,
        hasRequestError: false,
      }),
    ).toBe(true);
  });

  it("stops after success and after provider failure, while retry UI remains separate", () => {
    const pendingContent = "x".repeat(LONG_REQUEST_NOTICE_THRESHOLD);

    expect(
      shouldShowLongRequestNotice({
        input: "",
        isLoading: false,
        hasRequestError: false,
      }),
    ).toBe(false);
    expect(
      shouldShowLongRequestNotice({
        input: "",
        pendingContent,
        isLoading: false,
        hasRequestError: true,
      }),
    ).toBe(false);
    const failureMarkup = renderRetry(false);
    expect(failureMarkup).toContain("Try again");
    expect(failureMarkup).not.toContain(labels.longRequestNotice);
  });

  it("shows again only while retrying a retained long message", () => {
    expect(
      shouldShowLongRequestNotice({
        input: "",
        pendingContent: "x".repeat(LONG_REQUEST_NOTICE_THRESHOLD),
        isLoading: true,
        hasRequestError: true,
      }),
    ).toBe(true);
  });

  it("does not show for a short normal question", () => {
    expect(
      shouldShowLongRequestNotice({
        input: "How has Marc used React?",
        isLoading: true,
        hasRequestError: false,
      }),
    ).toBe(false);
  });

  it("renders as an accessible informational description, not an alert", () => {
    const markup = renderRetry(true);
    expect(markup).toContain('id="chat-long-request-notice"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain(
      'aria-describedby="chat-input-meta chat-long-request-notice"',
    );
    expect(markup).not.toMatch(
      /id="chat-long-request-notice"[^>]*role="alert"/,
    );
  });
});

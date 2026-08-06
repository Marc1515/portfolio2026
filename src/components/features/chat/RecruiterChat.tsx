"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatLauncher } from "@/components/features/chat/ChatLauncher";
import { ChatPanel } from "@/components/features/chat/ChatPanel";
import {
  MAX_ASSISTANT_MESSAGE_LENGTH,
  MAX_HISTORY_MESSAGES,
  MAX_USER_MESSAGE_LENGTH,
} from "@/lib/ai/validation";
import type {
  ChatDisplayMessage,
  ChatLocale,
  ChatResponse,
} from "@/types/chat";

const PANEL_ID = "recruiter-chat-panel";

type RequestError = {
  type: "generic" | "unavailable" | "busy" | "rate_limited" | "forbidden";
  retryAfterSeconds?: number;
};

function createMessage(
  role: ChatDisplayMessage["role"],
  content: string,
): ChatDisplayMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
  };
}

function parseStoredMessages(value: string): ChatDisplayMessage[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length > MAX_HISTORY_MESSAGES) {
    return null;
  }

  const messages: ChatDisplayMessage[] = [];
  for (const item of parsed) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("id" in item) ||
      !("role" in item) ||
      !("content" in item) ||
      typeof item.id !== "string" ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" ||
      item.content.trim().length === 0
    ) {
      return null;
    }

    const maximumLength =
      item.role === "user"
        ? MAX_USER_MESSAGE_LENGTH
        : MAX_ASSISTANT_MESSAGE_LENGTH;
    if (item.content.length > maximumLength) {
      return null;
    }

    messages.push({
      id: item.id,
      role: item.role,
      content: item.content,
    });
  }

  return messages.length > 0 ? messages : null;
}

function isChatResponse(value: unknown): value is ChatResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string" &&
    value.message.trim().length > 0 &&
    value.message.length <= MAX_ASSISTANT_MESSAGE_LENGTH
  );
}

function toStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function RecruiterChat() {
  const locale = useLocale() as ChatLocale;
  const t = useTranslations("chat");
  const greeting = t("greeting");
  const storageKey = `recruiter-chat:${locale}`;
  const greetingMessage = useMemo<ChatDisplayMessage>(
    () => ({ id: `greeting-${locale}`, role: "assistant", content: greeting }),
    [greeting, locale],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatDisplayMessage[]>([
    greetingMessage,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState<RequestError | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [hasRestored, setHasRestored] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const questions = toStringList(t.raw("suggestedQuestions"));
  const showSuggestions = !messages.some((message) => message.role === "user");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const stored = sessionStorage.getItem(storageKey);
        if (!stored) {
          setMessages([greetingMessage]);
        } else {
          const restored = parseStoredMessages(stored);
          if (restored) {
            setMessages(restored);
          } else {
            sessionStorage.removeItem(storageKey);
            setMessages([greetingMessage]);
          }
        }
      } catch {
        setMessages([greetingMessage]);
      }

      setHasRestored(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [greetingMessage, storageKey]);

  useEffect(() => {
    if (!hasRestored) {
      return;
    }

    try {
      if (messages.some((message) => message.role === "user")) {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify(messages.slice(-MAX_HISTORY_MESSAGES)),
        );
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }, [hasRestored, messages, storageKey]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frameId = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frameId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const anchor = document.getElementById(`${PANEL_ID}-scroll-anchor`);
    anchor?.scrollIntoView({ block: "nearest" });
  }, [isLoading, isOpen, messages]);

  const close = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const normalizedContent = content.trim();
      if (normalizedContent.length === 0) {
        setInputError(t("emptyInput"));
        inputRef.current?.focus();
        return;
      }

      if (normalizedContent.length > MAX_USER_MESSAGE_LENGTH || isLoading) {
        return;
      }

      const userMessage = createMessage("user", normalizedContent);
      const requestMessages = [...messages, userMessage].slice(
        -MAX_HISTORY_MESSAGES,
      );

      setInput("");
      setInputError(null);
      setRequestError(null);
      setIsLoading(true);
      setMessages(requestMessages);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            messages: requestMessages.map(
              ({ role, content: messageContent }) => ({
                role,
                content: messageContent,
              }),
            ),
          }),
        });

        let payload: unknown = null;
        try {
          payload = await response.json();
        } catch {
          // A malformed response is handled as a generic user-facing error.
        }

        if (!response.ok || !isChatResponse(payload)) {
          if (response.status === 429) {
            const retryAfterSeconds = Number(
              response.headers.get("retry-after"),
            );
            setRequestError({
              type: "rate_limited",
              retryAfterSeconds:
                Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
                  ? Math.ceil(retryAfterSeconds)
                  : undefined,
            });
          } else if (response.status === 403) {
            setRequestError({ type: "forbidden" });
          } else if (response.status === 503) {
            setRequestError({ type: "busy" });
          } else {
            setRequestError({ type: "generic" });
          }
          return;
        }

        const assistantMessage = createMessage(
          "assistant",
          payload.message.trim(),
        );
        setMessages((current) =>
          [...current, assistantMessage].slice(-MAX_HISTORY_MESSAGES),
        );
      } catch {
        setRequestError({ type: "unavailable" });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, locale, messages, t],
  );

  const clearConversation = useCallback(() => {
    setMessages([greetingMessage]);
    setInput("");
    setInputError(null);
    setRequestError(null);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Clearing the in-memory conversation still succeeds if storage is blocked.
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [greetingMessage, storageKey]);

  const labels = {
    assistantBadge: t("assistantBadge"),
    assistantMessage: t("assistantMessageLabel"),
    characterCounter: t("characterCounter", {
      count: input.length,
      max: MAX_USER_MESSAGE_LENGTH,
    }),
    clear: t("clearLabel"),
    close: t("closeLabel"),
    description: t("panelDescription"),
    emptyConversation: t("emptyConversation"),
    emptyInput: t("emptyInput"),
    inputLabel: t("inputLabel"),
    loading: t("loading"),
    placeholder: t("inputPlaceholder"),
    retryGuidance:
      requestError?.type === "rate_limited" && requestError.retryAfterSeconds
        ? t("rateLimitRetryGuidance", {
            seconds: requestError.retryAfterSeconds,
          })
        : t("retryGuidance"),
    send: t("sendLabel"),
    suggestions: t("suggestionsLabel"),
    title: t("panelTitle"),
    userMessage: t("userMessageLabel"),
  };

  return (
    <>
      <ChatLauncher
        buttonRef={launcherRef}
        controlsId={PANEL_ID}
        isOpen={isOpen}
        label={t("launcherLabel")}
        onClick={() => setIsOpen(true)}
      />
      {isOpen ? (
        <ChatPanel
          panelId={PANEL_ID}
          input={input}
          inputRef={inputRef}
          inputError={inputError}
          messages={messages}
          questions={questions}
          labels={labels}
          maxLength={MAX_USER_MESSAGE_LENGTH}
          isLoading={isLoading}
          showSuggestions={showSuggestions}
          errorMessage={
            requestError?.type === "unavailable"
              ? t("providerUnavailableError")
              : requestError?.type === "busy"
                ? t("assistantBusyError")
                : requestError?.type === "rate_limited"
                  ? t("rateLimitedError")
                  : requestError?.type === "forbidden"
                    ? t("requestRejectedError")
                    : requestError?.type === "generic"
                      ? t("genericApiError")
                      : null
          }
          onInputChange={(value) => {
            setInput(value);
            if (inputError) {
              setInputError(null);
            }
          }}
          onSend={() => void sendMessage(input)}
          onSuggestionSelect={(question) => void sendMessage(question)}
          onClear={clearConversation}
          onClose={close}
        />
      ) : null}
    </>
  );
}

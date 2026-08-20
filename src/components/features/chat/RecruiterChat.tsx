"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatLauncher } from "@/components/features/chat/ChatLauncher";
import { ChatPanel } from "@/components/features/chat/ChatPanel";
import {
  requestChatAnswer,
  type ChatRequestError,
} from "@/components/features/chat/chatClient";
import {
  confirmPendingChatHistory,
  parseStoredChatMessages,
  preparePendingChatHistory,
  recoverPendingChatHistory,
  toApiRequestMessages,
  type PendingChatHistory,
} from "@/components/features/chat/chatHistory";
import { shouldShowLongRequestNotice } from "@/components/features/chat/chatLongRequest";
import {
  MAX_HISTORY_MESSAGES,
  MAX_USER_MESSAGE_LENGTH,
} from "@/lib/ai/validation";
import type {
  ChatEvidenceSource,
  ChatDisplayMessage,
  ChatLocale,
} from "@/types/chat";

const PANEL_ID = "recruiter-chat-panel";

function createMessage(
  role: ChatDisplayMessage["role"],
  content: string,
  sources?: ChatEvidenceSource[],
): ChatDisplayMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    ...(sources && sources.length > 0 ? { sources } : {}),
  };
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
  const [pendingUserMessage, setPendingUserMessage] =
    useState<ChatDisplayMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestError, setRequestError] = useState<ChatRequestError | null>(
    null,
  );
  const [retryablePending, setRetryablePending] =
    useState<PendingChatHistory | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [hasRestored, setHasRestored] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const requestInFlightRef = useRef(false);

  const questions = toStringList(t.raw("suggestedQuestions"));
  const displayedMessages = useMemo(
    () =>
      pendingUserMessage
        ? [...messages, pendingUserMessage].slice(-MAX_HISTORY_MESSAGES)
        : messages,
    [messages, pendingUserMessage],
  );
  const showSuggestions = !displayedMessages.some(
    (message) => message.role === "user",
  );
  const showLongRequestNotice = shouldShowLongRequestNotice({
    input,
    pendingContent: pendingUserMessage?.content,
    isLoading,
    hasRequestError: requestError !== null,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const stored = sessionStorage.getItem(storageKey);
        if (!stored) {
          setMessages([greetingMessage]);
        } else {
          const restored = parseStoredChatMessages(stored);
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
  }, [displayedMessages, isLoading, isOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  const performRequest = useCallback(
    async (pendingHistory: PendingChatHistory, isRetry: boolean) => {
      if (requestInFlightRef.current) return;
      requestInFlightRef.current = true;
      setInputError(null);
      if (!isRetry) setRequestError(null);
      setIsLoading(true);
      setPendingUserMessage(pendingHistory.pendingUserMessage);

      const recoverFailedRequest = () => {
        const recovered = recoverPendingChatHistory(pendingHistory);
        setMessages(recovered.confirmedMessages);
        setPendingUserMessage(null);
        setRetryablePending(null);
        setInput(recovered.retryInput);
        requestAnimationFrame(() => inputRef.current?.focus());
      };

      const result = await requestChatAnswer(
        locale,
        toApiRequestMessages(pendingHistory.requestMessages),
      );

      if (!result.ok) {
        setRequestError(result.error);
        if (result.error.type === "provider_unavailable") {
          setMessages(pendingHistory.confirmedMessages);
          setPendingUserMessage(pendingHistory.pendingUserMessage);
          setRetryablePending(pendingHistory);
        } else {
          recoverFailedRequest();
        }
      } else {
        const assistantMessage = createMessage(
          "assistant",
          result.response.message.trim(),
          result.response.sources,
        );
        setMessages(
          confirmPendingChatHistory(pendingHistory, assistantMessage),
        );
        setPendingUserMessage(null);
        setRetryablePending(null);
        setRequestError(null);
      }

      requestInFlightRef.current = false;
      setIsLoading(false);
    },
    [locale],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const normalizedContent = content.trim();
      if (normalizedContent.length === 0) {
        setInputError(t("emptyInput"));
        inputRef.current?.focus();
        return;
      }

      if (
        normalizedContent.length > MAX_USER_MESSAGE_LENGTH ||
        requestInFlightRef.current ||
        retryablePending
      ) {
        return;
      }

      const userMessage = createMessage("user", normalizedContent);
      const pendingHistory = preparePendingChatHistory(messages, userMessage);
      setInput("");
      await performRequest(pendingHistory, false);
    },
    [messages, performRequest, retryablePending, t],
  );

  const retryFailedMessage = useCallback(async () => {
    if (!retryablePending || requestInFlightRef.current) return;
    await performRequest(retryablePending, true);
  }, [performRequest, retryablePending]);

  const clearConversation = useCallback(() => {
    setMessages([greetingMessage]);
    setPendingUserMessage(null);
    setInput("");
    setInputError(null);
    setRequestError(null);
    setRetryablePending(null);
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
    evidence: t("evidenceLabel"),
    inputLabel: t("inputLabel"),
    loading: t("loading"),
    longRequestNotice: t("longRequestNotice"),
    placeholder: t("inputPlaceholder"),
    errorGuidance:
      requestError?.type === "rate_limited" && requestError.retryAfterSeconds
        ? t("rateLimitRetryGuidance", {
            seconds: requestError.retryAfterSeconds,
          })
        : requestError?.type === "provider_unavailable"
          ? null
          : requestError?.type === "job_description_too_long"
            ? null
            : t("retryGuidance"),
    retry: t("retryLabel"),
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
          messages={displayedMessages}
          questions={questions}
          labels={labels}
          maxLength={MAX_USER_MESSAGE_LENGTH}
          isLoading={isLoading}
          showLongRequestNotice={showLongRequestNotice}
          showSuggestions={showSuggestions}
          errorMessage={
            requestError?.type === "network_unavailable"
              ? t("providerUnavailableError")
              : requestError?.type === "provider_unavailable"
                ? t("assistantGenerationError")
                : requestError?.type === "rate_limited"
                  ? t("rateLimitedError")
                  : requestError?.type === "invalid_request"
                    ? t("invalidRequestError")
                    : requestError?.type === "job_description_too_long"
                      ? t("jobDescriptionTooLongError")
                      : requestError?.type === "forbidden"
                        ? t("requestRejectedError")
                        : requestError?.type === "internal"
                          ? t("internalError")
                          : requestError?.type === "generic"
                            ? t("genericApiError")
                            : null
          }
          canRetry={Boolean(retryablePending)}
          onInputChange={(value) => {
            setInput(value);
            if (inputError) {
              setInputError(null);
            }
            if (requestError && !retryablePending) {
              setRequestError(null);
            }
          }}
          onSend={() => void sendMessage(input)}
          onRetry={() => void retryFailedMessage()}
          onSuggestionSelect={(question) => void sendMessage(question)}
          onClear={clearConversation}
          onClose={close}
        />
      ) : null}
    </>
  );
}

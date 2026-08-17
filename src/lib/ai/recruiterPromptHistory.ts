import "server-only";

import { hasPastedJobDescription } from "@/lib/ai/jobDescriptionHeuristics";
import {
  detectRecruiterQueryKind,
  normalizeRetrievalText,
} from "@/lib/ai/knowledgeRetriever";
import { isRecruiterProfessionalFollowUp } from "@/lib/ai/recruiterIntentGuard";
import type { RecruiterMessage } from "@/types/chat";

export const MAX_NORMAL_PROMPT_TURNS = 2;

const ROLE_REFERENCE_PATTERNS = [
  /\b(?:this|the) (?:job|position|role|vacancy)\b/,
  /\b(?:requirement|requirements|qualification|qualifications)\b/,
  /\b(?:weakest points?|weaknesses?|gaps?|missing|concerns?|strongest points?|strengths?)\b/,
  /\b(?:este|esta|el|la) (?:oferta|puesto|posicion|vacante|rol)\b/,
  /\b(?:requisito|requisitos|cualificacion|cualificaciones)\b/,
  /\b(?:puntos? debiles?|debilidades?|carencias?|brechas?|faltas?|dudas?|puntos? fuertes?|fortalezas?)\b/,
];

export function isRecruiterJobDescription(content: string): boolean {
  const trimmed = content.trim();
  return (
    hasPastedJobDescription(trimmed) ||
    (trimmed.length >= 600 &&
      detectRecruiterQueryKind(trimmed) === "role_comparison")
  );
}

function isRoleDependentFollowUp(
  messages: RecruiterMessage[],
  messageIndex: number,
): boolean {
  const message = messages[messageIndex];
  if (message?.role !== "user") return false;

  const normalized = normalizeRetrievalText(message.content);
  if (normalized.split(" ").length > 18) return false;

  return (
    ROLE_REFERENCE_PATTERNS.some((pattern) => pattern.test(normalized)) ||
    isRecruiterProfessionalFollowUp(messages.slice(0, messageIndex + 1))
  );
}

function findLatestJobDescriptionIndex(
  messages: RecruiterMessage[],
  endIndex: number,
): number {
  for (let index = endIndex; index >= 0; index -= 1) {
    const message = messages[index];
    if (
      message?.role === "user" &&
      isRecruiterJobDescription(message.content)
    ) {
      return index;
    }
  }

  return -1;
}

export function hasRoleComparisonFollowUpContext(
  messages: RecruiterMessage[],
): boolean {
  const currentIndex = messages.length - 1;
  const current = messages[currentIndex];
  if (
    !current ||
    current.role !== "user" ||
    isRecruiterJobDescription(current.content)
  ) {
    return false;
  }

  const anchorIndex = findLatestJobDescriptionIndex(messages, currentIndex - 1);
  if (anchorIndex < 0) return false;

  let foundVisitor = false;
  for (let index = anchorIndex + 1; index <= currentIndex; index += 1) {
    if (messages[index]?.role !== "user") continue;
    foundVisitor = true;
    if (!isRoleDependentFollowUp(messages, index)) return false;
  }

  return foundVisitor;
}

function selectLatestCompletedTurnAfterAnchor(
  messages: RecruiterMessage[],
  anchorIndex: number,
): RecruiterMessage[] {
  let latestTurn: RecruiterMessage[] = [];

  for (let index = anchorIndex + 1; index < messages.length - 1; index += 1) {
    const visitor = messages[index];
    const assistant = messages[index + 1];
    if (
      visitor?.role === "user" &&
      assistant?.role === "assistant" &&
      isRoleDependentFollowUp(messages, index)
    ) {
      latestTurn = [visitor, assistant];
      index += 1;
    }
  }

  if (latestTurn.length > 0) return latestTurn;

  const anchorAnswer = messages[anchorIndex + 1];
  return anchorAnswer?.role === "assistant" ? [anchorAnswer] : [];
}

function selectNormalCompletedTurns(
  messages: RecruiterMessage[],
  currentIndex: number,
): RecruiterMessage[] {
  const latestAnchorIndex = findLatestJobDescriptionIndex(
    messages,
    currentIndex - 1,
  );
  const completedTurns: RecruiterMessage[][] = [];

  for (
    let index = latestAnchorIndex + 1;
    index < currentIndex - 1;
    index += 1
  ) {
    const visitor = messages[index];
    const assistant = messages[index + 1];
    if (visitor?.role === "user" && assistant?.role === "assistant") {
      completedTurns.push([visitor, assistant]);
      index += 1;
    }
  }

  return completedTurns.slice(-MAX_NORMAL_PROMPT_TURNS).flat();
}

export function selectRecruiterPromptHistory(
  messages: RecruiterMessage[],
): RecruiterMessage[] {
  const currentIndex = messages.length - 1;
  const current = messages[currentIndex];
  if (!current || current.role !== "user") return [];

  if (isRecruiterJobDescription(current.content)) return [current];

  if (hasRoleComparisonFollowUpContext(messages)) {
    const anchorIndex = findLatestJobDescriptionIndex(
      messages,
      currentIndex - 1,
    );
    const anchor = messages[anchorIndex];
    if (anchor?.role === "user") {
      return [
        anchor,
        ...selectLatestCompletedTurnAfterAnchor(messages, anchorIndex),
        current,
      ];
    }
  }

  return [...selectNormalCompletedTurns(messages, currentIndex), current];
}

import { describe, expect, it } from "vitest";

import { recruiterEvalCases } from "@/lib/ai/evals/recruiterEvalCases";
import {
  buildPublicEvidenceSources,
  MAX_RETRIEVED_ENTRIES,
  MAX_ROLE_COMPARISON_ENTRIES,
  retrieveRecruiterKnowledge,
} from "@/lib/ai/knowledgeRetriever";
import { buildRecruiterPrompt } from "@/lib/ai/promptBuilder";
import { selectRecruiterPromptHistory } from "@/lib/ai/recruiterPromptHistory";
import { evaluateRecruiterIntent } from "@/lib/ai/recruiterIntentGuard";
import { isChatEvidenceSource, MAX_PUBLIC_SOURCES } from "@/lib/chatEvidence";

describe("deterministic recruiter evaluations", () => {
  it.each(recruiterEvalCases)("$id", (evaluation) => {
    const history = [
      ...(evaluation.historyPrefix ?? []),
      { role: "user" as const, content: evaluation.question },
    ];
    const intent = evaluateRecruiterIntent(evaluation.locale, history);
    const expectedIntent = evaluation.expectedIntentKind ?? "professional";

    expect(intent.kind).toBe(expectedIntent);
    if (intent.kind !== "professional") return;

    const retrieval = retrieveRecruiterKnowledge(evaluation.locale, history);
    const promptHistory = selectRecruiterPromptHistory(history);
    const evidenceIds = retrieval.entries.map((entry) => entry.id);
    const prompt = buildRecruiterPrompt({
      locale: evaluation.locale,
      history: promptHistory,
      evidence: retrieval.entries,
      queryKind: retrieval.queryKind,
      allowDirectContact: retrieval.allowDirectContact,
    });
    const systemPrompt = prompt[0]?.content ?? "";
    const sources = buildPublicEvidenceSources(
      retrieval.entries,
      evaluation.locale,
      { allowDirectContact: retrieval.allowDirectContact },
    );
    const sourceIds = sources.map((source) => source.id);

    if (evaluation.expectedQueryKind) {
      expect(retrieval.queryKind).toBe(evaluation.expectedQueryKind);
    }
    if (evaluation.expectedAllowDirectContact !== undefined) {
      expect(retrieval.allowDirectContact).toBe(
        evaluation.expectedAllowDirectContact,
      );
    }
    for (const id of evaluation.expectedEvidenceIds ?? []) {
      expect(evidenceIds).toContain(id);
    }
    for (const id of evaluation.forbiddenEvidenceIds ?? []) {
      expect(evidenceIds).not.toContain(id);
    }
    for (const value of evaluation.promptMustContain ?? []) {
      expect(systemPrompt).toContain(value);
    }
    for (const value of evaluation.promptMustNotContain ?? []) {
      expect(systemPrompt).not.toContain(value);
    }
    for (const id of evaluation.expectedSourceIds ?? []) {
      expect(sourceIds).toContain(id);
    }
    for (const id of evaluation.forbiddenSourceIds ?? []) {
      expect(sourceIds).not.toContain(id);
    }

    const maximumEntries =
      retrieval.queryKind === "role_comparison"
        ? MAX_ROLE_COMPARISON_ENTRIES
        : MAX_RETRIEVED_ENTRIES;
    expect(retrieval.entries.length).toBeLessThanOrEqual(maximumEntries);
    expect(sources.length).toBeLessThanOrEqual(MAX_PUBLIC_SOURCES);
    expect(sources.every(isChatEvidenceSource)).toBe(true);
    expect(prompt.filter((message) => message.role === "system")).toHaveLength(
      1,
    );
    expect(
      prompt.every(
        (message) => message.role === "system" || message.role === "user",
      ),
    ).toBe(true);
  });

  it("uses the digits-only trusted WhatsApp URL", () => {
    const history = [
      { role: "user" as const, content: "What is Marc's WhatsApp?" },
    ];
    const retrieval = retrieveRecruiterKnowledge("en", history);
    const sources = buildPublicEvidenceSources(retrieval.entries, "en", {
      allowDirectContact: retrieval.allowDirectContact,
    });
    const whatsapp = sources.find((source) => source.id === "contact-whatsapp");

    expect(whatsapp?.href).toBe("https://wa.me/353870041006");
  });
});

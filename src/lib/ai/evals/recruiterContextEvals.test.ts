import { describe, expect, it, vi } from "vitest";

import { createChatPostHandler } from "@/app/api/chat/route";
import {
  retrieveRecruiterKnowledge,
  type KnowledgeRetrievalResult,
} from "@/lib/ai/knowledgeRetriever";
import { buildRecruiterPrompt } from "@/lib/ai/promptBuilder";
import { selectRecruiterPromptHistory } from "@/lib/ai/recruiterPromptHistory";
import { MAX_JOB_DESCRIPTION_LENGTH } from "@/lib/ai/validation";
import type { RecruiterMessage } from "@/types/chat";

const roleA = `We're hiring a Junior Full Stack Engineer for a new product division focused on workforce education and certification. The engineer will join a greenfield team and help build a modern Python and React platform for regulated industries. This role involves collaborating closely with product, design and experienced engineers, developing accessible user interfaces, integrating APIs, reviewing code and maintaining automated tests. The successful candidate should be comfortable learning quickly, communicating clearly, using Git in a team environment and contributing to reliable delivery practices. Experience with TypeScript, React, Python, REST APIs, relational databases, Docker and CI/CD is preferred, together with an interest in contemporary AI capabilities and secure engineering practices.`;

const roleB = `Full Stack Engineer

Responsibilities:
- Develop APIs and web applications
- Maintain production services

Requirements:
- Next.js and PostgreSQL
- Docker and CI/CD`;

function promptFor(history: RecruiterMessage[]) {
  const retrieval = retrieveRecruiterKnowledge("en", history);
  return buildRecruiterPrompt({
    locale: "en",
    history: selectRecruiterPromptHistory(history),
    evidence: retrieval.entries,
    queryKind: retrieval.queryKind,
    allowDirectContact: retrieval.allowDirectContact,
  });
}

function roleAtLength(length: number): string {
  const base = `Senior Software Engineer

Responsibilities:
- Build and maintain web applications.
- Collaborate with engineering and product teams.

Requirements:
- React, TypeScript and automated testing.
- Docker, CI/CD and clear communication.

Additional role details: `;
  const detail = "React TypeScript testing delivery collaboration Docker. ";
  return `${base}${detail.repeat(Math.ceil(length / detail.length))}`.slice(
    0,
    length,
  );
}

function request(content: string) {
  return new Request("https://portfolio.test/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locale: "en",
      messages: [{ role: "user", content }],
    }),
  });
}

describe("recruiter context regression evaluations", () => {
  it("makes a fresh role prompt independent of long visible history", () => {
    const visibleHistory: RecruiterMessage[] = [
      { role: "assistant", content: "Browser greeting" },
      { role: "user", content: "Does Marc know Docker?" },
      { role: "assistant", content: "Earlier Docker answer" },
      { role: "user", content: "What testing experience does he have?" },
      { role: "assistant", content: "Earlier testing answer" },
      { role: "user", content: roleA },
    ];

    expect(promptFor(visibleHistory)).toEqual(
      promptFor([{ role: "user", content: roleA }]),
    );
  });

  it("keeps the latest role anchor for a follow-up", () => {
    const selected = selectRecruiterPromptHistory([
      { role: "user", content: roleA },
      { role: "assistant", content: "Role comparison" },
      { role: "user", content: "What are his weakest points for this role?" },
    ]);

    expect(selected.map((message) => message.content)).toEqual([
      roleA,
      "Role comparison",
      "What are his weakest points for this role?",
    ]);
  });

  it("replaces the first role when a second job description is pasted", () => {
    const selected = selectRecruiterPromptHistory([
      { role: "user", content: roleA },
      { role: "assistant", content: "First comparison" },
      { role: "user", content: "What about the testing requirement?" },
      { role: "assistant", content: "First follow-up" },
      { role: "user", content: roleB },
    ]);

    expect(selected).toEqual([{ role: "user", content: roleB }]);
  });

  it("rejects an overlong role without retrieval or model invocation", async () => {
    const providerFactory = vi.fn();
    const retrieveKnowledge =
      vi.fn<
        (
          locale: "en" | "es",
          messages: RecruiterMessage[],
        ) => KnowledgeRetrievalResult
      >();
    const post = createChatPostHandler({
      providerFactory,
      retrieveKnowledge,
      rateLimiter: { check: () => ({ allowed: true }) },
      clientIdentifier: () => "eval-client",
      originAllowed: () => true,
    });

    const response = await post(
      request(roleAtLength(MAX_JOB_DESCRIPTION_LENGTH + 1)),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "job_description_too_long",
    });
    expect(retrieveKnowledge).not.toHaveBeenCalled();
    expect(providerFactory).not.toHaveBeenCalled();
  });
});

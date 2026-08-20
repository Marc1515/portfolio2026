import { describe, expect, it } from "vitest";

import { recruiterKnowledgeEntries } from "@/data/recruiterKnowledge";
import { buildRecruiterPrompt } from "@/lib/ai/promptBuilder";
import {
  isRecruiterJobDescription,
  MAX_NORMAL_PROMPT_TURNS,
  selectRecruiterPromptHistory,
} from "@/lib/ai/recruiterPromptHistory";
import type { RecruiterMessage } from "@/types/chat";

const jobDescriptionA = `Senior Frontend Developer

Responsibilities:
- Build accessible web applications
- Collaborate with product and backend teams

Requirements:
- React and TypeScript
- Automated testing experience`;

const jobDescriptionB = `Full Stack Engineer

Responsibilities:
- Develop APIs and modern user interfaces
- Maintain production applications

Requirements:
- Next.js and PostgreSQL
- Docker and CI/CD`;

const proseJobDescription = `We're hiring a Junior Full Stack Engineer for a new product division focused on workforce education and certification. The engineer will join a greenfield team and help build a modern Python and React platform for regulated industries. This role involves collaborating closely with product, design and experienced engineers, developing accessible user interfaces, integrating APIs, reviewing code and maintaining automated tests. The successful candidate should be comfortable learning quickly, communicating clearly, using Git in a team environment and contributing to reliable delivery practices. Experience with TypeScript, React, Python, REST APIs, relational databases, Docker and CI/CD is preferred, together with an interest in contemporary AI capabilities and secure engineering practices.`;

function turn(question: string, answer: string): RecruiterMessage[] {
  return [
    { role: "user", content: question },
    { role: "assistant", content: answer },
  ];
}

describe("selectRecruiterPromptHistory", () => {
  it("recognizes a realistic prose role description as a reset anchor", () => {
    expect(proseJobDescription.length).toBeGreaterThanOrEqual(600);
    expect(isRecruiterJobDescription(proseJobDescription)).toBe(true);
    expect(
      selectRecruiterPromptHistory([
        ...turn("Does Marc know Docker?", "Earlier answer"),
        { role: "user", content: proseJobDescription },
      ]),
    ).toEqual([{ role: "user", content: proseJobDescription }]);
  });

  it("resets a new job description and produces the same prompt as a clean conversation", () => {
    const visibleHistory: RecruiterMessage[] = [
      {
        role: "assistant",
        content: "UI greeting that must stay in the browser",
      },
      ...turn("Does Marc know Docker?", "Old Docker answer"),
      ...turn("What testing experience does Marc have?", "Old testing answer"),
      { role: "user", content: jobDescriptionA },
    ];
    const cleanHistory: RecruiterMessage[] = [
      { role: "user", content: jobDescriptionA },
    ];
    const evidence = recruiterKnowledgeEntries.filter((entry) =>
      ["summary-profile", "experience-delinternet"].includes(entry.id),
    );

    const selectedVisible = selectRecruiterPromptHistory(visibleHistory);
    const selectedClean = selectRecruiterPromptHistory(cleanHistory);
    const promptFromVisibleHistory = buildRecruiterPrompt({
      locale: "en",
      history: selectedVisible,
      evidence,
      queryKind: "role_comparison",
      allowDirectContact: false,
    });
    const cleanPrompt = buildRecruiterPrompt({
      locale: "en",
      history: selectedClean,
      evidence,
      queryKind: "role_comparison",
      allowDirectContact: false,
    });

    expect(selectedVisible).toEqual([
      { role: "user", content: jobDescriptionA },
    ]);
    expect(promptFromVisibleHistory).toEqual(cleanPrompt);
    expect(promptFromVisibleHistory.at(-1)?.content).toBe(jobDescriptionA);
    expect(promptFromVisibleHistory[0]?.content).toContain(
      "SELECTED VERIFIED PORTFOLIO EVIDENCE",
    );
    expect(JSON.stringify(promptFromVisibleHistory)).not.toContain(
      "UI greeting",
    );
    expect(JSON.stringify(promptFromVisibleHistory)).not.toContain(
      "Does Marc know Docker?",
    );
    expect(JSON.stringify(promptFromVisibleHistory)).not.toContain(
      "Old testing answer",
    );
  });

  it("lets a second job description replace the first role context", () => {
    const selected = selectRecruiterPromptHistory([
      { role: "user", content: jobDescriptionA },
      { role: "assistant", content: "Comparison for role A" },
      { role: "user", content: "What are his weakest points for this role?" },
      { role: "assistant", content: "Role A follow-up" },
      { role: "user", content: jobDescriptionB },
    ]);

    expect(selected).toEqual([{ role: "user", content: jobDescriptionB }]);
    expect(JSON.stringify(selected)).not.toContain(jobDescriptionA);
    expect(JSON.stringify(selected)).not.toContain("Role A");
  });

  it("keeps the latest job anchor for role-dependent follow-ups and excludes earlier conversation", () => {
    const selected = selectRecruiterPromptHistory([
      ...turn("Does Marc know Docker?", "Earlier unrelated answer"),
      { role: "user", content: jobDescriptionA },
      { role: "assistant", content: "Initial role comparison" },
      { role: "user", content: "What are his weakest points for this role?" },
    ]);

    expect(selected.map((message) => message.content)).toEqual([
      jobDescriptionA,
      "Initial role comparison",
      "What are his weakest points for this role?",
    ]);
    expect(JSON.stringify(selected)).not.toContain("Earlier unrelated answer");
  });

  it("keeps the role anchor and only the latest completed role turn for a Python follow-up", () => {
    const selected = selectRecruiterPromptHistory([
      { role: "user", content: jobDescriptionA },
      { role: "assistant", content: "Initial role comparison" },
      { role: "user", content: "What are his weakest points for this role?" },
      { role: "assistant", content: "Most recent role answer" },
      { role: "user", content: "And what about the Python requirement?" },
    ]);

    expect(selected.map((message) => message.content)).toEqual([
      jobDescriptionA,
      "What are his weakest points for this role?",
      "Most recent role answer",
      "And what about the Python requirement?",
    ]);
    expect(JSON.stringify(selected)).not.toContain("Initial role comparison");
  });

  it("bounds normal questions to two completed turns and never includes the greeting", () => {
    const selected = selectRecruiterPromptHistory([
      { role: "assistant", content: "Browser-only greeting" },
      ...turn("Question one about Marc", "Answer one"),
      ...turn("Question two about Marc", "Answer two"),
      ...turn("Question three about Marc", "Answer three"),
      ...turn("Question four about Marc", "Answer four"),
      { role: "user", content: "What languages does Marc speak?" },
    ]);

    expect(selected).toHaveLength(MAX_NORMAL_PROMPT_TURNS * 2 + 1);
    expect(selected.map((message) => message.content)).toEqual([
      "Question three about Marc",
      "Answer three",
      "Question four about Marc",
      "Answer four",
      "What languages does Marc speak?",
    ]);
    expect(JSON.stringify(selected)).not.toContain("Browser-only greeting");
    expect(JSON.stringify(selected)).not.toContain("Question one");
    expect(JSON.stringify(selected)).not.toContain("Question two");
  });

  it("does not carry an older job description into a standalone question", () => {
    const selected = selectRecruiterPromptHistory([
      { role: "user", content: jobDescriptionA },
      { role: "assistant", content: "Role comparison" },
      ...turn("Does Marc know Docker?", "Docker answer"),
      { role: "user", content: "What languages does Marc speak?" },
    ]);

    expect(selected.map((message) => message.content)).toEqual([
      "Does Marc know Docker?",
      "Docker answer",
      "What languages does Marc speak?",
    ]);
    expect(JSON.stringify(selected)).not.toContain(jobDescriptionA);
  });
});

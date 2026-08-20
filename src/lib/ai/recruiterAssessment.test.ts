import { describe, expect, it } from "vitest";

import { detectRecruiterAssessmentMode } from "@/lib/ai/recruiterAssessment";

describe("detectRecruiterAssessmentMode", () => {
  it.each([
    "What are his weakest points?",
    "What are his weaknesses for this role?",
    "What are his gaps?",
    "What are the main concerns?",
    "What is missing from his profile?",
    "What could be a blocker?",
    "What would concern you as a recruiter?",
    "What requirements does he not meet?",
    "Why might Marc not be suitable?",
    "What should concern me as a recruiter?",
    "¿Cuáles son sus puntos débiles para esta oferta?",
    "¿Qué carencias tiene?",
    "¿Qué requisitos no cumple?",
    "¿Qué debería preocuparme como recruiter?",
  ])("detects gap analysis for: %s", (question) => {
    expect(detectRecruiterAssessmentMode(question)).toBe("gap_analysis");
  });

  it.each([
    "Does Marc know AWS?",
    "What testing experience does Marc have?",
    "Compare Marc with this role.",
    "What are Marc's strongest points?",
    "¿Qué experiencia tiene Marc con Docker?",
  ])("keeps standard assessment for: %s", (question) => {
    expect(detectRecruiterAssessmentMode(question)).toBe("standard");
  });
});

import { describe, expect, it } from "vitest";

import { trustedEvidenceSourceDefinitions } from "@/data/chatEvidenceSources";

describe("trusted evidence source links", () => {
  it.each([
    [
      "repository-ai-code-review-trainer",
      "https://github.com/Marc1515/ai-code-review-trainer",
    ],
    ["live-ai-code-review-trainer", "https://trainer.marcespana.com/"],
    [
      "repository-reservation-management",
      "https://github.com/Marc1515/casetamartiicarmeta",
    ],
    ["live-reservation-management", "https://casetamartiicarmeta.com"],
    ["repository-delta-routes", "https://github.com/Marc1515/deltaroutes"],
    ["live-delta-routes", "https://deltaroutes.marcespana.com/"],
    [
      "contact-linkedin",
      "https://www.linkedin.com/in/marc-espa%C3%B1a-833924141/",
    ],
    ["contact-github", "https://github.com/Marc1515"],
    ["public-cv", "/Marc_Espana_CV_Full_Stack.pdf"],
    ["contact-whatsapp", "https://wa.me/353870041006"],
  ])("keeps %s on its reviewed static URL", (id, href) => {
    expect(
      trustedEvidenceSourceDefinitions.find((source) => source.id === id)?.href,
    ).toBe(href);
  });
});

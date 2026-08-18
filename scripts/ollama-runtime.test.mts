import { describe, expect, it } from "vitest";

import {
  DEFAULT_OLLAMA_KEEP_ALIVE,
  normalizeOllamaKeepAlive,
} from "./ollama-runtime.mjs";

describe("normalizeOllamaKeepAlive", () => {
  it.each([
    [undefined, "-1m"],
    ["2m", "2m"],
    ["10m", "10m"],
    ["24h", "24h"],
    ["-1m", "-1m"],
    ["-1", "-1m"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeOllamaKeepAlive(input)).toBe(expected);
  });

  it("uses the persistent default", () => {
    expect(DEFAULT_OLLAMA_KEEP_ALIVE).toBe("-1m");
  });

  it.each(["2m\n", `2m${String.fromCharCode(0)}`, "x".repeat(33), "forever"])(
    "rejects invalid or unsafe value %j",
    (input) => {
      expect(normalizeOllamaKeepAlive(input)).toBeNull();
    },
  );
});

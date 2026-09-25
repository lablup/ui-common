/**
 * Limits the Astryx CLI enforces on an integration's agent-doc lines, checked
 * here because the CLI drops an over-long manifest with only a warning.
 */
import { describe, expect, it } from "vitest";

import manifest from "../astryx.integration.mjs";

const lines: readonly string[] = manifest.agentDocs?.append ?? [];

describe("astryx.integration.mjs", () => {
  it("stays within the CLI's agent-doc limits", () => {
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(8);
    for (const line of lines) {
      expect([...line].length, line).toBeLessThanOrEqual(240);
    }
  });

  it("tells agents to use Modal, not Dialog", () => {
    expect(lines.some((line) => line.includes("Modal, not Dialog"))).toBe(true);
  });
});

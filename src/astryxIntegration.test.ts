/**
 * Limits the Astryx CLI enforces on an integration's agent-doc lines, checked
 * here because the CLI drops an over-long manifest with only a warning.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "../astryx.integration.mjs";

const ROOT = join(__dirname, "..");

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

  it("pairs every component doc with a stub naming a real export", async () => {
    expect(manifest.components).toBe("./astryx/components");
    const dir = join(ROOT, "astryx", "components");
    const docs = readdirSync(dir).filter((f) => f.endsWith(".doc.mjs"));
    expect(docs.length).toBeGreaterThan(0);
    const customs = JSON.parse(
      readFileSync(join(ROOT, "exports.customs.json"), "utf8"),
    ) as Array<{ name: string; legacy?: unknown }>;
    for (const file of docs) {
      const name = file.replace(/\.doc\.mjs$/, "");
      const doc = (
        (await import(join(dir, file))) as { default: { name: string; import: string } }
      ).default;
      expect(doc.name).toBe(name);
      expect(
        customs.some((c) => c.name === name && !c.legacy),
        name,
      ).toBe(true);
      const stub = readFileSync(join(dir, `${name}.tsx`), "utf8");
      expect(stub).toContain(`export { ${name} } from "${doc.import}";`);
    }
  });
});

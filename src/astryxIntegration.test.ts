/**
 * Limits the Astryx CLI enforces on an integration's agent-doc lines, checked
 * here because the CLI drops an over-long manifest with only a warning.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "../astryx.integration.mjs";
import { wrapperDocFiles } from "../scripts/gen-wrapper-docs.mjs";

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
    ) as Array<{ name: string; source: string; legacy?: unknown; wraps?: string }>;
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

  it("documents every non-legacy PascalCase custom, bar the allow-listed", () => {
    const customs = JSON.parse(
      readFileSync(join(ROOT, "exports.customs.json"), "utf8"),
    ) as Array<{ name: string; source: string; legacy?: unknown; wraps?: string }>;
    const documented = new Set(
      readdirSync(join(ROOT, "astryx", "components"))
        .filter((f) => f.endsWith(".doc.mjs"))
        .map((f) => f.replace(/\.doc\.mjs$/, "")),
    );
    // ComplexSelector and Drawer (core's since Astryx 0.7.2) share their names
    // with Astryx core components. A doc of that name makes `astryx component
    // ComplexSelector` fail as provided by multiple packages (and warns in
    // `doctor integration components`) unless the doc sets `replaces`.
    // Astryx's own doc already describes the same API, as it does for a
    // same-API wrapper (Popover). The Form.Item wrappers change the API, so
    // their docs set `replaces` (scripts/gen-wrapper-docs.mjs).
    const undocumented = new Set(["ComplexSelector", "Drawer"]);
    const sameApiWrapper = (c: { source: string; wraps?: string }) =>
      c.wraps !== undefined && !c.source.startsWith("formControls/");
    const missing = customs
      .filter((c) => !c.legacy && !sameApiWrapper(c) && /^[A-Z]/.test(c.name))
      .map((c) => c.name)
      .filter((name) => !documented.has(name) && !undocumented.has(name));
    expect(missing).toEqual([]);
    for (const name of undocumented) {
      expect(documented.has(name), `${name} is allow-listed but documented`).toBe(
        false,
      );
    }
  });

  it("has the Form.Item wrappers' docs that gen-wrapper-docs writes", async () => {
    const files = await wrapperDocFiles();
    for (const [path, text] of Object.entries(files)) {
      expect(
        readFileSync(join(ROOT, path), "utf8"),
        `${path} is stale: run node scripts/gen-wrapper-docs.mjs`,
      ).toBe(text);
    }
  });
});

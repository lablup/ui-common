/**
 * Drift guard for the Astryx forks (CONTRIBUTING, "Forks of Astryx
 * components").
 *
 * Each fork is Astryx source with a fix applied, and renders with the class
 * names Astryx compiled for the version it was taken from. Both only hold
 * while that exact version is installed, so an Astryx bump fails here until
 * someone re-syncs each fork with the new upstream source (or deletes it,
 * once upstream carries the fix) and records the result:
 *
 *   node scripts/sync-forks.mjs --accept
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import {
  currentState,
  extractConst,
  readProvenance,
} from "../../scripts/sync-forks.mjs";

const ROOT = join(__dirname, "..", "..");
const provenance = readProvenance();
let state: Awaited<ReturnType<typeof currentState>>;

beforeAll(async () => {
  state = await currentState();
});

const RESYNC =
  "Astryx moved under a fork. Re-apply the fork's fix to the new upstream source " +
  "(or delete the fork if upstream has it), then run `node scripts/sync-forks.mjs --accept`.";

describe.each(Object.entries(provenance))("fork %s", (fork, entry) => {
  it(`was taken from the installed ${entry.package}`, () => {
    expect(state[fork]?.version, RESYNC).toBe(entry.version);
  });

  it("was taken from upstream files that have not changed", () => {
    expect(state[fork]?.files, RESYNC).toEqual(entry.files);
  });

  it("reuses the compiled styles of that version", () => {
    if (!entry.styles) return;
    const committed = readFileSync(join(ROOT, entry.styles.file), "utf8");
    expect(committed, "run `node scripts/sync-forks.mjs`").toBe(state[fork]?.styles);
  });
});

describe("fork bookkeeping", () => {
  it("records every fork exports.customs.json declares, and nothing else", () => {
    const customs = JSON.parse(
      readFileSync(join(ROOT, "exports.customs.json"), "utf8"),
    ) as Array<{ name: string; fork?: string }>;
    const forks = customs.filter((c) => c.fork !== undefined);
    expect(forks.map((c) => c.name).sort()).toEqual(Object.keys(provenance).sort());
    for (const c of forks) {
      expect(c.fork?.startsWith(provenance[c.name]!.package)).toBe(true);
    }
  });

  it("extracts a compiled constant, braces inside strings included", () => {
    const source =
      'const other = 1;\nexport const styles = {\n  a: { k: "x}{", $$css: true }\n};\n';
    expect(extractConst(source, "styles")).toBe('{\n  a: { k: "x}{", $$css: true }\n}');
    expect(() => extractConst(source, "missing")).toThrow(/no top-level const/);
  });
});

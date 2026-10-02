/**
 * The React peer floor covers every React API the source calls.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { globSync } from "tinyglobby";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  peerDependencies: Record<string, string>;
};

/** React APIs newer than 19.0, and the release that made them stable. */
const SINCE: Record<string, [number, number]> = {
  useEffectEvent: [19, 2],
  Activity: [19, 2],
};

/** The lowest version a `^x.y.z` / `>=x.y.z` range admits. */
function floor(range: string): [number, number] {
  const match = /^(?:\^|>=)?\s*(\d+)\.(\d+)/.exec(range.trim());
  if (!match) throw new Error(`unsupported range "${range}"`);
  return [Number(match[1]), Number(match[2])];
}

const atLeast = (a: [number, number], b: [number, number]) =>
  a[0] > b[0] || (a[0] === b[0] && a[1] >= b[1]);

const sources = globSync(["src/**/*.{ts,tsx}"], {
  cwd: root,
  ignore: ["**/*.test.*", "src/astryx/**", "src/test/**"],
});

describe("react and react-dom peers", () => {
  for (const [api, since] of Object.entries(SINCE)) {
    const imported = new RegExp(
      `import\\s*(?:type\\s*)?\\{[^}]*\\b${api}\\b[^}]*\\}\\s*from\\s*["']react["']|\\bReact\\.${api}\\b`,
    );
    const users = sources.filter((file) =>
      imported.test(readFileSync(join(root, file), "utf8")),
    );
    if (users.length === 0) continue;
    it(`admit no React without ${api} (${since.join(".")}), which ${users.length} module(s) use`, () => {
      for (const name of ["react", "react-dom"]) {
        expect(
          atLeast(floor(pkg.peerDependencies[name]), since),
          `${name} ${pkg.peerDependencies[name]}; used by ${users.join(", ")}`,
        ).toBe(true);
      }
    });
  }
});

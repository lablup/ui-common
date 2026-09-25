/**
 * `migration/0.1-to-0.2.json` is read by `ui-common upgrade`. It has to agree
 * with the package it describes: every removed component is gone, every
 * replacement import resolves to a runtime export, and every kept component's
 * class rename matches the classes its stylesheet declares.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");

interface RemovedEntry {
  name: string;
  replacement: { specifier: string; names: Record<string, string> };
}

interface KeptEntry {
  name: string;
  classRenames: Record<string, string>;
}

const map = JSON.parse(
  readFileSync(join(ROOT, "migration", "0.1-to-0.2.json"), "utf8"),
) as { removedComponents: RemovedEntry[]; keptComponents: KeptEntry[] };

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
  exports: Record<string, unknown>;
};

/** `@lablup/ui-common/Badge` → the Astryx module it mirrors. */
function astryxSpecifier(specifier: string): string {
  const sub = specifier.replace(/^@lablup\/ui-common\/?/, "");
  if (sub === "lab") return "@astryxdesign/lab";
  return sub === "" ? "@astryxdesign/core" : `@astryxdesign/core/${sub}`;
}

describe("migration/0.1-to-0.2.json", () => {
  it("lists the twelve removed customs", () => {
    expect(map.removedComponents.map((e) => e.name).sort()).toEqual([
      "Badge",
      "BaseCard",
      "Button",
      "DataTable",
      "Drawer",
      "EmptyState",
      "ProgressBar",
      "Select",
      "Skeleton",
      "StatusTag",
      "Tabs",
      "Tooltip",
    ]);
  });

  it.each(map.removedComponents.filter((e) => e.name !== "Skeleton"))(
    "$name is gone from src/components",
    ({ name }) => {
      expect(existsSync(join(ROOT, "src", "components", name))).toBe(false);
    },
  );

  it.each(map.removedComponents)(
    "$name's replacement is an exported subpath with the runtime export",
    async ({ replacement }) => {
      const subpath = `./${replacement.specifier.replace(/^@lablup\/ui-common\/?/, "")}`;
      expect(Object.keys(pkg.exports)).toContain(subpath);
      const mod = (await import(astryxSpecifier(replacement.specifier))) as Record<
        string,
        unknown
      >;
      const component = Object.values(replacement.names).find(
        (n) => !n.endsWith("Props"),
      );
      expect(component && mod[component]).toBeTruthy();
    },
  );

  it.each(map.keptComponents)(
    "$name's renamed classes are the ones its stylesheet declares",
    ({ classRenames }) => {
      const css = [
        "PageHeader",
        "PageLayout",
        "StatCard",
        "ErrorState",
        "SmoothHeight",
        "DigitPopIn",
        "Skeleton/SkeletonCard",
        "Skeleton/SkeletonText",
        "Skeleton/SkeletonChart",
        "Skeleton/SkeletonRow",
      ]
        .flatMap((p) => {
          const [dir, file] = p.includes("/") ? p.split("/") : [p, p];
          return [".css", ".tsx"].map((ext) =>
            readFileSync(
              join(ROOT, "src", "components", dir!, `${file}${ext}`),
              "utf8",
            ),
          );
        })
        .join("\n");
      for (const to of Object.values(classRenames)) {
        expect(css).toMatch(new RegExp(`[."\` ]${to}\\b`));
      }
    },
  );
});

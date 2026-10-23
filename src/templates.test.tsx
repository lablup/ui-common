/**
 * The page and block templates in astryx/templates, which `ui-common
 * template` copies into a consumer's project. A copy has to compile and run
 * there with nothing but ui-common's own dependencies, so this pins what each
 * one may import, that its doc is well formed, and that it renders.
 * Type-checking is `pnpm run typecheck` (tsconfig.json includes them); CI
 * also writes them into the packed fixture and type-checks them there.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ComponentType } from "react";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const DIR = join(__dirname, "..", "astryx", "templates");

/** What a copied template may import: ui-common, React and lucide icons. */
const ALLOWED_IMPORTS = new Set([
  "react",
  "@lablup/ui-common",
  "@lablup/ui-common/lab",
  "lucide-react",
]);

const ids = readdirSync(DIR)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => f.replace(/\.tsx$/, ""))
  .sort();

interface TemplateDoc {
  type: "page" | "block";
  name: string;
  description: string;
  keywords: string[];
  componentsUsed: string[];
  isReady?: boolean;
}

describe("astryx/templates", () => {
  it("ships the agreed set", () => {
    expect(ids).toEqual([
      "create-modal",
      "dashboard-board",
      "detail-drawer",
      "info-modal",
      "list-page",
      "list-toolbar",
      "settings-page",
      "tabbed-page",
    ]);
  });

  describe.each(ids)("%s", (id) => {
    const source = readFileSync(join(DIR, `${id}.tsx`), "utf8");

    it("imports only ui-common, React and lucide-react", () => {
      const specifiers = [
        ...source.matchAll(/^\s*(?:import|export)[^"']*?from\s+["']([^"']+)["']/gm),
      ].map((m) => m[1]);
      expect(specifiers.length).toBeGreaterThan(0);
      for (const specifier of specifiers) {
        expect(ALLOWED_IMPORTS.has(specifier!), specifier).toBe(true);
      }
    });

    it("has a doc that names it", async () => {
      const doc = (
        (await import(join(DIR, `${id}.doc.mjs`))) as { default: TemplateDoc }
      ).default;
      expect(doc.name).toBe(id);
      expect(["page", "block"]).toContain(doc.type);
      expect(doc.description.length).toBeGreaterThan(0);
      expect(doc.keywords.length).toBeGreaterThan(0);
      // `build` only starts a kit from a page marked ready.
      if (doc.type === "page") expect(doc.isReady).toBe(true);
      for (const name of doc.componentsUsed) {
        expect(source, `${id} lists ${name} but does not use it`).toMatch(
          new RegExp(`<${name}\\b`),
        );
      }
    });

    // The first template imported pulls in the whole root barrel cold, which
    // takes longer than the default 5s on a loaded machine or a CI runner.
    it("renders", { timeout: 30_000 }, async () => {
      const mod = (await import(join(DIR, `${id}.tsx`))) as {
        default: ComponentType;
      };
      const Template = mod.default;
      expect(() => render(<Template />)).not.toThrow();
    });
  });
});

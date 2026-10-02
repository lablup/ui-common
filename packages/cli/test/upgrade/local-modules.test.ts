/**
 * How the upgrade reads a project's own modules: import resolution
 * (relative, tsconfig `paths` and `baseUrl`), and which exports stand for a
 * 0.1 component (a re-export) or wrap one (a wrapper, reported only).
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import jscodeshift from "jscodeshift";
import { afterEach, describe, expect, it } from "vitest";

import { createResolver, parseJsonc } from "../../cli/resolve.mjs";
import { localExports, wrapperFindings } from "../../codemods/0.2/local-modules.mjs";

const temps: string[] = [];
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "uic-local-"));
  temps.push(dir);
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), text);
  }
  const resolver = createResolver(dir);
  const ctx = {
    source: (path: string) => {
      try {
        return readFileSync(path, "utf8");
      } catch {
        return null;
      }
    },
    resolveImport: resolver.resolveImport,
  };
  return { dir, ctx, resolver };
}

describe("import resolution", () => {
  it("reads tsconfig paths and baseUrl, comments and trailing commas included", () => {
    const { dir, resolver } = project({
      "tsconfig.json": `{
  // aliases
  "compilerOptions": { "baseUrl": "./src", "paths": { "@/*": ["./*"], }, },
}`,
      "src/ui/index.ts": "export {};\n",
      "src/lib/format.ts": "export {};\n",
      "src/pages/A.tsx": "",
      "src/styles/app.css": "",
    });
    const from = join(dir, "src/pages/A.tsx");
    expect(resolver.resolveImport(from, "@/ui")).toBe(join(dir, "src/ui/index.ts"));
    expect(resolver.resolveImport(from, "lib/format")).toBe(
      join(dir, "src/lib/format.ts"),
    );
    expect(resolver.resolveImport(from, "../lib/format.js")).toBe(
      join(dir, "src/lib/format.ts"),
    );
    // An alias to a stylesheet resolves to no script, and is not "unresolved".
    expect(resolver.resolveImport(from, "@/styles/app.css")).toBeNull();
    expect(resolver.resolveImport(from, "~/ui")).toBeNull();
    expect([...resolver.unresolved.keys()]).toEqual(["~/"]);
    // A probe finds the same files but records no miss.
    expect(resolver.resolveImport(from, "#/ui", { probe: true })).toBeNull();
    expect([...resolver.unresolved.keys()]).toEqual(["~/"]);
  });

  it("parses JSONC without touching strings", () => {
    expect(parseJsonc('{ "a": "http://x/*y*/", /* c */ "b": [1,], }')).toEqual({
      a: "http://x/*y*/",
      b: [1],
    });
  });
});

describe("local exports", () => {
  const j = jscodeshift.withParser("tsx");

  it("follows re-exports through barrels, export * and import-then-export", () => {
    const { dir, ctx } = project({
      "src/ui/index.ts": `export * from "./leaf";\nexport { Pill as Chip } from "./leaf";\n`,
      "src/ui/leaf.ts": `import { Badge as Pill, Tooltip } from "@lablup/ui-common";
export { Pill };
export default Tooltip;
export * from "@lablup/ui-common/components/Drawer";
`,
    });
    const entries = localExports(j, ctx, join(dir, "src/ui/index.ts"));
    expect(entries.get("Pill")).toEqual({ kind: "component", component: "Badge" });
    expect(entries.get("Chip")).toEqual({ kind: "component", component: "Badge" });
    expect(entries.get("Drawer")).toEqual({ kind: "component", component: "Drawer" });
    expect(entries.get("DrawerProps")).toMatchObject({ kind: "type", removed: false });
    // export * never re-exports a default.
    expect(entries.has("default")).toBe(false);
    expect(localExports(j, ctx, join(dir, "src/ui/leaf.ts")).get("default")).toEqual({
      kind: "component",
      component: "Tooltip",
    });
  });

  it("follows a barrel whose only re-exports go through tsconfig baseUrl", () => {
    const { dir, ctx } = project({
      "tsconfig.json": `{ "compilerOptions": { "baseUrl": "./src" } }`,
      "src/index.ts": `export * from "components/common";\n`,
      "src/components/common/index.ts": `export { Drawer as Panel } from "@lablup/ui-common";\n`,
    });
    expect(localExports(j, ctx, join(dir, "src/index.ts")).get("Panel")).toEqual({
      kind: "component",
      component: "Drawer",
    });
  });

  it("follows a barrel whose only re-exports go through an @-scoped paths alias", () => {
    const { dir, ctx } = project({
      "tsconfig.json": `{ "compilerOptions": { "paths": { "@ui/*": ["./src/ui/*"] } } }`,
      "src/index.ts": `export * from "@ui/common";\n`,
      "src/ui/common.ts": `export { Drawer } from "@lablup/ui-common";\n`,
    });
    expect(localExports(j, ctx, join(dir, "src/index.ts")).get("Drawer")).toEqual({
      kind: "component",
      component: "Drawer",
    });
  });

  it("survives an import cycle", () => {
    const { dir, ctx } = project({
      "a.ts": `export * from "./b";\nexport { Button } from "@lablup/ui-common";\n`,
      "b.ts": `export * from "./a";\n`,
    });
    expect(localExports(j, ctx, join(dir, "a.ts")).get("Button")).toEqual({
      kind: "component",
      component: "Button",
    });
  });

  it("tells a wrapper from a component that only renders one", () => {
    const { dir, ctx } = project({
      "ui.tsx": `import { Drawer as Base, DataTable } from "@lablup/ui-common";
import type { DrawerProps } from "@lablup/ui-common";
import { memo } from "react";

interface PanelProps extends Omit<DrawerProps, "title"> { heading: string }

// Typed on the 0.1 props: callers pass Drawer's props.
export function Panel({ heading, isOpen, onClose }: PanelProps) {
  return <Base isOpen={isOpen} onClose={onClose} title={heading} />;
}

// Spreads its props on: callers pass Drawer's props.
export const Sheet = (props: { size: string }) => <Base {...props} />;

function ListComponent({ ...rest }: DrawerProps) {
  return <Base {...rest} />;
}
// memo() of a component declared on its own.
export const List = memo(ListComponent);

// Its own props, its own API: not a wrapper.
export function UsersTable({ rows }: { rows: string[] }) {
  return <DataTable rows={rows} columns={[]} getRowKey={(r) => r} ariaLabel="Users" />;
}
`,
    });
    const entries = localExports(j, ctx, join(dir, "ui.tsx"));
    expect(entries.get("Panel")).toMatchObject({
      kind: "wrapper",
      components: ["Drawer"],
    });
    expect(entries.get("Sheet")).toMatchObject({
      kind: "wrapper",
      components: ["Drawer"],
    });
    expect(entries.get("List")).toMatchObject({
      kind: "wrapper",
      components: ["Drawer"],
    });
    expect(entries.has("UsersTable")).toBe(false);
    const findings = wrapperFindings(ctx, (f: string) => f.slice(dir.length + 1));
    expect(
      findings.map((f: { text: string; line: number }) => `${f.text}:${f.line}`),
    ).toEqual(["Panel:8", "Sheet:13", "List:19"]);
  });
});

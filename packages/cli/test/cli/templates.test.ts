/**
 * ui-common's templates in the CLI: the `template` command, and Astryx's
 * templates dropped from `search` and replaced in `build`. The filters run on
 * Astryx's output before it is rewritten, so their inputs here are in Astryx
 * terms (`package: @astryxdesign/core`). One live run per command pins them
 * to the Astryx CLI ui-common pins, so `sync-astryx` notices an output change.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import {
  filterBuildOutput,
  filterSearchOutput,
  loadTemplates,
  matchTemplates,
  missingDependencies,
  searchArgs,
} from "../../cli/templates.mjs";

const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const root = resolve(cliRoot, "../..");
const bin = join(cliRoot, "bin/ui-common.mjs");

const temps: string[] = [];
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});
function tempProject(dependencies: Record<string, string> = {}) {
  const dir = mkdtempSync(join(tmpdir(), "uic-template-"));
  temps.push(dir);
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ name: "consumer", private: true, dependencies })}\n`,
  );
  return dir;
}
function run(args: string[], cwd = root) {
  const result = spawnSync(process.execPath, [bin, ...args], { cwd, encoding: "utf8" });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

const templates = await loadTemplates(root);
const ids = (query: string) => matchTemplates(query, templates).map((t) => t.id);

describe("matchTemplates", () => {
  it("ranks the template a need names first", () => {
    expect(ids("list page with table, refresh and create modal")[0]).toBe(
      "create-modal",
    );
    expect(ids("settings page")).toEqual(["settings-page"]);
    expect(ids("admin dashboard")[0]).toBe("dashboard-board");
    expect(ids("user detail panel")).toEqual(["detail-drawer"]);
    expect(ids("tabs with counts")).toEqual(["tabbed-page"]);
  });

  it("does not match on a generic word alone", () => {
    expect(ids("login page")).toEqual([]);
    expect(ids("page")).toEqual([]);
  });
});

describe("missingDependencies", () => {
  it("names what a template imports beyond ui-common, with ui-common's ranges", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const project = tempProject();
    expect(
      missingDependencies('import { X } from "lucide-react";', project, root),
    ).toEqual([{ name: "lucide-react", range: pkg.dependencies["lucide-react"] }]);
    expect(
      missingDependencies(
        'import { Tour } from "@lablup/ui-common/lab";',
        project,
        root,
      ),
    ).toEqual([
      { name: "@astryxdesign/lab", range: pkg.peerDependencies["@astryxdesign/lab"] },
    ]);
    expect(
      missingDependencies(
        'import { X } from "lucide-react";',
        tempProject({ "lucide-react": "*" }),
        root,
      ),
    ).toEqual([]);
  });
});

describe("search", () => {
  it("asks Astryx for every match, keeping the limit to cut back to", () => {
    expect(searchArgs(["search", "table"])).toEqual({
      limit: 20,
      args: ["search", "table", "--limit", "1000"],
    });
    expect(searchArgs(["search", "table", "--limit", "5", "--json"])).toEqual({
      limit: 5,
      args: ["search", "table", "--json", "--limit", "1000"],
    });
    // An invalid limit goes to Astryx as given, for it to refuse.
    expect(searchArgs(["search", "x", "--limit=0"]).args).toEqual([
      "search",
      "x",
      "--limit=0",
    ]);
  });

  const record = (name: string, domain: string, pkg: string) =>
    `name:        ${name}\ndomain:      ${domain}\npackage:     ${pkg}\ndescription: ${name}.`;

  it("drops Astryx's templates from text and recounts", () => {
    const stdout = [
      'Results for "table" (4 of 10)',
      record("Table", "component", "@astryxdesign/core"),
      record("table-page", "template", "@astryxdesign/core"),
      record("list-page", "template", "@lablup/ui-common"),
      record("DataGrid", "component", "@lablup/ui-common"),
      "Next step: something.\n",
    ].join("\n\n");
    const out = filterSearchOutput(stdout, { json: false, limit: 2 });
    expect(out).toContain('Results for "table" (2 of 9)');
    expect(out).toContain("name:        Table");
    expect(out).toContain("name:        list-page");
    expect(out).not.toContain("table-page");
    expect(out).not.toContain("DataGrid");
    expect(out).toContain("Next step: something.");
  });

  it("drops Astryx's templates from JSON and recounts", () => {
    const stdout = JSON.stringify({
      apiVersion: 1,
      type: "search",
      data: {
        query: "table",
        matchCount: 3,
        results: [
          { domain: "component", name: "Table", package: "@astryxdesign/core" },
          { domain: "template", name: "table-page", package: "@astryxdesign/core" },
          { domain: "template", name: "list-page", package: "@lablup/ui-common" },
        ],
      },
    });
    const out = JSON.parse(filterSearchOutput(stdout, { json: true, limit: 20 }));
    expect(out.data.matchCount).toBe(2);
    expect(out.data.results.map((r: { name: string }) => r.name)).toEqual([
      "Table",
      "list-page",
    ]);
  });
});

describe("build", () => {
  const astryxKit = [
    'Build kit for "list page"',
    "",
    "Start from the TEMPLATE, fill it with BLOCKS, and use COMPONENTS only for what is left.",
    "",
    "TEMPLATE",
    "`table` matches but is not ready yet.",
    "",
    "name:        table-page",
    "package:     @astryxdesign/core",
    "",
    "Install missing dependencies: npm install @heroicons/react",
    "",
    "OTHER TEMPLATES",
    "",
    "name:        table-tree",
    "package:     @astryxdesign/core",
    "",
    "BLOCKS",
    "",
    "name:        BannerCollapsibleContent",
    "package:     @astryxdesign/core",
    "",
    "COMPONENTS",
    "",
    "name:        DataGrid",
    "package:     @lablup/ui-common",
    "",
    "frame:      AppShell",
    "",
  ].join("\n");

  it("replaces the kit's template sections with ui-common's", () => {
    const out = filterBuildOutput(astryxKit, {
      json: false,
      query: "list page with create modal",
      templates,
      invocation: "pnpm exec ui-common",
    });
    expect(out).not.toMatch(
      /@astryxdesign\/core|heroicons|table-page|table-tree|Banner/,
    );
    expect(out).toMatch(/TEMPLATE\n.*\n\nname: +list-page\n/);
    expect(out).toContain("command:     pnpm exec ui-common template list-page <path>");
    expect(out).toContain("name:        create-modal");
    // Everything outside the template sections stays.
    expect(out).toContain('Build kit for "list page"');
    expect(out).toContain("COMPONENTS\n\nname:        DataGrid");
    expect(out).toContain("frame:      AppShell");
  });

  it("says so when no ui-common page matches", () => {
    const out = filterBuildOutput(astryxKit, {
      json: false,
      query: "login page",
      templates,
      invocation: "npx ui-common",
    });
    expect(out).toContain("No ui-common page template matches.");
    expect(out).not.toContain("table-page");
  });

  it("replaces start, pages and blocks in JSON", () => {
    const stdout = JSON.stringify({
      apiVersion: 1,
      type: "build",
      data: {
        query: "list page",
        hasResults: true,
        start: { name: "table-page", package: "@astryxdesign/core", alternatives: [] },
        pages: [{ domain: "template", name: "table", package: "@astryxdesign/core" }],
        blocks: [{ domain: "template", name: "Banner", package: "@astryxdesign/core" }],
        domain: [
          { domain: "component", name: "DataGrid", package: "@lablup/ui-common" },
        ],
      },
    });
    const { data } = JSON.parse(
      filterBuildOutput(stdout, {
        json: true,
        query: "list page with create modal",
        templates,
        invocation: "npx ui-common",
      }),
    );
    expect(data.start.name).toBe("list-page");
    expect(data.start.package).toBe("@lablup/ui-common");
    expect(data.pages.map((p: { name: string }) => p.name)).toContain("list-page");
    expect(data.blocks.map((b: { name: string }) => b.name)).toContain("create-modal");
    expect(data.domain).toEqual([
      { domain: "component", name: "DataGrid", package: "@lablup/ui-common" },
    ]);
  });
});

describe("the template command", { timeout: 60_000 }, () => {
  it("lists ui-common's templates only", () => {
    const { code, stdout } = run(["template"]);
    expect(code).toBe(0);
    for (const t of templates) expect(stdout).toContain(t.id);
    expect(stdout).not.toContain("table-page");
    const json = JSON.parse(
      run(["template", "--list", "--type", "block", "--json"]).stdout,
    );
    expect(json.data.templates.every((t: { type: string }) => t.type === "block")).toBe(
      true,
    );
  });

  it("refuses an Astryx template and Astryx's selectors", () => {
    const astryx = run(["template", "table-page"]);
    expect(astryx.code).toBe(1);
    expect(astryx.stderr).toContain('"table-page" is not a ui-common template');
    expect(run(["template", "--package", "@astryxdesign/core"]).code).toBe(2);
    expect(run(["template", "--cdn"]).code).toBe(2);
  });

  it("prints a template's source", () => {
    const { code, stdout } = run(["template", "info-modal"]);
    expect(code).toBe(0);
    expect(stdout).toBe(
      readFileSync(join(root, "astryx/templates/info-modal.tsx"), "utf8"),
    );
  });

  it("writes a page as page.tsx and a block under its name, and names missing packages", () => {
    const project = tempProject();
    const page = run(["template", "list-page", "src/items"], project);
    expect(page.code).toBe(0);
    expect(existsSync(join(project, "src/items/page.tsx"))).toBe(true);
    expect(page.stdout).toContain(
      "Install missing dependencies: npm install lucide-react@",
    );

    const block = run(["template", "detail-drawer", "src/items"], project);
    expect(block.code).toBe(0);
    expect(existsSync(join(project, "src/items/detail-drawer.tsx"))).toBe(true);
    // The Drawer is core's since Astryx 0.7.2: the block needs no lab peer.
    expect(block.stdout).not.toContain("@astryxdesign/lab@");

    const again = run(["template", "list-page", "src/items"], project);
    expect(again.code).toBe(1);
    expect(again.stderr).toContain("--overwrite");
    expect(
      run(["template", "list-page", "src/items", "--overwrite"], project).code,
    ).toBe(0);

    expect(run(["template", "list-page", "../outside"], project).code).toBe(1);
  });
});

describe("live runs against the pinned Astryx CLI", { timeout: 120_000 }, () => {
  it("search shows no Astryx template", () => {
    const { code, stdout } = run(["search", "table", "--type", "template", "--json"]);
    expect(code).toBe(0);
    const results: { package: string }[] = JSON.parse(stdout).data.results;
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.package === "@lablup/ui-common")).toBe(true);
  });

  it("search text keeps its records and drops Astryx's templates", () => {
    const { code, stdout } = run(["search", "table", "--limit", "40"]);
    expect(code).toBe(0);
    expect(stdout).toMatch(/^Results for "table" \(40 of \d+\)$/m);
    expect(stdout.match(/^name:/gm)).toHaveLength(40);
    expect(stdout).toContain("name:        list-page");
    expect(stdout).not.toContain("table-page");
  });

  it("build starts from a ui-common template", () => {
    const text = run(["build", "list page with table, refresh and create modal"]);
    expect(text.code).toBe(0);
    expect(text.stdout).toContain("name:        list-page");
    expect(text.stdout).not.toMatch(/heroicons|@astryxdesign\/core\b/);
    const json = JSON.parse(run(["build", "list page", "--json"]).stdout);
    expect(json.data.start.name).toBe("list-page");
    for (const item of [...json.data.pages, ...json.data.blocks]) {
      expect(item.package).toBe("@lablup/ui-common");
    }
  });
});

/**
 * `ui-common doctor` against small projects built in a temp dir, with a fake
 * install (package.json files under node_modules) and hand-written lockfiles:
 * a healthy app passes every check, and each check fails on the breakage it
 * exists for.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { LAYER_ORDER } from "../../cli/agents.mjs";
import { checkNode, gatherProject, readCopy, runDoctor } from "../../cli/doctor.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const bin = resolve(here, "../../bin/ui-common.mjs");
const V = "0.2.0";
const CORE = "0.6.2";
const LAB = "0.6.2-canary.c9fb1ad";
const BLOCK = "<!-- UI-COMMON:START -->\nblock\n<!-- UI-COMMON:END -->";

const temps: string[] = [];
afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function write(dir: string, file: string, content: string | object) {
  const full = join(dir, file);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(
    full,
    typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`,
  );
}

function installed(dir: string, name: string, pkg: object = {}) {
  write(dir, `node_modules/${name}/package.json`, { name, main: "index.js", ...pkg });
  write(dir, `node_modules/${name}/index.js`, "export {};\n");
}

const lockfile = (extra = "") => `lockfileVersion: '9.0'

importers:

  .:
    dependencies:
      '@lablup/ui-common':
        specifier: ${V}
        version: ${V}

packages:

  '@astryxdesign/core@${CORE}':
    resolution: {integrity: sha512-a}

  '@astryxdesign/lab@${LAB}':
    resolution: {integrity: sha512-b}

  '@lablup/ui-common@${V}':
    resolution: {integrity: sha512-c}

snapshots:

  '@astryxdesign/core@${CORE}(react@19.2.8)':
    dependencies: {}

  '@astryxdesign/lab@${LAB}(@astryxdesign/core@${CORE}(react@19.2.8))(react@19.2.8)':
    dependencies: {}
${extra}`;

/** A pnpm app that does everything right. */
function healthyApp() {
  const dir = mkdtempSync(join(tmpdir(), "uic-doctor-"));
  temps.push(dir);
  write(dir, "package.json", {
    name: "healthy",
    private: true,
    dependencies: {
      "@lablup/ui-common": V,
      "@astryxdesign/lab": LAB,
      "@stylexjs/stylex": "0.19.0",
    },
    devDependencies: { "@lablup/ui-common-cli": V },
  });
  write(
    dir,
    "pnpm-workspace.yaml",
    `overrides:\n  "@astryxdesign/lab>@astryxdesign/core": "${CORE}"\n`,
  );
  write(dir, "pnpm-lock.yaml", lockfile());
  installed(dir, "@lablup/ui-common", {
    version: V,
    dependencies: { "@astryxdesign/core": CORE },
  });
  installed(dir, "@lablup/ui-common-cli", { version: V });
  installed(dir, "@astryxdesign/core", { version: CORE });
  installed(dir, "@astryxdesign/lab", { version: LAB });
  write(
    dir,
    "index.html",
    `<!doctype html>\n<html>\n  <head>\n    <style>${LAYER_ORDER}</style>\n  </head>\n  <body><script type="module" src="/src/main.tsx"></script></body>\n</html>\n`,
  );
  write(
    dir,
    "src/index.css",
    `/* entry */\n${LAYER_ORDER}\n\n@import "@lablup/ui-common/reset.css";\n@import "@lablup/ui-common/astryx.css";\n`,
  );
  write(
    dir,
    "src/main.tsx",
    `import "./index.css";\nimport { Button } from "@lablup/ui-common";\nimport { Drawer } from "@lablup/ui-common/lab";\nimport { InternationalizationProvider } from "@lablup/ui-common/i18n";\nimport { uiCommonMessages } from "@lablup/ui-common/i18n-catalog";\nexport const app = <InternationalizationProvider messages={uiCommonMessages}><Button /><Drawer /></InternationalizationProvider>;\n`,
  );
  write(
    dir,
    "src/main.test.tsx",
    `import { render } from "@testing-library/react";\nrender(null);\n`,
  );
  write(
    dir,
    "vite.config.ts",
    `import stylex from "@stylexjs/unplugin/vite";\nexport default {\n  plugins: [stylex(), { name: "prebundle-ui-common", enforce: "post", config(c) { c.optimizeDeps.exclude = c.optimizeDeps.exclude.filter((n) => n !== "@lablup/ui-common"); } }],\n  test: { server: { deps: { inline: [/@lablup\\/ui-common/] } } },\n};\n`,
  );
  write(dir, "AGENTS.md", `# Agents\n\n${BLOCK}\n`);
  return dir;
}

const generateBlock = async () => BLOCK;
const doctor = (dir: string) => runDoctor({ cwd: dir, generateBlock });
const status = async (dir: string) =>
  Object.fromEntries((await doctor(dir)).checks.map((c) => [c.id, c.status]));

describe("ui-common doctor", () => {
  it("passes a project wired the way the docs say", async () => {
    const run = await doctor(healthyApp());
    expect(
      run.checks
        .filter((c) => c.status === "fail" || c.status === "warn")
        .map((c) => `${c.id}: ${c.summary}`),
    ).toEqual([]);
    expect(run.code).toBe(0);
    for (const c of run.checks)
      expect(c.doc).toBe(`docs/adopting-from-astryx.md#${c.id}`);
  });

  it("fails on a second core, from the lockfile", async () => {
    const dir = healthyApp();
    write(
      dir,
      "pnpm-lock.yaml",
      lockfile(
        `\n  '@astryxdesign/core@${CORE}(react@19.2.7)':\n    dependencies: {}\n`,
      ),
    );
    expect((await status(dir))["single-core"]).toBe("fail");
    write(
      dir,
      "pnpm-lock.yaml",
      lockfile().replace(
        `'@astryxdesign/core@${CORE}':`,
        `'@astryxdesign/core@0.6.1':\n    resolution: {}\n\n  '@astryxdesign/core@${CORE}':`,
      ),
    );
    expect((await status(dir))["single-core"]).toBe("fail");
  });

  it("fails when lab resolves another core", async () => {
    const dir = healthyApp();
    write(
      dir,
      "pnpm-lock.yaml",
      lockfile().replace(
        `(@astryxdesign/core@${CORE}(react@19.2.8))(react`,
        `(@astryxdesign/core@${LAB}(react@19.2.8))(react`,
      ),
    );
    expect((await status(dir))["lab-core"]).toBe("fail");
  });

  it("wants the lab override where /lab is used, unless core is the package's own", async () => {
    const dir = healthyApp();
    write(dir, "pnpm-workspace.yaml", "");
    expect((await status(dir))["lab-override"]).toBe("fail");
    const pkg = {
      name: "healthy",
      dependencies: { "@lablup/ui-common": V, "@astryxdesign/core": CORE },
      devDependencies: { "@lablup/ui-common-cli": V },
    };
    write(dir, "package.json", pkg);
    // pnpm resolves lab's peer to the package's own core at the pin.
    expect((await status(dir))["lab-override"]).toBe("pass");
    write(dir, "package.json", {
      ...pkg,
      dependencies: { ...pkg.dependencies, "@astryxdesign/core": "0.6.1" },
    });
    expect((await status(dir))["lab-override"]).toBe("warn");
    write(dir, "src/main.tsx", `import { Button } from "@lablup/ui-common";\n`);
    expect((await status(dir))["lab-override"]).toBe("skip");
  });

  it("fails on a direct Astryx import, but not on @astryxdesign/cli or a generated file", async () => {
    const dir = healthyApp();
    write(
      dir,
      "src/docs.ts",
      `import type { ComponentDoc } from "@astryxdesign/cli/authoring";\ndeclare module "@astryxdesign/core/Text" {}\n`,
    );
    write(
      dir,
      "src/built.js",
      `/** @generated by astryx theme build */\nimport "@astryxdesign/core/theme";\n`,
    );
    expect((await status(dir)).imports).toBe("pass");
    write(dir, "src/x.css", `@import "@astryxdesign/core/astryx.css";\n`);
    const run = await doctor(dir);
    const imports = run.checks.find((c) => c.id === "imports");
    expect(imports?.status).toBe("fail");
    expect(imports?.details).toEqual(["src/x.css:1 @astryxdesign/core/astryx.css"]);
    expect(run.code).toBe(1);
  });

  it("checks the layer order: present, first, with ui-common, the same everywhere", async () => {
    const dir = healthyApp();
    write(
      dir,
      "index.html",
      `<html><head><link rel="stylesheet" href="/a.css"><style>${LAYER_ORDER}</style></head><body><script type="module" src="/m.ts"></script></body></html>`,
    );
    expect((await status(dir))["layer-order"]).toBe("fail");
    const dir2 = healthyApp();
    write(
      dir2,
      "src/index.css",
      `@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;\n@import "@lablup/ui-common/astryx.css";\n`,
    );
    expect((await status(dir2))["layer-order"]).toBe("fail");
    const dir3 = healthyApp();
    write(
      dir3,
      "src/index.css",
      `a { color: red }\n${LAYER_ORDER}\n@import "@lablup/ui-common/astryx.css";\n`,
    );
    expect((await status(dir3))["layer-order"]).toBe("fail");
    expect(
      readCopy("x.scss", `@use "sass:math";\n${LAYER_ORDER}\n`).problem,
    ).toBeNull();
  });

  it("checks the Vite pre-bundle fix and the Vitest inline", async () => {
    const dir = healthyApp();
    write(
      dir,
      "vite.config.ts",
      `import stylex from "@stylexjs/unplugin/vite";\nexport default { plugins: [stylex()], test: {} };\n`,
    );
    const s = await status(dir);
    expect(s["vite-prebundle"]).toBe("fail");
    expect(s["vitest-inline"]).toBe("fail");
  });

  it("checks that ui-common's catalog reaches the provider", async () => {
    const dir = healthyApp();
    write(
      dir,
      "src/main.tsx",
      `import { InternationalizationProvider } from "@lablup/ui-common/i18n";\nexport const a = <InternationalizationProvider locale="ko-KR" />;\n`,
    );
    expect((await status(dir)).i18n).toBe("fail");
  });

  it("checks versions: declared and installed, ui-common and the CLI", async () => {
    const dir = healthyApp();
    write(dir, "package.json", {
      name: "x",
      dependencies: { "@lablup/ui-common": V },
      devDependencies: { "@lablup/ui-common-cli": "0.2.1" },
    });
    expect((await status(dir)).versions).toBe("fail");
    installed(dir, "@lablup/ui-common-cli", { version: "0.2.1" });
    write(dir, "package.json", {
      name: "x",
      dependencies: { "@lablup/ui-common": "0.2.1" },
      devDependencies: { "@lablup/ui-common-cli": "0.2.1" },
    });
    expect((await status(dir)).versions).toBe("fail");
  });

  it("checks the agent block: stale, missing, or an ASTRYX block left over", async () => {
    const dir = healthyApp();
    write(
      dir,
      "AGENTS.md",
      `# Agents\n\n<!-- UI-COMMON:START -->\nold\n<!-- UI-COMMON:END -->\n`,
    );
    expect((await status(dir)).agents).toBe("fail");
    write(
      dir,
      "AGENTS.md",
      `# Agents\n\n${BLOCK}\n\n<!-- ASTRYX:START -->\nx\n<!-- ASTRYX:END -->\n`,
    );
    expect((await status(dir)).agents).toBe("fail");
    write(dir, "AGENTS.md", `# Agents\n`);
    expect((await status(dir)).agents).toBe("fail");
  });

  it("reads npm's lockfile: a core nested under lab is a second copy", async () => {
    const dir = healthyApp();
    rmSync(join(dir, "pnpm-lock.yaml"));
    rmSync(join(dir, "pnpm-workspace.yaml"));
    write(dir, "package-lock.json", {
      lockfileVersion: 3,
      packages: {
        "": { name: "healthy" },
        "node_modules/@astryxdesign/core": { version: CORE },
        "node_modules/@astryxdesign/lab": { version: LAB },
        "node_modules/@astryxdesign/lab/node_modules/@astryxdesign/core": {
          version: LAB,
        },
      },
    });
    const s = await status(dir);
    expect(s["single-core"]).toBe("fail");
    expect(s["lab-core"]).toBe("fail");
    expect(s["lab-override"]).toBe("fail");
  });

  it("checks every member of a workspace", async () => {
    const dir = mkdtempSync(join(tmpdir(), "uic-doctor-ws-"));
    temps.push(dir);
    write(dir, "package.json", { name: "root", private: true });
    write(
      dir,
      "pnpm-workspace.yaml",
      `packages:\n  - "apps/*"\n\ncatalog:\n  "@lablup/ui-common": ${V}\n`,
    );
    write(dir, "apps/a/package.json", {
      name: "a",
      dependencies: { "@lablup/ui-common": "catalog:" },
    });
    write(dir, "apps/b/package.json", {
      name: "b",
      dependencies: { "@lablup/ui-common": "0.1.0" },
    });
    write(dir, "apps/b/src/x.ts", `import { Button } from "@astryxdesign/core";\n`);
    const p = gatherProject(dir);
    expect(p.using.map((r) => p.rel(r))).toEqual(["apps/a", "apps/b"]);
    const s = await status(dir);
    expect(s.versions).toBe("fail");
    expect(s.imports).toBe("fail");
  });

  it("run from a workspace member, reads the page the workspace root serves", async () => {
    const dir = mkdtempSync(join(tmpdir(), "uic-doctor-member-"));
    temps.push(dir);
    write(dir, "package.json", { name: "root", private: true });
    write(dir, "pnpm-workspace.yaml", `packages:\n  - app\n`);
    write(
      dir,
      "index.html",
      `<html><head><style>${LAYER_ORDER}</style></head><body></body></html>`,
    );
    write(dir, "app/package.json", {
      name: "app",
      dependencies: { "@lablup/ui-common": V },
    });
    // A build-entry stub a plugin replaces with the root page.
    write(
      dir,
      "app/index.html",
      `<html><head></head><body><script type="module" src="/src/main.tsx"></script></body></html>`,
    );
    write(
      dir,
      "app/src/index.css",
      `${LAYER_ORDER}\n@import "@lablup/ui-common/astryx.css";\n`,
    );
    const run = await runDoctor({ cwd: join(dir, "app"), generateBlock });
    expect(run.projectDir).toBe(dir);
    const layer = run.checks.find((c) => c.id === "layer-order");
    expect(layer?.status, layer?.summary).toBe("pass");
    expect(layer?.summary).toContain("2 copies");
  });

  it("needs Node 22.13 for the CLI", () => {
    const p = gatherProject(healthyApp());
    expect(checkNode(p, "22.12.0").status).toBe("fail");
    expect(checkNode(p, "22.13.0").status).toBe("pass");
  });
});

describe("the command line", { timeout: 60_000 }, () => {
  it("prints JSON with --json and exits 1 on a failure", () => {
    const dir = healthyApp();
    write(dir, "src/x.ts", `import { Button } from "@astryxdesign/core";\n`);
    const r = spawnSync(process.execPath, [bin, "doctor", "--json"], {
      cwd: dir,
      encoding: "utf8",
    });
    expect(r.status).toBe(1);
    const out = JSON.parse(r.stdout);
    expect(out.ok).toBe(false);
    expect(out.checks.find((c: { id: string }) => c.id === "imports").status).toBe(
      "fail",
    );
    const bad = spawnSync(process.execPath, [bin, "doctor", "--bogus"], {
      cwd: dir,
      encoding: "utf8",
    });
    expect(bad.status).toBe(2);
  });
});

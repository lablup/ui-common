import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ANALYZE = join(here, "analyze-pr.mjs");
const COMMENT = join(here, "generate-pr-comment.mjs");

const META = {
  prNumber: "61",
  shortHash: "a1b2c3d",
  storybookUrl: "https://lablup.github.io/ui-common/pr/61/storybook/",
  runUrl: "https://github.com/lablup/ui-common/actions/runs/1",
};

function tempDir() {
  return mkdtempSync(join(tmpdir(), "pr-preview-"));
}

function writeJson(dir: string, name: string, value: unknown) {
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(value));
  return path;
}

function renderComment(args: {
  analysis: unknown;
  bundleHead?: unknown;
  bundleBase?: unknown;
}) {
  const dir = tempDir();
  const argv = [
    COMMENT,
    "--meta",
    writeJson(dir, "meta.json", META),
    "--analysis",
    writeJson(dir, "analysis.json", args.analysis),
  ];
  if (args.bundleHead)
    argv.push("--bundle-head", writeJson(dir, "head.json", args.bundleHead));
  if (args.bundleBase)
    argv.push("--bundle-base", writeJson(dir, "base.json", args.bundleBase));
  return execFileSync("node", argv, { encoding: "utf8" });
}

describe("analyze-pr.mjs", () => {
  function repoWithPr() {
    const repo = tempDir();
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd: repo, encoding: "utf8" });
    const write = (file: string, contents = "x") => {
      mkdirSync(dirname(join(repo, file)), { recursive: true });
      writeFileSync(join(repo, file), contents);
    };

    git("init", "-q", "-b", "main");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "test");
    write("src/components/StatCard/index.ts");
    write("src/components/StatCard/StatCard.tsx");
    write("src/components/Modal/Modal.tsx");
    write("src/components/Old/index.ts", "export {};");
    write("src/components/Old/Old.tsx", "export const Old = 1;");
    write("src/hooks/index.ts");
    git("add", "-A");
    git("commit", "-q", "-m", "base");
    git("checkout", "-q", "-b", "pr");

    write("src/components/StatCard/StatCard.css", "changed");
    write("src/components/StatCard/StatCard.stories.tsx", "new");
    write("src/components/Modal/Modal.test.tsx", "test only");
    write("src/components/Fresh/index.ts");
    write("src/components/Fresh/Fresh.tsx");
    write("src/hooks/index.ts", "changed");
    git("mv", "src/components/Old", "src/components/Renamed");
    git("add", "-A");
    git("commit", "-q", "-m", "pr");
    return repo;
  }

  it("groups changes by component directory and links the built stories", () => {
    const repo = repoWithPr();
    const index = writeJson(repo, "index.json", {
      entries: {
        "components-statcard--documentation": {
          id: "components-statcard--documentation",
          title: "Components/StatCard",
          type: "docs",
          importPath: "./src/components/StatCard/StatCard.stories.tsx",
        },
        "components-statcard--default": {
          id: "components-statcard--default",
          title: "Components/StatCard",
          type: "story",
          importPath: "./src/components/StatCard/StatCard.stories.tsx",
        },
      },
    });
    const output = join(repo, "analysis.json");
    execFileSync(
      "node",
      [
        ANALYZE,
        "--base",
        "main",
        "--head",
        "pr",
        "--storybook-index",
        index,
        "--output",
        output,
      ],
      { cwd: repo },
    );
    const analysis = JSON.parse(readFileSync(output, "utf8"));

    expect(analysis.diffMode).toBe("three-dot");
    // A test-only change is not a component change.
    // A rename shows up under both the old and the new directory.
    expect(analysis.components.map((c: { name: string }) => c.name)).toEqual([
      "Fresh",
      "Old",
      "Renamed",
      "StatCard",
    ]);

    const statCard = analysis.components.find(
      (c: { name: string }) => c.name === "StatCard",
    );
    expect(statCard).toMatchObject({
      kind: "components",
      sourceChanged: true,
      storiesChanged: true,
      isNew: false,
      storyCount: 1,
      deepLink: "?path=/docs/components-statcard--documentation",
    });

    const fresh = analysis.components.find((c: { name: string }) => c.name === "Fresh");
    expect(fresh).toMatchObject({ isNew: true, hasStories: false });
    const renamed = analysis.components.find(
      (c: { name: string }) => c.name === "Renamed",
    );
    expect(renamed).toMatchObject({ isNew: true });
    expect(analysis.summary.newWithoutStories).toBe(2);
    expect(analysis.otherSourceFiles).toEqual(["src/hooks/index.ts"]);
  });
});

describe("generate-pr-comment.mjs", () => {
  const ANALYSIS = {
    base: "origin/main",
    diffMode: "three-dot",
    components: [
      {
        name: "Skeleton",
        kind: "components",
        dir: "src/components/Skeleton/",
        deepLink: "?path=/docs/components-skeleton--documentation",
        hasStories: true,
        storyCount: 3,
        sourceChanged: true,
        storiesChanged: false,
        isNew: false,
      },
      {
        name: "Fresh",
        kind: "components",
        dir: "src/components/Fresh/",
        deepLink: null,
        hasStories: false,
        storyCount: 0,
        sourceChanged: true,
        storiesChanged: false,
        isNew: true,
      },
    ],
    otherSourceFiles: ["src/index.ts"],
    summary: { newWithoutStories: 1 },
  };

  it("links the preview and every changed component's stories", () => {
    const body = renderComment({ analysis: ANALYSIS });

    expect(body).toContain("## PR Analysis Report");
    expect(body).toContain(`href="${META.storybookUrl}"`);
    expect(body).toContain(
      `href="${META.storybookUrl}?path=/docs/components-skeleton--documentation"`,
    );
    expect(body).toContain("| `Skeleton` | source | 3 |");
    expect(body).toContain("New component(s) without a `*.stories.tsx`: `Fresh`");
    expect(body).toContain("1 changed component(s) with no story");
    expect(body).toContain("`src/index.ts`");
    expect(body).toContain("_Bundle was not measured for this run._");
  });

  it("reports only the bundle groups that changed", () => {
    const body = renderComment({
      analysis: ANALYSIS,
      bundleHead: {
        entries: [
          { file: "components/StatCard", bytes: 4096, gzipBytes: 2048, hash: "b" },
          { file: "components/Modal", bytes: 4096, gzipBytes: 1024, hash: "same" },
          { file: "components/Fresh", bytes: 1024, gzipBytes: 512, hash: "n" },
        ],
      },
      bundleBase: {
        entries: [
          { file: "components/StatCard", bytes: 2048, gzipBytes: 1024, hash: "a" },
          { file: "components/Modal", bytes: 4096, gzipBytes: 1024, hash: "same" },
          { file: "components/Gone", bytes: 1024, gzipBytes: 512, hash: "g" },
        ],
      },
    });

    expect(body).toContain("| `components/StatCard` | 2.0 kB | +1.0 kB |");
    expect(body).toContain("| `components/Fresh` | 0.5 kB | 🆕 new |");
    expect(body).toContain("| `components/Gone` | — | 🗑️ removed |");
    expect(body).not.toContain("`components/Modal`");
    expect(body).toContain(
      "**Total gzip (JS + CSS):** 3.5 kB (+1.0 kB vs `origin/main`)",
    );
  });
});

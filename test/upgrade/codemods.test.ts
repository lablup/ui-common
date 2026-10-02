/**
 * The 0.1 -> 0.2 component codemod on single files, for the cases where the
 * output has to be read for its meaning rather than compared: the Drawer
 * `onClose` wrapper is evaluated, and the renames are checked against the
 * scopes the file declares.
 */
import jscodeshift from "jscodeshift";
import { describe, expect, it, vi } from "vitest";

import transformComponents from "../../codemods/0.2/components.mjs";

const j = jscodeshift.withParser("tsx");

function upgrade(source: string) {
  const ctx = { flags: { packages: new Map(), touched: new Set() } };
  const out = transformComponents(
    { path: "src/A.tsx", source },
    { jscodeshift: j },
    ctx,
  );
  if (out == null) throw new Error("the codemod left the file alone");
  return out as string;
}

/** The source of `name`'s value on the first element that carries it. */
function attributeSource(source: string, name: string) {
  const attr = j(source).find(j.JSXAttribute, { name: { name } }).paths()[0];
  if (!attr) throw new Error(`no ${name} attribute in:\n${source}`);
  return j(attr.node.value.expression).toSource();
}

/**
 * Evaluate the migrated `onOpenChange` with `scope` bound, the way the
 * consumer's component would see it.
 */
function onOpenChange(source: string, scope: Record<string, unknown>) {
  const names = Object.keys(scope);
  const fn = new Function(
    ...names,
    `return (${attributeSource(source, "onOpenChange")});`,
  );
  return fn(...names.map((n) => scope[n])) as (open: boolean) => void;
}

describe("Drawer onClose -> onOpenChange", () => {
  it("keeps a handler that reads the consumer's own isOpen", () => {
    const out = upgrade(
      `import { Drawer } from "@lablup/ui-common";
export function P({ isOpen, close }: { isOpen: boolean; close: () => void }) {
  return <Drawer open={isOpen} onClose={() => { if (isOpen) close(); }}>x</Drawer>;
}
`,
    );
    const close = vi.fn();
    const handler = onOpenChange(out, { isOpen: true, close });
    handler(true);
    expect(close).not.toHaveBeenCalled();
    handler(false);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("keeps an expression body that toggles on isOpen", () => {
    const out = upgrade(
      `import { Drawer } from "@lablup/ui-common";
export function P({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  return <Drawer open={isOpen} onClose={() => setIsOpen(!isOpen)}>x</Drawer>;
}
`,
    );
    const setIsOpen = vi.fn();
    onOpenChange(out, { isOpen: true, setIsOpen })(false);
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  it("never names its parameter after anything the file binds or reads", () => {
    const source = `import { Drawer } from "@lablup/ui-common";
const next = 1;
export function P({ open, isOpen, nextOpen, close }: any) {
  return <Drawer open={open} onClose={() => { if (open && isOpen && nextOpen && next) close(); }}>x</Drawer>;
}
`;
    const out = upgrade(source);
    const param = j(attributeSource(out, "onOpenChange"))
      .find(j.ArrowFunctionExpression)
      .paths()[0]!.node.params[0].name as string;
    for (const taken of ["next", "open", "isOpen", "nextOpen", "close", "Drawer", "P"])
      expect(param).not.toBe(taken);
    const close = vi.fn();
    onOpenChange(out, { open: true, isOpen: true, nextOpen: true, next: 1, close })(
      false,
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("calls a referenced or parameterised handler with no arguments, as 0.1 did", () => {
    const byName = upgrade(
      `import { Drawer } from "@lablup/ui-common";
export const P = ({ close }: any) => <Drawer onClose={close}>x</Drawer>;
`,
    );
    const close = vi.fn();
    onOpenChange(byName, { close })(false);
    expect(close).toHaveBeenCalledWith();

    const withParam = upgrade(
      `import { Drawer } from "@lablup/ui-common";
export const P = ({ log }: any) => <Drawer onClose={(reason = "closed") => log(reason)}>x</Drawer>;
`,
    );
    const log = vi.fn();
    onOpenChange(withParam, { log })(false);
    expect(log).toHaveBeenCalledWith("closed");
  });
});

describe("renames respect every scope", () => {
  it("does not capture a local that already has the new name", () => {
    const out = upgrade(
      `import { BaseCard } from "@lablup/ui-common";
export function Panel({ compact }: { compact: boolean }) {
  const Card = compact ? "section" : "article";
  return (
    <Card className="outer">
      <BaseCard>inside</BaseCard>
    </Card>
  );
}
`,
    );
    expect(out).toContain('import { Card as UicCard } from "@lablup/ui-common/Card";');
    expect(out).toContain("<UicCard>inside</UicCard>");
    expect(out).toContain('<Card className="outer">');
    expect(out).toContain('const Card = compact ? "section" : "article";');
  });

  it("does not capture a function-local binding, and leaves shadowed names alone", () => {
    const out = upgrade(
      `import { Tabs, Select, StatusTag } from "@lablup/ui-common";

export function A({ items }: { items: string[] }) {
  const TabList = items.length;
  return (
    <div>
      <Tabs activeTab="a" onTabChange={() => {}} tabs={[]} />
      <span>{TabList}</span>
    </div>
  );
}

function B() {
  const Select = (p: any) => <em>{p.children}</em>;
  return <Select disabled>inner</Select>;
}

export function C() {
  return <Select disabled options={[]} aria-label="x" />;
}

export function D({ StatusTag }: { StatusTag: any }) {
  return <StatusTag state="x" />;
}
`,
    );
    // A: the import takes a free alias; the local keeps its name.
    expect(out).toMatch(
      /import \{ TabList as UicTabList \} from "@lablup\/ui-common\/TabList";/,
    );
    expect(out).toContain("<UicTabList value=");
    expect(out).toContain("const TabList = items.length;");
    expect(out).toContain("<span>{TabList}</span>");
    // B: the local Select is not the import; nothing about it changes.
    expect(out).toContain("const Select = (p: any) => <em>{p.children}</em>;");
    expect(out).toContain("return <Select disabled>inner</Select>;");
    // C: the module-level Select is migrated.
    expect(out).toMatch(/<(Selector|UicSelector) isDisabled options=\{\[\]\}/);
    // D: the parameter shadows the import.
    expect(out).toContain("export function D({ StatusTag }: { StatusTag: any }) {");
    expect(out).toContain('return <StatusTag state="x" />;');
    expect(out).not.toContain("is used as a value here");
  });
});

/** The output with each JSX TODO marker's message elided. */
const todos = (out: string) =>
  out.replace(/\{\/\* TODO\(ui-common-upgrade\): [^*]*\*\/\}/g, "{/* TODO */}");

describe("JSX text keeps its whitespace", () => {
  it("moves Badge children into label with the space after an expression", () => {
    const out = upgrade(
      `import { Badge } from "@lablup/ui-common";
export const A = ({ n }: { n: number }) => <Badge variant="success">{n} items</Badge>;
`,
    );
    expect(attributeSource(out, "label")).toBe('<>{n}{" "}items</>');
  });

  it("keeps a whitespace-only text between expressions", () => {
    const out = upgrade(
      `import { Badge } from "@lablup/ui-common";
export const A = ({ a, b }: { a: number; b: number }) => <Badge>{a} {b}</Badge>;
`,
    );
    expect(attributeSource(out, "label")).toBe("<>{a} {b}</>");
  });

  it("keeps multi-line children's words apart", () => {
    const out = upgrade(
      `import { Badge } from "@lablup/ui-common";
export const A = ({ n }: { n: number }) => (
  <Badge>
    {n} items
    in total
  </Badge>
);
`,
    );
    const label = attributeSource(out, "label");
    expect(label).toContain('{n}{" "}items');
    expect(label).toMatch(/items\n\s*in total/);
  });

  it("leaves text around an element that gets a TODO alone, inline", () => {
    const source = `import { Button } from "@lablup/ui-common";
export const A = ({ n }: { n: number }) => (
  <p>
    {n} sessions running <Button shape="round">Go</Button> and {n} more
  </p>
);
`;
    const out = upgrade(source);
    expect(todos(out).split("\n").slice(2)).toEqual([
      "  <p>",
      '    {n} sessions running {/* TODO */}<Button shape="round" label="Go" /> and {n} more',
      "  </p>",
      ");",
      "",
    ]);
    // Idempotent: a second run adds nothing.
    expect(upgrade(out.replace("@lablup/ui-common/Button", "@lablup/ui-common"))).toBe(
      out,
    );
  });

  it("puts a TODO on its own line above an element on its own line", () => {
    const out = upgrade(
      `import { Button } from "@lablup/ui-common";
export const A = ({ n }: { n: number }) => (
  <p>
    {n} sessions running
    <Button shape="round">Go</Button>
    {n} more
  </p>
);
`,
    );
    expect(todos(out).split("\n").slice(2)).toEqual([
      "  <p>",
      "    {n} sessions running",
      "    {/* TODO */}",
      '    <Button shape="round" label="Go" />',
      "    {n} more",
      "  </p>",
      ");",
      "",
    ]);
  });
});

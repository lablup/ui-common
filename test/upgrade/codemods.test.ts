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

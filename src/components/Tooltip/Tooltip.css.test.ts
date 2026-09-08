/**
 * The tooltip content has to be able to receive pointer events.
 *
 * WCAG 2.1 SC 1.4.13 (Hoverable) requires the pointer to be able to move onto
 * the content without it disappearing. `pointer-events: none` makes that
 * impossible from CSS alone, whatever the component does: the element is never
 * the target of a pointer event, so arriving on it fires nothing, the pending
 * hide is never cancelled, and the content goes away while the pointer is over
 * it. It also cannot be selected, which is the other half of why a reader
 * moves onto a tooltip.
 *
 * This is a separate guard from the behaviour tests because jsdom does not
 * implement `pointer-events`, so every one of those tests passes with the
 * declaration in place. The component shipped in exactly that state.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CSS = readFileSync(join(__dirname, "Tooltip.css"), "utf8");

/** Comments blanked out, so prose about the property is not read as one. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "));
}

describe("Tooltip.css", () => {
  it("does not disable pointer events anywhere", () => {
    const declarations =
      withoutComments(CSS).match(/pointer-events\s*:\s*[^;}]+/g) ?? [];

    expect(declarations.filter((d) => /none/.test(d))).toEqual([]);
  });
});

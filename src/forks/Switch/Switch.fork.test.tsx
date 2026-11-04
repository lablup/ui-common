/**
 * ui-common's tests for its Switch fork: the fix it carries (a passed `id`
 * reaches the native checkbox, so an outside `<label htmlFor>` names and
 * toggles it), that a passed `aria-describedby` describes it (upstream's
 * since Astryx 0.7.2, which Form.Item relies on), and that everything else
 * renders exactly as Astryx's does.
 */
import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch as UpstreamSwitch } from "@astryxdesign/core/Switch";

import { Form } from "../../components/Form";
import { comparableMarkup } from "../../test/forkParity";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as compiled from "./Switch.styles";
import { Switch, TOUCH_ONLY_ATOMS, coarseMinTarget, type SwitchProps } from "./Switch";

type Props = Partial<SwitchProps>;

describe("Switch fork: a passed id", () => {
  it("lands on the native checkbox", () => {
    render(
      <Switch label="Notifications" value={false} onChange={() => {}} id="field" />,
    );
    expect(screen.getByRole("switch")).toHaveAttribute("id", "field");
  });

  it("falls back to a generated id without one", () => {
    render(<Switch label="Notifications" value={false} onChange={() => {}} />);
    expect(screen.getByRole("switch").id).not.toBe("");
  });

  it("lets an outside label name and toggle it", async () => {
    const onChange = vi.fn();
    render(
      <>
        <label htmlFor="field">Outside</label>
        <Switch
          label="Notifications"
          isLabelHidden
          value={false}
          onChange={onChange}
          id="field"
        />
      </>,
    );
    expect(screen.getByRole("switch")).toHaveAccessibleName(/Outside/);
    await userEvent.click(screen.getByText("Outside"));
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("is what Form.Item's label points at", async () => {
    render(
      <Form initialValues={{ flag: false }}>
        <Form.Item label="Flag" name="flag">
          <Switch
            label="Notifications"
            isLabelHidden
            onChange={() => {}}
            value={false}
          />
        </Form.Item>
      </Form>,
    );
    const control = screen.getByRole("switch");
    expect(control).toHaveAttribute("id", "flag");
    await userEvent.click(screen.getByText("Flag"));
    expect(control).toBeChecked();
  });
});

describe("Switch: a passed aria-describedby", () => {
  it("describes the native checkbox, ahead of the switch's own ids", () => {
    render(
      <>
        <p id="hint">Sent weekly.</p>
        <Switch
          label="Notifications"
          description="Email only"
          value={false}
          onChange={() => {}}
          aria-describedby="hint"
        />
      </>,
    );
    const control = screen.getByRole("switch");
    expect(control.getAttribute("aria-describedby")).toMatch(/^hint /);
    expect(control).toHaveAccessibleDescription(/^Sent weekly\. Email only/);
  });

  it("carries Form.Item's message and extra", async () => {
    const { container } = render(
      <Form>
        <Form.Item
          label="Accept"
          name="accept"
          extra="Read the terms"
          rules={[{ required: true, message: "Must accept." }]}
        >
          <Switch label="Accept" isLabelHidden value={false} onChange={() => {}} />
        </Form.Item>
      </Form>,
    );
    const form = container.querySelector("form")!;
    await act(async () => {
      form.requestSubmit();
    });
    const control = await screen.findByRole("switch");
    await waitFor(() =>
      expect(control).toHaveAccessibleDescription(/Must accept\..*Read the terms/),
    );
  });
});

/**
 * Markup with the touch presentation the fork leaves out taken away on both
 * sides: the touch-only atoms, `touch-action: pan-y`, the press-holds-drag
 * mark, and the fork's own 24 px coarse minimum.
 */
const LEFT_OUT = new Set([
  ...TOUCH_ONLY_ATOMS,
  compiled.styles.switchWrapperInteractive.kFalU9,
  coarseMinTarget.kjFi6P,
  coarseMinTarget.kHzOjL,
]);
function withoutTouchPresentation(markup: string): string {
  return markup
    .replace(/ data-astryx-press-holds-drag=""/g, "")
    .replace(/class="([^"]*)"/g, (_, classes: string) => {
      const kept = classes.split(" ").filter((atom) => !LEFT_OUT.has(atom));
      return `class="${kept.join(" ")}"`;
    });
}

describe("Switch fork: parity with Astryx", () => {
  const cases: Array<[string, Props]> = [
    ["off", {}],
    ["on", { value: true }],
    ["small, disabled", { size: "sm", isDisabled: true }],
    [
      "a status and a description",
      { status: { type: "error", message: "Required" }, description: "Help" },
    ],
    ["a hidden label, required", { isLabelHidden: true, isRequired: true }],
  ];

  it.each(cases)("renders Astryx's markup with %s", (_, props) => {
    const fork = render(
      <Switch label="Notifications" value={false} onChange={() => {}} {...props} />,
    );
    const upstream = render(
      <UpstreamSwitch
        label="Notifications"
        value={false}
        onChange={() => {}}
        {...(props as object)}
      />,
    );
    expect(withoutTouchPresentation(comparableMarkup(fork.container))).toBe(
      withoutTouchPresentation(comparableMarkup(upstream.container)),
    );
  });

  // When this fails, Astryx has shipped the fix: delete the fork and its
  // exports.exclude.json entry (CONTRIBUTING, "Forks of Astryx components").
  it("still differs from Astryx's, which drops the id", () => {
    render(
      <UpstreamSwitch
        label="Notifications"
        value={false}
        onChange={() => {}}
        id="field"
      />,
    );
    expect(screen.getByRole("switch")).not.toHaveAttribute("id", "field");
  });
});

describe("Switch fork: a coarse pointer gets the mouse presentation", () => {
  const css = readFileSync(
    createRequire(import.meta.url).resolve("@astryxdesign/core/astryx.css"),
    "utf8",
  );
  /** The @media conditions every rule naming `atom` sits in, one list per rule. */
  const mediaOf = (atom: string): string[][] => {
    const found: string[][] = [];
    const pattern = new RegExp(`\\.${atom}(?![\\w-])`, "g");
    for (let m = pattern.exec(css); m; m = pattern.exec(css)) {
      const media: string[] = [];
      let depth = 0;
      for (let i = m.index - 1; i >= 0; i--) {
        if (css[i] === "}") depth++;
        else if (css[i] === "{") {
          if (depth > 0) depth--;
          else {
            const head = css
              .slice(
                Math.max(css.lastIndexOf("}", i), css.lastIndexOf("{", i - 1)) + 1,
                i,
              )
              .trim();
            if (head.startsWith("@media")) media.push(head);
          }
        }
      }
      found.push(media);
    }
    return found;
  };
  // Under a coarse pointer and not only for reduced motion.
  const isTouchOnly = (atom: string) => {
    const rules = mediaOf(atom);
    return (
      rules.length > 0 &&
      rules.every((media) =>
        media.some((m) =>
          /\(pointer: coarse\)/.test(m.replace(/not \(pointer: coarse\)/g, "")),
        ),
      ) &&
      !rules.some((media) =>
        media.some(
          (m) =>
            /prefers-reduced-motion: reduce\)( and \(pointer: coarse\)|\) and)/.test(
              m,
            ) && !/\(pointer: coarse\)\s*$/.test(m),
        ),
      )
    );
  };
  const ownAtoms = [
    compiled.wrapperSizeStyles,
    compiled.trackSizeStyles,
    compiled.thumbOffSizeStyles,
    compiled.thumbOnSizeStyles,
    compiled.pressOwnerStyles,
    compiled.labelWrapperSizeStyles,
    compiled.styles,
  ].flatMap((namespace) =>
    Object.values(namespace).flatMap((entry) =>
      Object.values(entry).flatMap((value) =>
        typeof value === "string" ? value.split(" ") : [],
      ),
    ),
  );

  it("lists only atoms astryx.css holds under a coarse pointer", () => {
    for (const atom of TOUCH_ONLY_ATOMS) {
      const rules = mediaOf(atom);
      expect(rules.length, atom).toBeGreaterThan(0);
      for (const media of rules)
        expect(media.join(" "), atom).toMatch(/\(pointer: coarse\)/);
    }
  });

  it("leaves out every touch-only atom upstream's Switch styles carry", () => {
    const missing = [...new Set(ownAtoms)].filter(
      (atom) => !TOUCH_ONLY_ATOMS.has(atom) && isTouchOnly(atom),
    );
    expect(missing).toEqual([]);
  });

  it("keeps a 24 px minimum target under a coarse pointer, from rules astryx.css has", () => {
    const rules = (atom: string) =>
      css.match(new RegExp(`\\.${atom}[^{]*\\{([^}]*)\\}`))?.[1];
    expect(rules(coarseMinTarget.kjFi6P)).toBe("min-width:24px");
    expect(rules(coarseMinTarget.kHzOjL)).toBe("min-height:24px");
    render(
      <Switch label="Notifications" value={false} onChange={() => {}} size="sm" />,
    );
    expect(screen.getByRole("switch")).toHaveClass(
      coarseMinTarget.kjFi6P,
      coarseMinTarget.kHzOjL,
    );
  });

  it("does not claim horizontal pans or hold the press through a drag", () => {
    const { container } = render(
      <Switch label="Notifications" value={false} onChange={() => {}} />,
    );
    expect(container.querySelector("[data-astryx-press-holds-drag]")).toBeNull();
    expect(
      container.querySelector(`.${compiled.styles.switchWrapperInteractive.kFalU9}`),
    ).toBeNull();
  });
});

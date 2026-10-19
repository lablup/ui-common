/**
 * ui-common's tests for its SegmentedControl fork: the fix it carries (a
 * passed `aria-describedby` describes the radiogroup, beside its own
 * disabled-reason tooltip), and that everything else renders exactly as
 * Astryx's does.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import {
  SegmentedControl as UpstreamSegmentedControl,
  SegmentedControlItem as UpstreamSegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";

import { Form } from "../../components/Form";
import { comparableMarkup } from "../../test/forkParity";
import { SegmentedControl, SegmentedControlItem, type SegmentedControlProps } from ".";

type Props = Partial<SegmentedControlProps>;

beforeEach(() => {
  // jsdom has no Popover API; the disabled-reason tooltip calls it.
  HTMLElement.prototype.showPopover = vi.fn();
  HTMLElement.prototype.hidePopover = vi.fn();
});

function Fork(props: Props) {
  return (
    <SegmentedControl label="View" value="grid" onChange={() => {}} {...props}>
      <SegmentedControlItem value="grid" label="Grid" />
      <SegmentedControlItem value="list" label="List" />
    </SegmentedControl>
  );
}

function Upstream(props: Props) {
  return (
    <UpstreamSegmentedControl
      label="View"
      value="grid"
      onChange={() => {}}
      {...(props as object)}
    >
      <UpstreamSegmentedControlItem value="grid" label="Grid" />
      <UpstreamSegmentedControlItem value="list" label="List" />
    </UpstreamSegmentedControl>
  );
}

describe("SegmentedControl fork: a passed aria-describedby", () => {
  it("describes the radiogroup", () => {
    render(
      <>
        <p id="hint">Applies to every list.</p>
        <Fork aria-describedby="hint" />
      </>,
    );
    expect(screen.getByRole("radiogroup")).toHaveAccessibleDescription(
      "Applies to every list.",
    );
  });

  it("comes ahead of the disabled reason", () => {
    render(<Fork aria-describedby="hint" isDisabled disabledMessage="Locked" />);
    expect(screen.getByRole("radiogroup").getAttribute("aria-describedby")).toMatch(
      /^hint \S+$/,
    );
  });

  it("carries Form.Item's message and extra", async () => {
    const { container } = render(
      <Form>
        <Form.Item
          label="View"
          name="view"
          extra="Saved per user"
          rules={[{ required: true, message: "Pick one." }]}
        >
          <Fork />
        </Form.Item>
      </Form>,
    );
    await act(async () => {
      container.querySelector("form")!.requestSubmit();
    });
    await waitFor(() =>
      expect(screen.getByRole("radiogroup")).toHaveAccessibleDescription(
        /Pick one\..*Saved per user/,
      ),
    );
  });
});

describe("SegmentedControl fork: parity with Astryx", () => {
  const cases: Array<[string, Props]> = [
    ["the defaults", {}],
    ["small, fill", { size: "sm", layout: "fill" }],
    ["disabled", { isDisabled: true }],
    ["disabled with a reason", { isDisabled: true, disabledMessage: "Locked" }],
  ];

  it.each(cases)("renders Astryx's markup with %s", (_, props) => {
    const fork = render(<Fork {...props} />);
    const upstream = render(<Upstream {...props} />);
    expect(comparableMarkup(fork.container)).toBe(comparableMarkup(upstream.container));
  });

  // When this fails, Astryx has shipped the fix: delete the fork and its
  // provenance.json entries (CONTRIBUTING, "Forks of Astryx components").
  it("still differs from Astryx's, which drops aria-describedby", () => {
    render(<Upstream aria-describedby="hint" />);
    expect(screen.getByRole("radiogroup")).not.toHaveAttribute("aria-describedby");
  });
});

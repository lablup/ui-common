/**
 * The SegmentedControl wrapper over Astryx's own control (its fork was
 * deleted at Astryx 0.7.7, which merges a caller's `aria-describedby`): a
 * passed description, and Form.Item's message and extra, describe the
 * radiogroup, ahead of the disabled reason.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

import { Form } from "../../components/Form";
import { SegmentedControl, SegmentedControlItem, type SegmentedControlProps } from ".";

beforeEach(() => {
  // jsdom has no Popover API; the disabled-reason tooltip calls it.
  HTMLElement.prototype.showPopover = vi.fn();
  HTMLElement.prototype.hidePopover = vi.fn();
});

function View(props: Partial<SegmentedControlProps>) {
  return (
    <SegmentedControl aria-label="View" defaultValue="grid" {...props}>
      <SegmentedControlItem value="grid" label="Grid" />
      <SegmentedControlItem value="list" label="List" />
    </SegmentedControl>
  );
}

describe("SegmentedControl: aria-describedby", () => {
  it("describes the radiogroup with a passed aria-describedby", () => {
    render(
      <>
        <p id="hint">Applies to every list.</p>
        <View aria-describedby="hint" />
      </>,
    );
    expect(screen.getByRole("radiogroup")).toHaveAccessibleDescription(
      "Applies to every list.",
    );
  });

  it("puts a passed aria-describedby ahead of the disabled reason", () => {
    render(<View aria-describedby="hint" disabled disabledMessage="Locked" />);
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
          <SegmentedControl>
            <SegmentedControlItem value="grid" label="Grid" />
            <SegmentedControlItem value="list" label="List" />
          </SegmentedControl>
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

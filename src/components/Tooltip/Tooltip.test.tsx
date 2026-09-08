/**
 * Tooltip Component Tests
 *
 * Tests cover:
 * - Rendering the trigger (children) without showing the tooltip initially
 * - Showing/hiding on mouse hover
 * - Showing/hiding on keyboard focus
 * - All three parts of WCAG 2.1 SC 1.4.13, which the component's docblock cites
 * - String content wrapped in a paragraph vs. ReactNode content rendered directly
 * - aria-describedby association while visible
 * - Custom className, contentClassName, tooltipId, and tabIndex
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  describe("rendering", () => {
    it("renders the trigger children", () => {
      render(
        <Tooltip content="Helpful hint">
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      expect(screen.getByRole("button", { name: "Trigger" })).toBeInTheDocument();
    });

    it("does not render the tooltip content until triggered", () => {
      render(
        <Tooltip content="Helpful hint">
          <span>Trigger</span>
        </Tooltip>,
      );

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("hover interaction", () => {
    it("shows the tooltip on mouse hover", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Helpful hint">
          <span>Trigger</span>
        </Tooltip>,
      );

      await user.hover(screen.getByText("Trigger"));

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toHaveTextContent("Helpful hint");
      });
    });

    it("hides the tooltip when the mouse leaves", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Helpful hint">
          <span>Trigger</span>
        </Tooltip>,
      );

      await user.hover(screen.getByText("Trigger"));
      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      // The hide is deferred by a grace period so the pointer can reach the
      // portalled content, so this is a waitFor rather than a bare assertion.
      await user.unhover(screen.getByText("Trigger"));
      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });
  });

  describe("keyboard focus interaction", () => {
    it("shows the tooltip when a child receives focus", async () => {
      render(
        <Tooltip content="Helpful hint">
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      const wrapper = screen.getByRole("button", { name: "Trigger" })
        .parentElement as HTMLElement;
      fireEvent.focusIn(wrapper);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
    });

    it("hides the tooltip when focus leaves", async () => {
      render(
        <Tooltip content="Helpful hint">
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      const wrapper = screen.getByRole("button", { name: "Trigger" })
        .parentElement as HTMLElement;
      fireEvent.focusIn(wrapper);
      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      fireEvent.focusOut(wrapper);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("content", () => {
    it("wraps string content in a paragraph", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Plain text hint">
          <span>Trigger</span>
        </Tooltip>,
      );

      await user.hover(screen.getByText("Trigger"));

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip.querySelector("p.tooltip__text")).toHaveTextContent(
          "Plain text hint",
        );
      });
    });

    it("renders ReactNode content directly without a wrapping paragraph", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content={<strong data-testid="rich-content">Rich hint</strong>}>
          <span>Trigger</span>
        </Tooltip>,
      );

      await user.hover(screen.getByText("Trigger"));

      await waitFor(() => {
        expect(screen.getByTestId("rich-content")).toBeInTheDocument();
      });

      const tooltip = await screen.findByRole("tooltip");
      expect(tooltip.querySelector("p.tooltip__text")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("associates the wrapper with the tooltip via aria-describedby while visible", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Helpful hint" tooltipId="my-tooltip">
          <span>Trigger</span>
        </Tooltip>,
      );

      const wrapper = screen.getByText("Trigger").parentElement as HTMLElement;
      expect(wrapper).not.toHaveAttribute("aria-describedby");

      await user.hover(screen.getByText("Trigger"));

      await waitFor(() => {
        expect(wrapper).toHaveAttribute("aria-describedby", "my-tooltip");
      });

      const tooltip = await screen.findByRole("tooltip");
      expect(tooltip).toHaveAttribute("id", "my-tooltip");
    });

    it("defaults the wrapper tabIndex to 0", () => {
      render(
        <Tooltip content="Helpful hint">
          <span>Trigger</span>
        </Tooltip>,
      );

      const wrapper = screen.getByText("Trigger").parentElement as HTMLElement;
      expect(wrapper).toHaveAttribute("tabIndex", "0");
    });

    it("respects a custom tabIndex", () => {
      render(
        <Tooltip content="Helpful hint" tabIndex={-1}>
          <button type="button">Trigger</button>
        </Tooltip>,
      );

      const wrapper = screen.getByRole("button", { name: "Trigger" })
        .parentElement as HTMLElement;
      expect(wrapper).toHaveAttribute("tabIndex", "-1");
    });
  });

  describe("custom props", () => {
    it("applies a custom className to the wrapper", () => {
      render(
        <Tooltip content="Helpful hint" className="custom-wrapper">
          <span>Trigger</span>
        </Tooltip>,
      );

      const wrapper = screen.getByText("Trigger").parentElement as HTMLElement;
      expect(wrapper).toHaveClass("tooltip__wrapper");
      expect(wrapper).toHaveClass("custom-wrapper");
    });

    it("applies a custom contentClassName to the tooltip content", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip content="Helpful hint" contentClassName="custom-content">
          <span>Trigger</span>
        </Tooltip>,
      );

      await user.hover(screen.getByText("Trigger"));

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toHaveClass("custom-content");
      });
    });
  });
  /**
   * The component's docblock cites WCAG 2.1 SC 1.4.13, which has three parts.
   * Dismissible and Hoverable were both missing: there was no Escape handler,
   * and the pointer could not reach the content across the gap that separates
   * it from the trigger.
   *
   * These use fake timers because the grace period is the thing under test, and
   * a stubbed rAF because placement is measured in one: until it lands the
   * content carries `visibility: hidden`, which keeps it out of the
   * accessibility tree and so out of `getByRole`.
   */
  describe("WCAG 2.1 SC 1.4.13", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    function open() {
      render(
        <Tooltip content="Helpful hint">
          <span>Trigger</span>
        </Tooltip>,
      );
      const trigger = screen.getByText("Trigger");
      fireEvent.mouseEnter(trigger.parentElement as HTMLElement);
      return trigger;
    }

    it("closes on Escape without moving the pointer or focus", () => {
      const trigger = open();
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      expect(trigger).toBeInTheDocument();
    });

    it("leaves other keys alone", () => {
      open();

      fireEvent.keyDown(document, { key: "a" });

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    /**
     * These transitions carry `relatedTarget` because that is what decides the
     * outcome. React propagates enter and leave through the portal, so a hop
     * straight from the trigger onto the content never leaves the component and
     * needs no help. What breaks is the 8px gap, where the pointer passes over
     * the body on the way across.
     */
    it("stays open while the pointer crosses the gap to the tooltip", () => {
      const trigger = open();
      const tooltip = screen.getByRole("tooltip");

      fireEvent.mouseOut(trigger, { relatedTarget: document.body });
      act(() => {
        vi.advanceTimersByTime(60);
      });
      fireEvent.mouseOver(tooltip, { relatedTarget: document.body });
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("closes once the pointer leaves the tooltip too", () => {
      const trigger = open();
      const tooltip = screen.getByRole("tooltip");

      fireEvent.mouseOut(trigger, { relatedTarget: document.body });
      fireEvent.mouseOver(tooltip, { relatedTarget: document.body });
      fireEvent.mouseOut(tooltip, { relatedTarget: document.body });
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("closes when the pointer leaves the trigger and goes nowhere near it", () => {
      const trigger = open();

      fireEvent.mouseOut(trigger, { relatedTarget: document.body });
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("stays open while the trigger is still hovered", () => {
      open();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });
  });
  /**
   * The content is `position: fixed` in a portal, so it does not travel with
   * the trigger the way an absolutely positioned child would. Anything that
   * moves the trigger under the viewport has to be measured again, or the
   * tooltip points at where the trigger used to be.
   *
   * The trigger's box is stubbed because jsdom lays nothing out: every real
   * `getBoundingClientRect` here is zero, which makes every placement identical
   * and every one of these assertions vacuous.
   */
  describe("anchoring", () => {
    let triggerTop = 300;

    function box(top: number, height: number, left: number, width: number): DOMRect {
      return {
        top,
        bottom: top + height,
        height,
        left,
        right: left + width,
        width,
        x: left,
        y: top,
        toJSON: () => ({}),
      } as DOMRect;
    }

    beforeEach(() => {
      triggerTop = 300;
      vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
        this: Element,
      ) {
        return this.classList.contains("tooltip__content")
          ? box(0, 40, 0, 120)
          : box(triggerTop, 20, 100, 60);
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    function open() {
      render(
        <Tooltip content="Helpful hint">
          <span>Trigger</span>
        </Tooltip>,
      );
      fireEvent.mouseEnter(screen.getByText("Trigger").parentElement as HTMLElement);
      return screen.getByRole("tooltip");
    }

    it("places the tooltip above the trigger when there is room", () => {
      const tooltip = open();

      // 300 (trigger top) - 40 (tooltip height) - 8 (gap)
      expect(tooltip.style.top).toBe("252px");
      expect(tooltip).toHaveClass("tooltip__content--top");
    });

    it("follows the trigger when the page scrolls under it", () => {
      const tooltip = open();
      expect(tooltip.style.top).toBe("252px");

      triggerTop = 100;
      fireEvent.scroll(window);

      expect(tooltip.style.top).toBe("52px");
    });

    it("follows a scroll on a container between the two", () => {
      const tooltip = open();
      const trigger = screen.getByText("Trigger");

      triggerTop = 500;
      // Container scrolls do not bubble, so this only arrives in the capture phase.
      fireEvent.scroll(trigger);

      expect(tooltip.style.top).toBe("452px");
    });

    it("re-places on resize", () => {
      const tooltip = open();

      triggerTop = 20;
      fireEvent(window, new Event("resize"));

      // No room above for the tooltip plus its margin, so it flips below.
      expect(tooltip.style.top).toBe("48px");
      expect(tooltip).toHaveClass("tooltip__content--bottom");
    });
  });
});

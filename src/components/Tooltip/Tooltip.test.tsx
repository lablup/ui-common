/**
 * Tooltip Component Tests
 *
 * Tests cover:
 * - Rendering the trigger (children) without showing the tooltip initially
 * - Showing/hiding on mouse hover
 * - Showing/hiding on keyboard focus (WCAG 1.4.13)
 * - String content wrapped in a paragraph vs. ReactNode content rendered directly
 * - aria-describedby association while visible
 * - Custom className, contentClassName, tooltipId, and tabIndex
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

      await user.unhover(screen.getByText("Trigger"));
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
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
});

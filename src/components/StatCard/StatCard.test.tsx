/**
 * Unit tests for the StatCard common primitive.
 *
 * Covers the small behavioural surface — render, value coercion, suffix,
 * trend, loading skeleton, tone class, and click handling — to lock in
 * the public contract used by SquadDashboardStats and other dashboards.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { StatCard } from "./StatCard";
import { formatCompactNumber } from "./formatters";

describe("StatCard", () => {
  it("renders the label and numeric value with locale formatting", () => {
    render(<StatCard label="Active agents" value={1234} />);
    expect(screen.getByText("Active agents")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("renders an optional suffix next to the value", () => {
    render(<StatCard label="Agents" value={2} valueSuffix="/ 4" />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("/ 4")).toBeInTheDocument();
  });

  it("renders a hint underneath the value", () => {
    render(<StatCard label="Tokens" value="0" hint="No agents have run yet" />);
    expect(screen.getByText("No agents have run yet")).toBeInTheDocument();
  });

  it("applies the requested tone modifier class", () => {
    const { container } = render(
      <StatCard label="Approvals" value={3} tone="warning" testId="approvals" />,
    );
    const root = container.querySelector('[data-testid="approvals"]');
    expect(root).toHaveClass("stat-card--tone-warning");
  });

  it("renders a trend indicator with direction-specific class", () => {
    render(
      <StatCard label="Trend" value={42} trend={{ direction: "up", label: "+12%" }} />,
    );
    expect(screen.getByText("+12%")).toBeInTheDocument();
    // Trend wrapper has direction class
    const trend = screen.getByText("+12%").parentElement;
    expect(trend).toHaveClass("stat-card__trend--up");
  });

  it("renders a skeleton placeholder when loading", () => {
    const { container } = render(<StatCard label="Loading" value={99} loading />);
    expect(screen.queryByText("99")).not.toBeInTheDocument();
    // Skeleton component renders a div with class "skeleton"
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Loading" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Loading: 99")).not.toBeInTheDocument();
  });

  it("invokes onClick when activated", () => {
    const onClick = vi.fn();
    render(
      <StatCard label="Clickable" value={1} onClick={onClick} testId="clickable" />,
    );
    fireEvent.click(screen.getByTestId("clickable"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses an aria-label composed from label + value by default", () => {
    render(<StatCard label="Squads" value={5} valueSuffix=" total" />);
    expect(screen.getByLabelText("Squads: 5 total")).toBeInTheDocument();
  });

  // ── Coverage migrated from the retired Statistics-local StatCard ────────

  describe("formatCompactNumber", () => {
    it("abbreviates millions and thousands, and groups below 1000", () => {
      expect(formatCompactNumber(1_500_000)).toBe("1.5M");
      expect(formatCompactNumber(1_500)).toBe("1.5K");
      expect(formatCompactNumber(999)).toBe("999");
    });
  });

  describe("format prop", () => {
    it("applies a custom formatter to numeric values", () => {
      render(
        <StatCard
          label="Latency"
          value={1500}
          format={(v) => `${(v / 1000).toFixed(1)}s`}
        />,
      );
      expect(screen.getByText("1.5s")).toBeInTheDocument();
    });

    it("leaves string values untouched", () => {
      render(<StatCard label="Status" value="N/A" format={() => "nope"} />);
      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("is reflected in the composed aria-label", () => {
      render(<StatCard label="Calls" value={1_500_000} format={formatCompactNumber} />);
      expect(screen.getByLabelText("Calls: 1.5M")).toBeInTheDocument();
    });
  });

  describe("emphasis", () => {
    it("adds no modifier class for the default emphasis", () => {
      const { container } = render(<StatCard label="A" value={1} />);
      const card = container.querySelector(".stat-card");
      expect(card).not.toHaveClass("stat-card--prominent");
      expect(card).not.toHaveClass("stat-card--compact");
    });

    it.each(["prominent", "compact"] as const)(
      "adds the %s modifier class",
      (emphasis) => {
        const { container } = render(
          <StatCard label="A" value={1} emphasis={emphasis} />,
        );
        expect(container.querySelector(".stat-card")).toHaveClass(
          `stat-card--${emphasis}`,
        );
      },
    );
  });

  describe("long value truncation", () => {
    /**
     * `.stat-card` sets `overflow: hidden` so the corner accent follows the
     * rounded corner, which means a value wider than the card is cut off with
     * no sign that anything was cut. The card cannot grow out of it either: a
     * grid track with a px floor keeps its floor whatever the content length.
     *
     * jsdom does no layout, so there is no width to assert on. It does apply
     * the stylesheet, though, which is enough: these read the value back
     * through the cascade, so they fail if the declarations are removed from
     * `StatCard.css` and also if a later rule overrides them. `overflow` is
     * read as the shorthand deliberately, because jsdom does not expand it
     * into `overflow-x` and `overflow-y`.
     */
    const TRUNCATION = {
      minWidth: "0px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    } as const;

    function truncationOf(container: HTMLElement) {
      const value = container.querySelector(".stat-card__value");
      if (!(value instanceof HTMLElement)) {
        throw new Error("no .stat-card__value rendered");
      }
      const style = getComputedStyle(value);
      return {
        minWidth: style.minWidth,
        overflow: style.overflow,
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
      };
    }

    it("ellipsises a value too long for its card", () => {
      const { container } = render(
        <StatCard label="Spend" value="$1,234,567,890.12" />,
      );
      expect(truncationOf(container)).toEqual(TRUNCATION);
    });

    // `prominent` enlarges the value, so it reaches the card edge sooner than
    // the default does. Both variants change font-size and nothing else, and
    // these fail if either ever grows a rule that drops the truncation.
    it.each(["prominent", "compact"] as const)(
      "keeps the truncation under emphasis=%s",
      (emphasis) => {
        const { container } = render(
          <StatCard label="Spend" value="$1,234,567,890.12" emphasis={emphasis} />,
        );
        expect(truncationOf(container)).toEqual(TRUNCATION);
      },
    );
  });

  describe("sparkline slot", () => {
    it("renders the provided node", () => {
      render(
        <StatCard label="Calls" value={10} sparkline={<svg data-testid="spark" />} />,
      );
      expect(screen.getByTestId("spark")).toBeInTheDocument();
    });

    it("omits the wrapper entirely when no sparkline is passed", () => {
      const { container } = render(<StatCard label="Calls" value={10} />);
      expect(container.querySelector(".stat-card__value-line")).not.toBeInTheDocument();
    });

    it("is not rendered while loading", () => {
      render(
        <StatCard
          label="Calls"
          value={10}
          loading
          sparkline={<svg data-testid="spark" />}
        />,
      );
      expect(screen.queryByTestId("spark")).not.toBeInTheDocument();
    });
  });

  describe("animate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("renders the settled value immediately when animation is off", () => {
      render(<StatCard label="Calls" value={4200} />);
      expect(screen.getByText("4,200")).toBeInTheDocument();
    });

    it("counts up to the target and settles there", () => {
      render(<StatCard label="Calls" value={4200} animate />);
      // The first frame has not run, so the counter starts below the target.
      expect(screen.queryByText("4,200")).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("4,200")).toBeInTheDocument();
    });

    it("keeps the aria-label on the settled value while counting", () => {
      render(<StatCard label="Calls" value={4200} animate />);
      expect(screen.getByLabelText("Calls: 4,200")).toBeInTheDocument();
    });
  });
  /**
   * A stat label is not always plain text. The case this exists for is a
   * glossary term: the label carries its own definition on hover and focus,
   * which is a node, while the card's accessible name has to stay a string.
   */
  describe("labelNode", () => {
    it("renders the node in place of the label text", () => {
      render(
        <StatCard
          label="TTFT p50"
          labelNode={<abbr title="Time to first token">TTFT p50</abbr>}
          value={128}
        />,
      );

      const label = document.querySelector(".stat-card__label");
      expect(label?.querySelector("abbr")).toHaveAttribute(
        "title",
        "Time to first token",
      );
    });

    it("still takes the accessible name from the label string", () => {
      render(
        <StatCard
          label="TTFT p50"
          labelNode={<span>ignored for naming</span>}
          value={128}
        />,
      );

      expect(screen.getByLabelText("TTFT p50: 128")).toBeInTheDocument();
    });

    it("falls back to the label text when no node is given", () => {
      render(<StatCard label="TTFT p50" value={128} />);

      expect(screen.getByText("TTFT p50")).toHaveClass("stat-card__label");
    });
  });
});

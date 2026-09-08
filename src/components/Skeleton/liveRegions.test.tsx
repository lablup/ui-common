/**
 * One loading affordance is one live region.
 *
 * `role="status"` is an implicit polite live region. Every composite here
 * renders a named container and fills it with `Skeleton` primitives, and until
 * `decorative` existed each of those primitives carried its own role: a
 * `SkeletonCard` mounted seven live regions for one wait, a pie
 * `SkeletonChart` ten. `SkeletonCard`, `SkeletonRow` and `SkeletonText` made it
 * worse by forwarding `loadingLabel` to the children while leaving the
 * container anonymous, so the region that should be announced had no name and
 * the ones that should be silent all had the caller's.
 *
 * These live in their own file rather than in the five component suites
 * because the property is about the set: the count is what matters, and every
 * one of those suites passed while it was wrong.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Skeleton } from "./Skeleton";
import { SkeletonCard } from "./SkeletonCard";
import { SkeletonChart } from "./SkeletonChart";
import { SkeletonRow } from "./SkeletonRow";
import { SkeletonText } from "./SkeletonText";

describe("one live region per placeholder", () => {
  it.each([
    ["SkeletonChart, bar", <SkeletonChart key="c" variant="bar" />],
    ["SkeletonChart, pie", <SkeletonChart key="c" variant="pie" />],
    ["SkeletonChart, line", <SkeletonChart key="c" variant="line" />],
    ["SkeletonCard, default", <SkeletonCard key="c" />],
    ["SkeletonCard, compact", <SkeletonCard key="c" variant="compact" />],
    ["SkeletonCard, stat", <SkeletonCard key="c" variant="stat" />],
    ["SkeletonText", <SkeletonText key="c" lines={4} />],
    ["SkeletonRow", <SkeletonRow key="c" showAvatar showActions />],
  ])("%s renders exactly one", (_name, element) => {
    render(element);

    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  /**
   * `SkeletonRow` renders a fragment with no wrapper on purpose, so rows stay
   * direct children of the caller's list or table. `count` therefore means
   * rows, and each row is its own placeholder.
   */
  it("SkeletonRow counts one region per row", () => {
    render(<SkeletonRow count={3} />);

    expect(screen.getAllByRole("status")).toHaveLength(3);
  });
});

describe("the container carries the name", () => {
  it.each([
    ["SkeletonChart", <SkeletonChart key="c" loadingLabel="Fetching series" />],
    ["SkeletonCard", <SkeletonCard key="c" loadingLabel="Fetching series" />],
    ["SkeletonText", <SkeletonText key="c" loadingLabel="Fetching series" />],
    ["SkeletonRow", <SkeletonRow key="c" loadingLabel="Fetching series" />],
  ])("%s announces the caller's label once", (_name, element) => {
    render(element);

    // Exact-name `getByRole` is the query a consumer writes. It used to find
    // several nodes, or none, depending on which composite it was aimed at.
    expect(screen.getByRole("status", { name: "Fetching series" })).toBeInTheDocument();
  });

  it("names the composites that used to render an anonymous region", () => {
    render(<SkeletonCard />);

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });
});

describe("the standalone primitive is unchanged", () => {
  it("is its own live region when nothing wraps it", () => {
    render(<Skeleton loadingLabel="Loading avatar" />);

    expect(screen.getByRole("status", { name: "Loading avatar" })).toBeInTheDocument();
  });

  it("leaves the tree only when asked", () => {
    const { container } = render(<Skeleton decorative testId="shape" />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    const shape = container.querySelector('[data-testid="shape"]');
    expect(shape).toHaveAttribute("aria-hidden", "true");
    // Still a shimmer of the right size: decoration, not absence.
    expect(shape).toHaveClass("skeleton");
    expect(shape?.querySelector(".skeleton__shimmer")).not.toBeNull();
  });
});

/**
 * ui-common's tests for its RadialChart fork: the fix it carries (the chart
 * renders at its container's width in the commit that mounts it, and in the
 * ResizeObserver callback that reports a new width, never a frame later), and
 * that everything else renders exactly as lab's does.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import {
  RadialAxis as UpstreamRadialAxis,
  RadialChart as UpstreamRadialChart,
  RadialGrid as UpstreamRadialGrid,
  RadialSlice as UpstreamRadialSlice,
} from "@astryxdesign/lab";

import { comparableMarkup } from "../../test/forkParity";
import { RadialAxis } from "./RadialAxis";
import { RadialChart } from "./RadialChart";
import { RadialGrid } from "./RadialGrid";
import { RadialSlice } from "./RadialSlice";

const pieData = [
  { region: "NA", revenue: 60 },
  { region: "EU", revenue: 40 },
];

const spiderData = [
  { name: "modelA", speed: 8, handling: 6, comfort: 7 },
  { name: "modelB", speed: 5, handling: 9, comfort: 6 },
];

type Impl = {
  Chart: typeof RadialChart;
  Grid: typeof RadialGrid;
  Axis: typeof RadialAxis;
  Slice: typeof RadialSlice;
};

const fork: Impl = {
  Chart: RadialChart,
  Grid: RadialGrid,
  Axis: RadialAxis,
  Slice: RadialSlice,
};

const upstream: Impl = {
  Chart: UpstreamRadialChart as typeof RadialChart,
  Grid: UpstreamRadialGrid as typeof RadialGrid,
  Axis: UpstreamRadialAxis as typeof RadialAxis,
  Slice: UpstreamRadialSlice as typeof RadialSlice,
};

function Donut({ impl, height = 300 }: { impl: Impl; height?: number }) {
  const { Chart, Slice } = impl;
  return (
    <Chart
      data={pieData}
      valueKey="revenue"
      labelKey="region"
      innerRadius={0.6}
      height={height}
    >
      <Slice colors={["#111111", "#222222"]} />
    </Chart>
  );
}

// The ResizeObserver callbacks, so a test can report a width the way the
// browser does: outside React, before the frame paints.
let resizeCallbacks: ResizeObserverCallback[] = [];
let measuredWidth = 0;

function reportWidth(width: number) {
  for (const callback of resizeCallbacks) {
    callback(
      [{ contentRect: { width } } as unknown as ResizeObserverEntry],
      {} as ResizeObserver,
    );
  }
}

beforeEach(() => {
  resizeCallbacks = [];
  measuredWidth = 0;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(cb: ResizeObserverCallback) {
        resizeCallbacks.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  // jsdom lays nothing out; the container measures as `measuredWidth`.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () => ({ width: measuredWidth }) as DOMRect,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RadialChart fork: mount", () => {
  it("draws at the container's width in the commit that mounts it", () => {
    measuredWidth = 480;
    const { container } = render(<Donut impl={fork} />);

    const svg = screen.getByRole("img");
    expect(svg).toHaveAttribute("width", "480");
    expect(container.querySelectorAll("path")).toHaveLength(pieData.length);
  });

  it("still renders nothing while the container has no width", () => {
    render(<Donut impl={fork} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  // When this fails, lab has shipped the fix: delete the fork and its
  // exports.exclude.json entry (CONTRIBUTING, "Forks of Astryx components").
  it("still differs from lab's, which mounts empty until the observer reports", () => {
    measuredWidth = 480;
    render(<Donut impl={upstream} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("RadialChart fork: resize", () => {
  // A ResizeObserver callback is not a React event: the update it makes is
  // not batched into act(), so React's test-environment warning is off here.
  const actEnvironment = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  let previous: boolean | undefined;
  beforeEach(() => {
    previous = actEnvironment.IS_REACT_ACT_ENVIRONMENT;
  });
  afterEach(() => {
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = previous;
  });

  function mountAt(impl: Impl, width: number) {
    measuredWidth = width;
    const view = render(<Donut impl={impl} />);
    act(() => reportWidth(width));
    actEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
    return view;
  }

  it("commits a reported width before the observer callback returns", () => {
    const { container } = mountAt(fork, 480);
    const before = container.querySelector("path")!.getAttribute("d");

    reportWidth(720);

    expect(screen.getByRole("img")).toHaveAttribute("width", "720");
    expect(container.querySelector("path")!.getAttribute("d")).not.toBe(before);
  });

  // As above: lab's update lands only after the frame has painted.
  it("still differs from lab's, which commits it later", async () => {
    mountAt(upstream, 480);

    reportWidth(720);

    expect(screen.getByRole("img")).toHaveAttribute("width", "480");
    await vi.waitFor(() =>
      expect(screen.getByRole("img")).toHaveAttribute("width", "720"),
    );
  });
});

describe("RadialChart fork: parity with lab", () => {
  it("renders lab's markup in pie mode", () => {
    const forkView = render(<Donut impl={fork} />);
    const upstreamView = render(<Donut impl={upstream} />);
    act(() => reportWidth(500));
    expect(comparableMarkup(upstreamView.container)).toContain("<svg");
    expect(comparableMarkup(forkView.container)).toBe(
      comparableMarkup(upstreamView.container),
    );
  });

  it("renders lab's markup in spider mode", () => {
    function Spider({ impl }: { impl: Impl }) {
      const { Chart, Grid, Axis } = impl;
      return (
        <Chart data={spiderData} axes={["speed", "handling", "comfort"]} height={300}>
          <Grid rings={4} />
          <Axis />
        </Chart>
      );
    }
    measuredWidth = 500;
    const forkView = render(<Spider impl={fork} />);
    const upstreamView = render(<Spider impl={upstream} />);
    act(() => reportWidth(500));
    expect(comparableMarkup(upstreamView.container)).toContain("<svg");
    expect(comparableMarkup(forkView.container)).toBe(
      comparableMarkup(upstreamView.container),
    );
  });
});

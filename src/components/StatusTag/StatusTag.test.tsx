/**
 * Tests for `StatusTag` (epic #2730 / issue #2738).
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusTag } from "./StatusTag";

describe("StatusTag", () => {
  it("renders the provided label", () => {
    render(<StatusTag state="running" label="Running" />);
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("applies a state-specific class", () => {
    const { container } = render(<StatusTag state="error" label="Error" />);
    expect(container.querySelector(".status-tag--error")).toBeInTheDocument();
  });

  it("renders the pulse indicator for transient states by default", () => {
    render(<StatusTag state="preparing" label="Starting" />);
    expect(screen.queryByTestId("status-tag-indicator")).toBeInTheDocument();
  });

  it("hides the pulse indicator for terminal states by default", () => {
    render(<StatusTag state="terminated" label="Terminated" />);
    expect(screen.queryByTestId("status-tag-indicator")).not.toBeInTheDocument();
  });

  it("respects an explicit `pulse={false}` override", () => {
    render(<StatusTag state="preparing" label="Starting" pulse={false} />);
    expect(screen.queryByTestId("status-tag-indicator")).not.toBeInTheDocument();
  });
});

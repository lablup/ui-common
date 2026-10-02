import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@astryxdesign/core/Toast", async () => ({
  ...(await vi.importActual<typeof import("@astryxdesign/core/Toast")>("@astryxdesign/core/Toast")),
  ToastViewport: () => null,
}));

import { App } from "./App";

describe("App", () => {
  it("renders", () => {
    render(<App />);
    expect(screen.getByText("Metrics")).toBeTruthy();
  });
});

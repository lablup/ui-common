import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@lablup/ui-common/Toast", async () => ({
  ...(await vi.importActual<typeof import("@lablup/ui-common/Toast")>("@lablup/ui-common/Toast")),
  ToastViewport: () => null,
}));

import { App } from "./App";

describe("App", () => {
  it("renders", () => {
    render(<App />);
    expect(screen.getByText("Metrics")).toBeTruthy();
  });
});

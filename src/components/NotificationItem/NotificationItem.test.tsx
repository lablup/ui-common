import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { NotificationItem } from "./NotificationItem";

describe("NotificationItem", () => {
  it("renders every slot in order", () => {
    const { container } = render(
      <NotificationItem
        title="Upload finished"
        description="report.csv"
        action={<button type="button">Open</button>}
        footer="2 minutes ago"
      />,
    );
    const text = container.textContent ?? "";
    expect(text.indexOf("Upload finished")).toBeLessThan(text.indexOf("report.csv"));
    expect(text.indexOf("report.csv")).toBeLessThan(text.indexOf("Open"));
    expect(text.indexOf("Open")).toBeLessThan(text.indexOf("2 minutes ago"));
    expect(
      screen.getByText("Upload finished").closest(".uic-notification-item__title"),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Open" })
        .closest(".uic-notification-item__action"),
    ).not.toBeNull();
    expect(
      screen.getByText("2 minutes ago").closest(".uic-notification-item__footer"),
    ).not.toBeNull();
  });

  it("leaves out empty slots", () => {
    const { container } = render(<NotificationItem description="Only this" />);
    expect(container.querySelector(".uic-notification-item__title")).toBeNull();
    expect(container.querySelector(".uic-notification-item__action")).toBeNull();
    expect(container.querySelector(".uic-notification-item__footer")).toBeNull();
    expect(screen.getByText("Only this")).toBeInTheDocument();
  });

  it("wraps strings and numbers in Text and renders nodes as is", () => {
    render(
      <NotificationItem
        title={42}
        description={<strong data-testid="node">bold</strong>}
      />,
    );
    expect(screen.getByText("42").closest(".astryx-text")).not.toBeNull();
    expect(screen.getByTestId("node").closest(".astryx-text")).toBeNull();
  });

  it("adds a class name to the root", () => {
    const { container } = render(<NotificationItem title="A" className="extra" />);
    expect(container.firstElementChild).toHaveClass("uic-notification-item", "extra");
  });
});

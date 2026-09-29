import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ListBanner } from "./ListBanner";

describe("ListBanner", () => {
  it("renders the title and one list item per item", () => {
    render(
      <ListBanner
        status="warning"
        title="Following users will be updated"
        items={[
          { key: "1", content: "a@example.com" },
          { key: "2", content: "b@example.com" },
        ]}
      />,
    );
    expect(screen.getByText("Following users will be updated")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("caps the list at 165px by default, and at maxHeight when given", () => {
    const { unmount } = render(
      <ListBanner status="info" title="t" items={[{ content: "x" }]} />,
    );
    expect(
      screen.getByRole("list").style.getPropertyValue("--list-banner-max-height"),
    ).toBe("165px");
    unmount();

    render(
      <ListBanner status="info" title="t" maxHeight={80} items={[{ content: "x" }]} />,
    );
    const list = screen.getByRole("list");
    expect(list.style.getPropertyValue("--list-banner-max-height")).toBe("80px");
    expect(list).toHaveClass("uic-list-banner__list");
    expect(list).toHaveAttribute("tabindex", "0");
  });

  it("puts the list in the title slot when there is no title", () => {
    render(
      <ListBanner
        status="info"
        items={[{ content: "first" }, { content: "second" }]}
      />,
    );
    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  it("renders no list without items", () => {
    render(<ListBanner status="info" title="Nothing" items={[]} />);
    expect(screen.queryByRole("list")).toBeNull();
  });
});

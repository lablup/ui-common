import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { TokenRow } from "./TokenRow";

const itemsOf = (...labels: string[]) => labels.map((label) => ({ key: label, label }));

describe("TokenRow", () => {
  it("renders every item and no count while the list fits", () => {
    render(<TokenRow items={itemsOf("alpha", "beta", "gamma")} />);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("gamma")).toBeInTheDocument();
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it("stops at maxCount and counts the rest", () => {
    render(<TokenRow items={itemsOf("alpha", "beta", "gamma", "delta", "eps")} />);
    expect(screen.getByText("gamma")).toBeInTheDocument();
    expect(screen.queryByText("delta")).not.toBeInTheDocument();
    expect(screen.getByText("and 2 more")).toBeInTheDocument();
  });

  it("counts against totalCount when items are a fetched page", () => {
    render(<TokenRow items={itemsOf("alpha", "beta", "gamma")} totalCount={12} />);
    expect(screen.getByText("and 9 more")).toBeInTheDocument();
  });

  it("never reports a negative remainder", () => {
    render(<TokenRow items={itemsOf("alpha", "beta", "gamma")} totalCount={1} />);
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it("renders each item as a Token in the given colour", () => {
    const { container } = render(
      <TokenRow items={itemsOf("alpha", "beta")} color="blue" />,
    );
    const tokens = container.querySelectorAll(".astryx-token");
    expect(tokens).toHaveLength(2);
    tokens.forEach((el) => expect(el).toHaveAttribute("data-color", "blue"));
  });

  it("falls back to emptyText with nothing to show", () => {
    const { container } = render(<TokenRow items={[]} emptyText="none" />);
    expect(container).toHaveTextContent("none");
  });

  it("takes an explicit count label and passes attributes to the row", () => {
    const { container } = render(
      <TokenRow
        items={itemsOf("a", "b")}
        maxCount={1}
        moreLabel={(count) => `+${count}`}
        className="extra"
        data-testid="row"
      />,
    );
    expect(screen.getByText("+1")).toBeInTheDocument();
    const row = container.firstElementChild as HTMLElement;
    expect(row).toHaveClass("uic-token-row", "extra");
    expect(row).toHaveAttribute("data-testid", "row");
  });

  it("takes its count from the shipped translations", () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <TokenRow items={itemsOf("a", "b", "c")} maxCount={1} />
      </InternationalizationProvider>,
    );
    expect(screen.getByText("외 2개")).toBeInTheDocument();
  });
});

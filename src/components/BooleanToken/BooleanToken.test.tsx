import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { BooleanToken } from "./BooleanToken";

describe("BooleanToken", () => {
  it("renders true as a green token", () => {
    const { container } = render(<BooleanToken value />);
    expect(screen.getByText("True")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("data-color", "green");
  });

  it("renders false as a default token", () => {
    const { container } = render(<BooleanToken value={false} />);
    expect(screen.getByText("False")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("data-color", "default");
  });

  it("takes explicit labels over the catalog", () => {
    const { rerender } = render(
      <BooleanToken value trueLabel="Enabled" falseLabel="Disabled" />,
    );
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    rerender(<BooleanToken value={false} trueLabel="Enabled" falseLabel="Disabled" />);
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("renders the fallback for a value that is not a boolean", () => {
    const { container, rerender } = render(<BooleanToken value={null} />);
    expect(container).toHaveTextContent("-");
    rerender(<BooleanToken value={undefined} fallback={<em>unknown</em>} />);
    expect(screen.getByText("unknown").tagName).toBe("EM");
  });

  it("takes its default labels from the shipped translations", () => {
    render(
      <InternationalizationProvider locale="ko-KR" messages={uiCommonMessages}>
        <BooleanToken value />
        <BooleanToken value={false} />
      </InternationalizationProvider>,
    );
    expect(screen.getByText("예")).toBeInTheDocument();
    expect(screen.getByText("아니요")).toBeInTheDocument();
  });
});

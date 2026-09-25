import { render } from "@testing-library/react";
import { vi } from "vitest";
import { ModelsPage } from "./ModelsPage";

vi.mock("@lablup/ui-common", async (importOriginal) => ({
  ...(await importOriginal()),
  StatCard: () => null,
}));

it("marks the primary action", () => {
  const { container } = render(<ModelsPage models={[]} onOpen={() => {}} />);
  expect(container.querySelector(".button--primary")).not.toBeNull();
  expect(container.firstChild).toHaveClass("page-layout");
});

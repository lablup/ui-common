import { render } from "@testing-library/react";
import { Select } from "./index";

it("opens", () => {
  const { container } = render(<Select value="a" onChange={() => {}} options={[]} />);
  const trigger = container.querySelector(".select__trigger");
  expect(trigger).not.toBeNull();
});

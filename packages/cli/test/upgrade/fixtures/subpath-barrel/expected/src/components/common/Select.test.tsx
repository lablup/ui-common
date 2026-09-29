import { render } from "@testing-library/react";
import { Select } from "./index";

it("opens", () => {
  // TODO(ui-common-upgrade): `label` is required and is a string; a node label needs a string for the accessible name.
  const { container } = render(<Select value="a" onChange={() => {}} options={[]} />);
  const trigger = container.querySelector(".select__trigger");
  expect(trigger).not.toBeNull();
});

import { render } from "@testing-library/react";
import { TextInput } from "@lablup/ui-common";

it("renders a disabled field", () => {
  render(<TextInput label="Name" isLabelHidden isDisabled />);
});

/**
 * `labelExtra` renders in the label row but outside the `<label>`, so its
 * actions stay out of the control's accessible name and never trigger label
 * activation.
 */
import FormItemVisual from "./FormItemVisual";
import { Form } from "./index";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("FormItemVisual — labelExtra", () => {
  it("renders the slot in the label row, outside the <label>", () => {
    render(
      <FormItemVisual
        label="Environments"
        labelExtra={<button type="button">Filter</button>}
      >
        <input aria-label="environment" />
      </FormItemVisual>,
    );
    const button = screen.getByRole("button", { name: "Filter" });
    const slot = button.closest(".uic-form-item__label-extra");
    expect(slot).not.toBeNull();
    expect(button.closest("label")).toBeNull();
    const labelCol = slot?.closest(".uic-form-item__label-col");
    expect(labelCol?.hasAttribute("data-has-label-extra")).toBe(true);
    expect(labelCol?.querySelector("label")?.textContent).toBe("Environments");
  });

  it("keeps the slot out of the control's accessible name", () => {
    render(
      <Form>
        <Form.Item
          name="environment"
          label="Environments"
          labelExtra={<button type="button">Filter</button>}
        >
          <input />
        </Form.Item>
      </Form>,
    );
    expect(screen.getByRole("textbox", { name: "Environments" })).not.toBeNull();
  });

  it("is forwarded by Form.Item", () => {
    render(
      <Form>
        <Form.Item
          name="environment"
          label="Environments"
          labelExtra={<button type="button">Filter</button>}
        >
          <input aria-label="environment" />
        </Form.Item>
      </Form>,
    );
    const button = screen.getByRole("button", { name: "Filter" });
    expect(button.closest(".uic-form-item__label-extra")).not.toBeNull();
  });

  it("keeps the colon on the slot by default", () => {
    render(
      <FormItemVisual
        layout="horizontal"
        label="Environments"
        labelExtra={<button type="button">Filter</button>}
      >
        <input aria-label="environment" />
      </FormItemVisual>,
    );
    const slot = document.querySelector(".uic-form-item__label-extra");
    expect(slot?.hasAttribute("data-no-colon")).toBe(false);
  });

  it("marks the slot as colon-less when the item has no colon", () => {
    render(
      <FormItemVisual
        layout="horizontal"
        colon={false}
        label="Environments"
        labelExtra={<button type="button">Filter</button>}
      >
        <input aria-label="environment" />
      </FormItemVisual>,
    );
    const slot = document.querySelector(".uic-form-item__label-extra");
    expect(slot?.hasAttribute("data-no-colon")).toBe(true);
  });

  it("renders no slot without a label", () => {
    render(
      <FormItemVisual labelExtra={<button type="button">Filter</button>}>
        <input aria-label="environment" />
      </FormItemVisual>,
    );
    expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
  });

  it.each([undefined, null, false])(
    "renders no slot for labelExtra=%s",
    (labelExtra) => {
      render(
        <FormItemVisual label="Environments" labelExtra={labelExtra}>
          <input aria-label="environment" />
        </FormItemVisual>,
      );
      expect(document.querySelector(".uic-form-item__label-extra")).toBeNull();
      expect(
        document
          .querySelector(".uic-form-item__label-col")
          ?.hasAttribute("data-has-label-extra"),
      ).toBe(false);
    },
  );

  // jsdom drops `@layer`, so the layout contract is read from the source.
  it("spreads the row and unclips the focus ring in vertical layout", () => {
    const css = readFileSync(join(__dirname, "FormItemVisual.css"), "utf8");
    expect(css).toMatch(
      /\[data-layout="vertical"\]\s+\.uic-form-item__label-col\[data-has-label-extra\]\s*\{[^}]*justify-content:\s*space-between;[^}]*overflow:\s*visible;/,
    );
  });
});

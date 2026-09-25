/**
 * `astryx component ColorPicker` (and `ui-common component ColorPicker`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "ColorPicker",
  displayName: "ColorPicker",
  import: "@lablup/ui-common",
  category: "Inputs",
  keywords: ["color", "colour", "picker", "hex", "swatch", "theme", "accent"],
  description:
    "A hex colour field: a swatch trigger with Astryx field chrome opens a Popover holding the platform's <input type=color> and a hex TextInput, and optionally a clear button. The value is #rrggbb on both edges (toHexColor also accepts #rgb, #rrggbbaa, rgb() and rgba()). onChange fires on the settled colour, not while dragging. No alpha, no presets.",
  props: [
    {
      name: "value",
      type: "string | null",
      description: "The colour. An unparseable value renders as unset.",
    },
    {
      name: "onChange",
      type: "(hex: string) => void",
      description:
        "Fires with #rrggbb when the user settles on a colour: the native input's change event, or a complete hex in the field.",
    },
    {
      name: "hasValueLabel",
      type: "boolean",
      description: "Shows the hex next to the swatch on the trigger.",
    },
    {
      name: "hasClear",
      type: "boolean",
      description: "Offers a clear button in the popover.",
    },
    {
      name: "onClear",
      type: "() => void",
      description: "Fires when the clear button is pressed; the popover closes.",
    },
    {
      name: "isDisabled",
      type: "boolean",
      description: "Disables the trigger and the popover's fields.",
    },
    {
      name: "label",
      type: "string",
      description: "Accessible name of the trigger and the colour area.",
      default: 'the catalog\'s uic.ColorPicker.label ("Select color")',
    },
    {
      name: "hexValueLabel",
      type: "string",
      description: "Hidden label of the hex field.",
      default: 'the catalog\'s uic.ColorPicker.hexValue ("Hex value")',
    },
    {
      name: "clearLabel",
      type: "string",
      description: "The clear button's label.",
      default: 'the catalog\'s uic.ColorPicker.clear ("Clear")',
    },
    {
      name: "noColorLabel",
      type: "string",
      description: "Shown on the trigger with hasValueLabel when there is no colour.",
      default: 'the catalog\'s uic.ColorPicker.noColor ("No color")',
    },
    {
      name: "data-testid",
      type: "string",
      description:
        "Test id of the trigger; the area, hex field, clear button and value label get <id>-area, -hex, -clear and -value.",
    },
  ],
  usage: {
    description:
      "A theme or branding setting where the colour is stored as hex and written once per choice. className and style reach the trigger.",
  },
  examples: [
    {
      label: "An accent colour that can be reset",
      code: '<ColorPicker label="Accent" value={accent} onChange={setAccent} hasValueLabel hasClear onClear={() => setAccent(null)} />',
    },
  ],
};

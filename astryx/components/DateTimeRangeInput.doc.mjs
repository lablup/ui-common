/**
 * `astryx component DateTimeRangeInput` (and `ui-common component DateTimeRangeInput`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "DateTimeRangeInput",
  displayName: "DateTimeRangeInput",
  import: "@lablup/ui-common",
  category: "Form Controls",
  keywords: [
    "date",
    "time",
    "datetime",
    "range",
    "period",
    "interval",
    "picker",
    "preset",
    "RangePicker",
    "last 24 hours",
  ],
  description:
    "A start and an end, each a date and (with showTime) a time to the minute, modeled on Ant Design's RangePicker. The trigger is Astryx's input box with one part per end (2026-11-05 09:00 → 2026-11-06 14:00); clicking a part opens the popover on that end, and the part being edited is underlined. The popover holds optional presets, Astryx's range Calendar over two months, and with showTime hour and minute columns and a confirm button. A day click sets the end being edited (the start at 00:00, the end at 23:59 or now on today); confirm moves from the start to the end, then commits both. Without showTime the second day click commits. Days after max, before the start and beyond maxDuration from it are disabled, and a range that is not after its start, ends after max or is longer than maxDuration keeps confirm disabled, so onChange never reports it. A Form.Item control like ui-common's form-control wrappers: the item supplies value, id, disabled and status, and its label names both parts. Use DateTimeInput for one date and time.",
  props: [
    {
      name: "value",
      type: "{ start: ISODateTimeString; end: ISODateTimeString } | null",
      description:
        "The range, as local YYYY-MM-DDTHH:MM strings (DateTimeInput's ISODateTimeString), or null. Unset, the control keeps its own.",
    },
    {
      name: "defaultValue",
      type: "{ start: ISODateTimeString; end: ISODateTimeString } | null",
      description: "The starting range when value is not set.",
    },
    {
      name: "onChange",
      type: "(range: DateTimeRangeInputValue | null, preset?: DateTimeRangeInputPreset) => void",
      description:
        "Fires with the committed range, or null when cleared, and the preset when one was clicked. Never with a range that breaks the bounds.",
    },
    {
      name: "showTime",
      type: "boolean",
      description:
        "Hour and minute columns and a confirm button. Without it the range is dates only: the start gets 00:00, the end 23:59, and the second day click commits.",
      default: "false",
    },
    {
      name: "presets",
      type: "ReadonlyArray<{ label: string; getRange: () => DateTimeRangeInputValue; isRelative?: boolean }>",
      description:
        'Quick picks beside the calendar ("Last 24 hours"); getRange runs when the popover renders and on the click. A preset commits at once and closes the popover; one longer than maxDuration is disabled (min and max are not checked, since a relative preset ends at its own now); the one equal to the value is marked current. isRelative marks a range relative to now, whose label a trigger with isCompactLabel shows.',
    },
    {
      name: "min",
      type: "ISODateTimeString",
      description: "The earliest start allowed. Days before it are disabled.",
    },
    {
      name: "max",
      type: "ISODateTimeString",
      description:
        "The latest end allowed, usually now. Days after it are disabled, and the calendar shows its month on the right.",
    },
    {
      name: "maxDuration",
      type: "number",
      description:
        "The longest range allowed, in milliseconds. Once a start is picked, days beyond it are disabled; a longer draft keeps confirm disabled.",
    },
    {
      name: "hasClear",
      type: "boolean",
      description: "Shows a clear button in the box while a range is set.",
      default: "true",
    },
    {
      name: "size",
      type: "'sm' | 'md'",
      description: "Height of the box; sm fits a card header.",
      default: "'md'",
    },
    {
      name: "isCompactLabel",
      type: "boolean",
      description:
        "While the value came from a preset marked isRelative (and still spans as long as it), the box shows that preset's label instead of the dates, so the caller can keep the range rolling.",
      default: "false",
    },
    {
      name: "isDisabled",
      type: "boolean",
      description:
        "Disables both parts. `disabled`, which <Form disabled> injects, does the same.",
    },
    {
      name: "status",
      type: "'error' | 'warning' | ''",
      description:
        "The border state; inside a Form.Item it follows the item's validation unless set. The message belongs to the item.",
    },
    {
      name: "width",
      type: "number | string",
      description: "Width of the box. Numbers are pixels.",
    },
    {
      name: "aria-label",
      type: "string",
      description:
        "Names the control outside a Form.Item; each part reads it before its own name and value.",
    },
    {
      name: "startPlaceholder",
      type: "string",
      description: "Shown in the start part with no range; also names that part.",
      default: 'the catalog\'s uic.DateTimeRangeInput.startPlaceholder ("Start date")',
    },
    {
      name: "endPlaceholder",
      type: "string",
      description: "Shown in the end part with no range; also names that part.",
      default: 'the catalog\'s uic.DateTimeRangeInput.endPlaceholder ("End date")',
    },
    {
      name: "confirmLabel",
      type: "string",
      description: "The confirm button's label (with showTime).",
      default: 'the catalog\'s uic.common.ok ("OK")',
    },
    {
      name: "data-testid",
      type: "string",
      description:
        "Test id of the box; the parts, calendar, presets, time columns and confirm button get <id>-start, -end, -calendar, -presets, -hour, -minute and -confirm.",
    },
  ],
  usage: {
    description:
      "A dashboard or report period: relative presets for the common windows, minute-precise times when investigating logs, a cap on how long a query may span. className and style reach the box.",
  },
  examples: [
    {
      label: "A dashboard period of at most 7 days, up to now",
      code: 'const DAY = 24 * 60 * 60 * 1000;\n\n<DateTimeRangeInput\n  aria-label="Period"\n  showTime\n  size="sm"\n  isCompactLabel\n  value={range}\n  onChange={setRange}\n  max={now}\n  maxDuration={7 * DAY}\n  presets={[\n    { label: "Last 1 hour", getRange: () => lastHours(1), isRelative: true },\n    { label: "Last 24 hours", getRange: () => lastHours(24), isRelative: true },\n    { label: "Last 7 days", getRange: () => lastHours(7 * 24), isRelative: true },\n  ]}\n/>',
    },
    {
      label: "In a form",
      code: '<Form.Item name="period" label="Period" rules={[{ required: true }]}>\n  <DateTimeRangeInput showTime />\n</Form.Item>',
    },
  ],
};

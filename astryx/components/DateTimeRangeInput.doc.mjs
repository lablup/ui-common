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
    "last 24 hours",
  ],
  description:
    "A range whose start and end each carry a date and a time, to the minute. The trigger is Astryx's input box showing the range compactly (Nov 5, 09:00 - Nov 5, 18:30, the year only when it is not this year); its popover holds Astryx's range Calendar, a TimeInput for each end, optional presets beside them, and Cancel / Apply. Apply commits the draft; a draft that ends before it starts, leaves min / max or is longer than maxDuration says why and cannot be applied, so onChange never reports it. A Form.Item control like ui-common's form-control wrappers: the item supplies value, id, disabled and status, and its label names the trigger. Use DateRangeInput when only dates matter, DateTimeInput for one date and time.",
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
      type: "(range: DateTimeRangeInputValue | null) => void",
      description:
        "Fires with the applied range or a preset's, or null when cleared. Never with a range that breaks the bounds.",
    },
    {
      name: "presets",
      type: "ReadonlyArray<{ label: string; getRange: () => DateTimeRangeInputValue }>",
      description:
        'Quick picks beside the calendar ("Last 24 hours"); getRange runs when the popover renders. A preset applies at once; one that breaks min, max or maxDuration is disabled; the one equal to the value is marked current.',
    },
    {
      name: "min",
      type: "ISODateTimeString",
      description:
        "The earliest start allowed. Days before it are disabled in the calendar.",
    },
    {
      name: "max",
      type: "ISODateTimeString",
      description:
        "The latest end allowed. Days after it are disabled in the calendar.",
    },
    {
      name: "maxDuration",
      type: "number",
      description:
        'The longest range allowed, in milliseconds. A longer draft shows "The range can be at most 7 days long." and Apply stays disabled.',
    },
    {
      name: "hasClear",
      type: "boolean",
      description: "Shows a clear button on the trigger while a range is set.",
      default: "true",
    },
    {
      name: "size",
      type: "'sm' | 'md' | 'lg'",
      description: "Height of the trigger.",
      default: "'md'",
    },
    {
      name: "hourFormat",
      type: "'12h' | '24h'",
      description:
        "Clock of the trigger and the time fields. Unset, it follows the locale.",
    },
    {
      name: "numberOfMonths",
      type: "1 | 2",
      description: "Months the calendar shows.",
      default: "1",
    },
    {
      name: "isDisabled",
      type: "boolean",
      description:
        "Disables the trigger. `disabled`, which <Form disabled> injects, does the same.",
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
      description: "Width of the trigger. Numbers are pixels.",
    },
    {
      name: "aria-label",
      type: "string",
      description:
        "Names the control outside a Form.Item; the trigger reads it before the range.",
    },
    {
      name: "placeholder",
      type: "string",
      description: "Shown on the trigger with no range.",
      default:
        'the catalog\'s uic.DateTimeRangeInput.placeholder ("Select date and time range")',
    },
    {
      name: "startTimeLabel",
      type: "string",
      description: "Label of the start time field.",
      default: 'the catalog\'s uic.DateTimeRangeInput.startTime ("Start time")',
    },
    {
      name: "endTimeLabel",
      type: "string",
      description: "Label of the end time field.",
      default: 'the catalog\'s uic.DateTimeRangeInput.endTime ("End time")',
    },
    {
      name: "applyLabel",
      type: "string",
      description: "The apply button's label.",
      default: 'the catalog\'s uic.common.apply ("Apply")',
    },
    {
      name: "cancelLabel",
      type: "string",
      description: "The cancel button's label.",
      default: 'the catalog\'s uic.common.cancel ("Cancel")',
    },
    {
      name: "data-testid",
      type: "string",
      description:
        "Test id of the trigger; the calendar, time fields, presets and buttons get <id>-calendar, -start-time, -end-time, -presets, -apply and -cancel.",
    },
  ],
  usage: {
    description:
      "A dashboard or report period that needs times, not only dates: relative presets for the common windows, a cap on how long a query may span. className and style reach the box around the trigger.",
  },
  examples: [
    {
      label: "A dashboard period of at most 7 days",
      code: 'const DAY = 24 * 60 * 60 * 1000;\n\n<DateTimeRangeInput\n  aria-label="Period"\n  value={range}\n  onChange={setRange}\n  maxDuration={7 * DAY}\n  presets={[\n    { label: "Last 1 hour", getRange: () => lastHours(1) },\n    { label: "Last 24 hours", getRange: () => lastHours(24) },\n    { label: "Last 7 days", getRange: () => lastHours(7 * 24) },\n  ]}\n/>',
    },
    {
      label: "In a form",
      code: '<Form.Item name="period" label="Period" rules={[{ required: true }]}>\n  <DateTimeRangeInput hourFormat="24h" />\n</Form.Item>',
    },
  ],
};

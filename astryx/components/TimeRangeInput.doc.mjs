/**
 * `astryx component TimeRangeInput` (and `ui-common component TimeRangeInput`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "TimeRangeInput",
  displayName: "TimeRangeInput",
  import: "@lablup/ui-common",
  category: "Form Controls",
  keywords: [
    "time",
    "range",
    "hours",
    "opening hours",
    "picker",
    "TimePicker",
    "RangePicker",
  ],
  description:
    "A start and an end time of day, to the minute, modeled on Ant Design's TimePicker.RangePicker; DateTimeRangeInput's time-only sibling. The box holds one part per end (09:00 → 18:00); clicking a part opens the popover on that end, with hour and minute columns (and an AM / PM column on a 12-hour clock) and a confirm button that moves from the start to the end, then commits both. The end must be after the start: earlier hours and minutes are greyed while it is edited. A Form.Item control like the form-control wrappers. Use TimeInput for one time of day, DateTimeRangeInput when the ends need dates.",
  props: [
    {
      name: "value",
      type: "{ start: ISOTimeString; end: ISOTimeString } | null",
      description:
        "The range, as local HH:MM strings, or null. Unset, the control keeps its own.",
    },
    {
      name: "defaultValue",
      type: "{ start: ISOTimeString; end: ISOTimeString } | null",
      description: "The starting range when value is not set.",
    },
    {
      name: "onChange",
      type: "(range: TimeRangeInputValue | null) => void",
      description:
        "Fires with the committed range, or null when cleared. The end is always after the start.",
    },
    {
      name: "hourFormat",
      type: "'12h' | '24h'",
      description:
        "A 12-hour clock shows 9:00 AM in the box and adds an AM / PM column, as antd's use12Hours. The value stays HH:MM.",
      default: "'24h'",
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
      name: "isDisabled",
      type: "boolean",
      description:
        "Disables both parts. `disabled`, which <Form disabled> injects, does the same.",
    },
    {
      name: "status",
      type: "'error' | 'warning' | ''",
      description:
        "The border state; inside a Form.Item it follows the item's validation unless set.",
    },
    {
      name: "width",
      type: "number | string",
      description: "Width of the box. Numbers are pixels.",
    },
    {
      name: "aria-label",
      type: "string",
      description: "Names the control outside a Form.Item.",
    },
    {
      name: "startPlaceholder",
      type: "string",
      description: "Shown in the start part with no range; also names that part.",
      default: 'the catalog\'s uic.DateTimeRangeInput.startTime ("Start time")',
    },
    {
      name: "endPlaceholder",
      type: "string",
      description: "Shown in the end part with no range; also names that part.",
      default: 'the catalog\'s uic.DateTimeRangeInput.endTime ("End time")',
    },
    {
      name: "confirmLabel",
      type: "string",
      description: "The confirm button's label.",
      default: 'the catalog\'s uic.common.ok ("OK")',
    },
    {
      name: "data-testid",
      type: "string",
      description:
        "Test id of the box; the parts, columns and confirm button get <id>-start, -end, -hour, -minute, -period and -confirm.",
    },
  ],
  usage: {
    description:
      "A daily window such as working or maintenance hours, where the day does not matter. className and style reach the box.",
  },
  examples: [
    {
      label: "Working hours on a 12-hour clock",
      code: '<TimeRangeInput\n  aria-label="Working hours"\n  hourFormat="12h"\n  value={hours}\n  onChange={setHours}\n/>',
    },
  ],
};

import { defineMessages } from "../../i18n/defineMessages";

export const dateTimeRangeInputMessages = defineMessages({
  "uic.DateTimeRangeInput.placeholder": {
    defaultMessage: "Select date and time range",
    description: "Shown on a date-time range field's trigger when no range is set",
  },
  "uic.DateTimeRangeInput.dialogLabel": {
    defaultMessage: "Choose date and time range",
    description:
      "Accessible name of the popover that picks a start and an end date and time",
  },
  "uic.DateTimeRangeInput.presets": {
    defaultMessage: "Preset ranges",
    description:
      "Accessible name of the group of quick-pick ranges, such as Last 24 hours",
  },
  "uic.DateTimeRangeInput.startTime": {
    defaultMessage: "Start time",
    description: "Label of the time field for the start of the range",
  },
  "uic.DateTimeRangeInput.endTime": {
    defaultMessage: "End time",
    description: "Label of the time field for the end of the range",
  },
  "uic.DateTimeRangeInput.endBeforeStart": {
    defaultMessage: "The end must be after the start.",
    description: "Error when the picked end date and time is not later than the start",
  },
  "uic.DateTimeRangeInput.beforeMin": {
    defaultMessage: "The range cannot start before {min}.",
    description:
      "Error when the range starts too early; {min} is the earliest allowed date and time",
  },
  "uic.DateTimeRangeInput.afterMax": {
    defaultMessage: "The range cannot end after {max}.",
    description:
      "Error when the range ends too late; {max} is the latest allowed date and time",
  },
  "uic.DateTimeRangeInput.tooLong": {
    defaultMessage: "The range can be at most {duration} long.",
    description:
      'Error when the range is longer than allowed; {duration} is a length such as "7 days"',
  },
});

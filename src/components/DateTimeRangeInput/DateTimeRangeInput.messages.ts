import { defineMessages } from "../../i18n/defineMessages";

export const dateTimeRangeInputMessages = defineMessages({
  "uic.TimeRangeInput.dialogLabel": {
    defaultMessage: "Choose time range",
    description:
      "Accessible name of the popover that picks a start and an end time of day",
  },
  "uic.TimeRangeInput.period": {
    defaultMessage: "AM/PM",
    description:
      "Accessible name of the column that picks AM or PM in a 12-hour time picker",
  },
  "uic.DateTimeRangeInput.startPlaceholder": {
    defaultMessage: "Start date",
    description:
      "Shown in the start half of a date range field while it has no start; also names that half",
  },
  "uic.DateTimeRangeInput.endPlaceholder": {
    defaultMessage: "End date",
    description:
      "Shown in the end half of a date range field while it has no end; also names that half",
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
    description:
      "Label of the hour and minute columns while they edit the start of the range",
  },
  "uic.DateTimeRangeInput.endTime": {
    defaultMessage: "End time",
    description:
      "Label of the hour and minute columns while they edit the end of the range",
  },
  "uic.DateTimeRangeInput.hour": {
    defaultMessage: "Hour",
    description: "Accessible name of the column of hours (00 to 23) in a time picker",
  },
  "uic.DateTimeRangeInput.minute": {
    defaultMessage: "Minute",
    description: "Accessible name of the column of minutes (00 to 59) in a time picker",
  },
});

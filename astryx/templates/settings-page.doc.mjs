/** @type {import("@astryxdesign/cli/authoring").TemplateDoc} */
export default {
  type: "page",
  name: "settings-page",
  displayName: "Settings Page",
  description:
    "Grouped settings, one card per group, saved together: Form.Items with switches and selectors, a Save button enabled only after a change, and Reset back to the saved values.",
  keywords: [
    "settings",
    "settings page",
    "preferences",
    "configuration",
    "config",
    "options",
    "toggles",
    "switches",
    "save",
    "reset",
  ],
  componentsUsed: [
    "PageLayout",
    "PageHeader",
    "Card",
    "Form",
    "Switch",
    "Selector",
    "Heading",
    "Text",
    "Button",
  ],
  category: "Settings - Panels",
  isReady: true,
};

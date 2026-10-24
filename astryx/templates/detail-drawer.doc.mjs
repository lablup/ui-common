/** @type {import("@astryxdesign/cli/authoring").IntegrationTemplateDoc} */
export default {
  type: "block",
  name: "detail-drawer",
  displayName: "Detail Drawer",
  description:
    "A side drawer that shows one row of a list: DrawerHeader with the title, status and close button, a MetadataList of the item's facts, and Edit / Delete actions in a footer row.",
  keywords: [
    "detail",
    "details",
    "detail drawer",
    "side panel",
    "side sheet",
    "drawer",
    "inspector",
    "row detail",
    "properties",
    "metadata",
  ],
  componentsUsed: [
    "Drawer",
    "DrawerHeader",
    "MetadataList",
    "MetadataListItem",
    "Badge",
    "Button",
    "Divider",
  ],
  category: "Form - Side Sheet",
  aspectRatio: 16 / 9,
};

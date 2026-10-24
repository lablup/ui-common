/** @type {import("@astryxdesign/cli/authoring").IntegrationTemplateDoc} */
export default {
  type: "block",
  name: "info-modal",
  displayName: "Info Modal",
  description:
    "A read-only modal of one record's facts in a MetadataList, closed with a single button. For a record with its own actions, use detail-drawer.",
  keywords: [
    "info",
    "info modal",
    "details modal",
    "read only",
    "view details",
    "metadata",
    "properties",
    "description list",
  ],
  componentsUsed: ["Modal", "MetadataList", "MetadataListItem", "Button"],
  category: "Form - Modal Overlay",
  aspectRatio: 4 / 3,
};

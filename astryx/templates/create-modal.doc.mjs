/** @type {import("@astryxdesign/cli/authoring").IntegrationTemplateDoc} */
export default {
  type: "block",
  name: "create-modal",
  displayName: "Create Modal",
  description:
    "A Modal around a validated Form for creating a resource. The primary action validates and submits; it shows a pending state until the create call settles and keeps the modal open on invalid fields.",
  keywords: [
    "create",
    "create modal",
    "create form",
    "new item",
    "add",
    "form modal",
    "dialog form",
    "modal form",
    "validation",
    "submit",
  ],
  componentsUsed: ["Modal", "Form", "TextInput", "TextArea", "Selector", "Button"],
  category: "Form - Modal Overlay",
  aspectRatio: 3 / 4,
};

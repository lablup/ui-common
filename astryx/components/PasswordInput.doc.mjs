/**
 * `astryx component PasswordInput` (and `ui-common component PasswordInput`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "PasswordInput",
  displayName: "PasswordInput",
  import: "@lablup/ui-common/PasswordInput",
  category: "Form Controls",
  keywords: [
    "password input",
    "password field",
    "show password",
    "hide password",
    "reveal password",
    "visibility toggle",
    "secret input",
    "login form",
  ],
  description:
    "A password field with a show/hide toggle inside its trailing edge, built on Astryx's TextInput and taking ui-common's TextInput props. The toggle keeps focus in the field, Enter on it does not submit the form, and spellcheck, autocorrect and autocapitalize are off; the password stays out of the input's value attribute. The password is masked again when the field is disabled, when its form submits and when the page comes back from the back/forward cache, and onRevealedChange(false) reports it. A field disabled when it mounts starts masked. Like the other form controls it takes no label or status message: put it in a Form.Item, or name it with aria-label on its own.",
  props: [
    {
      name: "value",
      type: "string",
      description: "The password. Without it the field is uncontrolled.",
    },
    {
      name: "defaultValue",
      type: "string",
      description: "The starting password when value is not set.",
    },
    {
      name: "onChange",
      type: "(value: string, event: ChangeEvent<HTMLInputElement>) => void",
      description: "Called with the new password.",
    },
    {
      name: "isRevealed",
      type: "boolean",
      description:
        "Whether the password is shown as plain text. Without it the field keeps its own state. A disabled field is masked whatever this says.",
    },
    {
      name: "defaultIsRevealed",
      type: "boolean",
      default: "false",
      description: "Whether the password starts shown when isRevealed is not set.",
    },
    {
      name: "onRevealedChange",
      type: "(isRevealed: boolean) => void",
      description:
        "Called with the new state when the toggle is pressed, and with false when the field masks the password on its own (disabled, form submit, back/forward-cache restore).",
    },
    {
      name: "showPasswordLabel",
      type: "string",
      description:
        'Accessible name of the toggle while the password is masked ("Show password").',
    },
    {
      name: "hidePasswordLabel",
      type: "string",
      description:
        'Accessible name of the toggle while the password is shown ("Hide password").',
    },
    {
      name: "status",
      type: "'error' | 'warning' | ''",
      description:
        "The border state. Inside a Form.Item it follows the item's validation unless set here.",
    },
    {
      name: "disabled",
      type: "boolean",
      description:
        "Disables the field and the toggle, and masks the password. Set by <Form disabled> through Form.Item.",
    },
  ],
  usage: {
    description:
      "Use for a password the user types, such as on a login or change-password form. Pass autoComplete (current-password, new-password) so password managers fill it.",
  },
  examples: [
    {
      label: "In a Form.Item",
      code: '<Form.Item name="password" label="Password" rules={[{ required: true }]}>\n  <PasswordInput autoComplete="current-password" />\n</Form.Item>',
    },
  ],
};

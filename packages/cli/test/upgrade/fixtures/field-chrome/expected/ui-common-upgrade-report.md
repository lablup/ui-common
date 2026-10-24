# ui-common upgrade report

`ui-common upgrade` 0.2.0-alpha.19 → 0.2.0-alpha.20 (@lablup/ui-common-cli <version>).

Ran the codemods over 1 file under `src`; searched 2 files under the project root for manual-review findings.

## Summary

| | Count |
|---|---:|
| Files changed | 1 |
| package.json changed | yes |
| TODO markers left in code | 0 |
| Manual-review findings | 4 |

## Steps

- 0.2.0-alpha.20: 0.2.0-alpha.20: Drawer moves from /lab to /Drawer; form controls leave their field chrome to Form.Item
- 0.2.0-alpha.20: Astryx 0.7.0 → 0.7.3 codemods

## Changed files

- `src/SettingsForm.tsx`: +7 −9, field-chrome

## package.json

- dependencies["@lablup/ui-common"]: "0.2.0-alpha.19" → "0.2.0-alpha.20".
- devDependencies["@lablup/ui-common-cli"]: "0.2.0-alpha.19" → "0.2.0-alpha.20".

## Manual review

### TODO markers (0)

None.

### Drawer moved from @lablup/ui-common/lab to @lablup/ui-common/Drawer (0)

None.

### Drawer's isFullWidthOnMobile is now experimental.isFullWidthOnMobile (0)

None.

### Form controls: the field chrome moved to Form.Item (4)

Since 0.2.0-alpha.20 ui-common's form controls (`TextInput`, `Selector`, `Switch`, …) are wrappers for `Form.Item`: the item owns the label, description (`extra`), tooltip, required mark (`required` / `rules`) and status message (`help`), and the control silently drops Astryx's `label`, `isLabelHidden`, `description`, `labelTooltip`, `labelIcon`, `isRequired`, `isOptional`, `statusVariant` and `isDisabled`; `status` is the border only (`"error" | "warning" | ""`). The upgrade rewrote what kept its meaning (a hidden label to `aria-label`, `isDisabled` to `disabled`, `status={{ type }}` to the string, a CheckboxInput / Switch label to children). Move each of these by hand: inside a form to the enclosing `Form.Item`, on its own name the control with `aria-label`. A spread is listed because what it carries is dropped the same way.

| Where | What | Detail |
|---|---|---|
| `e2e/settings.spec.tsx:5` | `render(<TextInput label="Name" isLabelHidden isDisabled />);` | TextInput: `label` hidden → `aria-label` (rewritten only in the paths the upgrade transforms); `isDisabled` → `disabled` (rewritten only in the paths the upgrade transforms) |
| `src/SettingsForm.tsx:26` | `<TextInput label="Name" description="Shown on your profile" isRequired />` | TextInput: `label` a visible label: move it to the Form.Item's `label`, or to `aria-label` where the control stands alone; `description` move it to the Form.Item's `extra`; `isRequired` the Form.Item's `required` / `rules` own it |
| `src/SettingsForm.tsx:28` | `<TextInput status={nameError ? { type: "error", message: nameError } : undefined} />` | TextInput: `status` not a literal: pass `"error"`, `"warning"` or `""`; a message goes to the Form.Item's `help` |
| `src/SettingsForm.tsx:29` | `<TextInput {...fieldProps} isDisabled />` | TextInput: `{...}` props spread into it: a `label`, `isDisabled` or status object in it is dropped; `isDisabled` not rewritten beside a spread |

## Notes

- Drawer and DrawerHeader are core components since Astryx 0.7.2: they come from @lablup/ui-common/Drawer (or the root) and no longer need @astryxdesign/lab or lab.css. A project that used lab only for the Drawer can drop both.
- ui-common's form controls are Form.Item wrappers (#72): the item owns the label, description, tooltip, required mark and status message, and `disabled` replaces `isDisabled`. A wrapper drops those props even when a spread or plain JavaScript gets them past the types; in development it warns once per control.

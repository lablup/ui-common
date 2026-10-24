/**
 * Component docs for ui-common's Form.Item wrappers (src/formControls/), so
 * `ui-common component TextInput` describes ui-common's TextInput instead of
 * Astryx's.
 *
 * Each wrapper keeps Astryx's name and import path but not its API: no field
 * chrome (label, description, required marker, status message), antd's
 * `disabled` and `status`, optional `value` beside `defaultValue`, and a few
 * defaults of its own. Its doc is Astryx's, read from the pinned
 * @astryxdesign/core, with the props, usage and examples rewritten to match,
 * and `replaces` set so the Astryx CLI shows it in place of Astryx's (it needs
 * the `@astryxdesign/cli >=0.6.7` peer).
 *
 * `src/astryxIntegration.test.ts` fails when a written doc differs from what
 * this produces, so an Astryx bump means running it again.
 *
 * Usage: node scripts/gen-wrapper-docs.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as prettier from "prettier";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const coreDir = join(root, "node_modules", "@astryxdesign", "core");

/** The props Form.Item owns (formControl.tsx, FormControlChromeProps). */
const CHROME = new Set([
  "label",
  "isLabelHidden",
  "description",
  "labelTooltip",
  "labelIcon",
  "isRequired",
  "isOptional",
  "status",
  "statusVariant",
  "isDisabled",
]);

/** Anatomy parts the wrapper no longer renders. */
const CHROME_PARTS = new Set([
  "Label",
  "Description",
  "Status message",
  "Field status message",
  "Tooltip status message",
  "Group label",
]);

/** Advice about the chrome, which Form.Item now owns. */
const CHROME_ADVICE =
  /\blabels?\b|isLabelHidden|\bdescription\b|isRequired|isOptional|\bstatus\b|statusVariant|validation/i;

/** Advice that matches CHROME_ADVICE but is not about the chrome. */
const KEEP_ADVICE = [
  "differentiate each option",
  "hasDividers",
  "maxSize and maxFiles",
  "multiple Typeaheads adjacent",
];

/** Sentences of Astryx's description that describe the chrome. */
const CHROME_SENTENCE = /supports labels|validation status|required\/optional/i;

/**
 * `width` as the wrapper defaults it: inside a Form.Item, what the antd
 * counterpart renders there (`IN_ITEM_WIDTH` in src/formControls/formControl.tsx);
 * elsewhere Astryx's own default.
 */
const itemWidth = (value, antd) => ({
  default: `${value} in a Form.Item`,
  note: `Inside a Form.Item it defaults to ${value}, as antd's ${antd} renders there; elsewhere Astryx's own default applies.`,
});

/**
 * What each wrapper changes beyond the chrome, and an example of it.
 *
 * @type {Record<string, {props?: Record<string, object>, add?: object[], example: string, standalone: string}>}
 */
const WRAPPERS = {
  TextInput: {
    props: { width: itemWidth("'100%'", "Input") },
    add: [
      {
        name: "maxLength",
        type: "number",
        description: "The native limit on the text's length, as antd's Input takes.",
      },
    ],
    example:
      '<Form.Item name="name" label="Name" rules={[{ required: true }]}>\n  <TextInput placeholder="my-project" />\n</Form.Item>',
    standalone: '<TextInput aria-label="Search" defaultValue="" hasClear />',
  },
  TextArea: {
    props: { width: itemWidth("'100%'", "TextArea") },
    example:
      '<Form.Item name="description" label="Description" extra="Shown on the detail page.">\n  <TextArea rows={4} />\n</Form.Item>',
    standalone: '<TextArea aria-label="Notes" defaultValue="" />',
  },
  NumberInput: {
    props: {
      width: itemWidth("90", "InputNumber"),
      value: {
        type: "number | string | null",
        description: "The number. A numeric string is read as one.",
      },
      onChange: {
        type: "(value: number | null) => void",
        description:
          "Called with the new number, or null when the field is emptied. Inside a Form.Item it is also called as the user types, with a plain number within min and max (an integer under isIntegerOnly); any other draft waits for the commit on blur or Enter, as it does on its own.",
      },
      hasClear: {
        default: "true",
        description:
          "Shows a clear button, and lets an emptied field report null. false keeps the last number when the text is erased.",
      },
      isIntegerOnly: {
        note: "A decimal typed into it is rounded on blur.",
      },
    },
    example:
      '<Form.Item name="replicas" label="Replicas" rules={[{ required: true }]}>\n  <NumberInput min={1} max={10} isIntegerOnly />\n</Form.Item>',
    standalone: '<NumberInput aria-label="Limit" defaultValue={10} />',
  },
  Selector: {
    props: {
      width: itemWidth("'100%'", "Select"),
      placement: {
        default: "'below'",
        note: "Defaults to 'below', so the panel does not cover the item's label.",
      },
    },
    example:
      '<Form.Item name="region" label="Region" rules={[{ required: true }]}>\n  <Selector\n    options={[\n      { value: "kr", label: "Korea" },\n      { value: "us", label: "United States" },\n    ]}\n  />\n</Form.Item>',
    standalone:
      '<Selector\n  aria-label="Sort by"\n  defaultValue="name"\n  options={[\n    { value: "name", label: "Name" },\n    { value: "created", label: "Created" },\n  ]}\n/>',
  },
  MultiSelector: {
    props: {
      width: itemWidth("'100%'", "Select"),
      triggerDisplay: {
        default: "'labels'",
        note: "Defaults to 'labels'.",
      },
    },
    example:
      '<Form.Item name="groups" label="Groups">\n  <MultiSelector\n    options={[\n      { value: "dev", label: "Developers" },\n      { value: "ops", label: "Operators" },\n    ]}\n  />\n</Form.Item>',
    standalone:
      '<MultiSelector\n  aria-label="Status"\n  defaultValue={[]}\n  options={[\n    { value: "running", label: "Running" },\n    { value: "stopped", label: "Stopped" },\n  ]}\n/>',
  },
  Typeahead: {
    props: { width: itemWidth("'100%'", "AutoComplete") },
    example:
      '<Form.Item name="owner" label="Owner">\n  <Typeahead searchSource={userSource} />\n</Form.Item>',
    standalone: '<Typeahead aria-label="Find a user" searchSource={userSource} />',
  },
  Tokenizer: {
    props: { width: itemWidth("'100%'", "Select") },
    example:
      '<Form.Item name="members" label="Members">\n  <Tokenizer searchSource={userSource} />\n</Form.Item>',
    standalone: '<Tokenizer aria-label="Members" searchSource={userSource} />',
  },
  DateInput: {
    props: { width: itemWidth("'fit-content'", "DatePicker") },
    example:
      '<Form.Item name="expiresAt" label="Expires on">\n  <DateInput hasClear />\n</Form.Item>',
    standalone: '<DateInput aria-label="From" defaultValue="2026-01-01" />',
  },
  TimeInput: {
    props: { width: itemWidth("'fit-content'", "TimePicker") },
    example:
      '<Form.Item name="startsAt" label="Starts at">\n  <TimeInput />\n</Form.Item>',
    standalone: '<TimeInput aria-label="Start time" defaultValue="09:00" />',
  },
  DateTimeInput: {
    props: { width: itemWidth("'fit-content'", "DatePicker") },
    example:
      '<Form.Item name="scheduledAt" label="Scheduled at">\n  <DateTimeInput />\n</Form.Item>',
    standalone: '<DateTimeInput aria-label="Run at" />',
  },
  DateRangeInput: {
    props: { width: itemWidth("'fit-content'", "RangePicker") },
    example:
      '<Form.Item name="period" label="Period">\n  <DateRangeInput />\n</Form.Item>',
    standalone: '<DateRangeInput aria-label="Period" />',
  },
  Switch: {
    props: { width: itemWidth("'fit-content'", "Switch") },
    add: [
      {
        name: "checked",
        type: "boolean",
        description: 'antd\'s name for value, for valuePropName="checked".',
      },
      {
        name: "defaultChecked",
        type: "boolean",
        description: "antd's name for defaultValue.",
      },
      {
        name: "children",
        type: "string",
        description: "The text beside the switch.",
      },
    ],
    example:
      '<Form.Item name="isPublic" label="Public" extra="Anyone in the project can see it.">\n  <Switch />\n</Form.Item>',
    standalone: '<Switch aria-label="Auto refresh" defaultChecked />',
  },
  CheckboxInput: {
    props: { width: itemWidth("'fit-content'", "Checkbox") },
    add: [
      {
        name: "checked",
        type: "boolean | 'indeterminate'",
        description: 'antd\'s name for value, for valuePropName="checked".',
      },
      {
        name: "defaultChecked",
        type: "boolean | 'indeterminate'",
        description: "antd's name for defaultValue.",
      },
      {
        name: "children",
        type: "string",
        description: "The text beside the checkbox.",
      },
    ],
    example:
      '<Form.Item name="agree" valuePropName="checked" rules={[{ required: true }]}>\n  <CheckboxInput>I agree to the terms</CheckboxInput>\n</Form.Item>',
    standalone: "<CheckboxInput defaultChecked>Remember me</CheckboxInput>",
  },
  CheckboxList: {
    props: { width: itemWidth("'fit-content'", "Checkbox.Group") },
    example:
      '<Form.Item name="formats" label="Export formats">\n  <CheckboxList>\n    <CheckboxListItem value="csv" label="CSV" />\n    <CheckboxListItem value="json" label="JSON" />\n  </CheckboxList>\n</Form.Item>',
    standalone:
      '<CheckboxList aria-label="Columns" defaultValue={["name"]}>\n  <CheckboxListItem value="name" label="Name" />\n  <CheckboxListItem value="status" label="Status" />\n</CheckboxList>',
  },
  RadioList: {
    props: { width: itemWidth("'fit-content'", "Radio.Group") },
    example:
      '<Form.Item name="plan" label="Plan" initialValue="basic">\n  <RadioList>\n    <RadioListItem value="basic" label="Basic" />\n    <RadioListItem value="pro" label="Pro" />\n  </RadioList>\n</Form.Item>',
    standalone:
      '<RadioList aria-label="Plan" defaultValue="basic">\n  <RadioListItem value="basic" label="Basic" />\n  <RadioListItem value="pro" label="Pro" />\n</RadioList>',
  },
  SegmentedControl: {
    example:
      '<Form.Item name="mode" label="Mode" initialValue="simple">\n  <SegmentedControl>\n    <SegmentedControlItem value="simple" label="Simple" />\n    <SegmentedControlItem value="advanced" label="Advanced" />\n  </SegmentedControl>\n</Form.Item>',
    standalone:
      '<SegmentedControl aria-label="Scope" value={scope} onChange={setScope}>\n  <SegmentedControlItem value="running" label="Running" />\n  <SegmentedControlItem value="finished" label="Finished" />\n</SegmentedControl>',
  },
  Slider: {
    example:
      '<Form.Item name="cpu" label="CPU" initialValue={2}>\n  <Slider min={1} max={16} />\n</Form.Item>',
    standalone: '<Slider aria-label="Volume" defaultValue={50} />',
  },
  FileInput: {
    props: {
      width: {
        default: "'fit-content' in a Form.Item ('100%' with mode=\"dropzone\")",
        note: "Inside a Form.Item it defaults to 'fit-content', as antd's Upload button renders there, and to '100%' with mode=\"dropzone\", as antd's Upload.Dragger does; elsewhere Astryx's own default applies.",
      },
    },
    example:
      '<Form.Item name="files" label="Files" rules={[{ required: true }]}>\n  <FileInput accept=".csv" />\n</Form.Item>',
    standalone: '<FileInput aria-label="Upload" />',
  },
};

/** The props every wrapper takes in place of the chrome. */
function sharedProps(valueProp) {
  return [
    {
      name: "status",
      type: "'error' | 'warning' | ''",
      description:
        "Paints the border only; there is no message. Inside a Form.Item it follows the item's validation, and an empty status falls back to it.",
    },
    {
      name: "disabled",
      type: "boolean",
      description: "Disables the control. A <Form disabled> disables it too.",
      default: "false",
    },
    {
      name: "aria-label",
      type: "string",
      description:
        "Names the control outside a Form.Item. Inside one, the item's label names it.",
    },
    ...(valueProp
      ? [
          {
            name: "defaultValue",
            type: valueProp.type,
            description:
              "The starting value when value is not set (uncontrolled), as in antd.",
          },
        ]
      : []),
  ];
}

/** Astryx's props for one wrapper, rewritten to the wrapper's. */
function wrapperProps(name, props) {
  const spec = WRAPPERS[name];
  const out = [];
  for (const prop of props) {
    if (CHROME.has(prop.name)) continue;
    // The wrapper maps antd's `disabled` to Astryx's `isDisabled`.
    let next = {
      ...prop,
      description: prop.description.replaceAll("isDisabled", "disabled"),
    };
    // Both are optional on every wrapper.
    if (prop.name === "value" || prop.name === "onChange") delete next.required;
    const change = spec.props?.[prop.name];
    if (change) {
      const { note, ...rest } = change;
      next = { ...next, ...rest };
      if (note) next.description = `${next.description} ${note}`;
    }
    if (prop.name === "value") {
      next.description = `${next.description} Without it the control is uncontrolled.`;
    }
    out.push(next);
  }
  return [
    ...out,
    ...sharedProps(out.find((p) => p.name === "value")),
    ...(spec.add ?? []),
  ];
}

function keepAdvice(practice) {
  return (
    !CHROME_ADVICE.test(practice.description) ||
    KEEP_ADVICE.some((text) => practice.description.includes(text))
  );
}

function wrapperUsage(name, usage) {
  const inline = name === "Switch" || name === "CheckboxInput";
  const description = (usage.description ?? "")
    .split(/(?<=\.)\s+/)
    .filter((sentence) => !CHROME_SENTENCE.test(sentence))
    .join(" ");
  return {
    ...usage,
    description:
      `${description} ui-common's ${name} is Astryx's, wrapped for Form.Item: it takes no label, description, required marker or status message, ` +
      "which the item's label, extra, rules and help own. It takes antd's disabled and status, and without value it is uncontrolled from defaultValue.",
    anatomy: (usage.anatomy ?? []).flatMap((part) => {
      if (inline && part.name === "Label") {
        return [
          {
            ...part,
            name: "Text",
            description: "The text beside the control, from children.",
          },
        ];
      }
      return CHROME_PARTS.has(part.name) ? [] : [part];
    }),
    bestPractices: [
      {
        guidance: true,
        description:
          "Put it in a Form.Item: the item's label names it, its rules mark it required and validate it, and extra and help show beneath it.",
      },
      ...(usage.bestPractices ?? []).filter(keepAdvice),
      {
        guidance: false,
        description:
          "Pass label, description, isRequired or a status message: the wrapper takes none of them. Outside a Form.Item, name it with aria-label.",
      },
    ],
  };
}

function omit(object, keys) {
  return Object.fromEntries(
    Object.entries(object).filter(([key]) => !keys.includes(key)),
  );
}

async function astryxDoc(name) {
  const file = join(coreDir, "src", name, `${name}.doc.mjs`);
  return (await import(pathToFileURL(file).href)).docs;
}

/** The doc module for one wrapper, unformatted. */
async function wrapperDoc(name, version) {
  const doc = await astryxDoc(name);
  const spec = WRAPPERS[name];
  // The main entry of a multi-component doc carries the props and usage;
  // references to Astryx's subcomponent docs are left to those docs.
  const main = doc.props ? doc : doc.components.find((c) => c.name === name);
  const usage = doc.usage ?? main.usage;
  const out = {
    type: "component",
    ...omit(doc, [
      "playground",
      "registry",
      "components",
      "examples",
      "usage",
      "props",
    ]),
    replaces: name,
    import: `@lablup/ui-common/${name}`,
    usage: wrapperUsage(name, usage),
    examples: [
      { label: "In a Form.Item", code: spec.example },
      { label: "On its own", code: spec.standalone },
    ],
  };
  if (doc.props) out.props = wrapperProps(name, doc.props);
  else {
    out.components = [
      {
        ...omit(main, ["usage", "examples", "playground"]),
        props: wrapperProps(name, main.props),
      },
      ...doc.components.filter((c) => c.name !== name && c.props),
    ];
  }
  return (
    `// @generated by scripts/gen-wrapper-docs.mjs from @astryxdesign/core ${version}. Do not edit.\n` +
    `/** @type {import('@astryxdesign/cli/authoring').ComponentDoc} */\n` +
    `export default ${JSON.stringify(out, null, 2)};\n`
  );
}

/** The files this script writes, by path from the repository root. */
export async function wrapperDocFiles() {
  const version = JSON.parse(
    readFileSync(join(coreDir, "package.json"), "utf8"),
  ).version;
  const options =
    (await prettier.resolveConfig(join(root, "astryx/components/x.doc.mjs"))) ?? {};
  const files = {};
  for (const name of Object.keys(WRAPPERS)) {
    const doc = await wrapperDoc(name, version);
    files[`astryx/components/${name}.doc.mjs`] = await prettier.format(doc, {
      ...options,
      parser: "babel",
    });
    files[`astryx/components/${name}.tsx`] =
      "// The Astryx CLI pairs each component doc with a same-stem source file.\n" +
      "// ui-common ships no source, so this names the export instead.\n" +
      `export { ${name} } from "@lablup/ui-common/${name}";\n`;
  }
  return files;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = await wrapperDocFiles();
  for (const [path, text] of Object.entries(files))
    writeFileSync(join(root, path), text);
  console.log(`Wrote ${Object.keys(files).length} file(s).`);
}

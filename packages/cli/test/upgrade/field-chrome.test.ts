/**
 * The 0.2.0-alpha.20 step: ui-common's form controls leave their field chrome
 * to Form.Item (#72). The safe rewrites, and the report for the rest.
 */
import jscodeshift from "jscodeshift";
import { describe, expect, it } from "vitest";

import { uiCommonRoot } from "../../cli/paths.mjs";
import {
  migrateFieldChrome,
  scanFieldChrome,
  WRAPPERS,
} from "../../codemods/0.2.0-alpha.20/field-chrome.mjs";
import { formControlWrappers } from "../../codemods/lib/form-controls.mjs";

const j = jscodeshift.withParser("tsx");

const IMPORTS = [
  'import { CheckboxInput, Switch, Selector } from "@lablup/ui-common";',
  'import { TextInput as Input } from "@lablup/ui-common/TextInput";',
  "",
].join("\n");

function upgrade(body: string, source = IMPORTS + body) {
  return migrateFieldChrome({ path: "src/A.tsx", source }, { jscodeshift: j });
}

/** The body after the imports, and what the scan still reports. */
function run(body: string) {
  const out = upgrade(body) ?? IMPORTS + body;
  return {
    body: out.slice(IMPORTS.length),
    findings: scanFieldChrome("src/A.tsx", out),
  };
}

describe("0.2.0-alpha.20: form-control field chrome", () => {
  it("knows only controls ui-common exports as Form.Item wrappers", () => {
    const wrappers = formControlWrappers(uiCommonRoot());
    for (const name of WRAPPERS) expect(wrappers).toContain(name);
  });

  it("turns a hidden label into aria-label", () => {
    const r = run('const a = <Input label="Name" isLabelHidden />;\n');
    expect(r.body).toBe('const a = <Input aria-label="Name" />;\n');
    expect(r.findings).toEqual([]);
    expect(
      run("const a = <Input label={t('name')} isLabelHidden={true} />;\n").body,
    ).toBe("const a = <Input aria-label={t('name')} />;\n");
  });

  it("renames isDisabled to disabled", () => {
    expect(run("const a = <Selector isDisabled options={o} />;\n").body).toBe(
      "const a = <Selector disabled options={o} />;\n",
    );
    expect(run("const a = <Selector isDisabled={busy} />;\n").body).toBe(
      "const a = <Selector disabled={busy} />;\n",
    );
  });

  it("turns a literal status object into the string", () => {
    expect(run("const a = <Input status={{ type: 'error' }} />;\n").body).toBe(
      'const a = <Input status="error" />;\n',
    );
    expect(run('const a = <Input status={{ type: "warning" }} />;\n').body).toBe(
      'const a = <Input status="warning" />;\n',
    );
  });

  it("moves a CheckboxInput / Switch label into children", () => {
    expect(run('const a = <CheckboxInput label="Remember me" />;\n').body).toBe(
      "const a = <CheckboxInput>Remember me</CheckboxInput>;\n",
    );
    expect(run("const a = <Switch label={t('on')} value={v} />;\n").body).toBe(
      "const a = <Switch value={v}>{t('on')}</Switch>;\n",
    );
  });

  it("drops an isLabelHidden that hides nothing", () => {
    expect(run("const a = <Input isLabelHidden />;\n").body).toBe(
      "const a = <Input />;\n",
    );
  });

  it("leaves a spread element as written and reports it", () => {
    const body =
      'const a = <Input {...props} label="Name" isLabelHidden isDisabled />;\n';
    const r = run(body);
    expect(r.body).toBe(body);
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].detail).toContain("props spread");
    expect(r.findings[0].detail).toContain("`isDisabled`");
  });

  it("reports what it cannot prove safe", () => {
    const body = [
      'const a = <Input label="Name" />;',
      "const b = <Input status={state} />;",
      "const c = <Input status={{ type: 'error', message: 'Required' }} />;",
      'const d = <Input description="Help" labelTooltip="Tip" isRequired />;',
      'const e = <Switch label="On">Off</Switch>;',
      'const f = <Input label="Name" isLabelHidden aria-label="Other" />;',
      "const g = <Input isDisabled disabled={x} />;",
      "",
    ].join("\n");
    const r = run(body);
    expect(r.body).toBe(body);
    expect(r.findings.map((f) => [f.line - 2, f.detail])).toEqual([
      [1, expect.stringContaining("`label` a visible label")],
      [2, expect.stringContaining("`status` not a literal")],
      [3, expect.stringContaining("`status` carries a message")],
      [4, expect.stringContaining("`description` move it to the Form.Item's `extra`")],
      [5, expect.stringContaining("`label` beside children")],
      [6, expect.stringContaining("beside `aria-label`")],
      [7, expect.stringContaining("beside `disabled`")],
    ]);
    expect(r.findings[3].detail).toContain("`labelTooltip`");
    expect(r.findings[3].detail).toContain("`isRequired`");
  });

  it("names a safe rewrite it finds in a file it only read", () => {
    const source = `${IMPORTS}const a = <Input isDisabled />;\n`;
    const [finding] = scanFieldChrome("e2e/a.spec.tsx", source);
    expect(finding.detail).toContain("rewritten only in the paths");
  });

  it("keeps a string status and leaves other components alone", () => {
    const source = [
      'import { TextInput } from "@astryxdesign/core/TextInput";',
      'import { Button } from "@lablup/ui-common";',
      'const a = <TextInput label="Name" isDisabled />;',
      'const b = <Button isDisabled label="Go" />;',
      "",
    ].join("\n");
    expect(upgrade("", source)).toBeUndefined();
    expect(scanFieldChrome("src/A.tsx", source)).toEqual([]);
    expect(run('const a = <Input status="error" />;\n').findings).toEqual([]);
  });

  it("falls back to the text scan where a file does not parse", () => {
    const source = `${IMPORTS}const a = <Input isDisabled label="x" /> <<<;\n`;
    const [finding] = scanFieldChrome("src/A.tsx", source);
    expect(finding.category).toBe("field-chrome");
    expect(finding.detail).toBe("TextInput: `isDisabled`, `label`");
  });

  it("changes nothing on a second run", () => {
    const once = upgrade(
      'const a = <Input label="Name" isLabelHidden isDisabled />;\n',
    );
    expect(once).toBeDefined();
    expect(upgrade("", once)).toBeUndefined();
  });
});

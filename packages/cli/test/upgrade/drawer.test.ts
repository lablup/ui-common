/**
 * The 0.2.0-alpha.20 step: Drawer and DrawerHeader leave the lab mirror for
 * `@lablup/ui-common/Drawer` (Astryx 0.7.2 moved them into core).
 */
import jscodeshift from "jscodeshift";
import { describe, expect, it } from "vitest";

import {
  moveDrawerImports,
  scanDrawer,
} from "../../codemods/0.2.0-alpha.20/drawer.mjs";

const j = jscodeshift.withParser("tsx");

function upgrade(source: string) {
  return moveDrawerImports({ path: "src/A.tsx", source }, { jscodeshift: j });
}

describe("0.2.0-alpha.20: Drawer off the lab mirror", () => {
  it("moves Drawer and DrawerHeader, and keeps the rest of the lab import", () => {
    const out = upgrade(
      'import { Drawer, DrawerHeader, Tour, type DrawerProps } from "@lablup/ui-common/lab";\n',
    );
    expect(out).toContain('import { Tour } from "@lablup/ui-common/lab";');
    expect(out).toContain(
      'import { Drawer, DrawerHeader, type DrawerProps } from "@lablup/ui-common/Drawer";',
    );
  });

  it("replaces a lab import that held only the Drawer", () => {
    const out = upgrade("import { Drawer as Panel } from '@lablup/ui-common/lab';\n");
    expect(out).toBe("import { Drawer as Panel } from '@lablup/ui-common/Drawer';\n");
  });

  it("joins an import from @lablup/ui-common/Drawer the file already has", () => {
    const out = upgrade(
      [
        'import { Drawer } from "@lablup/ui-common/Drawer";',
        'import { DrawerHeader } from "@lablup/ui-common/lab";',
        "",
      ].join("\n"),
    );
    expect(out).toBe(
      'import { Drawer, DrawerHeader } from "@lablup/ui-common/Drawer";\n',
    );
  });

  it("keeps a type-only import type-only", () => {
    const out = upgrade('import type { DrawerProps } from "@lablup/ui-common/lab";\n');
    expect(out).toBe('import type { DrawerProps } from "@lablup/ui-common/Drawer";\n');
  });

  it("moves re-exports", () => {
    const out = upgrade('export { Drawer, Tour } from "@lablup/ui-common/lab";\n');
    expect(out).toContain('export { Tour } from "@lablup/ui-common/lab";');
    expect(out).toContain('export { Drawer } from "@lablup/ui-common/Drawer";');
  });

  it("leaves a file without a Drawer import from lab alone", () => {
    expect(upgrade('import { Tour } from "@lablup/ui-common/lab";\n')).toBeUndefined();
    expect(upgrade('import { Drawer } from "@lablup/ui-common";\n')).toBeUndefined();
  });

  it("reports namespace imports and module mocks of the lab mirror", () => {
    const source = [
      'import * as Lab from "@lablup/ui-common/lab";',
      'vi.mock("@lablup/ui-common/lab");',
      'import { Tour } from "@lablup/ui-common/lab";',
    ].join("\n");
    expect(scanDrawer("src/A.tsx", source).map((f) => f.line)).toEqual([1, 2]);
    expect(upgrade(source)).toBeUndefined();
  });
});

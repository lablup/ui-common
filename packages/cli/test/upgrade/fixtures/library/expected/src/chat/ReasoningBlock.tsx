// TODO(ui-common-upgrade): namespace import of @lablup/ui-common: in 0.2 Badge, Button, Select, Tabs and the other removed 0.1 components are Astryx's (or gone). Rewrite the UC.X uses by hand.
import * as UC from "@lablup/ui-common";
import { Button } from "@lablup/ui-common/Button";
import { SmoothHeight } from "@lablup/ui-common";

export function ReasoningBlock({ open, toggle }: { open: boolean; toggle: () => void }) {
  return (
    <div>
      {/* TODO(ui-common-upgrade): shape="circle", inline and active have no counterpart. */}
      <Button variant="ghost" size="sm" onClick={toggle} aria-expanded={open} label="Toggle reasoning" inline isIconOnly icon={<span>›</span>} />
      <SmoothHeight active={open}>
        <UC.Badge>thinking</UC.Badge>
      </SmoothHeight>
    </div>
  );
}

// TODO(ui-common-upgrade): Button is used as a value here; props passed to it this way are not migrated to Astryx Button.
export const Toggle = Button;

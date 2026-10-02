import * as UC from "@lablup/ui-common";
import { Button, SmoothHeight } from "@lablup/ui-common";

export function ReasoningBlock({ open, toggle }: { open: boolean; toggle: () => void }) {
  return (
    <div>
      <Button variant="text" size="xsmall" onClick={toggle} aria-expanded={open} ariaLabel="Toggle reasoning" inline iconOnly icon={<span>›</span>} />
      <SmoothHeight active={open}>
        <UC.Badge>thinking</UC.Badge>
      </SmoothHeight>
    </div>
  );
}

export const Toggle = Button;

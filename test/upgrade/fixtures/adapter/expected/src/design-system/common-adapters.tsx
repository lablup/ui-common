/**
 * The only module that imports @lablup/ui-common. Feature code uses the
 * product-owned API below.
 */
import type { ReactNode } from "react";
import { Button as UiButton } from "@lablup/ui-common/Button";
import { EmptyState as UiEmptyState } from "@lablup/ui-common/EmptyState";
import { Selector as UiSelect } from "@lablup/ui-common/Selector";
import { Drawer as UiDrawer } from "@lablup/ui-common/lab";
import { ProgressBar } from "@lablup/ui-common/ProgressBar";
import { Tooltip } from "@lablup/ui-common/Tooltip";
import { Skeleton } from "@lablup/ui-common/Skeleton";

export function Button({ tone, busy, children, onClick }: { tone: "primary" | "danger"; busy?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    // TODO(ui-common-upgrade): Button variant is dynamic; map its values onto Astryx's: primary→primary, secondary→secondary, ghost→ghost, danger→destructive, text→ghost, outline→secondary, success→primary.
    // TODO(ui-common-upgrade): Button "label" must be a string; it was the element's children.
    <UiButton
      variant={tone}
      isLoading={busy}
      aria-busy={busy}
      onClick={onClick}
      label={children} />
  );
}

export function Empty({ title, body, onRetry }: { title: string; body: string; onRetry: () => void }) {
  return (
    <UiEmptyState
      title={title}
      description={body}
      actions={<><UiButton variant="primary" label="Retry" onClick={onRetry} /><UiButton variant="secondary" label="Docs" href="/docs" /></>} />
  );
}

export function RegionSelect({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid: boolean }) {
  return (
    <UiSelect
      label="Region"
      value={value}
      onChange={onChange}
      options={[]}
      status={invalid ? {
        type: "error"
      } : undefined}
      emptyText="Nothing here"
      searchPlaceholder="Find"
      isDisabled={false}
    />
  );
}

export function Panel({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    // TODO(ui-common-upgrade): lab Drawer `label` must be a string (it was the title).
    // TODO(ui-common-upgrade): lab Drawer renders no title, subtitle or footer: put a Heading (and the footer) inside its children, then remove `subtitle` / `footer`.
    <UiDrawer
      isOpen={open}
      onOpenChange={isOpen => {
        if (!isOpen) {
          onClose();
        }
      }}
      label={title}
      footer={<span>footer</span>}
      width={520}>
      {children}
    </UiDrawer>
  );
}

export function Loading({ percent }: { percent: number | null }) {
  return (
    <>
      {/* TODO(ui-common-upgrade): ProgressBar "animated": Astryx ProgressBar always animates its fill. */}
      <ProgressBar
        value={percent}
        variant="success"
        animated={false}
        hasValueLabel
        formatValueLabel={() => `${percent ?? 0} of 100`}
        label={`${percent ?? 0} of 100`} />
      <ProgressBar isIndeterminate label="Loading" />
      <Skeleton radius="rounded" width="40px" height="40px" data-testid="avatar" />
      <Skeleton radius={1} width="60%" height="1em" />
      {/* TODO(ui-common-upgrade): Tooltip "className": Astryx Tooltip has no such prop; it wires the trigger and the ARIA ids itself. Style the trigger, not the tooltip. */}
      <Tooltip content="Help" touchTrigger={isTouch() ? "tap" : "auto"} className="hint">
        <button type="button">?</button>
      </Tooltip>
    </>
  );
}

declare function isTouch(): boolean;

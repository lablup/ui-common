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
    // TODO(ui-common-upgrade): Button variant is dynamic; map its values onto Astryx's: primary→primary, secondary→secondary, danger→destructive, ghost→ghost, text→ghost, outline→secondary, success→(none).
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
    // TODO(ui-common-upgrade): lab Drawer `label` must be a string; it was the title.
    // TODO(ui-common-upgrade): lab Drawer renders no header: render the title, subtitle and footer inside children.
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
      {/* TODO(ui-common-upgrade): size and animated have no counterpart. */}
      <ProgressBar value={percent} label={`${percent ?? 0} of 100`} variant="success" animated={false} />
      <ProgressBar isIndeterminate label="Loading" isLabelHidden />
      <Skeleton width="40px" height="40px" data-testid="avatar" radius="rounded" />
      <Skeleton width="60%" height="1em" />
      {/* TODO(ui-common-upgrade): Astryx Tooltip takes no className: style the trigger, not the tooltip. */}
      <Tooltip content="Help" touchTrigger={isTouch() ? "tap" : "auto"} className="hint">
        <button type="button">?</button>
      </Tooltip>
    </>
  );
}

declare function isTouch(): boolean;

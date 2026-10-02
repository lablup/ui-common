/**
 * The only module that imports @lablup/ui-common. Feature code uses the
 * product-owned API below.
 */
import type { ReactNode } from "react";
import { Button as UiButton } from "@lablup/ui-common/components/Button";
import { EmptyState as UiEmptyState } from "@lablup/ui-common/components/EmptyState";
import { Select as UiSelect } from "@lablup/ui-common/components/Select";
import { Drawer as UiDrawer } from "@lablup/ui-common/components/Drawer";
import { ProgressBar } from "@lablup/ui-common/components/ProgressBar";
import { Tooltip } from "@lablup/ui-common/components/Tooltip";
import { Skeleton } from "@lablup/ui-common/components/Skeleton";

export function Button({ tone, busy, children, onClick }: { tone: "primary" | "danger"; busy?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <UiButton variant={tone} loading={busy} aria-busy={busy} onClick={onClick}>
      {children}
    </UiButton>
  );
}

export function Empty({ title, body, onRetry }: { title: string; body: string; onRetry: () => void }) {
  return (
    <UiEmptyState
      title={title}
      description={body}
      illustration={<svg />}
      showIllustration={false}
      primaryAction={{ label: "Retry", onClick: onRetry }}
      secondaryAction={{ label: "Docs", href: "/docs" }}
    />
  );
}

export function RegionSelect({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid: boolean }) {
  return (
    <UiSelect
      label="Region"
      value={value}
      onChange={onChange}
      options={[]}
      invalid={invalid}
      noOptionsLabel="Nothing here"
      searchPlaceholder="Find"
      disabled={false}
    />
  );
}

export function Panel({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <UiDrawer isOpen={open} onClose={onClose} title={title} footer={<span>footer</span>}>
      {children}
    </UiDrawer>
  );
}

export function Loading({ percent }: { percent: number | null }) {
  return (
    <>
      <ProgressBar value={percent} label={`${percent ?? 0} of 100`} variant="success" animated={false} />
      <ProgressBar value={null} ariaLabel="Loading" />
      <Skeleton variant="circle" width="40px" height="40px" testId="avatar" />
      <Skeleton variant="text" width="60%" />
      <Tooltip content="Help" toggleable={isTouch()} className="hint">
        <button type="button">?</button>
      </Tooltip>
    </>
  );
}

declare function isTouch(): boolean;

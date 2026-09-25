// Shared components: the app imports these from "@/components/common".
// TODO(ui-common-upgrade): re-exported under the 0.1 name, but the component is Astryx's now; modules importing it from here still pass 0.1 props and need the same migration.
export { Button } from "@lablup/ui-common/Button";
// TODO(ui-common-upgrade): re-exported under the 0.1 name, but the component is Astryx's now; modules importing it from here still pass 0.1 props and need the same migration.
export { Selector as Select } from "@lablup/ui-common/Selector";
export type { SelectorOptionData as SelectOption, SelectorProps as SelectProps } from "@lablup/ui-common/Selector";

// TODO(ui-common-upgrade): re-exported under the 0.1 name, but the component is Astryx's now; modules importing it from here still pass 0.1 props and need the same migration.
export { Skeleton } from "@lablup/ui-common/Skeleton";

export { SkeletonCard } from "@lablup/ui-common/components/Skeleton";
export { PageHeader } from "@lablup/ui-common/components/PageHeader";
// TODO(ui-common-upgrade): re-exported under the 0.1 name, but the component is Astryx's now; modules importing it from here still pass 0.1 props and need the same migration.
export { StatusDot as StatusTag } from "@lablup/ui-common/StatusDot";
export { usePrefersReducedMotion } from "@lablup/ui-common";
export { DataTableWrapper } from "./DataTableWrapper";

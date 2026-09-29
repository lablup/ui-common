// Shared components: the app imports these from "@/components/common".
// TODO(ui-common-upgrade): re-exported under the 0.1 name, but the component is Astryx's now. The upgrade migrated the elements of it in the modules it scanned that import it from here; any other importer still passes 0.1 props.
export { Button } from "@lablup/ui-common/Button";
// TODO(ui-common-upgrade): re-exported under the 0.1 name, but the component is Astryx's now. The upgrade migrated the elements of it in the modules it scanned that import it from here; any other importer still passes 0.1 props.
export { Selector as Select } from "@lablup/ui-common/Selector";
export type { SelectorOptionData as SelectOption, SelectorProps as SelectProps } from "@lablup/ui-common/Selector";

// TODO(ui-common-upgrade): re-exported under the 0.1 name, but the component is Astryx's now. The upgrade migrated the elements of it in the modules it scanned that import it from here; any other importer still passes 0.1 props.
export { Skeleton } from "@lablup/ui-common/Skeleton";

export { SkeletonCard } from "@lablup/ui-common/components/Skeleton";
export { PageHeader } from "@lablup/ui-common/components/PageHeader";
// TODO(ui-common-upgrade): re-exported under the 0.1 name, but the component is Astryx's now. The upgrade migrated the elements of it in the modules it scanned that import it from here; any other importer still passes 0.1 props.
export { StatusDot as StatusTag } from "@lablup/ui-common/StatusDot";
export { usePrefersReducedMotion } from "@lablup/ui-common";
export { DataTableWrapper } from "./DataTableWrapper";

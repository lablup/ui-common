import { StatusDot } from "@lablup/ui-common/StatusDot";
import { ProgressBar } from "@lablup/ui-common/ProgressBar";

export { StatusDot as StatusTag };
// TODO(ui-common-upgrade): ProgressBar is used as a value here; props passed to it this way are not migrated to Astryx ProgressBar.
export const Meter = ProgressBar;

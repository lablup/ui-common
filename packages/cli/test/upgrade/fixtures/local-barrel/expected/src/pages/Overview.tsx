import { ClickableCard } from "@lablup/ui-common/ClickableCard";
import { useState } from "react";
// TODO(ui-common-upgrade): type StatusKind was removed with StatusTag in 0.2 and has no Astryx counterpart; @/components/common no longer exports it.
import { Button, Meter, Select, StatusTag } from "@/components/common";

// TODO(ui-common-upgrade): type SortDirection was removed with DataTable in 0.2 and has no Astryx counterpart; ../components/common no longer exports it.
export function Overview({ kind, sort }: { kind: StatusKind; sort: SortDirection }) {
  const [region, setRegion] = useState("kr");
  return (
    <ClickableCard onClick={() => setRegion("kr")} label="Open the overview">
      {/* TODO(ui-common-upgrade): StatusDot renders only the dot; `label` becomes its accessible name. Keep the visible text: <HStack gap={1}><StatusDot variant=... label={label} /><Text>{label}</Text></HStack>. */}
      <StatusTag variant="success" label={kind} />
      {/* TODO(ui-common-upgrade): `label` is required and is the accessible name; the old visible `label` text maps to it with isLabelHidden when it was not shown. */}
      <Meter value={40} variant="success" />
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setRegion("us")}
        label="Reset" />
      <Select value={region} onChange={setRegion} options={[]} />
      <span>{sort}</span>
    </ClickableCard>
  );
}

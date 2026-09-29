import { useState } from "react";
import { BaseCard, Button, Meter, Select, StatusTag, type StatusKind } from "@/components/common";
import type { SortDirection } from "../components/common";

export function Overview({ kind, sort }: { kind: StatusKind; sort: SortDirection }) {
  const [region, setRegion] = useState("kr");
  return (
    <BaseCard onClick={() => setRegion("kr")} ariaLabel="Open the overview">
      <StatusTag state="running" label={kind} />
      <Meter value={40} variant="success" />
      <Button variant="danger" size="small" onClick={() => setRegion("us")}>
        Reset
      </Button>
      <Select value={region} onChange={setRegion} options={[]} />
      <span>{sort}</span>
    </BaseCard>
  );
}

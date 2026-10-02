import { useState } from "react";
import { Badge } from "@lablup/ui-common/Badge";
import { Card } from "@lablup/ui-common/Card";
import { Button } from "@lablup/ui-common/Button";
import { ProgressBar } from "@lablup/ui-common/ProgressBar";
import { StatusDot } from "@lablup/ui-common/StatusDot";
import { Tooltip } from "@lablup/ui-common/Tooltip";
import { PageLayout, StatCard } from "@lablup/ui-common";
import { ClickableCard } from "@lablup/ui-common/ClickableCard";
// TODO(ui-common-upgrade): type StatusKind was removed with StatusTag in 0.2 and has no Astryx counterpart.
import type { ButtonProps } from "@lablup/ui-common/Button";
import { usePrefersReducedMotion } from "@lablup/ui-common";
import { useTranslation } from "../i18n";

interface Model {
  id: string;
  name: string;
  state: StatusKind;
  progress: number;
}

export function ModelsPage({ models, onOpen }: { models: Model[]; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const reduced = usePrefersReducedMotion();
  const [busy, setBusy] = useState(false);
  const extra: Partial<ButtonProps> = { size: "small" };

  return (
    <PageLayout variant="wide">
      <StatCard label={t("models.total")} value={models.length} animate={!reduced} />
      <Button
        variant="primary"
        size="md"
        onClick={() => setBusy(true)}
        isLoading={busy}
        label="Deploy" />
      <Button
        variant="destructive"
        size="sm"
        isDisabled={busy}
        width="100%"
        label={t("models.deleteAll")} />
      <Button variant="ghost" isIconOnly label="Refresh" icon={<span>↻</span>} />
      {/* TODO(ui-common-upgrade): props spread into <Button> are not migrated; check them against Astryx Button's props. */}
      {/* TODO(ui-common-upgrade): shape="circle", inline and active have no counterpart. */}
      {/* TODO(ui-common-upgrade): `label` is required. A non-string child needs `label` for the accessible name and the node as children. */}
      <Button variant="secondary" inline tooltip="Details" {...extra}>
        <span>More</span>
      </Button>
      {models.map((model) => (
        // TODO(ui-common-upgrade): state (loading | active | disabled | warning) has no Card counterpart; express it in the content, or use ClickableCard isDisabled for disabled.
        <ClickableCard
          key={model.id}
          onClick={() => onOpen(model.id)}
          label={model.name}
          state="loading">
          <Badge variant="success" label={model.name} />
          {/* TODO(ui-common-upgrade): variant="primary" has no semantic Badge variant; pick `info` or a colour variant such as `orange`. */}
          <Badge variant="primary" label="New" />
          {/* TODO(ui-common-upgrade): StatusDot renders only the dot; `label` becomes its accessible name. Keep the visible text: <HStack gap={1}><StatusDot variant=... label={label} /><Text>{label}</Text></HStack>. */}
          <StatusDot
            variant={({
              running: "success",
              preparing: "accent",
              idle: "neutral",
              busy: "accent",
              stopping: "warning",
              terminated: "neutral",
              error: "error"
            } as const)[model.state]}
            label={model.state}
            isPulsing={["preparing", "stopping", "busy"].includes(model.state)} />
          {/* TODO(ui-common-upgrade): StatusDot renders only the dot; `label` becomes its accessible name. Keep the visible text: <HStack gap={1}><StatusDot variant=... label={label} /><Text>{label}</Text></HStack>. */}
          <StatusDot variant="accent" label="Preparing" isPulsing />
          {/* TODO(ui-common-upgrade): size and animated have no counterpart. */}
          <ProgressBar
            value={model.progress}
            variant="accent"
            size="sm"
            label="Download"
            hasValueLabel
            isLabelHidden />
          <Tooltip content="Copied" touchTrigger="tap">
            <span>copy</span>
          </Tooltip>
        </ClickableCard>
      ))}
      {/* TODO(ui-common-upgrade): variant (default | installed | available) maps to Card variant by intent: default -> "muted", installed -> "default", available -> "muted". */}
      <Card variant="default" className="summary">
        <p>Summary</p>
      </Card>
    </PageLayout>
  );
}

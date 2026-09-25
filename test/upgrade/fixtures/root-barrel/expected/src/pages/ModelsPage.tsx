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
      {/* TODO(ui-common-upgrade): Astryx Button has no "outline" variant; mapped to "secondary". */}
      {/* TODO(ui-common-upgrade): Button "inline": Astryx Button has no "inline" variant. Use variant="ghost" size="sm", or a Link. */}
      {/* TODO(ui-common-upgrade): Button needs a string `label` (its accessible name); its children are rich content. */}
      <Button variant="secondary" inline tooltip="Details" {...extra}>
        <span>More</span>
      </Button>
      {models.map((model) => (
        // TODO(ui-common-upgrade): BaseCard "state": Card has no state; show loading/disabled/warning in its content (Skeleton, Banner).
        <ClickableCard
          key={model.id}
          onClick={() => onOpen(model.id)}
          label={model.name}
          state="loading">
          <Badge variant="success" label={model.name} />
          {/* TODO(ui-common-upgrade): Astryx Badge has no "primary" variant; mapped to the "orange" colour variant (tinted, not solid). */}
          <Badge variant="orange" label="New" />
          {/* TODO(ui-common-upgrade): StatusDot shows no text: `label` is its accessible name only. Put a <Text> beside it if the label must stay visible. */}
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
          {/* TODO(ui-common-upgrade): StatusDot shows no text: `label` is its accessible name only. Put a <Text> beside it if the label must stay visible. */}
          <StatusDot variant="accent" label="Preparing" isPulsing />
          {/* TODO(ui-common-upgrade): ProgressBar "size": Astryx ProgressBar has one size. */}
          <ProgressBar value={model.progress} variant="accent" size="sm" label="Download" hasValueLabel />
          <Tooltip content="Copied" touchTrigger="tap">
            <span>copy</span>
          </Tooltip>
        </ClickableCard>
      ))}
      <Card className="summary">
        <p>Summary</p>
      </Card>
    </PageLayout>
  );
}

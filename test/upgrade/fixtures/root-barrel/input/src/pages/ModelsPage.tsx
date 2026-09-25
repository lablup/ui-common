import { useState } from "react";
import { Badge, BaseCard, Button, PageLayout, ProgressBar, StatCard, StatusTag, Tooltip } from "@lablup/ui-common";
import type { ButtonProps, StatusKind } from "@lablup/ui-common";
import { usePrefersReducedMotion } from "@lablup/ui-common/hooks";
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
      <Button variant="primary" size="medium" onClick={() => setBusy(true)} loading={busy}>
        Deploy
      </Button>
      <Button variant="danger" size="small" disabled={busy} fullWidth>
        {t("models.deleteAll")}
      </Button>
      <Button variant="ghost" iconOnly ariaLabel="Refresh" icon={<span>↻</span>} />
      <Button variant="outline" inline title="Details" {...extra}>
        <span>More</span>
      </Button>
      {models.map((model) => (
        <BaseCard key={model.id} clickable onClick={() => onOpen(model.id)} ariaLabel={model.name} state="loading">
          <Badge variant="success" size="small">
            {model.name}
          </Badge>
          <Badge variant="primary">New</Badge>
          <StatusTag state={model.state} label={model.state} />
          <StatusTag state="preparing" label="Preparing" />
          <ProgressBar value={model.progress} variant="primary" size="sm" ariaLabel="Download" showLabel />
          <Tooltip content="Copied" toggleable>
            <span>copy</span>
          </Tooltip>
        </BaseCard>
      ))}
      <BaseCard variant="default" className="summary">
        <p>Summary</p>
      </BaseCard>
    </PageLayout>
  );
}

import { Button } from "~/components/common";
import { BaseCard } from "../components/common";

export function Settings({ save }: { save: () => void }) {
  return (
    // TODO(ui-common-upgrade): variant (default | installed | available) maps to Card variant by intent: default -> "muted", installed -> "default", available -> "muted".
    <BaseCard variant="outlined">
      <Button variant="primary" loading={false} onClick={save}>
        Save
      </Button>
    </BaseCard>
  );
}

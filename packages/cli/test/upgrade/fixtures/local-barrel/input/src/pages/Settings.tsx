import { Button } from "~/components/common";
import { BaseCard } from "../components/common";

export function Settings({ save }: { save: () => void }) {
  return (
    <BaseCard variant="outlined">
      <Button variant="primary" loading={false} onClick={save}>
        Save
      </Button>
    </BaseCard>
  );
}

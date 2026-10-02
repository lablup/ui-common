import { AlertModal, type AlertModalProps } from "@lablup/ui-common/AlertModal";
import { useImperativeDialog } from "@astryxdesign/core/Dialog";
import { useState } from "react";

type Props = Pick<AlertModalProps, "title"> & { name: string };

export function ConfirmDelete({ name }: Props) {
  const [open, setOpen] = useState(false);
  const imperative = useImperativeDialog();
  void imperative;
  return (
    <AlertModal
      isOpen={open}
      onOpenChange={setOpen}
      title={`Delete ${name}?`}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    />
  );
}

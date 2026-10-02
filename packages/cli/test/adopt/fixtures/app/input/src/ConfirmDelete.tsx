import { AlertDialog, type AlertDialogProps } from "@astryxdesign/core/AlertDialog";
import { useImperativeDialog } from "@astryxdesign/core/Dialog";
import { useState } from "react";

type Props = Pick<AlertDialogProps, "title"> & { name: string };

export function ConfirmDelete({ name }: Props) {
  const [open, setOpen] = useState(false);
  const imperative = useImperativeDialog();
  void imperative;
  return (
    <AlertDialog
      isOpen={open}
      onOpenChange={setOpen}
      title={`Delete ${name}?`}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    />
  );
}

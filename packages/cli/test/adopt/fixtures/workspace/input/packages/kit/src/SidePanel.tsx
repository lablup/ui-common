import { Dialog } from "@astryxdesign/core";
import { useState } from "react";

const Modal = "modal";

export function SidePanel({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog isOpen={open} onOpenChange={setOpen} aria-label={`${title} ${Modal}`}>
      {title}
    </Dialog>
  );
}

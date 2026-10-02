import { Button, Modal, Text, type ModalProps } from "@lablup/ui-common";
import { ToastViewport } from "@lablup/ui-common/Toast";
import { Drawer } from "@lablup/ui-common/lab";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ConfirmDelete } from "./ConfirmDelete";

const purpose: ModalProps["purpose"] = "info";

export function App() {
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "k" && event.metaKey) setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="console-shell">
      <Text>Metrics</Text>
      <Button label="Details" onClick={() => setOpen(true)} />
      <Button label="Filters" onClick={() => setDrawer(true)} />
      <Modal ref={dialogRef} isOpen={open} onOpenChange={setOpen} purpose={purpose}>
        <Text>Details</Text>
      </Modal>
      <Drawer isOpen={drawer} onOpenChange={setDrawer} title="Filters">
        <Text>Filters</Text>
      </Drawer>
      <ConfirmDelete name="dashboard" />
      {createPortal(<ToastViewport position="bottomEnd" />, document.body)}
    </main>
  );
}

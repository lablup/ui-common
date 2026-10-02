import { Button } from '@astryxdesign/core/Button';
import { Drawer, Tour } from '@astryxdesign/lab';
import { useState } from 'react';

export function Filters() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button label="Filters" onClick={() => setOpen(true)} />
      <Drawer isOpen={open} onOpenChange={setOpen} title="Filters" />
      <Tour steps={[]} />
    </>
  );
}

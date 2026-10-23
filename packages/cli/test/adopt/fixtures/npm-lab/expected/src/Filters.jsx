import { Button } from '@lablup/ui-common/Button';
import { Tour } from '@lablup/ui-common/lab';
import { Drawer } from '@lablup/ui-common/Drawer';
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

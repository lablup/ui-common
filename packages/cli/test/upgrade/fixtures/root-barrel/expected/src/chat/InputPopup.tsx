import { useEffect } from "react";

export function useOutsideClose(onClose: () => void) {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".select__dropdown--portal")) return;
      onClose();
    };
    document.addEventListener("mousedown", handler);
    document.documentElement.style.setProperty("--color-error", "#c82333");
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
}

import "@testing-library/jest-dom/vitest";

// jsdom implements neither matchMedia nor ResizeObserver, and several
// components in this package branch on both (reduced motion, height
// animation). Without these the components under test throw before their
// behavior can be asserted.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// Node.js 22.4+ ships its own global `localStorage`, gated behind a
// `--localstorage-file` flag; without that flag the property resolves to
// `undefined` rather than throwing. Vitest's jsdom environment only
// overrides globals it already knows about when they collide with an
// existing Node global, and `localStorage` was added to Node after that
// allow-list was written, so jsdom's real (working) implementation never
// gets a chance to take its place. DataTable's column-persistence tests
// need a working Storage, so install a minimal in-memory polyfill whenever
// the environment's own `localStorage` is unusable.
function isUsableStorage(storage: unknown): storage is Storage {
  if (!storage || typeof storage !== "object") return false;
  const candidate = storage as Partial<Storage>;
  if (typeof candidate.setItem !== "function") return false;
  try {
    const probeKey = "__ui_common_storage_probe__";
    candidate.setItem(probeKey, "1");
    candidate.removeItem?.(probeKey);
    return true;
  } catch {
    return false;
  }
}

if (!isUsableStorage(window.localStorage)) {
  class MemoryStorage implements Storage {
    #store = new Map<string, string>();

    get length(): number {
      return this.#store.size;
    }

    clear(): void {
      this.#store.clear();
    }

    getItem(key: string): string | null {
      return this.#store.has(key) ? (this.#store.get(key) ?? null) : null;
    }

    key(index: number): string | null {
      return Array.from(this.#store.keys())[index] ?? null;
    }

    removeItem(key: string): void {
      this.#store.delete(key);
    }

    setItem(key: string, value: string): void {
      this.#store.set(key, String(value));
    }
  }

  Object.defineProperty(window, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

/**
 * The catalog holds every component's strings whichever module loads first.
 * A messages module that imported back from the catalog was evaluated after
 * it when an app reached the messages first (Form does, through its
 * validate messages), so the catalog spread `undefined` and those keys fell
 * back to the raw key in English.
 */
import { describe, expect, it, vi } from "vitest";

const messageModules = import.meta.glob<Record<string, Record<string, unknown>>>([
  "../**/*.messages.ts",
]);

describe("uiCommonCatalog", () => {
  it.each(Object.entries(messageModules))(
    "holds the strings of %s when that module loads before the catalog",
    async (_path, load) => {
      vi.resetModules();
      const exports = await load();
      const { uiCommonCatalog } = await import("./catalog");
      const keys = Object.values(exports).flatMap((messages) => Object.keys(messages));
      expect(keys.length).toBeGreaterThan(0);
      expect(keys.filter((key) => !(key in uiCommonCatalog))).toEqual([]);
    },
  );

  it("holds Form's strings when the Form engine loads first", async () => {
    vi.resetModules();
    await import("../components/Form/messages");
    const { uiCommonCatalog } = await import("./catalog");
    expect(uiCommonCatalog["uic.Form.optional"]?.defaultMessage).toBe("(optional)");
  });
});

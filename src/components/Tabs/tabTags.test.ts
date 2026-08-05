/**
 * Tests for tabTags shared module
 *
 * Tests cover:
 * - TabTagType type completeness (all four variants are defined)
 * - TAG_CONFIG covers every TabTagType key
 * - Each tag config entry has the expected badge variant
 */

import { describe, it, expect } from "vitest";
import { TAG_CONFIG } from "./tabTags";
import type { TabTagType } from "./tabTags";

describe("tabTags", () => {
  describe("TAG_CONFIG completeness", () => {
    it("should define an entry for every TabTagType variant", () => {
      const expectedKeys: TabTagType[] = [
        "required",
        "recommended",
        "beta",
        "experimental",
      ];

      for (const key of expectedKeys) {
        expect(TAG_CONFIG).toHaveProperty(key);
      }
    });

    it("should not contain unexpected keys", () => {
      const keys = Object.keys(TAG_CONFIG);
      expect(keys).toHaveLength(4);
      expect(keys.sort()).toEqual(
        ["beta", "experimental", "recommended", "required"].sort(),
      );
    });
  });

  describe("TAG_CONFIG entries — badge variants", () => {
    it("should map 'required' to warning variant", () => {
      expect(TAG_CONFIG.required.variant).toBe("warning");
    });

    it("should map 'recommended' to primary variant", () => {
      expect(TAG_CONFIG.recommended.variant).toBe("primary");
    });

    it("should map 'beta' to info variant", () => {
      expect(TAG_CONFIG.beta.variant).toBe("info");
    });

    it("should map 'experimental' to warning variant", () => {
      expect(TAG_CONFIG.experimental.variant).toBe("warning");
    });
  });

  describe("TAG_CONFIG shape", () => {
    it("should have only a variant field on every entry", () => {
      for (const [, config] of Object.entries(TAG_CONFIG)) {
        expect(config).toHaveProperty("variant");
        expect(typeof config.variant).toBe("string");
        expect(Object.keys(config)).toEqual(["variant"]);
      }
    });
  });
});

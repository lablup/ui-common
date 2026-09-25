/**
 * ui-common's strings resolve through Astryx's own provider (FR-4055), with
 * ui-common's English as the fallback rather than the raw key.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  InternationalizationProvider,
  type Catalog,
  type MessagesByLocale,
  type Overrides,
} from "@astryxdesign/core/i18n";

import { uiCommonCatalog } from "./catalog";
import { mergeMessages, uiCommonMessages } from "./messages";
import { localeChain, useUicTranslator } from "./useUicTranslator";

const CATALOG: Catalog = {
  "uic.Test.close": { defaultMessage: "Close" },
  "uic.Test.count": { defaultMessage: "{count, plural, one {# item} other {# items}}" },
};

function translate(
  key: string,
  values?: Record<string, unknown>,
  provider?: { locale: string; messages?: MessagesByLocale; overrides?: Overrides },
): string {
  const wrapper = provider
    ? ({ children }: { children: ReactNode }) => (
        <InternationalizationProvider {...provider}>
          {children}
        </InternationalizationProvider>
      )
    : undefined;
  const { result } = renderHook(() => useUicTranslator(CATALOG), { wrapper });
  return result.current(key, values);
}

describe("useUicTranslator", () => {
  it("falls back to the catalog's English with no provider", () => {
    expect(translate("uic.Test.close")).toBe("Close");
  });

  it("formats ICU values in the fallback", () => {
    expect(translate("uic.Test.count", { count: 2 })).toBe("2 items");
  });

  it("uses the consumer's messages for the active locale", () => {
    expect(
      translate("uic.Test.close", undefined, {
        locale: "ko-KR",
        messages: { "ko-KR": { "uic.Test.close": { defaultMessage: "닫기" } } },
      }),
    ).toBe("닫기");
  });

  it("walks to the parent locale, as Astryx does", () => {
    expect(
      translate("uic.Test.close", undefined, {
        locale: "pt-BR",
        messages: { pt: { "uic.Test.close": { defaultMessage: "Fechar" } } },
      }),
    ).toBe("Fechar");
  });

  it("lets an override win over messages", () => {
    expect(
      translate("uic.Test.close", undefined, {
        locale: "ko-KR",
        messages: { "ko-KR": { "uic.Test.close": { defaultMessage: "닫기" } } },
        overrides: { "ko-KR": { "uic.Test.close": "창 닫기" } },
      }),
    ).toBe("창 닫기");
  });

  it("falls back to English when the locale lacks the key", () => {
    expect(
      translate("uic.Test.close", undefined, { locale: "ja-JP", messages: {} }),
    ).toBe("Close");
  });

  it("returns the key when no catalog knows it", () => {
    expect(translate("uic.Test.unknown")).toBe("uic.Test.unknown");
  });

  it("builds the locale chain from most to least specific", () => {
    expect(localeChain("zh-Hans-CN")).toEqual(["zh-Hans-CN", "zh-Hans", "zh"]);
  });
});

describe("ui-common catalog", () => {
  const LOCALES_DIR = join(__dirname, "locales");
  const ASTRYX_LOCALES = new Set(
    readdirSync(join(__dirname, "../../node_modules/@astryxdesign/core/locales")),
  );
  const translationFiles = (() => {
    try {
      return readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));
    } catch {
      return [];
    }
  })();

  it("keys are uic.<Component>.<key> or uic.common.<key>", () => {
    for (const key of Object.keys(uiCommonCatalog)) {
      expect(key).toMatch(/^uic\.(common|[A-Z][A-Za-z0-9]*)\.[A-Za-z0-9]+$/);
    }
  });

  it("translation files use Astryx locale file names and only known keys", () => {
    for (const file of translationFiles) {
      expect(ASTRYX_LOCALES.has(file), file).toBe(true);
      expect(file, "English comes from the code catalog").not.toBe("en.json");
      const catalog = JSON.parse(
        readFileSync(join(LOCALES_DIR, file), "utf8"),
      ) as Catalog;
      const unknown = Object.keys(catalog).filter((k) => !(k in uiCommonCatalog));
      expect(unknown, file).toEqual([]);
    }
  });

  it.each(["ko-KR.json", "ja-JP.json"])("%s translates every key", (file) => {
    const catalog = JSON.parse(
      readFileSync(join(LOCALES_DIR, file), "utf8"),
    ) as Catalog;
    const missing = Object.keys(uiCommonCatalog).filter(
      (k) => !catalog[k]?.defaultMessage,
    );
    expect(missing).toEqual([]);
  });

  it("uiCommonMessages carries English plus every translation file", () => {
    expect(uiCommonMessages.en).toBe(uiCommonCatalog);
    expect(Object.keys(uiCommonMessages).sort()).toEqual(
      ["en", ...translationFiles.map((f) => f.replace(/\.json$/, ""))].sort(),
    );
  });

  it("mergeMessages merges per locale, later sources winning", () => {
    expect(
      mergeMessages(
        { en: { a: { defaultMessage: "A" }, b: { defaultMessage: "B" } } },
        { en: { b: { defaultMessage: "B2" } }, ko: { a: { defaultMessage: "가" } } },
      ),
    ).toEqual({
      en: { a: { defaultMessage: "A" }, b: { defaultMessage: "B2" } },
      ko: { a: { defaultMessage: "가" } },
    });
  });
});

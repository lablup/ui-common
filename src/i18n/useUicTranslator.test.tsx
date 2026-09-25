/**
 * ui-common's strings resolve through Astryx's own provider (FR-4055), with
 * ui-common's English as the fallback rather than the raw key.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderHook } from "@testing-library/react";
import IntlMessageFormat from "intl-messageformat";
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

/**
 * Locales ui-common ships a translation for although Astryx core has no
 * catalog of that name: the names backend.ai-ui hands Astryx's provider for
 * Indonesian, Mongolian, Malay and Thai.
 */
const EXTRA_LOCALES = ["id-ID", "mn-MN", "ms-MY", "th-TH"];

/**
 * Keys with no translation yet in the `UNTRANSLATED_IN` locales: their
 * components' origin had no translated string for them. Every other key is
 * translated in every shipped locale file. An allowlisted pair that is
 * translated fails, so the list only shrinks.
 */
const UNTRANSLATED_KEYS = [
  "uic.common.ok",
  "uic.common.retry",
  "uic.BooleanToken.true",
  "uic.BooleanToken.false",
  "uic.NotificationStack.progress",
  "uic.PageHeader.dismissError",
  "uic.SkeletonCard.loading",
  "uic.SkeletonChart.loading",
  "uic.SkeletonRow.loading",
  "uic.SkeletonText.loading",
];
const UNTRANSLATED_IN = [
  "de-DE",
  "el-GR",
  "es-ES",
  "fi-FI",
  "fr-FR",
  "id-ID",
  "it-IT",
  "mn-MN",
  "ms-MY",
  "pl-PL",
  "pt-BR",
  "pt-PT",
  "ru-RU",
  "th-TH",
  "tr-TR",
  "vi-VN",
  "zh-CN",
  "zh-TW",
];

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
  const localeOf = (file: string) => file.replace(/\.json$/, "");
  const readLocale = (file: string) =>
    JSON.parse(readFileSync(join(LOCALES_DIR, file), "utf8")) as Catalog;

  it("keys are uic.<Component>.<key> or uic.common.<key>", () => {
    for (const key of Object.keys(uiCommonCatalog)) {
      expect(key).toMatch(/^uic\.(common|[A-Z][A-Za-z0-9]*)\.[A-Za-z0-9]+$/);
    }
  });

  it("translation files use Astryx locale file names and only known keys", () => {
    for (const file of translationFiles) {
      expect(
        ASTRYX_LOCALES.has(file) || EXTRA_LOCALES.includes(localeOf(file)),
        file,
      ).toBe(true);
      expect(file, "English comes from the code catalog").not.toBe("en.json");
      const unknown = Object.keys(readLocale(file)).filter(
        (k) => !(k in uiCommonCatalog),
      );
      expect(unknown, file).toEqual([]);
    }
  });

  it("ships a file for every locale it translates", () => {
    expect(translationFiles.map(localeOf).sort()).toEqual(
      ["ja-JP", "ko-KR", ...UNTRANSLATED_IN].sort(),
    );
  });

  it("translates every key in every file, but for the allowlist", () => {
    const isAllowed = (locale: string, key: string) =>
      UNTRANSLATED_IN.includes(locale) && UNTRANSLATED_KEYS.includes(key);
    for (const file of translationFiles) {
      const locale = localeOf(file);
      const catalog = readLocale(file);
      const isTranslated = (key: string) => !!catalog[key]?.defaultMessage;
      const missing = Object.keys(uiCommonCatalog).filter(
        (key) => !isTranslated(key) && !isAllowed(locale, key),
      );
      const stale = UNTRANSLATED_KEYS.filter(
        (key) => isAllowed(locale, key) && isTranslated(key),
      );
      expect({ locale, missing, stale }).toEqual({ locale, missing: [], stale: [] });
    }
  });

  it("keeps the English placeholders and parses as ICU MessageFormat", () => {
    // Argument names from the parsed message, so a plural's branches count as
    // text. Literal (0) and `#` (7) nodes carry no argument.
    type AstNode = {
      type: number;
      value?: unknown;
      options?: Record<string, { value: AstNode[] }>;
    };
    const argumentsOf = (message: string) => {
      const names = new Set<string>();
      const walk = (nodes: AstNode[]) => {
        for (const node of nodes) {
          if (node.type !== 0 && node.type !== 7 && typeof node.value === "string")
            names.add(node.value);
          for (const option of Object.values(node.options ?? {})) walk(option.value);
        }
      };
      walk(new IntlMessageFormat(message, "en").getAst() as AstNode[]);
      return [...names].sort();
    };
    for (const file of translationFiles) {
      for (const [key, entry] of Object.entries(readLocale(file))) {
        const message = entry.defaultMessage ?? "";
        expect(
          () => new IntlMessageFormat(message, "en"),
          `${file} ${key}`,
        ).not.toThrow();
        expect(argumentsOf(message), `${file} ${key}`).toEqual(
          argumentsOf(uiCommonCatalog[key]?.defaultMessage ?? ""),
        );
      }
    }
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

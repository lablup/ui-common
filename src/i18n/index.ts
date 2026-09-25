/**
 * `@lablup/ui-common/i18n-catalog`: ui-common's strings, for the consumer's
 * Astryx `InternationalizationProvider`.
 *
 * Supply them once, at the provider. Astryx's own locale catalogs are
 * mirrored at `@lablup/ui-common/locales/<locale>.json`; ui-common's are at
 * `@lablup/ui-common/ui-common-locales/<locale>.json`, and all of them are
 * in `uiCommonMessages` below.
 *
 *   import { InternationalizationProvider } from "@lablup/ui-common/i18n";
 *   import { mergeMessages, uiCommonMessages } from "@lablup/ui-common/i18n-catalog";
 *   import astryxKo from "@lablup/ui-common/locales/ko-KR.json";
 *
 *   <InternationalizationProvider
 *     locale="ko-KR"
 *     messages={mergeMessages({ "ko-KR": astryxKo }, uiCommonMessages)}
 *   >
 */
export { uiCommonCatalog } from "./catalog";
export type { UicMessageKey } from "./catalog";
export { mergeMessages, uiCommonMessages } from "./messages";

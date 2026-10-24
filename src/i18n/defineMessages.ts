import type { MessageEntry } from "@astryxdesign/core/i18n";

/**
 * A catalog key: `uic.<Component>.<key>`, or `uic.common.<key>` for a word
 * every component shares (`./common.messages.ts`).
 */
export type UicMessageKey = `uic.${string}.${string}`;

/**
 * Type-checks a component's messages. Keys must be `uic.<Component>.<key>` or
 * `uic.common.<key>`.
 */
export function defineMessages<const T extends Record<UicMessageKey, MessageEntry>>(
  messages: T,
): T {
  return messages;
}

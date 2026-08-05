/**
 * EmptyState Component - Barrel Export
 */

export { EmptyState } from "./EmptyState";
export type {
  EmptyStateProps,
  EmptyStateAction,
  EmptyStateSecondaryAction,
  IllustrationType,
} from "./EmptyState";

/**
 * The illustrations are also exported on their own.
 *
 * They shipped inside the package from the first release but no barrel named
 * them, so a consumer that composes its own empty state, which is the case
 * `EmptyState` cannot cover, had no way to reach one. Same shape as the
 * stylesheets in 0.1.0-alpha.1: present in the tarball, addressable by
 * nothing.
 */
export {
  ChatIllustration,
  ModelsIllustration,
  CreationsIllustration,
  BenchmarkIllustration,
  LogsIllustration,
  StatisticsIllustration,
  ErrorIllustration,
  TextIllustration,
  ScheduleIllustration,
  GenericIllustration,
} from "./illustrations";
export type { IllustrationProps } from "./illustrations";

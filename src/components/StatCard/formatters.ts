/**
 * Value formatters for StatCard.
 *
 * Kept out of StatCard.tsx so that file only exports components, which is what
 * the react-refresh lint rule requires for fast refresh to work.
 */

/**
 * Abbreviates large counts ("1.2M", "3.4K") and falls back to locale grouping
 * below 1000. Pass explicitly via StatCard's `format` prop; the card's own
 * default is plain `toLocaleString` so existing consumers are unaffected.
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

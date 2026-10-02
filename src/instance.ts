/**
 * Dev-only warning for a second copy of ui-common, or of Astryx core, on the
 * page. Internal: not exported from the package.
 *
 * Two copies split what one copy shares: the modal stack and every other
 * module-level state, and, when each copy brings its own `@astryxdesign/core`,
 * Astryx's React contexts (theme, i18n, layers), so components stop seeing the
 * provider the app rendered. Nothing fails; things quietly look wrong. Each
 * copy therefore records itself under one global symbol, and the first copy
 * to find another there warns once.
 *
 * `registerInstance()` is called from the code paths that use state a second
 * copy would split: the string translator (it reads Astryx's i18n context, so
 * most components render through it) and the modal stack. It runs on first
 * use rather than at module scope because the package declares its modules
 * side-effect free (`sideEffects` in package.json), and bundlers drop a bare
 * module-scope call from such a module. After the first call it is one
 * boolean check. Production builds drop it with the rest of the
 * `process.env.NODE_ENV` branch, as Astryx's own dev warnings are.
 *
 * It cannot see a second `@astryxdesign/core` that ui-common does not itself
 * import, such as one `@astryxdesign/lab` resolves to without the override
 * README describes: core has no global registration and lab exposes no handle
 * on the core it runs on. Two ui-common copies that each bring their own core
 * are detected, by comparing one of core's context objects.
 */
import { InternationalizationContext } from "@astryxdesign/core/i18n";

export const INSTANCE_KEY = Symbol.for("@lablup/ui-common/instance");

export interface UiCommonInstance {
  /** ui-common's version, from package.json at build time. */
  version: string;
  /** The Astryx core version ui-common pins. */
  astryxVersion: string;
  /** Where this copy was loaded from. */
  url: string;
  /**
   * One of Astryx core's React contexts, as this copy imports it. Two copies
   * holding different objects run on two copies of Astryx core.
   */
  astryxIdentity: unknown;
}

interface Registry {
  instances: UiCommonInstance[];
  warned: boolean;
}

type RegistryHost = { [INSTANCE_KEY]?: Registry };

/** What a new copy should say, or `null` when there is nothing to report. */
export function describeDuplicates(
  instances: readonly UiCommonInstance[],
): string | null {
  if (instances.length < 2) return null;
  const astryxCopies = new Set(instances.map((i) => i.astryxIdentity)).size;
  const list = instances
    .map(
      (i) =>
        `  - @lablup/ui-common ${i.version} (Astryx ${i.astryxVersion}) at ${i.url}`,
    )
    .join("\n");
  return (
    `@lablup/ui-common: ${instances.length} copies are loaded. They do not share ` +
    `module state (the modal stack, among others)` +
    (astryxCopies > 1
      ? `, and they run on ${astryxCopies} copies of @astryxdesign/core, so ` +
        `Theme, i18n and layer contexts do not reach across them`
      : "") +
    `. Dedupe the dependency (\`pnpm why @lablup/ui-common\`, ` +
    `\`npm ls @lablup/ui-common\`).\n${list}`
  );
}

/**
 * Record `self` under `host` and warn, once per page, when another copy is
 * already there. Calling it again from the same copy does nothing.
 */
export function registerInstanceIn(
  host: RegistryHost,
  self: UiCommonInstance,
  warn: (message: string) => void = console.warn,
): void {
  const registry = (host[INSTANCE_KEY] ??= { instances: [], warned: false });
  if (registry.instances.includes(self)) return;
  registry.instances.push(self);
  if (registry.warned) return;
  const message = describeDuplicates(registry.instances);
  if (message === null) return;
  registry.warned = true;
  warn(message);
}

const self: UiCommonInstance = {
  version: __UI_COMMON_VERSION__,
  astryxVersion: __ASTRYX_CORE_VERSION__,
  url: import.meta.url,
  astryxIdentity: InternationalizationContext,
};

let registered = false;

/** Register this copy on `globalThis`, once. Dev only. */
export function registerInstance(): void {
  if (process.env.NODE_ENV !== "production") {
    if (registered) return;
    registered = true;
    registerInstanceIn(globalThis as RegistryHost, self);
  }
}

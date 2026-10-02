/**
 * The `ui-common` command line: a thin wrapper over the exact-pinned Astryx
 * CLI plus ui-common's own commands.
 */
import { AGENTS_HELP, agentsCommand } from "./agents.mjs";
import { passthrough } from "./passthrough.mjs";
import {
  cliDependencyVersion,
  cliPackageJson,
  uiCommonPackageJson,
  uiCommonRoot,
} from "./paths.mjs";
import { ASTRYX_COMMANDS } from "./rewrite.mjs";
import { SYNC_HELP, syncAstryxCommand } from "./sync-astryx.mjs";
import { UPGRADE_HELP, upgradeCommand } from "./upgrade.mjs";

export const HELP = `Usage: ui-common <command> [options]

@lablup/ui-common's CLI (@lablup/ui-common-cli). Astryx commands run the
Astryx CLI it pins, with its output rewritten to ui-common import paths.

One-off, before ui-common is installed or bumped (\`@next\` until 0.2.0 is
published; npm's \`latest\` for this package is its first alpha):
  pnpm dlx @lablup/ui-common-cli@next upgrade --from 0.1   (npx: npx @lablup/ui-common-cli@next …)
Installed as a devDependency next to @lablup/ui-common:
  pnpm exec ui-common <command>

ui-common commands:
  agents [--write <file>] [--check]
        Print, write or check the ui-common agent block (UI-COMMON markers).
  upgrade [--from <v>] [--to <v>] [--dry-run] [--diff] [--report <path>] [paths…]
        Run the codemods between two ui-common versions and write a report.
  sync-astryx <version> [--lab <version>] [--as <version>] [--dry-run]
        Maintainers, inside the ui-common repository: move to a new Astryx.

Astryx commands (rewritten to @lablup/ui-common paths):
  ${ASTRYX_COMMANDS.filter((c) => c !== "upgrade" && c !== "help").join(", ")}
  e.g. ui-common component Button, ui-common search "date picker",
       ui-common docs tokens, ui-common build "settings page"

  astryx <args…>   Run the pinned Astryx CLI as is, with no rewriting
                   (e.g. \`ui-common astryx upgrade --from 0.6.0\`).

Options:
  -h, --help       Show this help (\`ui-common <command> --help\` for one command)
  -V, --version    Print the @lablup/ui-common-cli version (the same as the
                   @lablup/ui-common it ships with); --verbose adds the
                   project's ui-common and the Astryx CLI

Exit codes: a passed-through command exits with the Astryx CLI's code. ui-common
commands exit 0 on success, 1 on a failed check or run, 2 on bad arguments.
`;

/**
 * @param {string[]} argv process.argv.slice(2)
 * @returns {Promise<number>}
 */
export async function main(argv) {
  const [command, ...rest] = argv;
  switch (command) {
    case undefined:
    case "-h":
    case "--help":
    case "help":
      if (command === "help" && rest[0]) return main([rest[0], "--help"]);
      process.stdout.write(HELP);
      return 0;
    case "-V":
    case "--version":
      process.stdout.write(`${cliPackageJson().version}\n`);
      if (rest.includes("--verbose")) {
        let uiCommon = "not installed";
        try {
          const root = uiCommonRoot();
          uiCommon = `${uiCommonPackageJson(root).version} (${root})`;
        } catch {
          // reported as not installed
        }
        process.stdout.write(
          `@lablup/ui-common ${uiCommon}\nastryx ${cliDependencyVersion("@astryxdesign/cli") ?? "not installed"}\n`,
        );
      }
      return 0;
    case "agents":
      return agentsCommand(rest);
    case "upgrade":
      return upgradeCommand(rest);
    case "sync-astryx":
      return syncAstryxCommand(rest);
    case "astryx":
      return passthrough(rest, { raw: true });
    default:
      return passthrough(argv);
  }
}

export { AGENTS_HELP, SYNC_HELP, UPGRADE_HELP };

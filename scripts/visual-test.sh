#!/bin/sh
# Runs the visual tests in the Playwright container CI uses. Screenshots differ
# between operating systems and CPU architectures, so baselines come only from
# here: linux/amd64 on every host, emulated on Apple Silicon.
#
#   scripts/visual-test.sh                       compare against the baselines
#   scripts/visual-test.sh src/components/Board  limit to a path
#   scripts/visual-test.sh -u                    rewrite the baselines
#   scripts/visual-test.sh src/components/Board -u
#
# Put -u last: Vitest reads the word after it as the update mode.
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
version=$(node -p "require('$root/package.json').devDependencies.playwright")
pnpm_spec=$(node -p "require('$root/package.json').packageManager")

# Volumes keep the host's node_modules (built for the host) out of the
# container and make repeat runs fast.
exec docker run --rm --init --platform linux/amd64 \
  -v "$root:/work" \
  -v ui-common-visual-root-modules:/work/node_modules \
  -v ui-common-visual-cli-modules:/work/packages/cli/node_modules \
  -v ui-common-visual-pnpm-store:/pnpm-store \
  -w /work \
  -e CI=true \
  "mcr.microsoft.com/playwright:v$version-noble" \
  sh -c 'npx --yes "$0" install --frozen-lockfile --prefer-offline --store-dir /pnpm-store >/dev/null && exec npx --yes "$0" run test:visual "$@"' "$pnpm_spec" "$@"

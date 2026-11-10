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
# container and make repeat runs fast. Named per checkout, so worktrees on
# different lockfiles do not install over each other.
id=$(printf %s "$root" | cksum | cut -d " " -f 1)

# The container runs as root; hand what it wrote back to the caller, or a
# Linux host is left with root-owned baselines.
exec docker run --rm --init --platform linux/amd64 \
  -v "$root:/work" \
  -v "ui-common-visual-$id-root-modules:/work/node_modules" \
  -v "ui-common-visual-$id-cli-modules:/work/packages/cli/node_modules" \
  -v ui-common-visual-pnpm-store:/pnpm-store \
  -w /work \
  -e CI=true \
  -e HOST_OWNER="$(id -u):$(id -g)" \
  "mcr.microsoft.com/playwright:v$version-noble" \
  sh -c '
    pnpm="npx --yes $0"
    $pnpm install --frozen-lockfile --prefer-offline --store-dir /pnpm-store --reporter=append-only || exit
    status=0
    $pnpm run test:visual "$@" || status=$?
    chown -R "$HOST_OWNER" test/visual/__screenshots__ .vitest-attachments 2>/dev/null
    exit $status
  ' "$pnpm_spec" "$@"

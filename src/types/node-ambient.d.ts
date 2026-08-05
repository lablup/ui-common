/**
 * Ambient Node.js type reference.
 *
 * `vite.config.ts` imports Node built-ins (`node:fs`, `node:path`, ...) for
 * the build-time `copyStyles` plugin and entry-point globbing. The root
 * tsconfig restricts automatic `@types/*` global inclusion to
 * `vitest/globals` and `@testing-library/jest-dom` (so component code never
 * accidentally picks up ambient Node globals like `process` or `Buffer`),
 * which means `@types/node` needs an explicit reference somewhere in the
 * "src" program to resolve those imports. This file is that reference; it
 * has no exports and contributes nothing to the runtime bundle.
 */

/// <reference types="node" />

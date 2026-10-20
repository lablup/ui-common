# @lablup/ui-common-cli

The `ui-common` command line for [`@lablup/ui-common`](https://www.npmjs.com/package/@lablup/ui-common):
the Astryx CLI that ui-common pins, with its output in `@lablup/ui-common`
terms, the agent block, the upgrade codemods, `adopt --from astryx` for an
app that uses Astryx directly, `doctor`, and the `ui-common-adopt` agent
skill.

It is a separate package so the CLI's toolchain (the Astryx CLI, jscodeshift,
postcss) stays out of a consumer's production install. It is released at the
same version as `@lablup/ui-common` and takes it as a peer.

```
pnpm dlx @lablup/ui-common-cli@next upgrade --from 0.1   # one-off (npx @lablup/ui-common-cli@next …)
pnpm dlx @lablup/ui-common-cli@next adopt --from astryx --dry-run   # an app on @astryxdesign/*

pnpm add -D @lablup/ui-common-cli@<the @lablup/ui-common version>   # or keep it next to ui-common
pnpm exec ui-common --help
```

While 0.2 is in prerelease, name the `next` dist-tag (or an exact version):
only prereleases are published, and npm points `latest` at a package's first
publish, so a bare `@lablup/ui-common-cli` resolves to its first alpha. Plain
`@lablup/ui-common-cli` works once 0.2.0 is published.

Documentation: [The ui-common CLI](https://github.com/lablup/ui-common#the-ui-common-cli)
in the repository README.

## License

[Apache-2.0](LICENSE). See [NOTICE](NOTICE).

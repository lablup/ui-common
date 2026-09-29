# @lablup/ui-common-cli

The `ui-common` command line for [`@lablup/ui-common`](https://www.npmjs.com/package/@lablup/ui-common):
the Astryx CLI that ui-common pins, with its output in `@lablup/ui-common`
terms, the agent block, and the upgrade codemods.

It is a separate package so the CLI's toolchain (the Astryx CLI, jscodeshift,
postcss) stays out of a consumer's production install. It is released at the
same version as `@lablup/ui-common` and takes it as a peer.

```
pnpm dlx @lablup/ui-common-cli upgrade --from 0.1   # one-off (npx @lablup/ui-common-cli …)

pnpm add -D @lablup/ui-common-cli                   # or keep it next to ui-common
pnpm exec ui-common --help
```

Documentation: [The ui-common CLI](https://github.com/lablup/ui-common#the-ui-common-cli)
in the repository README.

## License

[Apache-2.0](LICENSE). See [NOTICE](NOTICE).

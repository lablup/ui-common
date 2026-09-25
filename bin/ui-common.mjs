#!/usr/bin/env node
import { main } from "../cli/main.mjs";

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    process.stderr.write(`ui-common: ${err?.stack ?? err}\n`);
    process.exitCode = 1;
  },
);

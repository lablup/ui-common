/**
 * Why a codemod's output is not applied, or `null` when it is accepted
 * (`ui-common upgrade` and `ui-common adopt` both ask). A script is re-parsed
 * with the parser that produced it; a `.css` file with postcss, since an
 * Astryx codemod that lists `.css` runs its postcss path on it and the output
 * is not a script (#67). Sass and Less have no parser here and are accepted
 * as written.
 */
import { extname } from "node:path";

import postcss from "postcss";

import { SCRIPT_EXTENSIONS } from "./project.mjs";

/**
 * @param {string} file
 * @param {string} out
 * @param {any} j jscodeshift with the parser chosen for `file`
 * @returns {string | null}
 */
export function checkOutput(file, out, j) {
  const ext = extname(file);
  try {
    if (SCRIPT_EXTENSIONS.has(ext)) j(out);
    else if (ext === ".css") postcss.parse(out, { from: file });
  } catch (err) {
    return `produced unparseable output, not applied: ${/** @type {Error} */ (err).message}`;
  }
  return null;
}

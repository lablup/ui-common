/**
 * Markup comparison for the Astryx forks (src/forks/). A fork must render what
 * the upstream component renders, class for class, except where its fix
 * changes something; these helpers make two renders comparable.
 */

/**
 * `element`'s markup with React's generated ids (`useId`: `_r_1_`, `«r1»`,
 * `:r1:`) replaced, since two separate renders never share them.
 */
export function comparableMarkup(element: Element | DocumentFragment): string {
  const html =
    element instanceof Element
      ? element.outerHTML
      : Array.from(element.childNodes)
          .map((n) => (n instanceof Element ? n.outerHTML : (n.textContent ?? "")))
          .join("");
  return html.replace(/(?:_r_|«r|:r)[0-9a-z]+(?:_|»|:)/g, "<id>");
}

/**
 * A line diff, enough for a dry-run summary (+/- counts) and a unified
 * preview. Plain LCS over the lines that differ after trimming the common
 * head and tail, which is all a codemod's edits ever are.
 */

const MAX_CELLS = 25_000_000;

/**
 * @param {string} a
 * @param {string} b
 * @returns {Array<{op: ' ' | '-' | '+', line: string}>}
 */
export function diffLines(a, b) {
  const x = a.split("\n");
  const y = b.split("\n");
  let head = 0;
  while (head < x.length && head < y.length && x[head] === y[head]) head++;
  let tail = 0;
  while (
    tail < x.length - head &&
    tail < y.length - head &&
    x[x.length - 1 - tail] === y[y.length - 1 - tail]
  ) {
    tail++;
  }
  const xs = x.slice(head, x.length - tail);
  const ys = y.slice(head, y.length - tail);
  /** @type {Array<{op: ' ' | '-' | '+', line: string}>} */
  const middle = [];
  if ((xs.length + 1) * (ys.length + 1) > MAX_CELLS) {
    for (const line of xs) middle.push({ op: "-", line });
    for (const line of ys) middle.push({ op: "+", line });
  } else {
    const n = xs.length;
    const m = ys.length;
    const table = new Uint32Array((n + 1) * (m + 1));
    for (let i = n - 1; i >= 0; i--) {
      for (let k = m - 1; k >= 0; k--) {
        table[i * (m + 1) + k] =
          xs[i] === ys[k]
            ? table[(i + 1) * (m + 1) + k + 1] + 1
            : Math.max(table[(i + 1) * (m + 1) + k], table[i * (m + 1) + k + 1]);
      }
    }
    let i = 0;
    let k = 0;
    while (i < n && k < m) {
      if (xs[i] === ys[k]) {
        middle.push({ op: " ", line: xs[i] });
        i++;
        k++;
      } else if (table[(i + 1) * (m + 1) + k] >= table[i * (m + 1) + k + 1]) {
        middle.push({ op: "-", line: xs[i++] });
      } else {
        middle.push({ op: "+", line: ys[k++] });
      }
    }
    while (i < n) middle.push({ op: "-", line: xs[i++] });
    while (k < m) middle.push({ op: "+", line: ys[k++] });
  }
  return [
    ...x.slice(0, head).map((line) => ({ op: /** @type {' '} */ (" "), line })),
    ...middle,
    ...x.slice(x.length - tail).map((line) => ({ op: /** @type {' '} */ (" "), line })),
  ];
}

/** @param {string} a @param {string} b */
export function diffStat(a, b) {
  let added = 0;
  let removed = 0;
  for (const { op } of diffLines(a, b)) {
    if (op === "+") added++;
    else if (op === "-") removed++;
  }
  return { added, removed };
}

/**
 * A unified diff with three lines of context.
 *
 * @param {string} file
 * @param {string} a before ('' for a new file)
 * @param {string} b after
 */
export function unifiedDiff(file, a, b, context = 3) {
  const lines = diffLines(a, b);
  const out = [`--- a/${file}`, `+++ b/${file}`];
  let i = 0;
  let oldLine = 1;
  let newLine = 1;
  while (i < lines.length) {
    if (lines[i].op === " ") {
      i++;
      oldLine++;
      newLine++;
      continue;
    }
    const start = Math.max(0, i - context);
    let end = i;
    // Extend while changes are within 2*context of each other.
    for (;;) {
      while (end < lines.length && lines[end].op !== " ") end++;
      let next = end;
      while (next < lines.length && lines[next].op === " " && next - end < context * 2)
        next++;
      if (next < lines.length && lines[next].op !== " ") end = next;
      else break;
    }
    const stop = Math.min(lines.length, end + context);
    const lead = i - start;
    const hunk = lines.slice(start, stop);
    const oldCount = hunk.filter((l) => l.op !== "+").length;
    const newCount = hunk.filter((l) => l.op !== "-").length;
    out.push(`@@ -${oldLine - lead},${oldCount} +${newLine - lead},${newCount} @@`);
    for (const l of hunk) out.push(`${l.op}${l.line}`);
    for (let k = i; k < stop; k++) {
      if (lines[k].op !== "+") oldLine++;
      if (lines[k].op !== "-") newLine++;
    }
    i = stop;
  }
  return out.join("\n");
}

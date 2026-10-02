import { readFileSync, writeFileSync } from "node:fs";

// Appends our rules right after the managed agent block.
const text = readFileSync("AGENTS.md", "utf8");
const at = text.indexOf("<!-- ASTRYX:END -->");
writeFileSync("AGENTS.md", `${text.slice(0, at)}<!-- ASTRYX:END -->\n\nOur rules.\n`);

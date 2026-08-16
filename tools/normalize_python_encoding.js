/**
 * Convert legacy Windows-1252 Python sources to real UTF-8.
 *
 * Aarit declares UTF-8 in every source file, but part of the original tree
 * was saved using a Windows single-byte encoding. Python 3 correctly rejects
 * those files before parsing them.
 */
const fs = require("fs");
const path = require("path");
const { TextDecoder } = require("util");

const root = path.resolve(__dirname, "..");
const utf8 = new TextDecoder("utf-8", { fatal: true });
const windows1252 = new TextDecoder("windows-1252");
const skipped = new Set([".git", ".venv", "www", "node_modules"]);

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(filePath);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".py")) continue;

    const bytes = fs.readFileSync(filePath);
    try {
      const source = utf8.decode(bytes);
      if (source.includes("\uFFFD")) {
        fs.writeFileSync(filePath, source.replaceAll("\uFFFD", "?"), "utf8");
        console.log("repaired", path.relative(root, filePath));
      }
    } catch {
      const source = windows1252.decode(bytes);
      fs.writeFileSync(filePath, source, "utf8");
      console.log("converted", path.relative(root, filePath));
    }
  }
}

walk(root);

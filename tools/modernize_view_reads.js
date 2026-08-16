/**
 * Make legacy templates decode consistently on every operating system.
 * UTF-8-SIG also strips the BOM present in some original Aarit views.
 */
const fs = require("fs");
const path = require("path");

const srcRoot = path.resolve(__dirname, "..", "src");

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(filePath);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".py")) continue;

    const source = fs.readFileSync(filePath, "utf8");
    const updated = source.replace(
      /open\((["'])(src\/views\/[^"']+)\1\)/g,
      'open("$2", encoding="utf-8-sig")'
    );
    if (updated !== source) {
      fs.writeFileSync(filePath, updated, "utf8");
      console.log("updated", path.relative(srcRoot, filePath));
    }
  }
}

walk(srcRoot);

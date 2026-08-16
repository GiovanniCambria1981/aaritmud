/**
 * Mechanical Python 2 -> 3 port for the Aarit tree.
 * Conservative syntax/stdlib rewrites only; semantic leftovers are documented.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SKIP_DIRS = new Set([".git", "www", "tools", "docs", "node_modules"]);

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && entry.name.endsWith(".py")) acc.push(full);
  }
  return acc;
}

function convertPrintStatement(line) {
  const commentIdx = findUnquoted(line, "#");
  let code = commentIdx === -1 ? line : line.slice(0, commentIdx);
  const comment = commentIdx === -1 ? "" : line.slice(commentIdx);
  const trimmed = code.trimEnd();
  const indentMatch = code.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : "";
  const body = trimmed.slice(indent.length);

  if (!/^print\b/.test(body)) return line;
  if (/^print\s*\(/.test(body)) return line;

  const after = body.slice("print".length);
  if (after.trim() === "") {
    return indent + "print()" + (code.endsWith("\r") ? "\r" : "") + comment;
  }
  if (!/^\s/.test(after)) return line;

  let args = after.replace(/^\s+/, "");
  let endKw = "";
  if (args.endsWith(",")) {
    args = args.slice(0, -1).trimEnd();
    endKw = ", end=' '";
  }
  return indent + "print(" + args + endKw + ")" + comment;
}

function findUnquoted(line, ch) {
  let quote = null;
  let escape = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (quote) {
      if (c === "\\") escape = true;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      continue;
    }
    if (c === ch) return i;
  }
  return -1;
}

function ensureImport(src, statement) {
  if (src.includes(statement)) return src;
  const lines = src.split(/\r?\n/);
  let insertAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#") || lines[i].trim() === "" || lines[i].startsWith('"""') || lines[i].startsWith("'''")) {
      continue;
    }
    insertAt = i;
    break;
  }
  // Prefer after the import block header if present
  const importHeader = lines.findIndex((l) => l.includes("= IMPORT"));
  if (importHeader !== -1) {
    insertAt = importHeader + 3;
    while (insertAt < lines.length && lines[insertAt].trim() === "") insertAt++;
  }
  lines.splice(insertAt, 0, statement);
  return lines.join("\n");
}

function convertFile(src, rel) {
  let out = src.replace(/\r\n/g, "\n");
  let changed = false;

  // Standard library renames
  out = out.replace(/^import ConfigParser$/m, "import configparser as ConfigParser");
  out = out.replace(/ConfigParser\.SafeConfigParser/g, "ConfigParser.ConfigParser");
  out = out.replace(/^import HTMLParser$/m, "import html.parser as HTMLParser");
  out = out.replace(/HTMLParser\.HTMLParser/g, "HTMLParser.HTMLParser");
  out = out.replace(/^from email import Charset$/m, "from email import charset as Charset");
  out = out.replace(/^from __future__ import generators.*$/m, "");

  if (out.includes("cgi.escape")) {
    out = out.replace(/^import cgi$/m, "import html as cgi_html");
    out = out.replace(/cgi\.escape/g, "cgi_html.escape");
    if (!out.includes("import cgi\n") && !out.includes("import cgi ")) {
      // keep cgi only if still used
    }
  }

  if (/^import urllib$/m.test(out) && /urllib\.(quote|unquote)/.test(out)) {
    out = out.replace(/^import urllib$/m, "from urllib.parse import quote as _urllib_quote, unquote as _urllib_unquote");
    out = out.replace(/urllib\.unquote/g, "_urllib_unquote");
    out = out.replace(/urllib\.quote/g, "_urllib_quote");
  }

  if (/^import Image\b/m.test(out) || /from PIL import Image/.test(out) === false && /import Image  # PIL/.test(out)) {
    out = out.replace(/import Image  # PIL/, "from PIL import Image");
    out = out.replace(/^import Image$/m, "from PIL import Image");
  }
  out = out.replace(/Image\.VERSION/g, "getattr(Image, '__version__', getattr(Image, 'VERSION', 'unknown'))");

  // twisted version import is handled manually in src/log.py

  out = out.replace(/\bplatform\.dist\(\)/g, "getattr(platform, 'dist', lambda: ('', '', ''))()");

  // Language / builtin compatibility
  out = out.replace(/\bxrange\(/g, "range(");
  out = out.replace(/\.iteritems\(\)/g, ".items()");
  out = out.replace(/\.itervalues\(\)/g, ".values()");
  out = out.replace(/\.iterkeys\(\)/g, ".keys()");
  out = out.replace(/\bbasestring\b/g, "str");
  out = out.replace(/\blong\(/g, "int(");
  out = out.replace(/\braw_input\(/g, "input(");
  out = out.replace(/\bfile\(/g, "open(");
  out = out.replace(/raise ([A-Za-z_][A-Za-z0-9_.]*)\s*,\s*(.+)$/gm, "raise $1($2)");

  // reload builtin
  if (/\breload\(/.test(out) && !/importlib/.test(out)) {
    out = ensureImport(out, "from importlib import reload");
  }

  // list concatenations of dict views
  out = out.replace(
    /database\["([^"]+)"\]\.values\(\)\s*\+\s*database\["([^"]+)"\]\.values\(\)\s*\+\s*database\["([^"]+)"\]\.values\(\)\s*\+\s*database\["([^"]+)"\]\.values\(\)/g,
    'list(database["$1"].values()) + list(database["$2"].values()) + list(database["$3"].values()) + list(database["$4"].values())'
  );
  out = out.replace(
    /database\["([^"]+)"\]\.values\(\)\s*\+\s*database\["([^"]+)"\]\.values\(\)\s*\+\s*database\["([^"]+)"\]\.values\(\)/g,
    'list(database["$1"].values()) + list(database["$2"].values()) + list(database["$3"].values())'
  );
  out = out.replace(
    /database\["([^"]+)"\]\.values\(\)\s*\+\s*database\["([^"]+)"\]\.values\(\)/g,
    'list(database["$1"].values()) + list(database["$2"].values())'
  );
  out = out.replace(
    /(\w+)\s*\+\s*database\["([^"]+)"\]\.values\(\)\s*\+\s*database\["([^"]+)"\]\.values\(\)/g,
    '$1 + list(database["$2"].values()) + list(database["$3"].values())'
  );

  // map(string.strip, ...)
  out = out.replace(/map\(string\.strip,\s*([^)]+)\)/g, "[_line.strip() for _line in $1]");

  // string module helpers used as functions
  out = out.replace(/string\.lower\(([^)]+)\)/g, "($1).lower()");
  out = out.replace(/string\.find\(([^,]+),\s*([^)]+)\)/g, "($1).find($2)");
  out = out.replace(/string\.replace\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, "($1).replace($2, $3)");

  // sort(cmp=)
  out = out.replace(
    /\.sort\(cmp=compare_words\)/g,
    ".sort(key=lambda words: -len(words[0]))"
  );

  // print statements
  const lines = out.split("\n");
  const converted = lines.map(convertPrintStatement);
  out = converted.join("\n");

  // implicit relative import seen in web_resource
  out = out.replace(/^from act\s+import /m, "from src.act import ");

  if (out !== src.replace(/\r\n/g, "\n")) changed = true;
  if (src.includes("\r\n")) out = out.replace(/\n/g, "\r\n");
  return { out, changed };
}

const files = walk(ROOT);
let changedCount = 0;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const { out, changed } = convertFile(src, path.relative(ROOT, file));
  if (changed) {
    fs.writeFileSync(file, out, "utf8");
    changedCount += 1;
    console.log("updated", path.relative(ROOT, file));
  }
}
console.log("files_changed", changedCount, "files_scanned", files.length);

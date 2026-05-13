import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (full.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

const files = [...walk("app")];

const TONES = ["amber", "rose", "sky", "violet", "emerald", "indigo"];
const PATTERNS = [];
for (const t of TONES) {
  PATTERNS.push({ from: `text-${t}-700`, to: `text-${t}-700 dark:text-${t}-300` });
  PATTERNS.push({ from: `text-${t}-800`, to: `text-${t}-800 dark:text-${t}-300` });
  PATTERNS.push({ from: `bg-${t}-50`, to: `bg-${t}-50 dark:bg-${t}-500/15` });
  PATTERNS.push({ from: `bg-${t}-100`, to: `bg-${t}-100 dark:bg-${t}-500/20` });
  PATTERNS.push({ from: `ring-${t}-200`, to: `ring-${t}-200 dark:ring-${t}-500/30` });
}

for (const f of files) {
  let text = readFileSync(f, "utf-8");
  const before = text;
  for (const { from, to } of PATTERNS) {
    // Walk through occurrences; skip any followed by "dark:" already
    let out = "";
    let i = 0;
    while (i < text.length) {
      const idx = text.indexOf(from, i);
      if (idx === -1) {
        out += text.slice(i);
        break;
      }
      const tail = text.slice(idx + from.length);
      const next = tail.match(/^[\s]+dark:/);
      out += text.slice(i, idx);
      if (next) {
        out += from;
      } else {
        out += to;
      }
      i = idx + from.length;
    }
    text = out;
  }
  if (text !== before) {
    writeFileSync(f, text);
    console.log("✓", f);
  }
}

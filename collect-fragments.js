// Collect CJK text fragments (JSX text incl. multiline + mixed {expr} nodes)
const fs = require('fs');
const path = require('path');

const root = '/src';
const items = new Map(); // fragment -> {file, line}

const commentLineRe = /^\s*(\/\/|\*|\/\*)/;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(f)) {
      const src = fs.readFileSync(full, 'utf8');
      const lines = src.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (commentLineRe.test(line)) continue;
        // mask out string literals so we don't double-handle them
        const masked = line.replace(/(['"`])(?:\\.|(?!\1)[^\\])*?\1/g, (m) => ' '.repeat(m.length));
        // find CJK fragments in remaining JSX text
        for (const m of masked.matchAll(/[^<>{}\n]*[一-鿿][^<>{}\n]*/g)) {
          const frag = m[0].trim();
          if (frag && /[一-鿿]/.test(frag)) {
            if (!items.has(frag)) items.set(frag, { file: full.replace('/src/', ''), line: i + 1 });
          }
        }
      }
    }
  }
}
walk(root);
const arr = [...items.entries()].map(([text, loc]) => ({ text, file: loc.file, line: loc.line }));
arr.sort((a, b) => a.file.localeCompare(b.file));
fs.writeFileSync('/out/pending3.json', JSON.stringify(arr, null, 1), 'utf8');
console.log('CJK fragments:', arr.length);

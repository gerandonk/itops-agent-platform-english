// Collect remaining CJK UI strings (exclude comments)
const fs = require('fs');
const path = require('path');

const root = '/src';
const items = new Map();

const literalRe = /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g;
const jsxRe = />([^<>{}\n]+)</g;
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
        // strip trailing inline comment crudely for detection only
        for (const m of line.matchAll(literalRe)) {
          const body = m[2];
          if (/[一-鿿]/.test(body)) {
            const k = body;
            if (k && !items.has(k)) items.set(k, { file: full, line: i + 1 });
          }
        }
        for (const m of line.matchAll(jsxRe)) {
          const body = m[1];
          if (/[一-鿿]/.test(body)) {
            const k = body.trim();
            if (k && !items.has(k)) items.set(k, { file: full, line: i + 1 });
          }
        }
      }
    }
  }
}
walk(root);
const arr = [...items.entries()].map(([text, loc]) => ({ text, file: loc.file.replace('/src/', ''), line: loc.line }));
arr.sort((a, b) => a.file.localeCompare(b.file));
fs.writeFileSync('/out/pending2.json', JSON.stringify(arr, null, 1), 'utf8');
console.log('remaining CJK UI strings:', arr.length);

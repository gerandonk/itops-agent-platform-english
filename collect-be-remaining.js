// Collect remaining CJK string literals in backend (exclude comments)
const fs = require('fs');
const path = require('path');

const root = '/src';
const items = new Map();

const literalRe = /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g;
const commentLineRe = /^\s*(\/\/|\*|\/\*)/;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') walk(full);
    } else if (/\.(ts|js)$/.test(f) && !f.includes('.test.')) {
      const src = fs.readFileSync(full, 'utf8');
      const lines = src.split('\n');
      lines.forEach((line, i) => {
        if (commentLineRe.test(line)) return;
        for (const m of line.matchAll(literalRe)) {
          const body = m[2];
          if (/[\u4e00-\u9fff]/.test(body) && !body.includes('${')) {
            if (!items.has(body)) items.set(body, { file: full.replace('/src/', ''), line: i + 1 });
          }
        }
      });
    }
  }
}
walk(root);
const arr = [...items.entries()].map(([text, loc]) => ({ text, file: loc.file, line: loc.line }));
arr.sort((a, b) => a.file.localeCompare(b.file));
fs.writeFileSync('/out/be-remaining.json', JSON.stringify(arr, null, 1), 'utf8');
console.log('backend remaining CJK literals:', arr.length);
const byFile = {};
for (const a of arr) byFile[a.file] = (byFile[a.file] || 0) + 1;
console.log(JSON.stringify(Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 20), null, 1));

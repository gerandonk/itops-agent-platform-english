// Collect CJK strings from backend source (seed data, constants)
const fs = require('fs');
const path = require('path');

const root = '/src';
const items = new Map();

const literalRe = /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(ts|js)$/.test(f) && !full.includes('node_modules') && !full.includes('.test.')) {
      const src = fs.readFileSync(full, 'utf8');
      for (const m of src.matchAll(literalRe)) {
        const body = m[2];
        if (/[一-鿿]/.test(body) && !body.includes('${')) {
          const k = body.trim();
          if (k && !items.has(k)) items.set(k, { file: full.replace('/src/', ''), line: 0 });
        }
      }
    }
  }
}
walk(root);
const arr = [...items.entries()].map(([text, loc]) => ({ text, file: loc.file }));
fs.writeFileSync('/out/backend-pending.json', JSON.stringify(arr, null, 1), 'utf8');
console.log('backend CJK strings:', arr.length);

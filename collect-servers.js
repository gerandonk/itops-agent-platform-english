const fs = require('fs');
const path = require('path');

const root = '/src';
const items = new Map();
const literalRe = /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g;
const jsxRe = />([^<>{}\n]+)</g;

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(f)) {
      const src = fs.readFileSync(full, 'utf8');
      for (const m of src.matchAll(literalRe)) {
        const body = m[2];
        if (!body.includes('${') && /[一-鿿]/.test(body)) {
          const k = body.trim();
          if (k) items.set(k, (items.get(k) || 0) + 1);
        }
      }
      for (const m of src.matchAll(jsxRe)) {
        const body = m[1];
        if (!body.includes('{') && /[一-鿿]/.test(body)) {
          const k = body.trim();
          if (k) items.set(k, (items.get(k) || 0) + 1);
        }
      }
    }
  }
}
walk(root);
const arr = [...items.entries()].map(([text, count]) => ({ text, count }));
arr.sort((a, b) => b.count - a.count);
fs.writeFileSync('/out/servers-pending.json', JSON.stringify(arr, null, 1), 'utf8');
console.log('collected servers CJK:', arr.length);

// Collect every string literal / JSX text node containing CJK (no ${} interpolation).
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '/src';
const out = process.argv[3] || '/out/pending.json';

const items = new Map(); // text -> count

const literalRe = /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g;
const jsxRe = />([^<>{}\n]*<[^>]*>[^<>{}]*)*([\u4e00-\u9fff][^<>{}]*)</g;

function hasCjk(s) { return /[\u4e00-\u9fff]/.test(s); }

const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(f)) files.push(full);
  }
})(root);

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  for (const m of code.matchAll(literalRe)) {
    const body = m[2];
    if (body.includes('${')) continue;
    if (!hasCjk(body)) continue;
    const key = body.trim();
    if (!key) continue;
    items.set(key, (items.get(key) || 0) + 1);
  }
}

const arr = [...items.entries()].map(([text, count]) => ({ text, count }));
arr.sort((a, b) => b.count - a.count);
fs.writeFileSync(out, JSON.stringify(arr, null, 1));
console.log('collected:', arr.length);

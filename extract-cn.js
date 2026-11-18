// Extract Chinese string literals frequency from frontend/src (excluding i18n locale json)
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '/src';
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(f)) files.push(full);
  }
})(root);

const freq = new Map();
const cnRe = /[\u4e00-\u9fff][\u4e00-\u9fff\w·，。！？：；、“”‘’（）【】《》—…%./_()\- ]*[\u4e00-\u9fff\w·%./_()\-]?/g;
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  // strip line comments and block comments to focus on user-facing strings
  const code = c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  for (const m of code.matchAll(cnRe)) {
    const s = m[0].trim();
    if (!s) continue;
    freq.set(s, (freq.get(s) || 0) + 1);
  }
}
const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
console.log('TOTAL unique:', sorted.length);
for (const [s, n] of sorted) console.log(n + '\t' + s);

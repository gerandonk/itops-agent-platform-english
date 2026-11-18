// Replace zh-CN date locales with en-US, and fix hardcoded Chinese weekday/format strings
const fs = require('fs');
const path = require('path');

const root = '/src';
const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(f)) files.push(full);
  }
})(root);

let changed = 0;
const hits = [];
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  src = src.replace(/toLocale(String|DateString|TimeString)\(\s*'zh-CN'/g, 'toLocale$1(\'en-US\'');
  if (src !== before) { changed++; hits.push(file); fs.writeFileSync(file, src, 'utf8'); }
}
console.log('locale files changed:', changed);
hits.forEach(h => console.log('  ', h));

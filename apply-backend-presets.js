// Apply db-translated dict to backend preset sources (string literals only)
const fs = require('fs');
const path = require('path');

const dict = JSON.parse(fs.readFileSync('/dict/db-translated.json', 'utf8'));
const roots = ['/src/models/presets', '/src/constants'];

const files = [];
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(ts|js)$/.test(f)) files.push(full);
  }
}
for (const r of roots) walk(r);

let changed = 0, reps = 0;
for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  for (const [cn, en] of Object.entries(dict)) {
    if (!src.includes(cn)) continue;
    // replace inside any quote type
    for (const q of ["'", '"', '`']) {
      const needle = q + cn + q;
      const target = q + en.replace(/\\/g, '\\\\').replace(new RegExp(q === '`' ? '`' : '\\' + q, 'g'), '\\' + q) + q;
      while (src.includes(needle)) {
        src = src.replace(needle, target);
        reps++;
      }
    }
  }
  if (src !== before) {
    fs.writeFileSync(file, src, 'utf8');
    changed++;
  }
}
console.log('files changed:', changed, 'replacements:', reps);

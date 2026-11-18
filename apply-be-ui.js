const fs = require('fs');
const path = require('path');

const dict = JSON.parse(fs.readFileSync('/dict/be-rem-translated.json', 'utf8'));
const roots = ['/src/modules', '/src/constants'];

const files = [];
function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return; }
  for (const f of entries) {
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
    for (const q of ["'", '"', '`']) {
      const needle = q + cn + q;
      const escapedEn = en.replace(/\\/g, '\\\\').replace(new RegExp(q === '`' ? '`' : '\\' + q, 'g'), '\\' + q);
      const target = q + escapedEn + q;
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
console.log('backend files changed:', changed, 'replacements:', reps);

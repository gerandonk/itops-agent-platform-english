// Apply fragment translations: replace CJK runs outside string literals, outside <>{}
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '/src';
const dict = JSON.parse(fs.readFileSync('/out/all-fragments-translated.json', 'utf8'));

const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(f)) files.push(full);
  }
})(root);

let changedFiles = 0;
let replacements = 0;
const missed = new Map();

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  let dirty = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // mask string literals so we only touch JSX text
    let masked = '';
    let last = 0;
    for (const m of line.matchAll(/(['"`])(?:\\.|(?!\1)[^\\])*?\1/g)) {
      masked += line.slice(last, m.index) + '\u0000'.repeat(m[0].length);
      last = m.index + m[0].length;
    }
    masked += line.slice(last);

    let out = '';
    let cursor = 0;
    for (const m of masked.matchAll(/[^<>{}\u0000]*[\u4e00-\u9fff][^<>{}\u0000]*/g)) {
      const frag = m[0];
      const key = frag.trim();
      out += line.slice(cursor, m.index);
      if (dict[key] !== undefined) {
        const lead = frag.match(/^\s*/)[0];
        const trail = frag.match(/\s*$/)[0];
        out += lead + dict[key] + trail;
        replacements++;
        dirty = true;
      } else {
        out += frag;
        if (key) missed.set(key, (missed.get(key) || 0) + 1);
      }
      cursor = m.index + frag.length;
    }
    out += line.slice(cursor);
    if (out !== line) lines[i] = out;
  }

  if (dirty) {
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    changedFiles++;
  }
}

console.log('files changed:', changedFiles, 'replacements:', replacements);
console.log('missed unique:', missed.size);
if (missed.size) {
  const top = [...missed.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [k, c] of top) console.log('  MISS', c, JSON.stringify(k));
}
